# KIS OpenAPI 연동 모듈 Implementation Plan

## 1. 목적 및 배경

본 문서는 KIS OpenAPI를 활용하여 주가 정보를 제공하는 서비스에서  
API 호출 제한(종목 수 제한, 호출 빈도 제한)을 초과하지 않으면서  
여러 페이지 및 다수의 동시 요청 상황에서도 안정적으로 동작하는  
API 연동 모듈을 구현하기 위한 전략과 구현 방안을 정의한다.

---

## 2. 설계 목표

- KIS OpenAPI 호출 제한 초과 방지
- 중복 호출 최소화
- 장애 및 에러 발생 시 자동 복구
- 트래픽 증가에도 확장 가능한 구조
- 실서비스 운영에 적합한 안정성 확보

---

## 3. 전체 아키텍처 개요

```
[Frontend]
   │
   ▼
[Backend API Layer]
   │
   ▼
[Market Data Service]
   ├─ Cache (Redis)
   ├─ Request Queue
   ├─ Batch Aggregator
   ├─ Rate Limiter
   └─ KIS API Adapter
           │
           ▼
        [KIS OpenAPI]
```

원칙:

- Frontend 또는 개별 페이지에서 KIS OpenAPI를 직접 호출하지 않는다.
- 모든 호출 정책은 Market Data Service에서 중앙 집중 관리한다.

---

## 4. 핵심 구현 전략

### 4.1 Queue 기반 API 호출 제어 (필수)

- 모든 KIS API 요청을 Queue에 적재
- Worker가 순차적으로 요청 처리
- 호출 제한 및 재시도 로직을 Worker에서 통제

구현 옵션:

- Node.js: bull, bullmq, p-queue
- Python: Celery, RQ, asyncio.Queue
- Redis 기반 Queue 권장

---

### 4.2 Batch 요청 처리 (종목 수 ≤ 20)

- 동일 타입 요청을 짧은 시간 동안 수집
- 최대 20개 종목 또는 타임아웃 시 단일 API 호출
- 결과를 요청 단위로 다시 분배

기대 효과:

- API 호출 수 감소
- Rate Limit 여유 확보

---

### 4.3 Cache + TTL 전략

목적:

- 중복 호출 제거
- 응답 속도 개선
- API 의존도 감소

권장 TTL 예시:

| 데이터 종류   | TTL  |
| -------- | ---- |
| 현재가      | 1~3초 |
| 전일 종가    | 1일   |
| 종목 메타 정보 | 1일   |

Cache Miss 시에만 Queue를 통해 API 호출 수행

---

### 4.4 Rate Limiter

- 초당 / 분당 호출 횟수 제한
- 토큰 버킷 또는 슬라이딩 윈도우 방식 적용
- Queue Worker 단에서 적용

---

### 4.5 Retry & Circuit Breaker

- 429 / 5xx 에러 시 지수 백오프 재시도
- 연속 실패 시 Circuit Breaker 활성화
- 일정 시간 동안 API 호출 차단 후 자동 복구

---

## 5. 전체 워크플로우

```
[Client Request]
   │
   ▼
[Cache 확인]
   ├─ Hit → 즉시 응답
   └─ Miss
        │
        ▼
   [Request Queue]
        │
        ▼
   [Batch Aggregator]
        │
        ▼
   [Rate Limiter]
        │
        ▼
   [KIS API 호출]
        │
        ▼
   [Cache 저장]
        │
        ▼
   [Client 응답]
```

---

## 6. 운영 및 모니터링 고려사항

- API 호출 횟수 메트릭 수집
- Queue 길이 모니터링
- 평균 응답 시간 추적
- 토큰 만료 자동 갱신
- 장애 알림 연동 (Slack 등)

---

## 7. 추천 기술 스택 예시

- Backend: Node.js / Python
- Queue & Cache: Redis
- Monitoring: Prometheus + Grafana
- Logging: ELK Stack

---

## 8. 결론

본 구조는 KIS OpenAPI의 호출 제한 환경에서도  
안정적이고 확장 가능한 주가 정보 서비스를 구현하기 위한  
검증된 패턴을 기반으로 한다.

Queue + Batch + Cache + 중앙 집중 제어 구조를 통해  
실서비스 운영 시 발생할 수 있는 대부분의 장애와 한계 상황을  
효과적으로 대응할 수 있다.

# KIS OpenAPI 호출 전략 & 실서비스 아키텍처 다이어그램

## 1. KIS OpenAPI 스펙 기반 호출 전략

> 본 전략은 한국투자증권(KIS) OpenAPI의 **실시간 시세/현재가 조회 계열 API**의
> 구조적 제약(종목 수 제한, 호출 빈도 제한, 토큰 인증)을 전제로 설계한다.

---

## 1.1 KIS OpenAPI 주요 특징 요약

- REST API 기반 (HTTP/HTTPS)
- OAuth2 Access Token 방식 인증
- API 별 호출 제한 존재
- 일부 시세 API는 **복수 종목 조회 가능 (최대 20개 미만)**
- 토큰 만료 시간 존재 → 자동 갱신 필요

---

## 1.2 주요 사용 API 유형 (논리 분류)

| 분류  | API 유형 | 특징            |
| --- | ------ | ------------- |
| 시세  | 현재가 조회 | 다수 화면에서 가장 빈번 |
| 기준  | 전일 종가  | 변경 거의 없음      |
| 메타  | 종목 정보  | 캐시 장기 유지 가능   |

---

## 1.3 호출 전략 핵심 원칙

### 원칙 1. API 타입별 호출 정책 분리

- 현재가 /  기준정보를 동일 큐에서 처리하지 않음
- API 타입별 Queue 또는 Priority 분리

### 원칙 2. Batch 가능한 API는 무조건 Batch 처리

- 단건 요청 금지
- 항상 배열 기반 요청 구조로 통일

### 원칙 3. Cache First

- Cache Hit 시 KIS API 호출 절대 금지
- Cache TTL은 데이터 특성별로 차등 적용

---

## 1.4 API 타입별 상세 호출 전략

### 1.4.1 현재가 조회 API

- Batch Size: 최대 20 종목
- Cache TTL: 1~3초
- 호출 트리거:
  - Cache Miss
  - 강제 갱신 요청

전략:

1. 요청 수집 (50~100ms)
2. 최대 20개로 묶어서 호출
3. 결과를 종목 코드 기준으로 분리
4. Redis Cache 저장
5. 각 요청자에게 응답

---

### ### 1.4.3 전일 종가 / 기준 정보

- Batch Size: 최대 허용치
- Cache TTL: 1일
- 호출 시점:
  - 최초 요청
  - 장 시작 전 프리로딩

---

## 1.5 인증 토큰 관리 전략

### 구조

```
[KIS Auth Manager]
   ├─ Access Token
   ├─ Expire Time
   └─ Refresh Logic
```

### 정책

- 토큰 만료 5분 전 자동 재발급
- 재발급 실패 시 API 호출 중단
- 모든 Worker는 Auth Manager를 통해서만 토큰 접근

---

## 1.6 Rate Limit 제어 전략

- Queue Worker 단에서만 KIS API 호출 허용
- Token Bucket 또는 Leaky Bucket 알고리즘 사용
- 호출 실패 시:
  - Retry (Exponential Backoff)
  - Circuit Breaker 활성화

---

## 2. 실서비스용 아키텍처 다이어그램

## 2.1 전체 시스템 구성

```
┌───────────────────┐
│     Frontend      │
│ (Web / Mobile)    │
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Backend API     │
│ (BFF / Gateway)   │
└─────────┬─────────┘
          │
          ▼
┌──────────────────────────────────────────┐
│        Market Data Service                │
│                                          │
│  ┌────────────┐   ┌─────────────────┐   │
│  │ Redis      │◀──▶│ Cache Manager   │   │
│  └────────────┘   └─────────────────┘   │
│        ▲                      ▲          │
│        │                      │          │
│  ┌────────────┐   ┌─────────────────┐   │
│  │ Request    │──▶│ Batch Aggregator │   │
│  │ Queue      │   └─────────────────┘   │
│  └────────────┘             │            │
│        ▲                    ▼            │
│        │           ┌─────────────────┐   │
│        └──────────▶│ Rate Limiter    │   │
│                    └─────────────────┘   │
│                             │             │
│                    ┌─────────────────┐   │
│                    │ KIS API Adapter  │───┼──▶ KIS OpenAPI
│                    └─────────────────┘   │
│                             │             │
│                    ┌─────────────────┐   │
│                    │ Auth Manager    │   │
│                    └─────────────────┘   │
└──────────────────────────────────────────┘
```

---

## 2.2 데이터 흐름 상세

1. Frontend에서 종목 시세 요청
2. Backend API는 Market Data Service 호출
3. Cache 조회
   - Hit → 즉시 반환
   - Miss → Queue 적재
4. Batch Aggregator가 요청 수집
5. Rate Limiter 통과 후 KIS API 호출
6. 응답을 Cache에 저장
7. 요청자에게 결과 반환

---

## 2.3 장애 대응 시나리오

- KIS API 장애
  - Circuit Breaker ON
  - 최근 Cache 데이터 반환
- Rate Limit 초과 위험
  - Queue 대기
  - Batch Size 자동 축소
- 인증 토큰 만료
  - Auth Manager에서 자동 재발급

---

## 3. 결론

본 호출 전략과 아키텍처는  
KIS OpenAPI의 구조적 제약 환경에서도 실서비스에서 안정적으로 동작하도록 설계되었다.

- Queue 중심 설계
- Batch 기반 호출 최소화
- Cache 우선 전략
- 중앙 집중형 API 제어

을 통해 호출 제한, 장애, 트래픽 증가에 모두 대응 가능하다.





# KIS OpenAPI 엔드포인트별 Request / Response 래퍼 설계

## 1. 설계 목표

본 문서는 KIS OpenAPI를 사용하는 서비스에서  
엔드포인트별 Request/Response를 **일관된 인터페이스로 추상화**하기 위한 래퍼 설계를 정의한다.

목표:

- KIS API 스펙 변경 영향 최소화
- Batch / Cache / Queue 와 자연스럽게 결합
- 도메인 친화적인 응답 구조 제공
- 테스트 및 유지보수 용이성 확보

---

## 2. 전체 래퍼 구조 개요

```
src/kis/
├── auth/
│   └── token_manager.py
├── client/
│   └── kis_http_client.py
├── endpoints/
│   ├── price.py          # 현재가
│   ├── daily_price.py    # 전일 종가
│   └── symbol_info.py    # 종목 정보
├── models/
│   ├── request.py
│   └── response.py
└── exceptions.py
```

---

## 3. 공통 HTTP Client 래퍼

### 역할

- HTTP 통신 공통 처리
- 인증 헤더 자동 주입
- Retry / Timeout / Error Handling

### 인터페이스 예시

```python
class KISHttpClient:
    def request(self, method: str, url: str, headers: dict, params: dict) -> dict:
        ...
```

---

## 4. 공통 Request / Response 모델

### 4.1 Request 모델

```python
@dataclass
class KISRequest:
    endpoint: str
    params: dict
    is_batch: bool = False
```

---

### 4.2 Response 모델 (도메인 기준)

```python
@dataclass
class PriceResponse:
    symbol: str
    current_price: int
    change: int
    change_rate: float
    volume: int
```

> KIS 원본 필드명은 내부에서만 사용하고  
> 외부로는 **도메인 친화적인 필드명만 노출**

---

## 5. 엔드포인트별 래퍼 설계

## 5.1 현재가 조회 API

### KIS API 특성

- 복수 종목 조회 가능 (≤ 20)
- 실시간 호출 빈도 높음

### Wrapper 인터페이스

```python
def get_current_prices(symbols: list[str]) -> dict[str, PriceResponse]:
    ...
```

### 내부 처리

1. symbols 길이 검증 (≤ 20)
2. KIS API 요청 파라미터 구성
3. 응답 수신
4. 종목 코드 기준 파싱
5. PriceResponse 매핑

---## 

## 5.3 전일 종가 / 일봉 API

### Wrapper 인터페이스

```python
def get_daily_prices(symbols: list[str]) -> dict[str, DailyPriceResponse]:
    ...
```

### 전략

- 장 시작 전 프리로딩
- TTL 1일

---

## 5.4 종목 메타 정보 API

### Wrapper 인터페이스

```python
def get_symbol_infos(symbols: list[str]) -> dict[str, SymbolInfoResponse]:
    ...
```

### 특징

- 변경 거의 없음
- 강한 Cache 적용

---

## 6. Batch + Queue 연계 방식

### 호출 규칙

- Wrapper는 **단일 책임**
- Batch / Queue 로직은 상위 Service Layer에서 처리

```
Service Layer
   └─ collect symbols
       └─ call wrapper (≤20)
```

---

## 7. Error & Exception 추상화

### 공통 예외

```python
class KISRateLimitException(Exception): ...
class KISAuthException(Exception): ...
class KISServerException(Exception): ...
```

### 정책

- Wrapper는 KIS 에러를 도메인 예외로 변환
- 상위 레이어에서 Retry / Fallback 처리

---

## 8. 테스트 전략

- HTTP Client Mock
- Endpoint Wrapper 단위 테스트
- 실제 KIS API 연동 테스트는 별도 환경 분리

---

## 9. 결론

이 래퍼 설계는:

- KIS API 의존성을 최소화하고
- Batch / Queue / Cache 구조와 자연스럽게 결합되며
- 실서비스에서 유지보수 가능한 구조를 제공한다.

엔드포인트 추가 시:

- endpoints/ 폴더에 래퍼 추가
- models/에 Response 정의
- Service Layer에서 조합

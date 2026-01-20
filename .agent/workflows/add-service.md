---
description: 새로운 서비스를 생성합니다
---
# 서비스 생성

비즈니스 로직을 담당하는 새로운 서비스를 생성합니다.

## 서비스 구조

```
src/services/
├── analysis/           # 분석 엔진
│   ├── summary-engine.ts
│   ├── exit-timing-engine.ts
│   ├── risk-control-engine.ts
│   └── index.ts
├── market-data/        # 시장 데이터
│   ├── price-service.ts
│   ├── financial-service.ts
│   ├── analyst-service.ts
│   ├── toss-crawler.ts
│   ├── naver-crawler.ts
│   └── seibro-crawler.ts
├── report/             # 리포트
│   ├── report-generator.ts
│   └── pdf-exporter.ts
├── alerts/             # 알림
│   └── alert-service.ts
├── portfolio/          # 포트폴리오
│   └── rebalancing-engine.ts
└── index.ts            # 통합 export
```

## 새 서비스 추가 시

1. 적절한 폴더에 `[service-name].ts` 생성
2. 해당 폴더의 `index.ts`에 export 추가
3. `src/services/index.ts`에서 폴더 export 확인

## 템플릿

```typescript
export class MyService {
  async myMethod(param: string): Promise<Result> {
    // 구현
  }
}

export const myService = new MyService();
```

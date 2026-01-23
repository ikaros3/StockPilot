/**
 * KIS API 중앙 집중형 Request Queue
 * 
 * OpenAPI_Integration_Guide.md 아키텍처 적용:
 * - 모든 가격 요청을 중앙에서 수집
 * - 배치로 묶어서 순차 처리
 * - 캐시로 중복 호출 방지
 * - Rate Limit 준수
 */

import { ServerKisService } from "./server-kis-service";

// =============================================================================
// 타입 정의
// =============================================================================

export interface PriceData {
    stockCode: string;
    stockName: string;
    currentPrice: number;
    changePrice: number;
    changeRate: number;
    openPrice: number;
    highPrice: number;
    lowPrice: number;
    volume: number;
}

interface PendingRequest {
    symbol: string;
    resolve: (data: PriceData | null) => void;
    reject: (error: Error) => void;
    timestamp: number;
}

interface CacheEntry {
    data: PriceData;
    expiresAt: number;
}

// =============================================================================
// KIS Request Queue 클래스
// =============================================================================

class KisRequestQueue {
    // 대기 중인 요청 목록
    private pendingRequests: PendingRequest[] = [];

    // 처리 중 플래그
    private isProcessing = false;

    // 배치 처리 스케줄 타이머
    private batchTimer: NodeJS.Timeout | null = null;

    // 가격 캐시 (메모리)
    private priceCache = new Map<string, CacheEntry>();

    // ==========================================================================
    // 설정값
    // ==========================================================================

    private readonly BATCH_SIZE = 15;           // 최대 배치 크기 (20개 제한 마진)
    private readonly BATCH_WAIT_MS = 100;       // 요청 수집 대기 시간 (ms)
    private readonly REQUEST_DELAY_MS = 100;    // 배치 내 요청 간 딜레이 (ms)
    private readonly CACHE_TTL_MS = 3000;       // 캐시 TTL (3초)

    // ==========================================================================
    // Public API
    // ==========================================================================

    /**
     * 단일 종목 가격 조회 (큐를 통해 처리)
     */
    async getPrice(symbol: string): Promise<PriceData | null> {
        // 1. 캐시 확인
        const cached = this.getCachedPrice(symbol);
        if (cached) {
            console.log(`[KisRequestQueue] 캐시 히트: ${symbol}`);
            return cached;
        }

        // 2. 큐에 요청 추가
        return new Promise((resolve, reject) => {
            this.pendingRequests.push({
                symbol,
                resolve,
                reject,
                timestamp: Date.now(),
            });

            // 3. 배치 처리 스케줄
            this.scheduleBatchProcessing();
        });
    }

    /**
     * 복수 종목 가격 조회 (큐를 통해 처리)
     */
    async getPrices(symbols: string[]): Promise<Record<string, PriceData | null>> {
        const results = await Promise.all(
            symbols.map(symbol => this.getPrice(symbol).catch(() => null))
        );

        const response = Object.fromEntries(
            symbols.map((symbol, i) => [symbol, results[i]])
        );

        console.log(`[KisRequestQueue] getPrices 반환: ${JSON.stringify(Object.keys(response))}`);
        // 데이터가 있는 종목만 일부 로그 출력
        const validData = Object.entries(response).filter(([_, v]) => v !== null);
        if (validData.length > 0) {
            console.log(`[KisRequestQueue] 데이터 확인 (첫번째):`, validData[0]);
        }

        return response;
    }

    /**
     * 캐시 상태 조회 (디버깅용)
     */
    getCacheStats(): { size: number; symbols: string[] } {
        return {
            size: this.priceCache.size,
            symbols: Array.from(this.priceCache.keys()),
        };
    }

    // ==========================================================================
    // Private Methods
    // ==========================================================================

    /**
     * 캐시에서 가격 조회
     */
    private getCachedPrice(symbol: string): PriceData | null {
        const cached = this.priceCache.get(symbol);
        if (cached && Date.now() < cached.expiresAt) {
            return cached.data;
        }
        // 만료된 캐시 삭제
        if (cached) {
            this.priceCache.delete(symbol);
        }
        return null;
    }

    /**
     * 캐시에 가격 저장
     */
    private setCachedPrice(symbol: string, data: PriceData): void {
        this.priceCache.set(symbol, {
            data,
            expiresAt: Date.now() + this.CACHE_TTL_MS,
        });
    }

    /**
     * 배치 처리 스케줄링
     */
    private scheduleBatchProcessing(): void {
        // 이미 처리 중이거나 타이머가 있으면 무시
        if (this.isProcessing || this.batchTimer) {
            return;
        }

        // BATCH_WAIT_MS 후 배치 처리 시작
        this.batchTimer = setTimeout(() => {
            this.batchTimer = null;
            this.processBatch();
        }, this.BATCH_WAIT_MS);
    }

    /**
     * 배치 처리 실행
     */
    private async processBatch(): Promise<void> {
        if (this.isProcessing || this.pendingRequests.length === 0) {
            return;
        }

        this.isProcessing = true;

        try {
            // 1. 대기 중인 요청 가져오기 (최대 BATCH_SIZE개)
            const batch = this.pendingRequests.splice(0, this.BATCH_SIZE);

            // 2. 중복 종목 제거 (고유 종목만 추출)
            const uniqueSymbols = [...new Set(batch.map(req => req.symbol))];

            console.log(`[KisRequestQueue] 배치 처리 시작: ${batch.length}개 요청, ${uniqueSymbols.length}개 종목`);

            // 3. 종목별로 API 호출 (순차 처리)
            const results = new Map<string, PriceData | null>();

            for (const symbol of uniqueSymbols) {
                // 캐시 재확인
                const cached = this.getCachedPrice(symbol);
                if (cached) {
                    results.set(symbol, cached);
                    console.log(`[KisRequestQueue] 캐시 사용: ${symbol}`);
                    continue;
                }

                try {
                    console.log(`[KisRequestQueue] API 호출 시도: ${symbol}`);
                    const data = await ServerKisService.callApi(
                        "/uapi/domestic-stock/v1/quotations/inquire-price",
                        "FHKST01010100",
                        {
                            FID_COND_MRKT_DIV_CODE: "J",
                            FID_INPUT_ISCD: symbol,
                        }
                    );

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const anyData = data as any;

                    if (anyData?.output) {
                        const o = anyData.output;
                        const priceData: PriceData = {
                            stockCode: symbol,
                            stockName: "",
                            currentPrice: parseInt(o.stck_prpr, 10) || 0,
                            changePrice: parseInt(o.prdy_vrss, 10) || 0,
                            changeRate: parseFloat(o.prdy_ctrt) || 0,
                            openPrice: parseInt(o.stck_oprc, 10) || 0,
                            highPrice: parseInt(o.stck_hgpr, 10) || 0,
                            lowPrice: parseInt(o.stck_lwpr, 10) || 0,
                            volume: parseInt(o.acml_vol, 10) || 0,
                        };

                        this.setCachedPrice(symbol, priceData);
                        results.set(symbol, priceData);
                        console.log(`[KisRequestQueue] API 성공: ${symbol} = ${priceData.currentPrice}`);
                    } else {
                        console.warn(`[KisRequestQueue] API 응답 형식 오류 (output 없음): ${symbol}`, JSON.stringify(anyData).substring(0, 200));
                        results.set(symbol, null);
                    }

                    if (uniqueSymbols.indexOf(symbol) < uniqueSymbols.length - 1) {
                        await this.delay(this.REQUEST_DELAY_MS);
                    }
                } catch (error) {
                    console.error(`[KisRequestQueue] API 호출 중 예외 발생: ${symbol}`, error);
                    results.set(symbol, null);
                }
            }

            // 4. 각 요청에 결과 분배
            let successCount = 0;
            for (const request of batch) {
                const result = results.get(request.symbol);
                if (result) successCount++;
                request.resolve(result ?? null);
            }

            console.log(`[KisRequestQueue] 배치 처리 완료: ${batch.length}건 중 ${successCount}건 성공`);

        } finally {
            this.isProcessing = false;

            // 남은 요청이 있으면 다음 배치 스케줄
            if (this.pendingRequests.length > 0) {
                this.scheduleBatchProcessing();
            }
        }
    }

    /**
     * 딜레이 유틸리티
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// =============================================================================
// 싱글톤 인스턴스 (서버 메모리에서 공유)
// =============================================================================

export const kisRequestQueue = new KisRequestQueue();

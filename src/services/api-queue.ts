/**
 * 클라이언트 측 API 큐 서비스
 * 
 * KIS API의 Rate Limit(초당 20건)을 준수하기 위해
 * 여러 페이지에서의 API 호출을 중앙 집중화하여 배치 처리합니다.
 * 
 * 특징:
 * - 싱글톤 패턴으로 전역 큐 관리
 * - 배치 처리: 한 번에 최대 15건씩 병렬 호출
 * - 요청 수집: 100ms 동안 요청을 모은 후 배치 처리
 * - 배치 간 딜레이: 1.1초 (Rate Limit 안전 마진)
 * - 요청 중복 방지: 동일 종목 코드는 캐시 활용
 */

interface PriceData {
    stockCode: string;
    currentPrice: number;
    changePrice: number;
    changeRate: number;
    [key: string]: unknown;
}

interface QueueItem {
    stockCode: string;
    resolve: (data: PriceData | null) => void;
    reject: (error: Error) => void;
}

class ApiQueue {
    private queue: QueueItem[] = [];
    private isProcessing = false;
    private cache: Map<string, { data: PriceData; timestamp: number }> = new Map();
    private collectTimer: ReturnType<typeof setTimeout> | null = null;
    private readonly CACHE_TTL = 30000;       // 30초 캐시
    private readonly BATCH_SIZE = 15;         // 한 번에 처리할 최대 요청 수
    private readonly BATCH_DELAY = 1100;      // 배치 간 딜레이 (1.1초)
    private readonly COLLECT_DELAY = 100;     // 요청 수집 딜레이 (100ms)

    /**
     * 현재가 조회 요청을 큐에 추가
     */
    async fetchPrice(stockCode: string): Promise<PriceData | null> {
        // 캐시 확인
        const cached = this.cache.get(stockCode);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            console.log(`[ApiQueue] 캐시 히트: ${stockCode}`);
            return cached.data;
        }

        // 큐에 요청 추가
        return new Promise((resolve, reject) => {
            this.queue.push({ stockCode, resolve, reject });
            this.scheduleProcess();
        });
    }

    /**
     * 여러 종목 현재가 동시 조회 (큐를 통해 배치 처리)
     */
    async fetchPrices(stockCodes: string[]): Promise<Map<string, PriceData | null>> {
        const results = new Map<string, PriceData | null>();

        // 모든 요청을 큐에 추가하고 결과 대기
        const promises = stockCodes.map(async (code) => {
            const data = await this.fetchPrice(code);
            results.set(code, data);
        });

        await Promise.all(promises);
        return results;
    }

    /**
     * 요청 수집 후 처리 스케줄링
     * 100ms 동안 요청을 모은 후 한꺼번에 처리
     */
    private scheduleProcess(): void {
        // 이미 처리 중이면 타이머만 설정
        if (this.isProcessing) {
            return;
        }

        // 기존 타이머가 있으면 유지 (더 많은 요청 수집)
        if (this.collectTimer) {
            return;
        }

        // 새 타이머 설정: 100ms 후 처리 시작
        this.collectTimer = setTimeout(() => {
            this.collectTimer = null;
            this.processQueue();
        }, this.COLLECT_DELAY);
    }

    /**
     * 큐 처리 (싱글 스레드 보장, 배치 처리)
     */
    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length > 0) {
            // 배치 추출
            const batch = this.queue.splice(0, this.BATCH_SIZE);
            console.log(`[ApiQueue] 배치 처리 시작: ${batch.length}건 (남은 요청: ${this.queue.length}건)`);

            // 배치 내 병렬 처리
            await Promise.all(
                batch.map(async (item) => {
                    try {
                        const response = await fetch(`/api/kis/price?symbol=${item.stockCode}`);
                        const data = await response.json();

                        if (!response.ok || !data.price) {
                            throw new Error(data.error || "Failed to fetch price");
                        }

                        // 캐시 저장
                        this.cache.set(item.stockCode, {
                            data: data.price,
                            timestamp: Date.now(),
                        });

                        item.resolve(data.price);
                    } catch (error) {
                        console.error(`[ApiQueue] ${item.stockCode} 조회 실패:`, error);
                        item.resolve(null); // 에러 시 null 반환
                    }
                })
            );

            // 다음 배치가 있으면 딜레이
            if (this.queue.length > 0) {
                console.log(`[ApiQueue] 다음 배치 대기: ${this.BATCH_DELAY}ms`);
                await new Promise((resolve) => setTimeout(resolve, this.BATCH_DELAY));
            }
        }

        this.isProcessing = false;

        // 처리 중에 새 요청이 들어왔을 수 있으므로 다시 확인
        if (this.queue.length > 0) {
            this.scheduleProcess();
        }
    }

    /**
     * 캐시 클리어
     */
    clearCache(): void {
        this.cache.clear();
        console.log("[ApiQueue] 캐시 클리어됨");
    }

    /**
     * 특정 종목 캐시 무효화
     */
    invalidateCache(stockCode: string): void {
        this.cache.delete(stockCode);
    }
}

// 싱글톤 인스턴스
export const apiQueue = new ApiQueue();

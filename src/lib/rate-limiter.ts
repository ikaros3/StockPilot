/**
 * Rate Limiter 유틸리티
 * 
 * API 호출 빈도를 제어하여 rate limit 오류를 방지합니다.
 */

interface RateLimiterConfig {
    maxRequests: number;      // 기간 내 최대 요청 수
    intervalMs: number;       // 기간 (밀리초)
    minDelayMs?: number;      // 요청 간 최소 딜레이
}

interface QueuedRequest<T> {
    execute: () => Promise<T>;
    resolve: (value: T) => void;
    reject: (error: Error) => void;
}

export class RateLimiter {
    private config: RateLimiterConfig;
    private requestTimestamps: number[] = [];
    private queue: QueuedRequest<unknown>[] = [];
    private isProcessing = false;

    constructor(config: RateLimiterConfig) {
        this.config = {
            ...config,
            minDelayMs: config.minDelayMs ?? 100, // 기본 100ms 딜레이
        };
    }

    /**
     * Rate limit을 적용하여 요청 실행
     */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            this.queue.push({
                execute: fn,
                resolve: resolve as (value: unknown) => void,
                reject,
            });
            this.processQueue();
        });
    }

    /**
     * 현재 사용 가능한 요청 수
     */
    getAvailableRequests(): number {
        this.cleanupOldTimestamps();
        return this.config.maxRequests - this.requestTimestamps.length;
    }

    /**
     * 다음 요청까지 대기 시간 (ms)
     */
    getWaitTime(): number {
        this.cleanupOldTimestamps();

        if (this.requestTimestamps.length < this.config.maxRequests) {
            return 0;
        }

        const oldestTimestamp = this.requestTimestamps[0];
        const waitTime = (oldestTimestamp + this.config.intervalMs) - Date.now();
        return Math.max(0, waitTime);
    }

    private async processQueue(): Promise<void> {
        if (this.isProcessing || this.queue.length === 0) {
            return;
        }

        this.isProcessing = true;

        while (this.queue.length > 0) {
            const waitTime = this.getWaitTime();

            if (waitTime > 0) {
                await this.delay(waitTime);
            }

            // 최소 딜레이 적용
            if (this.requestTimestamps.length > 0 && this.config.minDelayMs) {
                const lastRequest = this.requestTimestamps[this.requestTimestamps.length - 1];
                const timeSinceLastRequest = Date.now() - lastRequest;
                if (timeSinceLastRequest < this.config.minDelayMs) {
                    await this.delay(this.config.minDelayMs - timeSinceLastRequest);
                }
            }

            const request = this.queue.shift();
            if (!request) continue;

            try {
                this.requestTimestamps.push(Date.now());
                const result = await request.execute();
                request.resolve(result);
            } catch (error) {
                request.reject(error as Error);
            }
        }

        this.isProcessing = false;
    }

    private cleanupOldTimestamps(): void {
        const cutoff = Date.now() - this.config.intervalMs;
        this.requestTimestamps = this.requestTimestamps.filter(
            (timestamp) => timestamp > cutoff
        );
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

// KIS API용 Rate Limiter 설정
// KIS API는 초당 20건, 분당 1000건 제한이 있음
export const kisRateLimiter = new RateLimiter({
    maxRequests: 15,        // 초당 15건으로 제한 (안전 마진 확보)
    intervalMs: 1000,       // 1초
    minDelayMs: 50,         // 요청 간 최소 50ms 딜레이
});

// DART API용 Rate Limiter 설정
// DART API는 일 10,000건 제한
export const dartRateLimiter = new RateLimiter({
    maxRequests: 100,       // 분당 100건으로 제한
    intervalMs: 60000,      // 1분
    minDelayMs: 200,        // 요청 간 최소 200ms 딜레이
});

// 네이버 금융 크롤러용 Rate Limiter
export const naverRateLimiter = new RateLimiter({
    maxRequests: 10,        // 초당 10건으로 제한 (서버 부하 방지)
    intervalMs: 1000,
    minDelayMs: 150,
});

/**
 * 재시도 로직이 포함된 API 호출 래퍼
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: {
        maxRetries?: number;
        baseDelayMs?: number;
        maxDelayMs?: number;
        retryCondition?: (error: Error) => boolean;
    } = {}
): Promise<T> {
    const {
        maxRetries = 3,
        baseDelayMs = 1000,
        maxDelayMs = 10000,
        retryCondition = () => true,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error as Error;

            // Rate limit 오류 감지
            const isRateLimitError =
                lastError.message?.includes("초당 거래건수") ||
                lastError.message?.includes("rate limit") ||
                lastError.message?.includes("Too Many Requests");

            // Rate Limit 에러인 경우 재시도 하지 않음 (사용자 요청 반영)
            if (isRateLimitError) {
                console.warn(`[RateLimit] API 호출 제한 도달: ${lastError.message}`);
                throw lastError;
            }

            if (attempt < maxRetries && retryCondition(lastError)) {
                // 지수 백오프 딜레이
                const delay = Math.min(
                    baseDelayMs * Math.pow(2, attempt),
                    maxDelayMs
                );
                console.warn(
                    `[Retry] 시도 ${attempt + 1}/${maxRetries} 실패, ${delay}ms 후 재시도:`,
                    lastError.message
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
            } else {
                throw lastError;
            }
        }
    }

    throw lastError;
}

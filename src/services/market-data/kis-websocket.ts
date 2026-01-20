/**
 * KIS WebSocket 서비스
 * 
 * 한국투자증권 실시간 시세 WebSocket 연동
 * - 실시간 체결가
 * - 실시간 호가
 * - 실시간 거래량
 * 
 * WebSocket URL:
 * - 실전투자: wss://ops.koreainvestment.com:21000
 * - 모의투자: wss://ops.koreainvestment.com:31000
 * 
 * 참고: https://apiportal.koreainvestment.com
 */

// WebSocket 이벤트 타입
export type WebSocketEventType =
    | "price"      // 실시간 체결가
    | "orderbook"  // 실시간 호가
    | "volume"     // 실시간 거래량
    | "connected"  // 연결됨
    | "disconnected" // 연결 끊김
    | "error";     // 오류

// 실시간 체결가 데이터
export interface RealtimePrice {
    stockCode: string;
    stockName?: string;
    currentPrice: number;
    changePrice: number;
    changeRate: number;
    volume: number;
    askPrice: number;
    bidPrice: number;
    timestamp: Date;
}

// 실시간 호가 데이터
export interface RealtimeOrderbook {
    stockCode: string;
    timestamp: Date;
    asks: { price: number; quantity: number }[]; // 매도 호가 (가격순)
    bids: { price: number; quantity: number }[]; // 매수 호가 (가격순)
    totalAskQuantity: number;
    totalBidQuantity: number;
}

// 이벤트 리스너 타입
type EventCallback<T> = (data: T) => void;

interface WebSocketConfig {
    environment: "prod" | "vts";
    appKey: string;
    appSecret: string;
    approvalKey?: string;
}

// WebSocket URL
const WS_URL = {
    prod: "wss://ops.koreainvestment.com:21000",
    vts: "wss://ops.koreainvestment.com:31000",
};

// TR ID
const TR_ID = {
    SUBSCRIBE_PRICE: "H0STCNT0",      // 실시간 체결가 구독
    UNSUBSCRIBE_PRICE: "H0STCNT0",    // 실시간 체결가 해제
    SUBSCRIBE_ORDERBOOK: "H0STASP0",  // 실시간 호가 구독
    UNSUBSCRIBE_ORDERBOOK: "H0STASP0", // 실시간 호가 해제
};

export class KisWebSocketService {
    private ws: WebSocket | null = null;
    private config: WebSocketConfig | null = null;
    private isConnected = false;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectDelay = 3000;

    // 구독 중인 종목
    private subscribedPrices: Set<string> = new Set();
    private subscribedOrderbooks: Set<string> = new Set();

    // 이벤트 리스너
    private priceListeners: Map<string, EventCallback<RealtimePrice>[]> = new Map();
    private orderbookListeners: Map<string, EventCallback<RealtimeOrderbook>[]> = new Map();
    private connectionListeners: EventCallback<boolean>[] = [];
    private errorListeners: EventCallback<Error>[] = [];

    /**
     * WebSocket 초기화
     */
    async initialize(config: WebSocketConfig): Promise<void> {
        this.config = config;

        // Approval Key 발급 (WebSocket 인증에 필요)
        if (!config.approvalKey) {
            config.approvalKey = await this.getApprovalKey();
        }

        await this.connect();
    }

    /**
     * WebSocket 연결
     */
    private async connect(): Promise<void> {
        if (!this.config) {
            throw new Error("WebSocket 설정이 없습니다.");
        }

        const url = WS_URL[this.config.environment];

        try {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                console.log("[KIS WebSocket] 연결됨");
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.notifyConnectionListeners(true);

                // 기존 구독 복원
                this.resubscribeAll();
            };

            this.ws.onclose = () => {
                console.log("[KIS WebSocket] 연결 끊김");
                this.isConnected = false;
                this.notifyConnectionListeners(false);
                this.attemptReconnect();
            };

            this.ws.onerror = (error) => {
                console.error("[KIS WebSocket] 오류:", error);
                this.notifyErrorListeners(new Error("WebSocket 연결 오류"));
            };

            this.ws.onmessage = (event) => {
                this.handleMessage(event.data);
            };
        } catch (error) {
            console.error("[KIS WebSocket] 연결 실패:", error);
            this.attemptReconnect();
        }
    }

    /**
     * Approval Key 발급 (WebSocket 인증용)
     */
    private async getApprovalKey(): Promise<string> {
        if (!this.config) return "";

        const baseUrl = this.config.environment === "prod"
            ? "https://openapi.koreainvestment.com:9443"
            : "https://openapivts.koreainvestment.com:29443";

        try {
            const response = await fetch(`${baseUrl}/oauth2/Approval`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json; charset=utf-8",
                },
                body: JSON.stringify({
                    grant_type: "client_credentials",
                    appkey: this.config.appKey,
                    secretkey: this.config.appSecret,
                }),
            });

            const data = await response.json();
            if (data.approval_key) {
                console.log("[KIS WebSocket] Approval Key 발급 성공");
                return data.approval_key;
            }

            console.error("[KIS WebSocket] Approval Key 발급 실패:", data.msg1);
            return "";
        } catch (error) {
            console.error("[KIS WebSocket] Approval Key 발급 오류:", error);
            return "";
        }
    }

    /**
     * 실시간 체결가 구독
     */
    subscribePrice(stockCode: string, callback: EventCallback<RealtimePrice>): () => void {
        // 리스너 등록
        if (!this.priceListeners.has(stockCode)) {
            this.priceListeners.set(stockCode, []);
        }
        this.priceListeners.get(stockCode)!.push(callback);

        // 구독 메시지 전송
        if (!this.subscribedPrices.has(stockCode)) {
            this.subscribedPrices.add(stockCode);
            this.sendSubscribe(TR_ID.SUBSCRIBE_PRICE, stockCode);
        }

        // 구독 해제 함수 반환
        return () => this.unsubscribePrice(stockCode, callback);
    }

    /**
     * 실시간 체결가 구독 해제
     */
    unsubscribePrice(stockCode: string, callback: EventCallback<RealtimePrice>): void {
        const listeners = this.priceListeners.get(stockCode);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }

            // 모든 리스너가 해제되면 서버 구독도 해제
            if (listeners.length === 0) {
                this.priceListeners.delete(stockCode);
                this.subscribedPrices.delete(stockCode);
                this.sendUnsubscribe(TR_ID.UNSUBSCRIBE_PRICE, stockCode);
            }
        }
    }

    /**
     * 실시간 호가 구독
     */
    subscribeOrderbook(stockCode: string, callback: EventCallback<RealtimeOrderbook>): () => void {
        if (!this.orderbookListeners.has(stockCode)) {
            this.orderbookListeners.set(stockCode, []);
        }
        this.orderbookListeners.get(stockCode)!.push(callback);

        if (!this.subscribedOrderbooks.has(stockCode)) {
            this.subscribedOrderbooks.add(stockCode);
            this.sendSubscribe(TR_ID.SUBSCRIBE_ORDERBOOK, stockCode);
        }

        return () => this.unsubscribeOrderbook(stockCode, callback);
    }

    /**
     * 실시간 호가 구독 해제
     */
    unsubscribeOrderbook(stockCode: string, callback: EventCallback<RealtimeOrderbook>): void {
        const listeners = this.orderbookListeners.get(stockCode);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }

            if (listeners.length === 0) {
                this.orderbookListeners.delete(stockCode);
                this.subscribedOrderbooks.delete(stockCode);
                this.sendUnsubscribe(TR_ID.UNSUBSCRIBE_ORDERBOOK, stockCode);
            }
        }
    }

    /**
     * 연결 상태 리스너 등록
     */
    onConnectionChange(callback: EventCallback<boolean>): () => void {
        this.connectionListeners.push(callback);
        return () => {
            const index = this.connectionListeners.indexOf(callback);
            if (index > -1) this.connectionListeners.splice(index, 1);
        };
    }

    /**
     * 오류 리스너 등록
     */
    onError(callback: EventCallback<Error>): () => void {
        this.errorListeners.push(callback);
        return () => {
            const index = this.errorListeners.indexOf(callback);
            if (index > -1) this.errorListeners.splice(index, 1);
        };
    }

    /**
     * 연결 상태 확인
     */
    isConnectedToServer(): boolean {
        return this.isConnected;
    }

    /**
     * 연결 종료
     */
    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.subscribedPrices.clear();
        this.subscribedOrderbooks.clear();
    }

    // ============================================
    // Private Methods
    // ============================================

    private sendSubscribe(trId: string, stockCode: string): void {
        this.sendMessage("1", trId, stockCode); // "1" = 등록
    }

    private sendUnsubscribe(trId: string, stockCode: string): void {
        this.sendMessage("2", trId, stockCode); // "2" = 해제
    }

    private sendMessage(trType: string, trId: string, trKey: string): void {
        if (!this.ws || !this.isConnected || !this.config) {
            console.warn("[KIS WebSocket] 연결되지 않음, 메시지 전송 실패");
            return;
        }

        const message = {
            header: {
                approval_key: this.config.approvalKey,
                custtype: "P",
                tr_type: trType,
                content_type: "utf-8",
            },
            body: {
                input: {
                    tr_id: trId,
                    tr_key: trKey,
                },
            },
        };

        this.ws.send(JSON.stringify(message));
        console.log(`[KIS WebSocket] ${trType === "1" ? "구독" : "해제"}: ${trId} - ${trKey}`);
    }

    private handleMessage(rawData: string): void {
        try {
            // KIS WebSocket은 | 구분자로 데이터를 전송
            if (rawData.startsWith("{")) {
                // JSON 응답 (연결 확인 등)
                const data = JSON.parse(rawData);
                console.log("[KIS WebSocket] JSON 응답:", data);
                return;
            }

            // 파이프 구분 데이터 파싱
            const parts = rawData.split("|");
            if (parts.length < 4) return;

            const [encryptFlag, trId, dataCount, body] = parts;

            if (trId === "H0STCNT0") {
                // 실시간 체결가
                this.parsePriceData(body);
            } else if (trId === "H0STASP0") {
                // 실시간 호가
                this.parseOrderbookData(body);
            }
        } catch (error) {
            console.error("[KIS WebSocket] 메시지 파싱 오류:", error);
        }
    }

    private parsePriceData(body: string): void {
        // KIS 실시간 체결가 포맷 파싱
        const fields = body.split("^");
        if (fields.length < 20) return;

        const priceData: RealtimePrice = {
            stockCode: fields[0],
            currentPrice: parseInt(fields[2]) || 0,
            changePrice: parseInt(fields[4]) || 0,
            changeRate: parseFloat(fields[5]) || 0,
            volume: parseInt(fields[12]) || 0,
            askPrice: parseInt(fields[13]) || 0,
            bidPrice: parseInt(fields[14]) || 0,
            timestamp: new Date(),
        };

        // 리스너에 알림
        const listeners = this.priceListeners.get(priceData.stockCode);
        if (listeners) {
            listeners.forEach((callback) => callback(priceData));
        }
    }

    private parseOrderbookData(body: string): void {
        // KIS 실시간 호가 포맷 파싱
        const fields = body.split("^");
        if (fields.length < 50) return;

        const stockCode = fields[0];
        const asks: { price: number; quantity: number }[] = [];
        const bids: { price: number; quantity: number }[] = [];

        // 매도호가 10개 (index 3~22)
        for (let i = 0; i < 10; i++) {
            asks.push({
                price: parseInt(fields[3 + i * 2]) || 0,
                quantity: parseInt(fields[4 + i * 2]) || 0,
            });
        }

        // 매수호가 10개 (index 23~42)
        for (let i = 0; i < 10; i++) {
            bids.push({
                price: parseInt(fields[23 + i * 2]) || 0,
                quantity: parseInt(fields[24 + i * 2]) || 0,
            });
        }

        const orderbookData: RealtimeOrderbook = {
            stockCode,
            timestamp: new Date(),
            asks,
            bids,
            totalAskQuantity: asks.reduce((sum, a) => sum + a.quantity, 0),
            totalBidQuantity: bids.reduce((sum, b) => sum + b.quantity, 0),
        };

        const listeners = this.orderbookListeners.get(stockCode);
        if (listeners) {
            listeners.forEach((callback) => callback(orderbookData));
        }
    }

    private resubscribeAll(): void {
        // 기존 구독 복원
        this.subscribedPrices.forEach((stockCode) => {
            this.sendSubscribe(TR_ID.SUBSCRIBE_PRICE, stockCode);
        });
        this.subscribedOrderbooks.forEach((stockCode) => {
            this.sendSubscribe(TR_ID.SUBSCRIBE_ORDERBOOK, stockCode);
        });
    }

    private attemptReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error("[KIS WebSocket] 최대 재연결 시도 횟수 초과");
            this.notifyErrorListeners(new Error("WebSocket 재연결 실패"));
            return;
        }

        this.reconnectAttempts++;
        console.log(`[KIS WebSocket] ${this.reconnectDelay}ms 후 재연결 시도... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.connect();
        }, this.reconnectDelay);
    }

    private notifyConnectionListeners(connected: boolean): void {
        this.connectionListeners.forEach((callback) => callback(connected));
    }

    private notifyErrorListeners(error: Error): void {
        this.errorListeners.forEach((callback) => callback(error));
    }
}

// 싱글톤 인스턴스
export const kisWebSocket = new KisWebSocketService();

import { Timestamp } from "firebase/firestore";
import { priceService } from "../market-data/price-service";

/**
 * 알림 타입
 */
export type AlertType = "price_above" | "price_below" | "target_reached" | "stop_loss" | "profit_milestone";

/**
 * 알림 상태
 */
export type AlertStatus = "active" | "triggered" | "expired" | "cancelled";

/**
 * 알림 인터페이스
 */
export interface Alert {
    id: string;
    userId: string;
    holdingId: string;
    stockCode: string;
    stockName: string;
    type: AlertType;
    condition: {
        price?: number;
        percent?: number;
    };
    message: string;
    status: AlertStatus;
    createdAt: Timestamp;
    triggeredAt?: Timestamp;
}

/**
 * 트리거된 알림
 */
export interface TriggeredAlert extends Alert {
    currentPrice: number;
    triggeredAt: Timestamp;
}

/**
 * 알림 생성 입력
 */
export interface CreateAlertInput {
    userId: string;
    holdingId: string;
    stockCode: string;
    stockName: string;
    type: AlertType;
    condition: {
        price?: number;
        percent?: number;
    };
}

/**
 * 알림 서비스
 */
export class AlertService {
    private alerts: Map<string, Alert> = new Map();

    /**
     * 가격 알림 생성
     */
    async createPriceAlert(
        userId: string,
        holdingId: string,
        stockCode: string,
        stockName: string,
        targetPrice: number,
        type: "price_above" | "price_below"
    ): Promise<Alert> {
        const alert: Alert = {
            id: `alert_${Date.now()}`,
            userId,
            holdingId,
            stockCode,
            stockName,
            type,
            condition: { price: targetPrice },
            message: type === "price_above"
                ? `${stockName}이(가) ${targetPrice.toLocaleString()}원 이상으로 상승했습니다.`
                : `${stockName}이(가) ${targetPrice.toLocaleString()}원 이하로 하락했습니다.`,
            status: "active",
            createdAt: Timestamp.now(),
        };

        this.alerts.set(alert.id, alert);
        return alert;
    }

    /**
     * 목표가 도달 알림 생성
     */
    async createTargetAlert(
        userId: string,
        holdingId: string,
        stockCode: string,
        stockName: string,
        targetPrice: number
    ): Promise<Alert> {
        const alert: Alert = {
            id: `alert_${Date.now()}`,
            userId,
            holdingId,
            stockCode,
            stockName,
            type: "target_reached",
            condition: { price: targetPrice },
            message: `🎯 ${stockName}이(가) 목표가 ${targetPrice.toLocaleString()}원에 도달했습니다!`,
            status: "active",
            createdAt: Timestamp.now(),
        };

        this.alerts.set(alert.id, alert);
        return alert;
    }

    /**
     * 손절 알림 생성
     */
    async createStopLossAlert(
        userId: string,
        holdingId: string,
        stockCode: string,
        stockName: string,
        stopLossPrice: number
    ): Promise<Alert> {
        const alert: Alert = {
            id: `alert_${Date.now()}`,
            userId,
            holdingId,
            stockCode,
            stockName,
            type: "stop_loss",
            condition: { price: stopLossPrice },
            message: `⚠️ ${stockName}이(가) 손절선 ${stopLossPrice.toLocaleString()}원에 도달했습니다. 매도를 검토하세요.`,
            status: "active",
            createdAt: Timestamp.now(),
        };

        this.alerts.set(alert.id, alert);
        return alert;
    }

    /**
     * 수익률 마일스톤 알림 생성
     */
    async createProfitMilestoneAlert(
        userId: string,
        holdingId: string,
        stockCode: string,
        stockName: string,
        targetPercent: number
    ): Promise<Alert> {
        const alert: Alert = {
            id: `alert_${Date.now()}`,
            userId,
            holdingId,
            stockCode,
            stockName,
            type: "profit_milestone",
            condition: { percent: targetPercent },
            message: `🎉 ${stockName}이(가) ${targetPercent}% 수익률을 달성했습니다!`,
            status: "active",
            createdAt: Timestamp.now(),
        };

        this.alerts.set(alert.id, alert);
        return alert;
    }

    /**
     * 알림 체크 및 트리거
     */
    async checkAlerts(): Promise<TriggeredAlert[]> {
        const triggered: TriggeredAlert[] = [];

        for (const alert of this.alerts.values()) {
            if (alert.status !== "active") continue;

            const priceData = await priceService.getCurrentPrice(alert.stockCode);
            const currentPrice = priceData.currentPrice;
            let shouldTrigger = false;

            switch (alert.type) {
                case "price_above":
                case "target_reached":
                    if (alert.condition.price && currentPrice >= alert.condition.price) {
                        shouldTrigger = true;
                    }
                    break;
                case "price_below":
                case "stop_loss":
                    if (alert.condition.price && currentPrice <= alert.condition.price) {
                        shouldTrigger = true;
                    }
                    break;
            }

            if (shouldTrigger) {
                const triggeredAlert: TriggeredAlert = {
                    ...alert,
                    currentPrice,
                    triggeredAt: Timestamp.now(),
                    status: "triggered",
                };

                this.alerts.set(alert.id, { ...alert, status: "triggered", triggeredAt: Timestamp.now() });
                triggered.push(triggeredAlert);
            }
        }

        return triggered;
    }

    /**
     * 알림 목록 조회
     */
    getAlerts(userId: string): Alert[] {
        return Array.from(this.alerts.values()).filter(a => a.userId === userId);
    }

    /**
     * 알림 취소
     */
    cancelAlert(alertId: string): void {
        const alert = this.alerts.get(alertId);
        if (alert) {
            this.alerts.set(alertId, { ...alert, status: "cancelled" });
        }
    }

    /**
     * 알림 삭제
     */
    deleteAlert(alertId: string): void {
        this.alerts.delete(alertId);
    }
}

export const alertService = new AlertService();

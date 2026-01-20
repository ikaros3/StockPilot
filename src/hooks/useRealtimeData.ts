"use client";

import { useState, useEffect, useRef } from "react";
import type { RealtimePrice, RealtimeOrderbook } from "@/services/market-data/kis-websocket";

// WebSocket 연결 상태
type ConnectionStatus = "connecting" | "connected" | "disconnected" | "error";

/**
 * 실시간 체결가 훅
 */
export function useRealtimePrice(stockCode: string) {
    const [price, setPrice] = useState<RealtimePrice | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const [error, setError] = useState<Error | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!stockCode) return;

        const setupWebSocket = async () => {
            try {
                const { kisWebSocket } = await import("@/services/market-data/kis-websocket");
                const { getConfig } = await import("@/services/market-data/kis-service");

                const config = getConfig();

                // WebSocket이 연결되지 않았으면 초기화
                if (!kisWebSocket.isConnectedToServer()) {
                    setStatus("connecting");

                    await kisWebSocket.initialize({
                        environment: config.environment,
                        appKey: config.activeConfig.appKey,
                        appSecret: config.activeConfig.appSecret,
                    });
                }

                // 연결 상태 리스너
                const unsubscribeConnection = kisWebSocket.onConnectionChange((connected) => {
                    setStatus(connected ? "connected" : "disconnected");
                });

                // 에러 리스너
                const unsubscribeError = kisWebSocket.onError((err) => {
                    setError(err);
                    setStatus("error");
                });

                // 실시간 체결가 구독
                const unsubscribePrice = kisWebSocket.subscribePrice(stockCode, (data) => {
                    setPrice(data);
                });

                // cleanup 함수 저장
                unsubscribeRef.current = () => {
                    unsubscribeConnection();
                    unsubscribeError();
                    unsubscribePrice();
                };

                setStatus("connected");
            } catch (err) {
                console.error("[useRealtimePrice] 초기화 오류:", err);
                setError(err as Error);
                setStatus("error");
            }
        };

        setupWebSocket();

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [stockCode]);

    return { price, status, error };
}

/**
 * 실시간 호가 훅
 */
export function useRealtimeOrderbook(stockCode: string) {
    const [orderbook, setOrderbook] = useState<RealtimeOrderbook | null>(null);
    const [status, setStatus] = useState<ConnectionStatus>("disconnected");
    const [error, setError] = useState<Error | null>(null);
    const unsubscribeRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!stockCode) return;

        const setupWebSocket = async () => {
            try {
                const { kisWebSocket } = await import("@/services/market-data/kis-websocket");
                const { getConfig } = await import("@/services/market-data/kis-service");

                const config = getConfig();

                if (!kisWebSocket.isConnectedToServer()) {
                    setStatus("connecting");

                    await kisWebSocket.initialize({
                        environment: config.environment,
                        appKey: config.activeConfig.appKey,
                        appSecret: config.activeConfig.appSecret,
                    });
                }

                const unsubscribeConnection = kisWebSocket.onConnectionChange((connected) => {
                    setStatus(connected ? "connected" : "disconnected");
                });

                const unsubscribeError = kisWebSocket.onError((err) => {
                    setError(err);
                    setStatus("error");
                });

                // 실시간 호가 구독
                const unsubscribeOrderbook = kisWebSocket.subscribeOrderbook(stockCode, (data) => {
                    setOrderbook(data);
                });

                unsubscribeRef.current = () => {
                    unsubscribeConnection();
                    unsubscribeError();
                    unsubscribeOrderbook();
                };

                setStatus("connected");
            } catch (err) {
                console.error("[useRealtimeOrderbook] 초기화 오류:", err);
                setError(err as Error);
                setStatus("error");
            }
        };

        setupWebSocket();

        return () => {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
            }
        };
    }, [stockCode]);

    return { orderbook, status, error };
}

/**
 * 연결 상태 색상 반환
 */
export function getStatusColor(status: ConnectionStatus): string {
    switch (status) {
        case "connected":
            return "text-green-500";
        case "connecting":
            return "text-yellow-500";
        case "disconnected":
            return "text-gray-500";
        case "error":
            return "text-red-500";
    }
}

/**
 * 연결 상태 라벨 반환
 */
export function getStatusLabel(status: ConnectionStatus): string {
    switch (status) {
        case "connected":
            return "실시간";
        case "connecting":
            return "연결 중...";
        case "disconnected":
            return "연결 안됨";
        case "error":
            return "오류";
    }
}

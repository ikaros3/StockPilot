"use client";

import { useMemo } from "react";
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

interface StockChartProps {
    data: {
        date: string;
        openPrice: number;
        highPrice: number;
        lowPrice: number;
        closePrice: number;
        volume: number;
    }[];
    height?: number;
}

// 캔들스틱 Custom Shape
const CandleStick = (props: any) => {
    const { x, y, width, height, low, high, openClose } = props;
    const isUp = openClose[1] >= openClose[0];
    const color = isUp ? "#ef4444" : "#3b82f6"; // Red : Blue
    // 상단 꼬리, 하단 꼬리 좌표 계산
    // Y축은 위에서 아래로 증가하므로 값이 클수록 Y좌표는 작아짐 (recharts 자동 처리됨)
    // 하지만 여기서 props로 넘어오는 y, height는 '몸통' 기준임.
    // low, high값은 Y축 스케일에 맞게 변환된 좌표가 아니라 '값' 자체일 수 있음 -> 아님, recharts가 좌표로 변환해서 줌?
    // CustomShape에서는 보통 좌표 변환된 값을 받아야 함. 
    // Bar에 데이터를 어떻게 넘기느냐에 따라 다름.
    // [min, max] 형태로 데이터를 넘기면 y는 min(상단) 좌표, height는 길이.

    // recharts의 Custom Shape props:
    // x, y, width, height는 Bar의 dimensions.
    // payload 안에는 원본 데이터가 있음.

    // 캔들 몸통 그리기
    // 몸통의 중심 X 좌표
    const cx = x + width / 2;

    // 고가/저가 선 그리기 (좌표 변환 필요)
    // 이 부분은 Bar의 기본 props로는 해결 안 됨. YAxis Scale을 가져와야 함.
    // 또는 ComposedChart에서 ErrorBar를 쓰는 게 나을 수도 있음. 

    // 여기서는 간단하게 ErrorBar 대신 Shape 안에서 해결하려면 YScale 함수가 필요한데 props로 안 넘어옴.
    // 따라서 가장 쉬운 방법:
    // data에 [low, high] 범위를 가진 Bar를 하나 그리고(꼬리), [open, close] 범위를 가진 Bar를 그 위에 덮어쓰기? 
    // -> 이러면 두께 조절이 어려움.

    // 해결책: SVG로 직접 그리기. 하지만 y좌표 변환이 문제.
    // recharts에서 캔들스틱 그리기는 까다롭기로 유명함.

    // 대안: 그냥 ErrorBar 사용하지 않고 '오차 막대' 처럼 보이나, 
    // 여기선 SVG Path로 그리되, 좌표는 yAxis 스케일을 통해 변환된 값을 받아야 함.
    // Bar 컴포넌트에 [low, high] 데이터를 넣고, shape props에서 open, close 값을 payload로 받아서 처리.

    const { y: highY, height: totalHeight } = props;
    // Bar dataKey를 [low, high]로 주면, y는 high의 좌표, height는 low-high의 길이.

    // 원본 데이터
    const { openPrice, closePrice, highPrice, lowPrice } = props.payload;

    // 하지만 스케일 함수가 없어서 openY, closeY를 계산할 수 없음.
    // 따라서 이 방법(Custom Shape 내에서 스케일링)은 불가능.

    // 'recharts' way: 
    // 1. 고가-저가 라인은 ErrorBar 또는 별도 Line으로? (X)
    // 2. Bar를 [low, high]로 렌더링하되, stroke만 그리고 fill은 투명? -> 막대 두께 문제.

    // 가장 확실한 방법:
    // Bar에 dataKey=[lowPrice, highPrice]를 넣는다. 이 Bar는 얇게(꼬리).
    // 또 다른 Bar에 dataKey=[Math.min(open, close), Math.max(open, close)]를 넣는다. 이 Bar는 두껍게(몸통).
    // 이 두 Bar를 겹쳐서 그리면 됨. X축 공유하므로.
    return <path />;
};

export function StockChart({ data, height = 400 }: StockChartProps) {
    // 데이터 가공: 날짜 오름차순 정렬 및 이평선 계산
    const chartData = useMemo(() => {
        // 원본 데이터 복사 및 날짜 오름차순 정렬 (과거 -> 현재)
        const sortedData = [...data].sort((a, b) => a.date.localeCompare(b.date));

        // 이평선 계산
        const calculateMA = (days: number) => {
            return sortedData.map((item, index, array) => {
                if (index < days - 1) return { ...item, [`ma${days}`]: null };
                const slice = array.slice(index - days + 1, index + 1);
                const sum = slice.reduce((acc, cur) => acc + cur.closePrice, 0);
                return sum / days;
            });
        };

        const ma5 = calculateMA(5);
        const ma20 = calculateMA(20);
        const ma60 = calculateMA(60);
        const ma120 = calculateMA(120);

        return sortedData.map((item, index) => {
            const isUp = item.closePrice >= item.openPrice;
            const year = item.date.slice(0, 4);
            const month = item.date.slice(4, 6);
            const day = item.date.slice(6, 8);

            return {
                ...item,
                ma5: ma5[index],
                ma20: ma20[index],
                ma60: ma60[index],
                ma120: ma120[index],
                // 캔들 차트용 데이터 (Bar range)
                // 꼬리: [저가, 고가]
                candleTail: [item.lowPrice, item.highPrice],
                // 몸통: [min(시,종), max(시,종)]
                candleBody: [Math.min(item.openPrice, item.closePrice), Math.max(item.openPrice, item.closePrice)],
                color: isUp ? "#ef4444" : "#3b82f6", // 상승: 빨강, 하락: 파랑
                formattedDate: `${month}/${day}`,
            };
        });
    }, [data]);

    // 차트 높이 분배 (주가 70%, 거래량 30%)
    const mainChartHeight = height * 0.7;
    const volumeChartHeight = height * 0.3;

    return (
        <div className="w-full flex flex-col gap-2" style={{ height }}>
            {/* 주가 차트 (캔들 + 이평선) */}
            <div style={{ height: mainChartHeight, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        syncId="stockChart"
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis
                            dataKey="formattedDate"
                            hide={true} // 위쪽 차트의 X축 텍스트는 숨김
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            domain={['auto', 'auto']}
                            tickFormatter={(value) => value.toLocaleString()}
                            orientation="right"
                            tick={{ fontSize: 11 }}
                            tickCount={6}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            labelStyle={{ color: '#666', marginBottom: '4px' }}
                            filterNull={true}
                            formatter={(value: any, name: any) => {
                                // 배열(캔들 꼬리/몸통)이나 객체는 렌더링 제외
                                if (Array.isArray(value) || typeof value === 'object') return [];
                                if (name === 'candleTail' || name === 'candleBody' || name === 'color') return [];
                                // 숫자 포맷팅
                                if (typeof value === 'number') return [value.toLocaleString(), name];
                                return [value, name];
                            }}
                        />

                        {/* 이평선 */}
                        <Line type="monotone" dataKey="ma5" stroke="#10b981" dot={false} strokeWidth={1} name="5일" isAnimationActive={false} />
                        <Line type="monotone" dataKey="ma20" stroke="#f59e0b" dot={false} strokeWidth={1} name="20일" isAnimationActive={false} />
                        <Line type="monotone" dataKey="ma60" stroke="#8b5cf6" dot={false} strokeWidth={1} name="60일" isAnimationActive={false} />
                        <Line type="monotone" dataKey="ma120" stroke="#ec4899" dot={false} strokeWidth={1} name="120일" isAnimationActive={false} />

                        {/* 캔들스틱 - 꼬리 (얇은 바) */}
                        <Bar dataKey="candleTail" barSize={1} isAnimationActive={false}>
                            {chartData.map((entry, index) => (
                                <Cell key={`tail-${index}`} fill={entry.color} />
                            ))}
                        </Bar>

                        {/* 캔들스틱 - 몸통 (두꺼운 바) */}
                        <Bar dataKey="candleBody" barSize={8} isAnimationActive={false}>
                            {chartData.map((entry, index) => (
                                <Cell key={`body-${index}`} fill={entry.color} />
                            ))}
                        </Bar>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

            {/* 거래량 차트 */}
            <div style={{ height: volumeChartHeight, width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={chartData}
                        syncId="stockChart" // 두 차트 동기화 (마우스 오버 등)
                        margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis
                            dataKey="formattedDate"
                            tick={{ fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            orientation="right"
                            tick={{ fontSize: 10 }}
                            tickFormatter={(val) => (val / 1000).toFixed(0) + 'K'} // K 단위
                            tickCount={4}
                        />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Bar dataKey="volume" name="거래량" barSize={8} isAnimationActive={false}>
                            {chartData.map((entry, index) => (
                                <Cell key={`vol-${index}`} fill={entry.color} opacity={0.6} />
                            ))}
                        </Bar>
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

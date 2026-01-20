---
description: 새로운 분석 탭 컴포넌트를 생성합니다
---
# 분석 탭 컴포넌트 생성

종목 상세 페이지에 새로운 분석 탭을 추가합니다.

## 컴포넌트 구조

```
src/components/analysis/
├── SummaryTab.tsx        # 요약
├── ExitTimingTab.tsx     # 매도 타이밍
├── AccumulationTab.tsx   # 추가 매수
├── RiskControlTab.tsx    # 익절/손절
├── TradingStrategyTab.tsx # 매매 전략
├── HoldingPeriodTab.tsx  # 보유 기간
├── AnalystTab.tsx        # 애널리스트
└── index.ts              # export
```

## 새 탭 추가 시

1. `src/components/analysis/[TabName]Tab.tsx` 생성
2. `src/components/analysis/index.ts`에 export 추가
3. `src/app/stocks/[id]/page.tsx`에 TabsTrigger와 TabsContent 추가

## 템플릿

```tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface [TabName]TabProps {
  stockId: string;
}

export function [TabName]Tab({ stockId }: [TabName]TabProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>제목</CardTitle>
        </CardHeader>
        <CardContent>
          내용
        </CardContent>
      </Card>
    </div>
  );
}
```

---
description: shadcn/ui 컴포넌트를 추가합니다
---
# shadcn/ui 컴포넌트 추가

프로젝트에 새로운 shadcn/ui 컴포넌트를 추가합니다.

## 사용 가능한 컴포넌트

- button, card, badge, tabs, input, select
- dialog, avatar, dropdown-menu, separator
- scroll-area, tooltip, progress, alert
- table, form, checkbox, radio-group
- switch, slider, calendar, popover

## 단계

// turbo
1. 단일 컴포넌트 추가
```bash
npx shadcn@latest add [컴포넌트명] -y
```

// turbo
2. 여러 컴포넌트 동시 추가
```bash
npx shadcn@latest add button card badge tabs -y
```

## 생성 위치

`src/components/ui/[컴포넌트명].tsx`

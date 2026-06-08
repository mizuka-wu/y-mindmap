# 主题系统

## 概述

Y-MindMap 支持 7 个预置主题，同时支持自定义主题。

## 预置主题

| 主题 | 名称 | 说明 |
|------|------|------|
| Classic | 经典 | 默认主题，适合大多数场景 |
| Dark | 暗黑 | 深色背景，护眼 |
| Colorful | 彩色 | 鲜艳色彩，活泼 |
| Minimalist | 极简 | 简约风格 |
| Ocean | 海洋 | 蓝色调 |
| Forest | 森林 | 绿色调 |
| Sunset | 日落 | 暖色调 |

## 使用方式

### 切换主题

```typescript
import { ThemeManager, DARK_THEME } from '@y-mindmap/view'

const themeManager = new ThemeManager()
themeManager.setTheme(DARK_THEME)
```

### 自定义主题

```typescript
import { Theme } from '@y-mindmap/view'

const customTheme: Theme = {
  id: 'custom',
  name: 'Custom',
  colors: {
    background: '#ffffff',
    foreground: '#333333',
    primary: '#4A90D9',
    secondary: '#6C757D',
    accent: '#FF6B6B',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
  },
  fonts: {
    family: 'Arial, sans-serif',
    size: {
      small: 12,
      normal: 14,
      large: 16,
      xlarge: 20,
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
  },
  topic: {
    default: {
      fillColor: '#ffffff',
      borderColor: '#dddddd',
      textColor: '#333333',
      cornerRadius: 8,
    },
    root: {
      fillColor: '#4A90D9',
      borderColor: '#357ABD',
      textColor: '#ffffff',
      cornerRadius: 12,
    },
  },
  connection: {
    default: {
      color: '#999999',
      width: 2,
      style: 'curve',
    },
  },
}

// 注册主题
themeManager.registerTheme(customTheme)
themeManager.setTheme('custom')
```

## 主题结构

```typescript
interface Theme {
  id: string
  name: string
  colors: ThemeColors
  fonts: ThemeFonts
  spacing: ThemeSpacing
  topic: {
    default: TopicStylePreset
    root: TopicStylePreset
  }
  connection: {
    default: ConnectionStylePreset
  }
}

interface ThemeColors {
  background: string
  foreground: string
  primary: string
  secondary: string
  accent: string
  success: string
  warning: string
  error: string
}
```

## 动态切换

```typescript
// 监听系统主题变化
const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
mediaQuery.addEventListener('change', (e) => {
  if (e.matches) {
    themeManager.setTheme(DARK_THEME)
  } else {
    themeManager.setTheme(CLASSIC_THEME)
  }
})
```

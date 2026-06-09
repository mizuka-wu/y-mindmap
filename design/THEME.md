# THEME.md - 主题系统设计

> 思维导图主题管理、切换、自定义设计

---

## 一、主题架构

### 1.1 主题结构

```typescript
// @y-mindmap/theme/types.ts

interface Theme {
  /** 主题唯一标识 */
  id: string
  
  /** 主题名称 */
  name: string
  
  /** 主题描述 */
  description?: string
  
  /** 主题版本 */
  version: string
  
  /** 作者 */
  author?: string
  
  /** 颜色主题 */
  colors: ColorTheme
  
  /** 字体主题 */
  fonts: FontTheme
  
  /** 间距主题 */
  spacing: SpacingTheme
  
  /** 组件样式 */
  components: ComponentTheme
}

interface ColorTheme {
  /** 主色调 */
  primary: string
  
  /** 次要色 */
  secondary: string
  
  /** 背景色 */
  background: string
  
  /** 表面色 */
  surface: string
  
  /** 文字色 */
  text: string
  
  /** 边框色 */
  border: string
  
  /** 强调色 */
  accent: string
  
  /** 错误色 */
  error: string
  
  /** 警告色 */
  warning: string
  
  /** 成功色 */
  success: string
  
  /** 信息色 */
  info: string
  
  /** 自定义颜色 */
  custom: Record<string, string>
}

interface FontTheme {
  /** 字体族 */
  family: string
  
  /** 基础字号 */
  baseSize: number
  
  /** 字号比例 */
  scaleRatio: number
  
  /** 行高 */
  lineHeight: number
  
  /** 字重 */
  weights: {
    light: number
    normal: number
    medium: number
    bold: number
  }
}

interface SpacingTheme {
  /** 基础间距单位 */
  unit: number
  
  /** 间距比例 */
  scale: number[]
}

interface ComponentTheme {
  /** 节点样式 */
  topic: TopicTheme
  
  /** 连线样式 */
  connection: ConnectionTheme
  
  /** 边界样式 */
  boundary: BoundaryTheme
  
  /** 摘要样式 */
  summary: SummaryTheme
  
  /** 关系线样式 */
  relationship: RelationshipTheme
}

interface TopicTheme {
  /** 中央节点 */
  central: TopicStylePreset
  
  /** 主节点 */
  main: TopicStylePreset
  
  /** 子节点 */
  sub: TopicStylePreset
  
  /** 浮动节点 */
  floating: TopicStylePreset
  
  /** 标注节点 */
  callout: TopicStylePreset
}

interface TopicStylePreset {
  /** 形状 */
  shape: string
  
  /** 填充色 */
  fill: string
  
  /** 边框色 */
  border: string
  
  /** 边框宽度 */
  borderWidth: number
  
  /** 文字色 */
  textColor: string
  
  /** 字号 */
  fontSize: number
  
  /** 字重 */
  fontWeight: string
  
  /** 圆角 */
  borderRadius: number
  
  /** 阴影 */
  shadow?: string
}

interface ConnectionTheme {
  /** 默认样式 */
  default: ConnectionStylePreset
  
  /** 选中样式 */
  selected: ConnectionStylePreset
}

interface ConnectionStylePreset {
  /** 线型 */
  lineClass: string
  
  /** 线色 */
  color: string
  
  /** 线宽 */
  width: number
  
  /** 是否锥形 */
  tapered: boolean
}
```

---

## 二、预置主题

### 2.1 主题定义

```typescript
// @y-mindmap/theme/presets/classic.ts

export const classicTheme: Theme = {
  id: 'classic',
  name: '经典',
  description: '经典思维导图主题',
  version: '1.0.0',
  
  colors: {
    primary: '#4A90D9',
    secondary: '#7B68EE',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#333333',
    border: '#DDDDDD',
    accent: '#FF6B6B',
    error: '#FF4444',
    warning: '#FFB300',
    success: '#4CAF50',
    info: '#2196F3',
    custom: {},
  },
  
  fonts: {
    family: 'Arial, sans-serif',
    baseSize: 14,
    scaleRatio: 1.2,
    lineHeight: 1.5,
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      bold: 700,
    },
  },
  
  spacing: {
    unit: 8,
    scale: [0.5, 1, 1.5, 2, 3, 4, 6, 8],
  },
  
  components: {
    topic: {
      central: {
        shape: 'roundedRect',
        fill: '#4A90D9',
        border: '#2E6DB4',
        borderWidth: 2,
        textColor: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        borderRadius: 12,
        shadow: '0 4px 8px rgba(0,0,0,0.2)',
      },
      main: {
        shape: 'roundedRect',
        fill: '#5BA0E9',
        border: '#3A8FD4',
        borderWidth: 2,
        textColor: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        borderRadius: 8,
      },
      sub: {
        shape: 'roundedRect',
        fill: '#E8F0FE',
        border: '#B8D4F0',
        borderWidth: 1,
        textColor: '#333333',
        fontSize: 14,
        fontWeight: 'normal',
        borderRadius: 6,
      },
      floating: {
        shape: 'roundedRect',
        fill: '#FFF3E0',
        border: '#FFB74D',
        borderWidth: 1,
        textColor: '#333333',
        fontSize: 14,
        fontWeight: 'normal',
        borderRadius: 8,
      },
      callout: {
        shape: 'callout',
        fill: '#FFF9C4',
        border: '#F9A825',
        borderWidth: 1,
        textColor: '#333333',
        fontSize: 12,
        fontWeight: 'normal',
        borderRadius: 4,
      },
    },
    
    connection: {
      default: {
        lineClass: 'curve',
        color: '#999999',
        width: 2,
        tapered: false,
      },
      selected: {
        lineClass: 'curve',
        color: '#4A90D9',
        width: 3,
        tapered: false,
      },
    },
    
    boundary: {
      fill: 'rgba(74, 144, 217, 0.1)',
      border: '#4A90D9',
      borderWidth: 1,
      borderRadius: 8,
    },
    
    summary: {
      color: '#999999',
      width: 2,
    },
    
    relationship: {
      color: '#999999',
      width: 2,
      lineClass: 'curve',
    },
  },
}
```

### 2.2 更多预置主题

```typescript
// @y-mindmap/theme/presets/index.ts

export const presets: Theme[] = [
  classicTheme,
  darkTheme,
  colorfulTheme,
  minimalistTheme,
  handDrawnTheme,
  // ...
]

export function getThemeById(id: string): Theme | undefined {
  return presets.find(theme => theme.id === id)
}

export function getDefaultTheme(): Theme {
  return classicTheme
}
```

---

## 三、主题管理器

### 3.1 主题管理器实现

```typescript
// @y-mindmap/theme/theme-manager.ts

class ThemeManager {
  private currentTheme: Theme
  private customThemes: Map<string, Theme> = new Map()
  private listeners: Set<(theme: Theme) => void> = new Set()
  
  constructor(initialTheme?: Theme) {
    this.currentTheme = initialTheme || getDefaultTheme()
  }
  
  /**
   * 获取当前主题
   */
  getCurrentTheme(): Theme {
    return this.currentTheme
  }
  
  /**
   * 切换主题
   */
  switchTheme(themeId: string): void {
    const theme = this.getTheme(themeId)
    
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`)
    }
    
    this.currentTheme = theme
    this.notifyListeners()
  }
  
  /**
   * 获取主题
   */
  private getTheme(themeId: string): Theme | undefined {
    // 先查找自定义主题
    const custom = this.customThemes.get(themeId)
    if (custom) return custom
    
    // 再查找预置主题
    return getThemeById(themeId)
  }
  
  /**
   * 注册自定义主题
   */
  registerTheme(theme: Theme): void {
    this.customThemes.set(theme.id, theme)
  }
  
  /**
   * 注销自定义主题
   */
  unregisterTheme(themeId: string): void {
    this.customThemes.delete(themeId)
  }
  
  /**
   * 监听主题变更
   */
  onThemeChange(listener: (theme: Theme) => void): () => void {
    this.listeners.add(listener)
    
    return () => {
      this.listeners.delete(listener)
    }
  }
  
  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentTheme))
  }
  
  /**
   * 获取所有可用主题
   */
  getAvailableThemes(): Theme[] {
    return [
      ...presets,
      ...Array.from(this.customThemes.values()),
    ]
  }
  
  /**
   * 创建主题变体
   */
  createVariant(baseThemeId: string, overrides: Partial<Theme>): Theme {
    const base = this.getTheme(baseThemeId)
    if (!base) {
      throw new Error(`Base theme not found: ${baseThemeId}`)
    }
    
    return {
      ...base,
      ...overrides,
      id: overrides.id || `${base.id}-variant`,
      colors: { ...base.colors, ...overrides.colors },
      fonts: { ...base.fonts, ...overrides.fonts },
      spacing: { ...base.spacing, ...overrides.spacing },
      components: { ...base.components, ...overrides.components },
    }
  }
}
```

---

## 四、主题应用

### 4.1 样式计算

```typescript
// @y-mindmap/theme/style-resolver.ts

class ThemeStyleResolver {
  private themeManager: ThemeManager
  
  constructor(themeManager: ThemeManager) {
    this.themeManager = themeManager
  }
  
  /**
   * 解析节点样式
   */
  resolveTopicStyle(
    node: MindMapNode,
    state: 'default' | 'hover' | 'selected' = 'default'
  ): ResolvedStyle {
    const theme = this.themeManager.getCurrentTheme()
    const preset = this.getTopicPreset(node, theme)
    
    // 应用状态样式
    const stateStyle = this.getStateStyle(preset, state)
    
    // 合并用户自定义样式
    const userStyle = node.style?.properties || {}
    
    return {
      ...preset,
      ...stateStyle,
      ...userStyle,
    }
  }
  
  /**
   * 获取节点预设样式
   */
  private getTopicPreset(node: MindMapNode, theme: Theme): TopicStylePreset {
    switch (node.type) {
      case TopicType.ROOT:
        return theme.components.topic.central
      
      case TopicType.ATTACHED:
        if (node.depth === 1) {
          return theme.components.topic.main
        }
        return theme.components.topic.sub
      
      case TopicType.DETACHED:
        return theme.components.topic.floating
      
      case TopicType.CALLOUT:
        return theme.components.topic.callout
      
      default:
        return theme.components.topic.sub
    }
  }
  
  /**
   * 获取状态样式
   */
  private getStateStyle(
    preset: TopicStylePreset,
    state: string
  ): Partial<TopicStylePreset> {
    switch (state) {
      case 'hover':
        return {
          border: this.lighten(preset.border, 0.2),
          borderWidth: preset.borderWidth + 1,
        }
      
      case 'selected':
        return {
          border: theme.colors.accent,
          borderWidth: preset.borderWidth + 1,
        }
      
      default:
        return {}
    }
  }
  
  /**
   * 颜色变亮
   */
  private lighten(color: string, amount: number): string {
    // 实现颜色变亮逻辑
    return color
  }
}
```

### 4.2 CSS 变量生成

```typescript
// @y-mindmap/theme/css-variables.ts

class CssVariableGenerator {
  /**
   * 生成 CSS 变量
   */
  generate(theme: Theme): Record<string, string> {
    return {
      // 颜色
      '--ymind-color-primary': theme.colors.primary,
      '--ymind-color-secondary': theme.colors.secondary,
      '--ymind-color-background': theme.colors.background,
      '--ymind-color-surface': theme.colors.surface,
      '--ymind-color-text': theme.colors.text,
      '--ymind-color-border': theme.colors.border,
      '--ymind-color-accent': theme.colors.accent,
      
      // 字体
      '--ymind-font-family': theme.fonts.family,
      '--ymind-font-size-base': `${theme.fonts.baseSize}px`,
      '--ymind-line-height': String(theme.fonts.lineHeight),
      
      // 间距
      '--ymind-spacing-unit': `${theme.spacing.unit}px`,
      
      // 组件
      '--ymind-topic-central-fill': theme.components.topic.central.fill,
      '--ymind-topic-central-border': theme.components.topic.central.border,
      '--ymind-topic-main-fill': theme.components.topic.main.fill,
      '--ymind-topic-sub-fill': theme.components.topic.sub.fill,
      // ...
    }
  }
  
  /**
   * 应用到 DOM
   */
  applyToDom(theme: Theme): void {
    const variables = this.generate(theme)
    const root = document.documentElement
    
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value)
    })
  }
}
```

---

## 五、主题切换动画

### 5.1 切换动画实现

```typescript
// @y-mindmap/theme/theme-transition.ts

class ThemeTransition {
  /**
   * 执行主题切换动画
   */
  async animate(
    editor: EditorView,
    fromTheme: Theme,
    toTheme: Theme,
    duration: number = 300
  ): Promise<void> {
    // 计算颜色差异
    const colorDiffs = this.calcColorDiffs(fromTheme.colors, toTheme.colors)
    
    // 创建动画
    const animation = editor.animate(
      this.getKeyframes(colorDiffs),
      { duration, easing: 'ease-in-out' }
    )
    
    // 等待动画完成
    await animation.finished
    
    // 应用最终主题
    editor.applyTheme(toTheme)
  }
  
  /**
   * 计算颜色差异
   */
  private calcColorDiffs(
    from: ColorTheme,
    to: ColorTheme
  ): ColorDiff[] {
    const diffs: ColorDiff[] = []
    
    Object.keys(from).forEach(key => {
      if (from[key] !== to[key]) {
        diffs.push({
          property: key,
          from: from[key],
          to: to[key],
        })
      }
    })
    
    return diffs
  }
  
  /**
   * 获取关键帧
   */
  private getKeyframes(diffs: ColorDiff[]): Keyframe[] {
    // 生成颜色过渡关键帧
    return []
  }
}
```

---

## 六、Snowbrush 主题参考

### 6.1 主题数据结构

```typescript
// 来源: /src/models/theme.ts

type ThemeData = {
  id: string
  title: string
  colorThemeId?: string
  skeletonThemeId?: string
  map?: StyleData
  centralTopic?: StyleData
  mainTopic?: StyleData
  subTopic?: StyleData
  floatingTopic?: StyleData
  boundary?: StyleData
  relationship?: StyleData
  summaryTopic?: StyleData
  summary?: StyleData
}
```

### 6.2 颜色主题

```typescript
// 来源: /src/snowball/lib/colorthemes.json

const colorThemes = [
  {
    id: 'rgb(74,144,217)',
    name: 'Blue',
    centralTopic: { fill: '#4A90D9', text: '#FFFFFF' },
    mainTopic: { fill: '#5BA0E9', text: '#FFFFFF' },
    subTopic: { fill: '#E8F0FE', text: '#333333' },
    // ...
  },
  // 更多主题...
]
```

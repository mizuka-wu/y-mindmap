# STYLE-SYSTEM.md - 样式系统设计

> 思维导图样式计算、继承、覆盖规则详细设计

---

## 一、样式架构

### 1.1 样式层次结构

```
┌─────────────────────────────────────────────────────────────┐
│ User Style (用户自定义样式)                                   │
│ 最高优先级，直接覆盖其他样式                                    │
├─────────────────────────────────────────────────────────────┤
│ Theme Style (主题样式)                                       │
│ 来自当前应用的主题                                             │
├─────────────────────────────────────────────────────────────┤
│ Parent Style (父节点样式)                                     │
│ 从父节点继承的样式                                             │
├─────────────────────────────────────────────────────────────┤
│ Default Style (默认样式)                                      │
│ 系统内置的默认值                                               │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 样式计算流程

```
请求节点样式
    │
    ▼
1. 获取默认样式
    │
    ▼
2. 应用主题样式 (覆盖默认)
    │
    ▼
3. 应用父节点继承样式 (覆盖主题)
    │
    ▼
4. 应用用户自定义样式 (覆盖继承)
    │
    ▼
5. 应用临时样式 (选中、悬停等状态)
    │
    ▼
输出: 计算后的样式
```

---

## 二、样式属性定义

### 2.1 节点样式属性

```typescript
// @y-mindmap/style/types/node-style.ts

interface NodeStyle {
  // ===== 形状 =====
  
  /** 形状类名 */
  shapeClass?: string           // 默认: 'roundedRect'
  
  /** 圆角半径 */
  cornerRadius?: number         // 默认: 8
  
  // ===== 填充 =====
  
  /** 填充颜色 */
  fillColor?: string            // 默认: '#4A90D9'
  
  /** 填充渐变 */
  fillGradient?: GradientData
  
  /** 填充图案 */
  fillPattern?: PatternData
  
  /** 填充透明度 */
  fillOpacity?: number          // 默认: 1
  
  // ===== 边框 =====
  
  /** 边框颜色 */
  borderColor?: string          // 默认: '#2E6DB4'
  
  /** 边框宽度 */
  borderWidth?: number          // 默认: 2
  
  /** 边框样式 */
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  
  /** 边框透明度 */
  borderOpacity?: number        // 默认: 1
  
  // ===== 文字 =====
  
  /** 字体 */
  fontFamily?: string           // 默认: 'Arial'
  
  /** 字号 */
  fontSize?: number             // 默认: 14
  
  /** 字重 */
  fontWeight?: 'normal' | 'bold' | number  // 默认: 'normal'
  
  /** 字形 */
  fontStyle?: 'normal' | 'italic'  // 默认: 'normal'
  
  /** 文字颜色 */
  textColor?: string            // 默认: '#333'
  
  /** 文字对齐 */
  textAlign?: 'left' | 'center' | 'right'  // 默认: 'center'
  
  /** 文字装饰 */
  textDecoration?: 'none' | 'underline' | 'line-through'
  
  /** 文字转换 */
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  
  /** 行高 */
  lineHeight?: number           // 默认: 1.2
  
  // ===== 阴影 =====
  
  /** 阴影颜色 */
  shadowColor?: string
  
  /** 阴影模糊 */
  shadowBlur?: number
  
  /** 阴影 X 偏移 */
  shadowOffsetX?: number
  
  /** 阴影 Y 偏移 */
  shadowOffsetY?: number
  
  // ===== 内边距 =====
  
  /** 上内边距 */
  paddingTop?: number           // 默认: 10
  
  /** 右内边距 */
  paddingRight?: number         // 默认: 20
  
  /** 下内边距 */
  paddingBottom?: number        // 默认: 10
  
  /** 左内边距 */
  paddingLeft?: number          // 默认: 20
  
  // ===== 外边距 =====
  
  /** 上外边距 */
  marginTop?: number            // 默认: 5
  
  /** 右外边距 */
  marginRight?: number          // 默认: 10
  
  /** 下外边距 */
  marginBottom?: number         // 默认: 5
  
  /** 左外边距 */
  marginLeft?: number           // 默认: 10
}
```

### 2.2 连线样式属性

```typescript
// @y-mindmap/style/types/connection-style.ts

interface ConnectionStyle {
  /** 连线样式类名 */
  lineClass?: string            // 默认: 'curve'
  
  /** 连线颜色 */
  lineColor?: string            // 默认: '#999'
  
  /** 连线宽度 */
  lineWidth?: number            // 默认: 2
  
  /** 连线样式 */
  lineStyle?: 'solid' | 'dashed' | 'dotted'
  
  /** 连线透明度 */
  lineOpacity?: number          // 默认: 1
  
  /** 是否锥形 */
  tapered?: boolean             // 默认: false
  
  /** 起始箭头 */
  startArrow?: ArrowStyle
  
  /** 结束箭头 */
  endArrow?: ArrowStyle
}

interface ArrowStyle {
  /** 箭头类型 */
  type: 'none' | 'arrow' | 'circle' | 'diamond'
  
  /** 箭头大小 */
  size?: number
}
```

### 2.3 布局样式属性

```typescript
// @y-mindmap/style/types/layout-style.ts

interface LayoutStyle {
  /** 结构类型 */
  structureClass?: string
  
  /** 主要间距 */
  majorSpacing?: number
  
  /** 次要间距 */
  minorSpacing?: number
  
  /** 方向 */
  direction?: 'right' | 'left' | 'both'
}
```

---

## 三、样式计算规则

### 3.1 默认样式

```typescript
// @y-mindmap/style/defaults.ts

const DEFAULT_NODE_STYLE: NodeStyle = {
  // 形状
  shapeClass: 'roundedRect',
  cornerRadius: 8,
  
  // 填充
  fillColor: '#4A90D9',
  fillOpacity: 1,
  
  // 边框
  borderColor: '#2E6DB4',
  borderWidth: 2,
  borderStyle: 'solid',
  borderOpacity: 1,
  
  // 文字
  fontFamily: 'Arial',
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textColor: '#333',
  textAlign: 'center',
  textDecoration: 'none',
  textTransform: 'none',
  lineHeight: 1.2,
  
  // 内边距
  paddingTop: 10,
  paddingRight: 20,
  paddingBottom: 10,
  paddingLeft: 20,
  
  // 外边距
  marginTop: 5,
  marginRight: 10,
  marginBottom: 5,
  marginLeft: 10,
}

const DEFAULT_CONNECTION_STYLE: ConnectionStyle = {
  lineClass: 'curve',
  lineColor: '#999',
  lineWidth: 2,
  lineStyle: 'solid',
  lineOpacity: 1,
  tapered: false,
}

const DEFAULT_LAYOUT_STYLE: LayoutStyle = {
  structureClass: 'org.xmind.ui.map',
  majorSpacing: 20,
  minorSpacing: 8,
}
```

### 3.2 样式继承

```typescript
// @y-mindmap/style/inheritance.ts

class StyleInheritance {
  /**
   * 计算继承的样式
   * 
   * 继承链: 节点 → 父节点 → ... → 根节点
   */
  calcInheritedStyle(
    node: MindMapNode,
    styleKey: StyleKey
  ): any {
    // 向上查找
    let current = node.parent
    
    while (current) {
      const value = current.style?.properties?.[styleKey]
      
      if (value !== undefined) {
        return value
      }
      
      current = current.parent
    }
    
    return undefined
  }
  
  /**
   * 检查是否应该继承
   */
  shouldInherit(styleKey: StyleKey): boolean {
    // 某些样式不继承
    const nonInheritedKeys: StyleKey[] = [
      'fill-color',
      'border-color',
      'position',
    ]
    
    return !nonInheritedKeys.includes(styleKey)
  }
}
```

### 3.3 样式覆盖

```typescript
// @y-mindmap/style/override.ts

class StyleOverride {
  /**
   * 合并样式
   * 
   * 优先级: 用户 > 主题 > 继承 > 默认
   */
  mergeStyles(
    defaultStyle: NodeStyle,
    themeStyle: Partial<NodeStyle>,
    inheritedStyle: Partial<NodeStyle>,
    userStyle: Partial<NodeStyle>
  ): NodeStyle {
    return {
      ...defaultStyle,
      ...themeStyle,
      ...inheritedStyle,
      ...userStyle,
    }
  }
  
  /**
   * 应用临时样式
   */
  applyTransientStyle(
    baseStyle: NodeStyle,
    transientStyle: Partial<NodeStyle>
  ): NodeStyle {
    return {
      ...baseStyle,
      ...transientStyle,
    }
  }
}
```

---

## 四、样式缓存

### 4.1 缓存策略

```typescript
// @y-mindmap/style/cache.ts

class StyleCache {
  private cache: Map<string, ComputedStyle> = new Map()
  private maxSize: number = 1000
  
  /**
   * 生成缓存键
   */
  private generateKey(nodeId: string, state: string): string {
    return `${nodeId}:${state}`
  }
  
  /**
   * 获取缓存
   */
  get(nodeId: string, state: string): ComputedStyle | null {
    const key = this.generateKey(nodeId, state)
    return this.cache.get(key) || null
  }
  
  /**
   * 设置缓存
   */
  set(nodeId: string, state: string, style: ComputedStyle): void {
    const key = this.generateKey(nodeId, state)
    
    // 检查缓存大小
    if (this.cache.size >= this.maxSize) {
      // 删除最旧的缓存
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, style)
  }
  
  /**
   * 失效缓存
   */
  invalidate(nodeId: string): void {
    // 删除该节点的所有缓存
    for (const key of this.cache.keys()) {
      if (key.startsWith(nodeId)) {
        this.cache.delete(key)
      }
    }
  }
  
  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
  }
}
```

### 4.2 缓存失效

```typescript
// @y-mindmap/style/cache-invalidation.ts

class CacheInvalidation {
  /**
   * 处理样式变更
   */
  handleStyleChange(
    nodeId: string,
    styleKey: StyleKey
  ): void {
    // 1. 失效当前节点缓存
    this.styleCache.invalidate(nodeId)
    
    // 2. 如果是可继承的样式，失效所有子节点缓存
    if (this.styleInheritance.shouldInherit(styleKey)) {
      this.invalidateDescendants(nodeId)
    }
  }
  
  /**
   * 失效所有后代节点
   */
  private invalidateDescendants(nodeId: string): void {
    const node = this.doc.getNodeById(nodeId)
    if (!node) return
    
    node.descendants((descendant) => {
      this.styleCache.invalidate(descendant.id)
    })
  }
}
```

---

## 五、样式计算函数

### 5.1 计算节点样式

```typescript
// @y-mindmap/style/calculator.ts

class StyleCalculator {
  /**
   * 计算节点的最终样式
   */
  calcNodeStyle(
    node: MindMapNode,
    state: 'default' | 'hover' | 'selected' | 'editing' = 'default'
  ): ComputedStyle {
    // 检查缓存
    const cached = this.styleCache.get(node.id, state)
    if (cached) {
      return cached
    }
    
    // 1. 获取默认样式
    const defaultStyle = { ...DEFAULT_NODE_STYLE }
    
    // 2. 应用主题样式
    const themeStyle = this.getThemeStyle(node)
    
    // 3. 应用继承样式
    const inheritedStyle = this.getInheritedStyle(node)
    
    // 4. 应用用户样式
    const userStyle = node.style?.properties || {}
    
    // 5. 合并样式
    let computedStyle = this.styleOverride.mergeStyles(
      defaultStyle,
      themeStyle,
      inheritedStyle,
      userStyle
    )
    
    // 6. 应用状态样式
    computedStyle = this.applyStateStyle(computedStyle, state)
    
    // 7. 缓存结果
    this.styleCache.set(node.id, state, computedStyle)
    
    return computedStyle
  }
  
  /**
   * 获取主题样式
   */
  private getThemeStyle(node: MindMapNode): Partial<NodeStyle> {
    const theme = this.getCurrentTheme()
    if (!theme) return {}
    
    // 根据节点类型获取对应的样式
    switch (node.type) {
      case TopicType.ROOT:
        return theme.centralTopic?.properties || {}
      case TopicType.ATTACHED:
        return this.getAttachedTopicThemeStyle(node, theme)
      case TopicType.DETACHED:
        return theme.floatingTopic?.properties || {}
      default:
        return {}
    }
  }
  
  /**
   * 获取附着节点的主题样式
   */
  private getAttachedTopicThemeStyle(
    node: MindMapNode,
    theme: ThemeData
  ): Partial<NodeStyle> {
    const depth = node.depth
    
    switch (depth) {
      case 0:
        return theme.centralTopic?.properties || {}
      case 1:
        return theme.mainTopic?.properties || {}
      default:
        return theme.subTopic?.properties || {}
    }
  }
  
  /**
   * 获取继承样式
   */
  private getInheritedStyle(node: MindMapNode): Partial<NodeStyle> {
    const inherited: Partial<NodeStyle> = {}
    
    // 继承字体
    const fontFamily = this.styleInheritance.calcInheritedStyle(
      node,
      'font-family'
    )
    if (fontFamily) {
      inherited.fontFamily = fontFamily
    }
    
    // 继承字号
    const fontSize = this.styleInheritance.calcInheritedStyle(
      node,
      'font-size'
    )
    if (fontSize) {
      inherited.fontSize = fontSize
    }
    
    // 继承文字颜色
    const textColor = this.styleInheritance.calcInheritedStyle(
      node,
      'text-color'
    )
    if (textColor) {
      inherited.textColor = textColor
    }
    
    return inherited
  }
  
  /**
   * 应用状态样式
   */
  private applyStateStyle(
    style: NodeStyle,
    state: string
  ): NodeStyle {
    switch (state) {
      case 'hover':
        return {
          ...style,
          borderColor: '#FFD700',
          borderWidth: 3,
        }
      
      case 'selected':
        return {
          ...style,
          borderColor: '#FF6B6B',
          borderWidth: 3,
        }
      
      case 'editing':
        return {
          ...style,
          borderColor: '#4A90D9',
          borderWidth: 3,
          borderStyle: 'dashed',
        }
      
      default:
        return style
    }
  }
}
```

### 5.2 计算连线样式

```typescript
// @y-mindmap/style/connection-calculator.ts

class ConnectionStyleCalculator {
  /**
   * 计算连线的最终样式
   */
  calcConnectionStyle(
    parent: MindMapNode,
    child: MindMapNode
  ): ComputedConnectionStyle {
    // 1. 获取默认样式
    const defaultStyle = { ...DEFAULT_CONNECTION_STYLE }
    
    // 2. 应用主题样式
    const themeStyle = this.getThemeConnectionStyle()
    
    // 3. 应用父节点样式
    const parentStyle = parent.style?.properties || {}
    
    // 4. 合并样式
    const computedStyle = {
      ...defaultStyle,
      ...themeStyle,
      lineClass: parentStyle['line-class'] || defaultStyle.lineClass,
      lineColor: parentStyle['line-color'] || defaultStyle.lineColor,
      lineWidth: parentStyle['line-width'] || defaultStyle.lineWidth,
      tapered: parentStyle['line-tapered'] || defaultStyle.tapered,
    }
    
    return computedStyle
  }
}
```

---

## 六、样式性能优化

### 6.1 懒计算

```typescript
// @y-mindmap/style/lazy-evaluation.ts

class LazyStyleEvaluator {
  private pendingCalculations: Map<string, () => void> = new Map()
  
  /**
   * 调度样式计算
   */
  schedule(nodeId: string, calculation: () => void): void {
    this.pendingCalculations.set(nodeId, calculation)
    
    // 使用 requestAnimationFrame 批量处理
    if (!this.isScheduled) {
      this.isScheduled = true
      requestAnimationFrame(() => {
        this.flush()
      })
    }
  }
  
  /**
   * 执行所有待处理的计算
   */
  private flush(): void {
    this.pendingCalculations.forEach(calculation => calculation())
    this.pendingCalculations.clear()
    this.isScheduled = false
  }
}
```

### 6.2 批量更新

```typescript
// @y-mindmap/style/batch-update.ts

class BatchStyleUpdater {
  private pendingUpdates: Map<string, Partial<NodeStyle>> = new Map()
  
  /**
   * 添加待更新
   */
  addUpdate(nodeId: string, changes: Partial<NodeStyle>): void {
    const existing = this.pendingUpdates.get(nodeId) || {}
    
    this.pendingUpdates.set(nodeId, {
      ...existing,
      ...changes,
    })
  }
  
  /**
   * 应用所有更新
   */
  applyAll(): void {
    this.pendingUpdates.forEach((changes, nodeId) => {
      const node = this.doc.getNodeById(nodeId)
      if (node) {
        node.setStyle(changes)
      }
    })
    
    this.pendingUpdates.clear()
  }
}
```

---

## 七、Snowbrush 样式参考

### 7.1 样式键常量

```typescript
// 来源: /src/common/constants/styles.ts

const STYLE_KEYS = {
  // 形状
  SHAPE_CLASS: 'shape-class',
  
  // 填充
  FILL_COLOR: 'fill-color',
  FILL_GRADIENT: 'fill-gradient',
  FILL_PATTERN: 'fill-pattern',
  
  // 边框
  BORDER_LINE_COLOR: 'border-line-color',
  BORDER_LINE_WIDTH: 'border-line-width',
  BORDER_LINE_PATTERN: 'border-line-pattern',
  
  // 文字
  FONT_FAMILY: 'font-family',
  FONT_SIZE: 'font-size',
  FONT_WEIGHT: 'font-weight',
  FONT_STYLE: 'font-style',
  TEXT_COLOR: 'text-color',
  TEXT_ALIGN: 'text-align',
  TEXT_DECORATION: 'text-decoration',
  TEXT_TRANSFORM: 'text-transform',
  
  // 连线
  LINE_CLASS: 'line-class',
  LINE_COLOR: 'line-color',
  LINE_WIDTH: 'line-width',
  LINE_PATTERN: 'line-pattern',
  LINE_TAPERED: 'line-tapered',
  
  // 箭头
  START_ARROW: 'start-arrow',
  END_ARROW: 'end-arrow',
}
```

### 7.2 样式管理器

```typescript
// 来源: /src/utils/business/stylemanager/index.ts

class StyleManager {
  /**
   * 获取样式值
   */
  getStyleValue(view: any, styleKey: string): any {
    // 从 figure 获取
    if (view.figure && view.figure[styleKey] !== undefined) {
      return view.figure[styleKey]
    }
    
    // 从 model 获取
    if (view.model) {
      const style = view.model.getStyle()
      if (style && style.properties && style.properties[styleKey] !== undefined) {
        return style.properties[styleKey]
      }
    }
    
    // 返回默认值
    return this.getDefaultValue(styleKey)
  }
  
  /**
   * 设置样式值
   */
  setStyleValue(view: any, styleKey: string, value: any): void {
    // 更新 model
    if (view.model) {
      const style = view.model.getStyle() || { id: '', properties: {} }
      style.properties[styleKey] = value
      view.model.setStyle(style)
    }
    
    // 更新 figure
    if (view.figure) {
      view.figure[styleKey] = value
    }
  }
}
```

# RENDER.md - 渲染层详细设计

> 基于 Leafer.js 的 Canvas 渲染系统设计

---

## 一、渲染架构

### 1.1 整体架构

```
EditorView (编辑器视图)
    │
    ├── BackgroundLayer (背景层)
    │     └── SheetBackground (Sheet 背景)
    │
    ├── ConnectionLayer (连线层)
    │     ├── ConnectionView[] (节点连线)
    │     ├── RelationshipView[] (关系线)
    │     └── SummaryLineView[] (摘要线)
    │
    ├── TopicLayer (节点层)
    │     └── BranchView[] (分支 - 递归)
    │           ├── TopicView (节点视图)
    │           │     ├── Shape (形状)
    │           │     ├── Title (标题)
    │           │     ├── Markers (标记)
    │           │     ├── Image (图片)
    │           │     ├── Labels (标签)
    │           │     └── InfoIcons (信息图标)
    │           ├── CollapseExtendView (折叠/展开按钮)
    │           ├── BoundaryView[] (边界)
    │           └── BranchView[] (子分支)
    │
    └── OverlayLayer (覆盖层)
          ├── SelectBox (选择框)
          ├── DragShadow (拖拽阴影)
          ├── Placeholder (占位符)
          └── Indicator (指示器)
```

### 1.2 渲染管线

```
状态变更
    │
    ▼
Dirty 标记
    │
    ▼
布局计算 (Layout Pass)
    │
    ▼
绘制计算 (Paint Pass)
    │
    ▼
Canvas 渲染 (Render Pass)
    │
    ▼
合成输出 (Composite)
```

### 1.3 Leafer.js 集成

```typescript
// @y-mindmap/view/editor-view.ts

import { App, Leafer, Group, Rect, Path, Text, Ellipse } from 'leafer-ui'

interface EditorViewConfig {
  container: HTMLElement
  width?: number
  height?: number
  theme?: string
  readOnly?: boolean
}

class EditorView {
  private app: App
  private backgroundLeafer: Leafer
  private connectionLeafer: Leafer
  private topicLeafer: Leafer
  private overlayLeafer: Leafer
  
  constructor(config: EditorViewConfig) {
    // 创建 App 应用
    this.app = new App({
      view: config.container,
      width: config.width || 800,
      height: config.height || 600,
      type: 'viewport',
    })
    
    // 创建多层 Leafer
    this.backgroundLeafer = this.app.addLeafer({ type: 'draw' })
    this.connectionLeafer = this.app.addLeafer({ type: 'draw' })
    this.topicLeafer = this.app.addLeafer({ type: 'platform' })
    this.overlayLeafer = this.app.addLeafer({ type: 'platform' })
  }
}
```

---

## 二、节点形状渲染

### 2.1 形状系统架构

```typescript
// @y-mindmap/view/shapes/abstract-shape.ts

abstract class AbstractTopicShape {
  // 计算形状路径
  abstract calcShapePath(bounds: Bounds): string
  
  // 获取锚点位置
  getAnchorPosition(direction: Direction): Point {
    return getJointPosition(this.bounds, direction)
  }
  
  // 获取控制点位置
  getControlPosition(direction: Direction): Point {
    const base = this.getAnchorPosition(direction)
    return addPositionByDirection(base, direction, LINECOLPOS)
  }
  
  // 渲染形状
  render(topicView: TopicView): void {
    const bounds = topicView.shapeBounds
    const path = this.calcShapePath(bounds)
    topicView.setShapePath(path)
  }
}
```

### 2.2 形状清单 (40+ 种)

| 类别 | 形状 | 文件 | 说明 |
|------|------|------|------|
| **基础** | Rect | recttopicshape.ts | 矩形 |
| | RoundedRect | roundedrecttopicshape.ts | 圆角矩形 (radius=8) |
| | Ellipse | ellipsetopicshape.ts | 椭圆 |
| | Diamond | diamondtopicshape.ts | 菱形 |
| **特殊** | Cloud | cloudtopicshape.ts | 云朵 |
| | Hexagon | hexagontopicshape.ts | 六边形 |
| | Parallelogram | parallelogramtopicshape.ts | 平行四边形 |
| | Star | startopicshape.ts | 星形 |
| | Heart | hearttopicshape.ts | 心形 |
| | Shield | shieldtopicshape.ts | 盾形 |
| | WaterDrop | waterdroptopicshape.ts | 水滴 |
| **引用** | SingleBookQuote | singlebookquotetopicshape.ts | 单书名号 |
| | DoubleBookQuote | doublebookquotetopicshape.ts | 双书名号 |
| | SquareQuote | squarequotetopicshape.ts | 方引号 |
| | DoubleQuote | doublequotetopicshape.ts | 双引号 |
| **括号** | RoundBracket | roundbrackettopicshape.ts | 圆括号 |
| | SquareBracket | squarebrackettopicshape.ts | 方括号 |
| | CurlyBracket | curlybrackettopicshape.ts | 花括号 |
| **箭头** | FatLeftArrow | fatleftarrowtopicshape.ts | 左箭头 |
| | FatRightArrow | fatrightarrowtopicshape.ts | 右箭头 |
| **其他** | Bookmark | bookmarktopicshape.ts | 书签 |
| | Label | labeltopicshape.ts | 标签 |
| | Underline | underlinetopicshape.ts | 下划线 |
| | DoubleUnderline | doubleunderlinetopicshape.ts | 双下划线 |
| | NoBorder | nobordertopicshape.ts | 无边框 |
| | Leaf | (brushes.ts) | 叶子 |
| | Stack | (brushes.ts) | 堆叠 |

### 2.3 关键形状实现

#### 圆角矩形 (RoundedRect)

```typescript
// @y-mindmap/view/shapes/rounded-rect.ts

class RoundedRectShape extends AbstractTopicShape {
  private corner: number = 8
  
  calcShapePath(bounds: Bounds): string {
    const { x, y, width, height } = bounds
    const r = this.corner
    
    return `
      M ${x + r} ${y}
      L ${x + width - r} ${y}
      Q ${x + width} ${y} ${x + width} ${y + r}
      L ${x + width} ${y + height - r}
      Q ${x + width} ${y + height} ${x + width - r} ${y + height}
      L ${x + r} ${y + height}
      Q ${x} ${y + height} ${x} ${y + height - r}
      L ${x} ${y + r}
      Q ${x} ${y} ${x + r} ${y}
      Z
    `
  }
}
```

#### 椭圆 (Ellipse)

```typescript
// @y-mindmap/view/shapes/ellipse.ts

class EllipseShape extends AbstractTopicShape {
  calcShapePath(bounds: Bounds): string {
    const { x, y, width, height } = bounds
    const cx = x + width / 2
    const cy = y + height / 2
    const rx = width / 2
    const ry = height / 2
    
    // 使用贝塞尔曲线近似椭圆
    const k = 0.5522847498  // 4/3 * (sqrt(2) - 1)
    const kx = rx * k
    const ky = ry * k
    
    return `
      M ${cx} ${y}
      C ${cx + kx} ${y} ${x + width} ${cy - ky} ${x + width} ${cy}
      C ${x + width} ${cy + ky} ${cx + kx} ${y + height} ${cx} ${y + height}
      C ${cx - kx} ${y + height} ${x} ${cy + ky} ${x} ${cy}
      C ${x} ${cy - ky} ${cx - kx} ${y} ${cx} ${y}
      Z
    `
  }
}
```

#### 六边形 (Hexagon)

```typescript
// @y-mindmap/view/shapes/hexagon.ts

class HexagonShape extends AbstractTopicShape {
  calcShapePath(bounds: Bounds): string {
    const { x, y, width, height } = bounds
    const offset = width / 9  // 左右突出 1/9
    
    return `
      M ${x} ${y + height / 2}
      L ${x + offset} ${y}
      L ${x + width - offset} ${y}
      L ${x + width} ${y + height / 2}
      L ${x + width - offset} ${y + height}
      L ${x + offset} ${y + height}
      Z
    `
  }
}
```

#### 云朵 (Cloud)

```typescript
// @y-mindmap/view/shapes/cloud.ts

class CloudShape extends AbstractTopicShape {
  calcShapePath(bounds: Bounds): string {
    // 复杂的云朵路径生成算法
    // 使用贝塞尔曲线绘制波浪边缘
    // 参考 brushes.ts 中的 newCloud() 实现
    return generateCloudPath(bounds)
  }
}
```

### 2.4 形状工厂

```typescript
// @y-mindmap/view/shapes/shape-factory.ts

class ShapeFactory {
  private static shapes: Map<string, typeof AbstractTopicShape> = new Map()
  
  static register(name: string, shapeClass: typeof AbstractTopicShape): void {
    this.shapes.set(name, shapeClass)
  }
  
  static create(shapeName: string): AbstractTopicShape {
    const ShapeClass = this.shapes.get(shapeName)
    if (!ShapeClass) {
      throw new Error(`Unknown shape: ${shapeName}`)
    }
    return new ShapeClass()
  }
  
  static getDefault(): AbstractTopicShape {
    return this.create('roundedRect')
  }
}

// 注册所有形状
ShapeFactory.register('rect', RectShape)
ShapeFactory.register('roundedRect', RoundedRectShape)
ShapeFactory.register('ellipse', EllipseShape)
ShapeFactory.register('diamond', DiamondShape)
ShapeFactory.register('cloud', CloudShape)
ShapeFactory.register('hexagon', HexagonShape)
// ... 其他形状
```

---

## 三、连线渲染

### 3.1 连线系统架构

```typescript
// @y-mindmap/view/connection/abstract-connection.ts

abstract class AbstractConnection {
  // 计算连线路径
  abstract calcPath(start: Point, ctrl: Point, end: Point): string
  
  // 渲染连线
  render(connectionView: ConnectionView): void {
    const startPt = connectionView.startPoint
    const ctrlPt = connectionView.controlPoint
    const endPt = connectionView.endPoint
    
    const path = this.calcPath(startPt, ctrlPt, endPt)
    connectionView.setPath(path)
  }
}
```

### 3.2 连线样式清单 (18 种)

| 类别 | 样式 | 文件 | 说明 |
|------|------|------|------|
| **曲线** | Curve | curve.ts | 贝塞尔曲线 |
| | TaperedCurve | curve.ts | 锥形曲线 |
| **直线** | Straight | straight.ts | 直线 |
| | TaperedStraight | straight.ts | 锥形直线 |
| **肘线** | Elbow | elbow.ts | 直角肘线 |
| | RoundedElbow | roundedelbow.ts | 圆角肘线 |
| | TaperedElbow | elbow.ts | 锥形肘线 |
| **折叠** | Fold | fold.ts | 折叠线 |
| | Fold2 | fold2.ts | 折叠线变体 |
| | RoundedFold | roundedfold.ts | 圆角折叠线 |
| **其他** | Bight | bight.ts | 海湾线 |
| | Horizontal | horizontal.ts | 水平线 |
| | None | none.ts | 无连线 |
| **括号** | Brace | brace.ts | 括号线 |
| | Brace2-5 | brace2-5.ts | 括号线变体 |
| **标注** | CalloutLine | calloutline.ts | 标注线 |

### 3.3 关键连线实现

#### 曲线 (Curve)

```typescript
// @y-mindmap/view/connection/curve.ts

class CurveConnection extends AbstractConnection {
  calcPath(start: Point, ctrl: Point, end: Point): string {
    // 控制点计算
    const dx = end.x - ctrl.x
    const ctrlX = dx / 5 + ctrl.x
    
    return `
      M ${start.x} ${start.y}
      L ${ctrl.x} ${ctrl.y}
      Q ${ctrlX} ${end.y} ${end.x} ${end.y}
    `
  }
}
```

#### 锥形曲线 (TaperedCurve)

```typescript
// @y-mindmap/view/connection/tapered-curve.ts

class TaperedCurveConnection extends AbstractConnection {
  calcPath(start: Point, ctrl: Point, end: Point, lineWidth: number): string {
    const dx = end.x - ctrl.x
    const ctrlX = dx / 3 + ctrl.x
    
    // 计算上下两条偏移线
    const openGap = lineWidth * 3   // 起始宽度
    const closeGap = lineWidth       // 终止宽度
    
    const p1 = calcUnderline(start, ctrl, openGap / 2)
    const p2 = calcUnderline(ctrl, end, openGap / 2)
    const p4 = calcUnderline(end, ctrl, closeGap / 2)
    const p3 = pivot(end, p4)
    const p5 = pivot(ctrl, p2)
    const p6 = pivot(start, p1)
    
    // 修正控制点
    const corX = (p2.x - p5.x) / 2
    const corY = (p3.y - p4.y) / 2
    
    return `
      M ${p1.x} ${p1.y}
      L ${p2.x} ${p2.y}
      Q ${ctrlX + corX} ${end.y + corY} ${p3.x} ${p3.y}
      L ${p4.x} ${p4.y}
      Q ${ctrlX - corX} ${end.y - corY} ${p5.x} ${p5.y}
      L ${p6.x} ${p6.y}
      Z
    `
  }
}
```

#### 肘线 (Elbow)

```typescript
// @y-mindmap/view/connection/elbow.ts

class ElbowConnection extends AbstractConnection {
  calcPath(start: Point, ctrl: Point, end: Point): string {
    return `
      M ${start.x} ${start.y}
      L ${ctrl.x} ${ctrl.y}
      L ${ctrl.x} ${end.y}
      L ${end.x} ${end.y}
    `
  }
}
```

#### 圆角肘线 (RoundedElbow)

```typescript
// @y-mindmap/view/connection/rounded-elbow.ts

class RoundedElbowConnection extends AbstractConnection {
  private corner: number = 10
  
  calcPath(start: Point, ctrl: Point, end: Point): string {
    const flexPt = { x: ctrl.x, y: end.y }  // 拐点
    
    // 计算拐点前后的点
    const ver = end.y > ctrl.y ? 1 : -1
    const hor = end.x > ctrl.x ? 1 : -1
    
    const corner = Math.min(this.corner, Math.abs(end.x - ctrl.x))
    
    const bflexPt = {
      x: flexPt.x,
      y: flexPt.y - ver * corner
    }
    
    const aflexPt = {
      x: flexPt.x + hor * corner,
      y: flexPt.y
    }
    
    return `
      M ${start.x} ${start.y}
      L ${ctrl.x} ${ctrl.y}
      L ${bflexPt.x} ${bflexPt.y}
      Q ${flexPt.x} ${flexPt.y} ${aflexPt.x} ${aflexPt.y}
      L ${end.x} ${end.y}
    `
  }
}
```

### 3.4 连线工厂

```typescript
// @y-mindmap/view/connection/connection-factory.ts

class ConnectionFactory {
  private static connections: Map<string, typeof AbstractConnection> = new Map()
  
  static register(name: string, connectionClass: typeof AbstractConnection): void {
    this.connections.set(name, connectionClass)
  }
  
  static create(styleName: string): AbstractConnection {
    const ConnectionClass = this.connections.get(styleName)
    if (!ConnectionClass) {
      throw new Error(`Unknown connection style: ${styleName}`)
    }
    return new ConnectionClass()
  }
}

// 注册所有连线样式
ConnectionFactory.register('curve', CurveConnection)
ConnectionFactory.register('taperedCurve', TaperedCurveConnection)
ConnectionFactory.register('elbow', ElbowConnection)
ConnectionFactory.register('roundedElbow', RoundedElbowConnection)
ConnectionFactory.register('straight', StraightConnection)
// ... 其他样式
```

---

## 四、文字渲染

### 4.1 文字测量

```typescript
// @y-mindmap/view/text/text-measurer.ts

class TextMeasurer {
  private canvas: OffscreenCanvas
  private ctx: OffscreenCanvasRenderingContext2D
  
  constructor() {
    this.canvas = new OffscreenCanvas(1, 1)
    this.ctx = this.canvas.getContext('2d')!
  }
  
  measureText(text: string, font: FontConfig): TextMetrics {
    this.ctx.font = `${font.weight} ${font.size}px ${font.family}`
    return this.ctx.measureText(text)
  }
  
  measureTextWidth(text: string, font: FontConfig): number {
    return this.measureText(text, font).width
  }
  
  measureTextHeight(font: FontConfig): number {
    // 近似计算行高
    return font.size * 1.2
  }
}
```

### 4.2 自动换行算法

```typescript
// @y-mindmap/view/text/text-wrapper.ts

class TextWrapper {
  private measurer: TextMeasurer
  
  constructor(measurer: TextMeasurer) {
    this.measurer = measurer
  }
  
  wrapText(text: string, maxWidth: number, font: FontConfig): string[] {
    const words = text.split('')
    const lines: string[] = []
    let currentLine = ''
    
    for (const char of words) {
      const testLine = currentLine + char
      const width = this.measurer.measureTextWidth(testLine, font)
      
      if (width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine)
        currentLine = char
      } else {
        currentLine = testLine
      }
    }
    
    if (currentLine.length > 0) {
      lines.push(currentLine)
    }
    
    return lines
  }
}
```

### 4.3 文字渲染器

```typescript
// @y-mindmap/view/text/text-renderer.ts

class TextRenderer {
  private wrapper: TextWrapper
  
  render(
    container: Group,
    text: string,
    bounds: Bounds,
    config: TextConfig
  ): void {
    const font = {
      family: config.fontFamily || 'Arial',
      size: config.fontSize || 14,
      weight: config.fontWeight || 'normal',
    }
    
    // 自动换行
    const lines = this.wrapper.wrapText(text, bounds.width, font)
    
    // 计算文字位置
    const lineHeight = font.size * 1.2
    const totalHeight = lines.length * lineHeight
    
    let startY = bounds.y
    if (config.verticalAlign === 'middle') {
      startY = bounds.y + (bounds.height - totalHeight) / 2
    } else if (config.verticalAlign === 'bottom') {
      startY = bounds.y + bounds.height - totalHeight
    }
    
    // 渲染每一行
    lines.forEach((line, index) => {
      const textEl = new Text({
        text: line,
        x: bounds.x,
        y: startY + index * lineHeight,
        width: bounds.width,
        fontSize: font.size,
        fontFamily: font.family,
        fontWeight: font.weight,
        fill: config.color || '#333',
        textAlign: config.textAlign || 'center',
      })
      
      container.add(textEl)
    })
  }
}
```

---

## 五、图片渲染

### 5.1 图片加载器

```typescript
// @y-mindmap/view/image/image-loader.ts

class ImageLoader {
  private cache: Map<string, HTMLImageElement> = new Map()
  
  async load(src: string): Promise<HTMLImageElement> {
    // 检查缓存
    const cached = this.cache.get(src)
    if (cached) {
      return cached
    }
    
    // 加载图片
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      
      img.onload = () => {
        this.cache.set(src, img)
        resolve(img)
      }
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`))
      }
      
      img.src = src
    })
  }
  
  clearCache(): void {
    this.cache.clear()
  }
}
```

### 5.2 图片渲染器

```typescript
// @y-mindmap/view/image/image-renderer.ts

class ImageRenderer {
  private loader: ImageLoader
  
  async render(
    container: Group,
    imageData: ImageData,
    bounds: Bounds
  ): Promise<void> {
    try {
      const img = await this.loader.load(imageData.src)
      
      // 计算缩放
      const scale = this.calcScale(
        { width: img.width, height: img.height },
        bounds,
        imageData.fit || 'contain'
      )
      
      // 计算位置
      const position = this.calcPosition(
        scale,
        bounds,
        imageData.align || 'center'
      )
      
      // 创建图片元素
      const imageEl = new Image({
        url: imageData.src,
        x: position.x,
        y: position.y,
        width: img.width * scale,
        height: img.height * scale,
      })
      
      container.add(imageEl)
    } catch (error) {
      // 渲染占位符
      this.renderPlaceholder(container, bounds)
    }
  }
  
  private calcScale(
    imageSize: Size,
    bounds: Bounds,
    fit: 'contain' | 'cover' | 'fill'
  ): number {
    const scaleX = bounds.width / imageSize.width
    const scaleY = bounds.height / imageSize.height
    
    switch (fit) {
      case 'contain':
        return Math.min(scaleX, scaleY)
      case 'cover':
        return Math.max(scaleX, scaleY)
      case 'fill':
        return 1
    }
  }
  
  private calcPosition(
    scale: number,
    bounds: Bounds,
    align: 'center' | 'top' | 'bottom' | 'left' | 'right'
  ): Point {
    // 根据对齐方式计算位置
    // ...
  }
  
  private renderPlaceholder(container: Group, bounds: Bounds): void {
    const placeholder = new Rect({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      fill: '#f0f0f0',
      stroke: '#ddd',
    })
    container.add(placeholder)
    
    // 添加图标
    const icon = new Text({
      text: '🖼',
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      fontSize: 24,
      textAlign: 'center',
    })
    container.add(icon)
  }
}
```

---

## 六、标记/图标渲染

### 6.1 标记系统

```typescript
// @y-mindmap/view/marker/marker-renderer.ts

class MarkerRenderer {
  private markerIcons: Map<string, string> = new Map()
  
  constructor() {
    // 注册标记图标
    this.markerIcons.set('priority-1', '🔴')
    this.markerIcons.set('priority-2', '🟡')
    this.markerIcons.set('priority-3', '🟢')
    this.markerIcons.set('flag', '🚩')
    this.markerIcons.set('star', '⭐')
    this.markerIcons.set('smile', '😊')
    // ... 更多标记
  }
  
  render(
    container: Group,
    markers: MarkerData[],
    bounds: Bounds
  ): void {
    if (markers.length === 0) return
    
    const markerSize = 16
    const gap = 4
    
    // 计算标记排列位置
    const startX = bounds.x + bounds.width - (markerSize + gap) * markers.length
    
    markers.forEach((marker, index) => {
      const icon = this.markerIcons.get(marker.markerId)
      if (!icon) return
      
      const markerEl = new Text({
        text: icon,
        x: startX + index * (markerSize + gap),
        y: bounds.y,
        fontSize: markerSize,
      })
      
      container.add(markerEl)
    })
  }
}
```

### 6.2 信息图标渲染

```typescript
// @y-mindmap/view/info-icon/info-icon-renderer.ts

class InfoIconRenderer {
  render(
    container: Group,
    topic: TopicData,
    bounds: Bounds
  ): void {
    const iconSize = 12
    const gap = 4
    let offsetX = bounds.x
    
    // 备注图标
    if (topic.notes) {
      this.renderIcon(container, '📝', offsetX, bounds.y + bounds.height + gap, iconSize)
      offsetX += iconSize + gap
    }
    
    // 链接图标
    if (topic.href) {
      this.renderIcon(container, '🔗', offsetX, bounds.y + bounds.height + gap, iconSize)
      offsetX += iconSize + gap
    }
    
    // 任务信息图标
    if (topic.extensions?.some(e => e.provider === 'taskInfo')) {
      this.renderIcon(container, '✅', offsetX, bounds.y + bounds.height + gap, iconSize)
      offsetX += iconSize + gap
    }
  }
  
  private renderIcon(
    container: Group,
    icon: string,
    x: number,
    y: number,
    size: number
  ): void {
    const iconEl = new Text({
      text: icon,
      x,
      y,
      fontSize: size,
    })
    container.add(iconEl)
  }
}
```

---

## 七、装饰器渲染

### 7.1 选择框渲染

```typescript
// @y-mindmap/view/decoration/select-box.ts

class SelectBoxRenderer {
  render(
    container: Group,
    bounds: Bounds,
    config: SelectBoxConfig
  ): void {
    const padding = config.padding || 2
    const strokeWidth = config.strokeWidth || 2
    const radius = config.radius || 4
    
    const selectBox = new Rect({
      x: bounds.x - padding,
      y: bounds.y - padding,
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2,
      fill: 'none',
      stroke: {
        color: config.color || '#4A90D9',
        width: strokeWidth,
        dash: config.dash || [],
      },
      cornerRadius: radius,
    })
    
    container.add(selectBox)
  }
}
```

### 7.2 拖拽阴影渲染

```typescript
// @y-mindmap/view/decoration/drag-shadow.ts

class DragShadowRenderer {
  render(
    container: Group,
    topic: TopicData,
    position: Point,
    config: DragShadowConfig
  ): void {
    // 创建半透明阴影
    const shadow = new Group({
      x: position.x,
      y: position.y,
      opacity: config.opacity || 0.5,
    })
    
    // 渲染节点形状
    const shape = ShapeFactory.create(topic.style.shapeClass || 'roundedRect')
    const path = shape.calcShapePath({
      x: 0,
      y: 0,
      width: topic.width || 200,
      height: topic.height || 60,
    })
    
    const shapeEl = new Path({
      path,
      fill: topic.style.fillColor || '#4A90D9',
      opacity: 0.7,
    })
    shadow.add(shapeEl)
    
    // 渲染标题
    const title = new Text({
      text: topic.title,
      x: 20,
      y: 15,
      fontSize: 14,
      fill: '#333',
    })
    shadow.add(title)
    
    container.add(shadow)
  }
}
```

### 7.3 指示器渲染

```typescript
// @y-mindmap/view/decoration/indicator.ts

class IndicatorRenderer {
  render(
    container: Group,
    targetBranch: BranchView,
    index: number,
    config: IndicatorConfig
  ): void {
    // 计算指示器位置
    const position = this.calcIndicatorPosition(targetBranch, index)
    
    // 渲染指示器
    const indicator = new Rect({
      x: position.x,
      y: position.y,
      width: config.width || 60,
      height: config.height || 4,
      fill: config.color || '#4A90D9',
      cornerRadius: 2,
    })
    
    container.add(indicator)
  }
  
  private calcIndicatorPosition(branch: BranchView, index: number): Point {
    // 根据分支方向和索引计算指示器位置
    // ...
  }
}
```

---

## 八、视口管理

### 8.1 缩放控制

```typescript
// @y-mindmap/view/viewport/zoom-controller.ts

class ZoomController {
  private leafer: Leafer
  private minZoom: number = 0.1
  private maxZoom: number = 10
  private currentZoom: number = 1
  
  constructor(leafer: Leafer) {
    this.leafer = leafer
    this.initWheelZoom()
    this.initGestureZoom()
  }
  
  private initWheelZoom(): void {
    this.leafer.on('wheel', (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        
        const delta = e.deltaY > 0 ? 0.9 : 1.1
        const newZoom = this.currentZoom * delta
        
        this.zoomTo(newZoom, { x: e.clientX, y: e.clientY })
      }
    })
  }
  
  private initGestureZoom(): void {
    // 触摸板手势缩放
    // ...
  }
  
  zoomTo(zoom: number, center?: Point): void {
    // 限制缩放范围
    zoom = Math.max(this.minZoom, Math.min(this.maxZoom, zoom))
    
    // 计算缩放中心
    if (center) {
      const oldZoom = this.currentZoom
      const scale = zoom / oldZoom
      
      // 调整视口位置以保持缩放中心不变
      // ...
    }
    
    this.currentZoom = zoom
    this.leafer.zoom = zoom
    
    // 触发缩放事件
    this.emit('zoomChanged', zoom)
  }
  
  zoomToFit(bounds: Bounds, padding: number = 40): void {
    const viewportBounds = this.leafer.bounds
    
    const scaleX = viewportBounds.width / (bounds.width + padding * 2)
    const scaleY = viewportBounds.height / (bounds.height + padding * 2)
    const zoom = Math.min(scaleX, scaleY, 2)  // 最大 2 倍
    
    this.zoomTo(zoom)
    this.panTo({
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    })
  }
}
```

### 8.2 平移控制

```typescript
// @y-mindmap/view/viewport/pan-controller.ts

class PanController {
  private leafer: Leafer
  private isDragging: boolean = false
  private lastPosition: Point | null = null
  
  constructor(leafer: Leafer) {
    this.leafer = leafer
    this.initDragPan()
    this.initEdgeScroll()
  }
  
  private initDragPan(): void {
    this.leafer.on('pointerdown', (e) => {
      if (e.button === 1 || (e.button === 0 && e.altKey)) {
        this.isDragging = true
        this.lastPosition = { x: e.clientX, y: e.clientY }
      }
    })
    
    this.leafer.on('pointermove', (e) => {
      if (this.isDragging && this.lastPosition) {
        const dx = e.clientX - this.lastPosition.x
        const dy = e.clientY - this.lastPosition.y
        
        this.pan(dx, dy)
        this.lastPosition = { x: e.clientX, y: e.clientY }
      }
    })
    
    this.leafer.on('pointerup', () => {
      this.isDragging = false
      this.lastPosition = null
    })
  }
  
  private initEdgeScroll(): void {
    // 拖拽时鼠标靠近边缘自动滚动
    // ...
  }
  
  pan(dx: number, dy: number): void {
    this.leafer.x += dx
    this.leafer.y += dy
  }
  
  panTo(position: Point): void {
    const viewportBounds = this.leafer.bounds
    
    this.leafer.x = viewportBounds.width / 2 - position.x * this.leafer.zoom
    this.leafer.y = viewportBounds.height / 2 - position.y * this.leafer.zoom
  }
}
```

### 8.3 惯性滚动

```typescript
// @y-mindmap/view/viewport/inertial-scroll.ts

class InertialScroll {
  private friction: number = -0.005
  private positions: Array<{ x: number; y: number; time: number }> = []
  private animationFrame: number | null = null
  
  recordPosition(x: number, y: number): void {
    this.positions.push({ x, y, time: Date.now() })
    
    // 只保留最近 6 个位置
    if (this.positions.length > 6) {
      this.positions.shift()
    }
  }
  
  startScroll(callback: (dx: number, dy: number) => void): void {
    if (this.positions.length < 2) return
    
    const last = this.positions[this.positions.length - 1]
    const first = this.positions[0]
    
    const dt = last.time - first.time
    if (dt === 0) return
    
    const vx = (last.x - first.x) / dt
    const vy = (last.y - first.y) / dt
    
    this.animate(vx, vy, last.time, last.x, last.y, callback)
  }
  
  private animate(
    vx: number,
    vy: number,
    lastTime: number,
    lastX: number,
    lastY: number,
    callback: (dx: number, dy: number) => void
  ): void {
    this.animationFrame = requestAnimationFrame(() => {
      const now = Date.now()
      const dt = now - lastTime
      
      // 速度衰减
      vx += this.friction * dt
      vy += this.friction * dt
      
      if (vx <= 0 && vy <= 0) {
        // 停止
        return
      }
      
      const dx = vx * dt
      const dy = vy * dt
      
      callback(dx, dy)
      
      this.animate(vx, vy, now, lastX + dx, lastY + dy, callback)
    })
  }
  
  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
    this.positions = []
  }
}
```

---

## 九、性能优化

### 9.1 脏标记系统

```typescript
// @y-mindmap/view/core/dirty-tracker.ts

class DirtyTracker {
  private layoutDirty: Set<string> = new Set()
  private paintDirty: Set<string> = new Set()
  
  markLayoutDirty(id: string): void {
    this.layoutDirty.add(id)
    this.scheduleUpdate()
  }
  
  markPaintDirty(id: string): void {
    this.paintDirty.add(id)
    this.scheduleUpdate()
  }
  
  private scheduleUpdate(): void {
    // 使用 requestAnimationFrame 批量更新
    requestAnimationFrame(() => {
      this.flush()
    })
  }
  
  private flush(): void {
    // 先处理布局
    this.layoutDirty.forEach(id => {
      const node = this.getNode(id)
      if (node) {
        node.validateLayout()
      }
    })
    this.layoutDirty.clear()
    
    // 再处理绘制
    this.paintDirty.forEach(id => {
      const node = this.getNode(id)
      if (node) {
        node.validatePaint()
      }
    })
    this.paintDirty.clear()
  }
}
```

### 9.2 对象池

```typescript
// @y-mindmap/view/core/object-pool.ts

class ObjectPool<T> {
  private pool: T[] = []
  private factory: () => T
  private reset: (obj: T) => void
  
  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 10) {
    this.factory = factory
    this.reset = reset
    
    // 预创建对象
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory())
    }
  }
  
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!
    }
    return this.factory()
  }
  
  release(obj: T): void {
    this.reset(obj)
    this.pool.push(obj)
  }
}
```

### 9.3 批量更新

```typescript
// @y-mindmap/view/core/batch-updater.ts

class BatchUpdater {
  private pendingUpdates: Map<string, () => void> = new Map()
  private isScheduled: boolean = false
  
  schedule(id: string, update: () => void): void {
    this.pendingUpdates.set(id, update)
    
    if (!this.isScheduled) {
      this.isScheduled = true
      requestAnimationFrame(() => {
        this.flush()
      })
    }
  }
  
  private flush(): void {
    this.pendingUpdates.forEach(update => update())
    this.pendingUpdates.clear()
    this.isScheduled = false
  }
}
```

---

## 十、Snowbrush 形状参考

### 10.1 形状路径生成函数 (brushes.ts)

```typescript
// 矩形
function rect(bound: Bounds): string {
  return `M ${bound.x} ${bound.y}
          L ${bound.x + bound.width} ${bound.y}
          L ${bound.x + bound.width} ${bound.y + bound.height}
          L ${bound.x} ${bound.y + bound.height} Z`
}

// 六边形
function hexagon(bound: Bounds): string {
  const offset = bound.width / 9
  return `M ${bound.x} ${bound.y + bound.height / 2}
          L ${bound.x + offset} ${bound.y}
          L ${bound.x + bound.width - offset} ${bound.y}
          L ${bound.x + bound.width} ${bound.y + bound.height / 2}
          L ${bound.x + bound.width - offset} ${bound.y + bound.height}
          L ${bound.x + offset} ${bound.y + bound.height} Z`
}

// 菱形
function diamond(bound: Bounds): string {
  return `M ${bound.x + bound.width / 2} ${bound.y}
          L ${bound.x + bound.width} ${bound.y + bound.height / 2}
          L ${bound.x + bound.width / 2} ${bound.y + bound.height}
          L ${bound.x} ${bound.y + bound.height / 2} Z`
}

// 叶子
function leaf(bound: Bounds): string {
  const h = bound.height / 2
  return `M ${bound.x} ${bound.y + bound.height / 2}
          Q ${bound.x + bound.width / 2} ${bound.y - h}
            ${bound.x + bound.width} ${bound.y + bound.height / 2}
          Q ${bound.x + bound.width / 2} ${bound.y + bound.height + h}
            ${bound.x} ${bound.y + bound.height / 2} Z`
}
```

### 10.2 连线路径生成函数 (brushes.ts)

```typescript
// 曲线
function curveHorizon(start: Point, ctrl: Point, end: Point): string {
  const dx = end.x - ctrl.x
  const ctrlX = dx / 5 + ctrl.x
  return `M ${start.x} ${start.y}
          L ${ctrl.x} ${ctrl.y}
          Q ${ctrlX} ${end.y} ${end.x} ${end.y}`
}

// 肘线
function elbowHorizon(start: Point, ctrl: Point, end: Point): string {
  return `M ${start.x} ${start.y}
          L ${ctrl.x} ${ctrl.y}
          L ${ctrl.x} ${end.y}
          L ${end.x} ${end.y}`
}

// 圆角肘线
function roundedElbowHorizon(start: Point, ctrl: Point, end: Point, corner: number): string {
  const flexPt = { x: ctrl.x, y: end.y }
  const ver = end.y > ctrl.y ? 1 : -1
  const hor = end.x > ctrl.x ? 1 : -1
  
  const bflexPt = { x: flexPt.x, y: flexPt.y - ver * corner }
  const aflexPt = { x: flexPt.x + hor * corner, y: flexPt.y }
  
  return `M ${start.x} ${start.y}
          L ${ctrl.x} ${ctrl.y}
          L ${bflexPt.x} ${bflexPt.y}
          Q ${flexPt.x} ${flexPt.y} ${aflexPt.x} ${aflexPt.y}
          L ${end.x} ${end.y}`
}
```

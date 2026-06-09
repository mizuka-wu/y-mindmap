# COORDINATE.md - 坐标系统设计

> 思维导图坐标系统详细设计

---

## 一、坐标空间定义

### 1.1 四个坐标空间

```
┌─────────────────────────────────────────────────────────────┐
│ Screen (屏幕坐标)                                            │
│ 原点: 屏幕左上角                                              │
│ 单位: 物理像素                                                │
│                                                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ Viewport (视口坐标)                                    │  │
│  │ 原点: 编辑器容器左上角                                   │  │
│  │ 单位: CSS 像素                                          │  │
│  │                                                        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │ World (世界坐标)                                 │  │  │
│  │  │ 原点: 画布中心                                   │  │  │
│  │  │ 单位: 逻辑单位 (受缩放影响)                       │  │  │
│  │  │                                                  │  │  │
│  │  │  ┌─────────────────────────────────────────┐    │  │  │
│  │  │  │ Local (本地坐标)                         │    │  │  │
│  │  │  │ 原点: 元素左上角                          │    │  │  │
│  │  │  │ 单位: 相对于父元素                        │    │  │  │
│  │  │  └─────────────────────────────────────────┘    │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 坐标空间详解

```typescript
// @y-mindmap/coordinate/coordinate-spaces.ts

/**
 * 屏幕坐标 (Screen)
 * 
 * - 原点: 屏幕左上角
 * - 单位: 物理像素
 * - 用途: 鼠标事件、屏幕定位
 * 
 * 示例: { x: 500, y: 300 } 表示屏幕左上角 500px, 300px 的位置
 */
interface ScreenPoint {
  x: number
  y: number
}

/**
 * 视口坐标 (Viewport)
 * 
 * - 原点: 编辑器容器左上角
 * - 单位: CSS 像素
 * - 用途: 元素定位、事件处理
 * 
 * 示例: { x: 200, y: 150 } 表示编辑器容器内 200px, 150px 的位置
 */
interface ViewportPoint {
  x: number
  y: number
}

/**
 * 世界坐标 (World)
 * 
 * - 原点: 画布中心 (初始状态)
 * - 单位: 逻辑单位 (受缩放影响)
 * - 用途: 元素布局、碰撞检测
 * 
 * 示例: { x: 100, y: 50 } 表示画布中心右侧 100 单位, 下方 50 单位的位置
 */
interface WorldPoint {
  x: number
  y: number
}

/**
 * 本地坐标 (Local)
 * 
 * - 原点: 元素左上角
 * - 单位: 相对于父元素
 * - 用途: 元素内部定位
 * 
 * 示例: { x: 10, y: 5 } 表示元素内部 10px, 5px 的位置
 */
interface LocalPoint {
  x: number
  y: number
}
```

---

## 二、坐标转换

### 2.1 转换矩阵

```typescript
// @y-mindmap/coordinate/matrix.ts

/**
 * 2D 变换矩阵
 * 
 * | a  b  tx |
 * | c  d  ty |
 * | 0  0  1  |
 * 
 * 其中:
 * - a, d: 缩放
 * - b, c: 旋转/倾斜
 * - tx, ty: 平移
 */
class Matrix2D {
  constructor(
    public a: number = 1,
    public b: number = 0,
    public c: number = 0,
    public d: number = 1,
    public tx: number = 0,
    public ty: number = 0
  ) {}
  
  /**
   * 矩阵乘法
   * 
   * result = this * other
   */
  multiply(other: Matrix2D): Matrix2D {
    return new Matrix2D(
      this.a * other.a + this.b * other.c,
      this.a * other.b + this.b * other.d,
      this.c * other.a + this.d * other.c,
      this.c * other.b + this.d * other.d,
      this.tx * other.a + this.ty * other.c + other.tx,
      this.tx * other.b + this.ty * other.d + other.ty
    )
  }
  
  /**
   * 变换点
   */
  transformPoint(point: { x: number; y: number }): { x: number; y: number } {
    return {
      x: this.a * point.x + this.c * point.y + this.tx,
      y: this.b * point.x + this.d * point.y + this.ty,
    }
  }
  
  /**
   * 逆矩阵
   */
  inverse(): Matrix2D {
    const det = this.a * this.d - this.b * this.c
    if (det === 0) {
      throw new Error('Matrix is not invertible')
    }
    
    const invDet = 1 / det
    
    return new Matrix2D(
      this.d * invDet,
      -this.b * invDet,
      -this.c * invDet,
      this.a * invDet,
      (this.c * this.ty - this.d * this.tx) * invDet,
      (this.b * this.tx - this.a * this.ty) * invDet
    )
  }
  
  /**
   * 创建平移矩阵
   */
  static translate(x: number, y: number): Matrix2D {
    return new Matrix2D(1, 0, 0, 1, x, y)
  }
  
  /**
   * 创建缩放矩阵
   */
  static scale(sx: number, sy: number = sx): Matrix2D {
    return new Matrix2D(sx, 0, 0, sy, 0, 0)
  }
  
  /**
   * 创建旋转矩阵
   */
  static rotate(angle: number): Matrix2D {
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    return new Matrix2D(cos, sin, -sin, cos, 0, 0)
  }
  
  /**
   * 单位矩阵
   */
  static identity(): Matrix2D {
    return new Matrix2D(1, 0, 0, 1, 0, 0)
  }
}
```

### 2.2 坐标转换器

```typescript
// @y-mindmap/coordinate/coordinate-converter.ts

class CoordinateConverter {
  // 视口变换矩阵
  private viewportMatrix: Matrix2D = Matrix2D.identity()
  
  // 世界变换矩阵 (包含缩放和平移)
  private worldMatrix: Matrix2D = Matrix2D.identity()
  
  // 容器偏移
  private containerOffset: { x: number; y: number } = { x: 0, y: 0 }
  
  /**
   * 屏幕坐标 → 视口坐标
   */
  screenToViewport(screenPoint: ScreenPoint): ViewportPoint {
    return {
      x: screenPoint.x - this.containerOffset.x,
      y: screenPoint.y - this.containerOffset.y,
    }
  }
  
  /**
   * 视口坐标 → 屏幕坐标
   */
  viewportToScreen(viewportPoint: ViewportPoint): ScreenPoint {
    return {
      x: viewportPoint.x + this.containerOffset.x,
      y: viewportPoint.y + this.containerOffset.y,
    }
  }
  
  /**
   * 视口坐标 → 世界坐标
   */
  viewportToWorld(viewportPoint: ViewportPoint): WorldPoint {
    const inverse = this.worldMatrix.inverse()
    return inverse.transformPoint(viewportPoint)
  }
  
  /**
   * 世界坐标 → 视口坐标
   */
  worldToViewport(worldPoint: WorldPoint): ViewportPoint {
    return this.worldMatrix.transformPoint(worldPoint)
  }
  
  /**
   * 屏幕坐标 → 世界坐标
   */
  screenToWorld(screenPoint: ScreenPoint): WorldPoint {
    const viewportPoint = this.screenToViewport(screenPoint)
    return this.viewportToWorld(viewportPoint)
  }
  
  /**
   * 世界坐标 → 屏幕坐标
   */
  worldToScreen(worldPoint: WorldPoint): ScreenPoint {
    const viewportPoint = this.worldToViewport(worldPoint)
    return this.viewportToScreen(viewportPoint)
  }
  
  /**
   * 本地坐标 → 世界坐标
   */
  localToWorld(localPoint: LocalPoint, elementTransform: Matrix2D): WorldPoint {
    return elementTransform.transformPoint(localPoint)
  }
  
  /**
   * 世界坐标 → 本地坐标
   */
  worldToLocal(worldPoint: WorldPoint, elementTransform: Matrix2D): LocalPoint {
    const inverse = elementTransform.inverse()
    return inverse.transformPoint(worldPoint)
  }
  
  /**
   * 更新世界变换矩阵
   */
  updateWorldTransform(zoom: number, pan: { x: number; y: number }): void {
    // 先缩放，再平移
    this.worldMatrix = Matrix2D.translate(pan.x, pan.y)
      .multiply(Matrix2D.scale(zoom))
  }
  
  /**
   * 更新容器偏移
   */
  updateContainerOffset(offset: { x: number; y: number }): void {
    this.containerOffset = offset
  }
}
```

---

## 三、矩阵变换详解

### 3.1 平移矩阵

```typescript
/**
 * 平移矩阵
 * 
 * | 1  0  tx |
 * | 0  1  ty |
 * | 0  0  1  |
 * 
 * 效果: 将点 (x, y) 移动到 (x + tx, y + ty)
 */
function translateMatrix(tx: number, ty: number): Matrix2D {
  return new Matrix2D(1, 0, 0, 1, tx, ty)
}

// 示例
const m = translateMatrix(100, 50)
const p = m.transformPoint({ x: 10, y: 20 })
// p = { x: 110, y: 70 }
```

### 3.2 缩放矩阵

```typescript
/**
 * 缩放矩阵
 * 
 * | sx  0   0 |
 * | 0   sy  0 |
 * | 0   0   1 |
 * 
 * 效果: 将点 (x, y) 缩放到 (x * sx, y * sy)
 */
function scaleMatrix(sx: number, sy: number = sx): Matrix2D {
  return new Matrix2D(sx, 0, 0, sy, 0, 0)
}

// 示例
const m = scaleMatrix(2, 3)
const p = m.transformPoint({ x: 10, y: 20 })
// p = { x: 20, y: 60 }
```

### 3.3 旋转矩阵

```typescript
/**
 * 旋转矩阵
 * 
 * | cos  -sin  0 |
 * | sin   cos  0 |
 * | 0     0    1 |
 * 
 * 效果: 将点 (x, y) 绕原点旋转 angle 弧度
 */
function rotateMatrix(angle: number): Matrix2D {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return new Matrix2D(cos, sin, -sin, cos, 0, 0)
}

// 示例: 旋转 90 度 (π/2)
const m = rotateMatrix(Math.PI / 2)
const p = m.transformPoint({ x: 10, y: 0 })
// p = { x: 0, y: 10 }
```

### 3.4 组合变换

```typescript
/**
 * 组合变换: 先缩放，再旋转，最后平移
 * 
 * M = T * R * S
 */
function composeTransform(
  scale: { x: number; y: number },
  rotation: number,
  translation: { x: number; y: number }
): Matrix2D {
  const s = Matrix2D.scale(scale.x, scale.y)
  const r = Matrix2D.rotate(rotation)
  const t = Matrix2D.translate(translation.x, translation.y)
  
  // 注意: 矩阵乘法顺序是 T * R * S
  // 应用顺序是: 先缩放，再旋转，最后平移
  return t.multiply(r).multiply(s)
}

// 示例
const m = composeTransform(
  { x: 2, y: 2 },      // 缩放 2 倍
  Math.PI / 4,          // 旋转 45 度
  { x: 100, y: 50 }     // 平移 (100, 50)
)
```

### 3.5 矩阵求逆

```typescript
/**
 * 矩阵求逆
 * 
 * 对于矩阵:
 * | a  b  tx |
 * | c  d  ty |
 * | 0  0  1  |
 * 
 * 逆矩阵为:
 * | d/det   -b/det  (b*ty - d*tx)/det |
 * | -c/det  a/det   (c*tx - a*ty)/det |
 * | 0       0       1                 |
 * 
 * 其中 det = a*d - b*c
 */
function inverseMatrix(m: Matrix2D): Matrix2D {
  const det = m.a * m.d - m.b * m.c
  if (det === 0) {
    throw new Error('Matrix is not invertible')
  }
  
  const invDet = 1 / det
  
  return new Matrix2D(
    m.d * invDet,
    -m.b * invDet,
    -m.c * invDet,
    m.a * invDet,
    (m.b * m.ty - m.d * m.tx) * invDet,
    (m.c * m.tx - m.a * m.ty) * invDet
  )
}
```

---

## 四、位置计算

### 4.1 节点位置

```typescript
// @y-mindmap/coordinate/position-calculator.ts

class PositionCalculator {
  /**
   * 计算节点的世界坐标位置
   * 
   * 节点位置 = 父节点位置 + 相对偏移
   */
  calcNodeWorldPosition(
    node: MindMapNode,
    parentPosition: WorldPoint,
    relativeOffset: LocalPoint
  ): WorldPoint {
    return {
      x: parentPosition.x + relativeOffset.x,
      y: parentPosition.y + relativeOffset.y,
    }
  }
  
  /**
   * 计算节点的绝对位置 (从根节点开始累加)
   */
  calcAbsolutePosition(node: MindMapNode): WorldPoint {
    let x = 0
    let y = 0
    
    let current = node
    while (current.parent) {
      x += current.position.x
      y += current.position.y
      current = current.parent
    }
    
    return { x, y }
  }
  
  /**
   * 计算节点边界
   */
  calcNodeBounds(node: MindMapNode): Bounds {
    const position = this.calcAbsolutePosition(node)
    const size = node.size
    
    return {
      x: position.x,
      y: position.y,
      width: size.width,
      height: size.height,
    }
  }
}
```

### 4.2 连线位置

```typescript
// @y-mindmap/coordinate/connection-calculator.ts

class ConnectionCalculator {
  /**
   * 计算连线的起始点、控制点、结束点
   */
  calcConnectionPoints(
    parent: MindMapNode,
    child: MindMapNode,
    structure: StructureType
  ): ConnectionPoints {
    const parentBounds = this.calcNodeBounds(parent)
    const childBounds = this.calcNodeBounds(child)
    
    // 根据布局结构计算连线点
    switch (structure) {
      case 'logic-right':
        return this.calcLogicRightPoints(parentBounds, childBounds)
      case 'tree-right':
        return this.calcTreeRightPoints(parentBounds, childBounds)
      case 'org-chart-down':
        return this.calcOrgChartDownPoints(parentBounds, childBounds)
      default:
        return this.calcDefaultPoints(parentBounds, childBounds)
    }
  }
  
  private calcLogicRightPoints(
    parent: Bounds,
    child: Bounds
  ): ConnectionPoints {
    // 起始点: 父节点右侧中心
    const start = {
      x: parent.x + parent.width,
      y: parent.y + parent.height / 2,
    }
    
    // 结束点: 子节点左侧中心
    const end = {
      x: child.x,
      y: child.y + child.height / 2,
    }
    
    // 控制点: 起始点和结束点的中间
    const ctrl = {
      x: (start.x + end.x) / 2,
      y: start.y,
    }
    
    return { start, ctrl, end }
  }
  
  private calcTreeRightPoints(
    parent: Bounds,
    child: Bounds
  ): ConnectionPoints {
    // 起始点: 父节点底部中心
    const start = {
      x: parent.x + parent.width / 2,
      y: parent.y + parent.height,
    }
    
    // 结束点: 子节点顶部中心
    const end = {
      x: child.x + child.width / 2,
      y: child.y,
    }
    
    // 控制点: 起始点下方
    const ctrl = {
      x: start.x,
      y: (start.y + end.y) / 2,
    }
    
    return { start, ctrl, end }
  }
  
  private calcOrgChartDownPoints(
    parent: Bounds,
    child: Bounds
  ): ConnectionPoints {
    // 起始点: 父节点底部中心
    const start = {
      x: parent.x + parent.width / 2,
      y: parent.y + parent.height,
    }
    
    // 结束点: 子节点顶部中心
    const end = {
      x: child.x + child.width / 2,
      y: child.y,
    }
    
    // 控制点: 起始点和结束点的中间
    const ctrl = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    }
    
    return { start, ctrl, end }
  }
  
  private calcDefaultPoints(
    parent: Bounds,
    child: Bounds
  ): ConnectionPoints {
    // 默认: 直线连接中心点
    const start = {
      x: parent.x + parent.width / 2,
      y: parent.y + parent.height / 2,
    }
    
    const end = {
      x: child.x + child.width / 2,
      y: child.y + child.height / 2,
    }
    
    const ctrl = {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2,
    }
    
    return { start, ctrl, end }
  }
}

interface ConnectionPoints {
  start: Point
  ctrl: Point
  end: Point
}
```

### 4.3 锚点位置

```typescript
// @y-mindmap/coordinate/anchor-calculator.ts

class AnchorCalculator {
  /**
   * 获取节点的锚点位置
   * 
   * 锚点用于连线的起始/结束位置
   */
  getAnchorPosition(
    node: MindMapNode,
    direction: Direction
  ): Point {
    const bounds = this.calcNodeBounds(node)
    
    switch (direction) {
      case 'top':
        return {
          x: bounds.x + bounds.width / 2,
          y: bounds.y,
        }
      
      case 'bottom':
        return {
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height,
        }
      
      case 'left':
        return {
          x: bounds.x,
          y: bounds.y + bounds.height / 2,
        }
      
      case 'right':
        return {
          x: bounds.x + bounds.width,
          y: bounds.y + bounds.height / 2,
        }
      
      case 'top-left':
        return {
          x: bounds.x,
          y: bounds.y,
        }
      
      case 'top-right':
        return {
          x: bounds.x + bounds.width,
          y: bounds.y,
        }
      
      case 'bottom-left':
        return {
          x: bounds.x,
          y: bounds.y + bounds.height,
        }
      
      case 'bottom-right':
        return {
          x: bounds.x + bounds.width,
          y: bounds.y + bounds.height,
        }
      
      default:
        return {
          x: bounds.x + bounds.width / 2,
          y: bounds.y + bounds.height / 2,
        }
    }
  }
  
  /**
   * 获取节点的控制点位置
   * 
   * 控制点用于曲线连线的弯曲程度
   */
  getControlPosition(
    node: MindMapNode,
    direction: Direction,
    offset: number = 50
  ): Point {
    const anchor = this.getAnchorPosition(node, direction)
    
    switch (direction) {
      case 'top':
        return { x: anchor.x, y: anchor.y - offset }
      case 'bottom':
        return { x: anchor.x, y: anchor.y + offset }
      case 'left':
        return { x: anchor.x - offset, y: anchor.y }
      case 'right':
        return { x: anchor.x + offset, y: anchor.y }
      default:
        return anchor
    }
  }
}
```

---

## 五、碰撞检测

### 5.1 点在矩形内

```typescript
// @y-mindmap/coordinate/collision.ts

/**
 * 检测点是否在矩形内
 */
function isPointInRect(point: Point, rect: Rect): boolean {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

/**
 * 检测点是否在圆角矩形内
 */
function isPointInRoundedRect(
  point: Point,
  rect: Rect,
  radius: number
): boolean {
  // 先检查是否在矩形内
  if (!isPointInRect(point, rect)) {
    return false
  }
  
  // 检查四个角
  const corners = [
    { x: rect.x + radius, y: rect.y + radius },                    // 左上
    { x: rect.x + rect.width - radius, y: rect.y + radius },       // 右上
    { x: rect.x + radius, y: rect.y + rect.height - radius },      // 左下
    { x: rect.x + rect.width - radius, y: rect.y + rect.height - radius }, // 右下
  ]
  
  for (const corner of corners) {
    const dx = point.x - corner.x
    const dy = point.y - corner.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance > radius) {
      return false
    }
  }
  
  return true
}
```

### 5.2 点在多边形内

```typescript
/**
 * 检测点是否在多边形内 (射线法)
 */
function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y
    
    const intersect = ((yi > point.y) !== (yj > point.y)) &&
      (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi)
    
    if (intersect) {
      inside = !inside
    }
  }
  
  return inside
}
```

### 5.3 矩形相交

```typescript
/**
 * 检测两个矩形是否相交
 */
function isRectIntersecting(rect1: Rect, rect2: Rect): boolean {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  )
}

/**
 * 计算两个矩形的交集
 */
function getRectIntersection(rect1: Rect, rect2: Rect): Rect | null {
  const x = Math.max(rect1.x, rect2.x)
  const y = Math.max(rect1.y, rect2.y)
  const width = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - x
  const height = Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - y
  
  if (width <= 0 || height <= 0) {
    return null
  }
  
  return { x, y, width, height }
}
```

### 5.4 凸包计算

```typescript
/**
 * 计算点集的凸包 (Andrew's Monotone Chain 算法)
 */
function convexHull(points: Point[]): Point[] {
  if (points.length < 3) {
    return points
  }
  
  // 按 x 坐标排序 (x 相同按 y)
  const sorted = [...points].sort((a, b) => {
    if (a.x !== b.x) return a.x - b.x
    return a.y - b.y
  })
  
  // 构建下凸壳
  const lower: Point[] = []
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop()
    }
    lower.push(p)
  }
  
  // 构建上凸壳
  const upper: Point[] = []
  for (const p of sorted.reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop()
    }
    upper.push(p)
  }
  
  // 合并
  lower.pop()
  upper.pop()
  return lower.concat(upper)
}

function cross(o: Point, a: Point, b: Point): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x)
}
```

---

## 六、视口计算

### 6.1 视口边界

```typescript
// @y-mindmap/coordinate/viewport.ts

class ViewportCalculator {
  /**
   * 计算视口边界 (世界坐标)
   */
  calcViewportBounds(
    viewportSize: Size,
    zoom: number,
    pan: Point
  ): Bounds {
    // 视口左上角的世界坐标
    const topLeft = {
      x: -pan.x / zoom,
      y: -pan.y / zoom,
    }
    
    // 视口右下角的世界坐标
    const bottomRight = {
      x: (viewportSize.width - pan.x) / zoom,
      y: (viewportSize.height - pan.y) / zoom,
    }
    
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    }
  }
  
  /**
   * 计算内容边界
   */
  calcContentBounds(doc: MindMapNode): Bounds {
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    
    doc.descendants((node) => {
      const bounds = this.calcNodeBounds(node)
      
      minX = Math.min(minX, bounds.x)
      minY = Math.min(minY, bounds.y)
      maxX = Math.max(maxX, bounds.x + bounds.width)
      maxY = Math.max(maxY, bounds.y + bounds.height)
    })
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    }
  }
  
  /**
   * 计算适应内容的缩放和位置
   */
  calcFitToContent(
    contentBounds: Bounds,
    viewportSize: Size,
    padding: number = 40
  ): { zoom: number; pan: Point } {
    const scaleX = viewportSize.width / (contentBounds.width + padding * 2)
    const scaleY = viewportSize.height / (contentBounds.height + padding * 2)
    const zoom = Math.min(scaleX, scaleY, 2)  // 最大 2 倍
    
    const pan = {
      x: viewportSize.width / 2 - (contentBounds.x + contentBounds.width / 2) * zoom,
      y: viewportSize.height / 2 - (contentBounds.y + contentBounds.height / 2) * zoom,
    }
    
    return { zoom, pan }
  }
}
```

### 6.2 缩放计算

```typescript
/**
 * 计算缩放后的视口
 */
function calcZoomedViewport(
  currentViewport: Bounds,
  zoom: number,
  center: Point
): Bounds {
  // 计算缩放中心在视口中的相对位置
  const relativeCenter = {
    x: (center.x - currentViewport.x) / currentViewport.width,
    y: (center.y - currentViewport.y) / currentViewport.height,
  }
  
  // 计算新尺寸
  const newWidth = currentViewport.width / zoom
  const newHeight = currentViewport.height / zoom
  
  // 计算新位置 (保持缩放中心不变)
  const newX = center.x - newWidth * relativeCenter.x
  const newY = center.y - newHeight * relativeCenter.y
  
  return {
    x: newX,
    y: newY,
    width: newWidth,
    height: newHeight,
  }
}
```

---

## 七、Snowbrush 坐标参考

### 7.1 三个坐标空间

```typescript
// 来源: /src/view/helper/coordinate-transfer.ts

/**
 * Viewport: 窗口左上角为原点
 * VisibleArea: 可见区域左上角为原点
 * MindMap: 中央节点中心为原点
 */

class CoordinateTransfer {
  mindMapToViewport(p: Point): Point {
    const origin = this.mindMapOriginPositionInViewport
    const scale = this.mindMapScale
    return {
      x: p.x * scale + origin.x,
      y: p.y * scale + origin.y,
    }
  }
  
  viewportToMindMap(p: Point): Point {
    const origin = this.mindMapOriginPositionInViewport
    const scale = this.mindMapScale
    return {
      x: (p.x - origin.x) / scale,
      y: (p.y - origin.y) / scale,
    }
  }
  
  mindMapToVisibleArea(p: Point): Point {
    const origin = this.mindMapOriginPositionInVisibleArea
    const scale = this.mindMapScale
    return {
      x: p.x * scale + origin.x,
      y: p.y * scale + origin.y,
    }
  }
  
  visibleAreaToMindMap(p: Point): Point {
    const origin = this.mindMapOriginPositionInVisibleArea
    const scale = this.mindMapScale
    return {
      x: (p.x - origin.x) / scale,
      y: (p.y - origin.y) / scale,
    }
  }
}
```

### 7.2 缩放和平移

```typescript
// 来源: /src/view/helper/canvascontrol.ts

class CanvasControl {
  /**
   * 移动视口
   */
  move(x: number, y: number): void {
    this._scrollContainer.scrollLeft += x
    this._scrollContainer.scrollTop += y
  }
  
  /**
   * 居中某个位置
   */
  center(position: Point): void {
    const viewport = this.getVisibleAreaBounds()
    const posInViewport = this.coordinateTransfer.mindMapToViewport(position)
    
    const deltaX = viewport.x + viewport.width / 2 - posInViewport.x
    const deltaY = viewport.y + viewport.height / 2 - posInViewport.y
    
    this.move(deltaX, deltaY)
  }
  
  /**
   * 适应内容
   */
  fitMap(): void {
    const viewport = this.getVisibleAreaBounds()
    const content = this.getContentBounds()
    
    const scale = Math.min(
      (viewport.width - 20) / content.width,
      (viewport.height - 20) / content.height,
      2
    )
    
    this.setScale(scale * 100)
    this.center({
      x: content.x + content.width / 2,
      y: content.y + content.height / 2,
    })
  }
}
```

# LAYOUT-IMPL.md - 布局实现规范

> 21 种布局结构的详细实现规范

---

## 一、布局架构

### 1.1 LayoutEngine 接口

```typescript
// @y-mindmap/layout/layout-engine.ts

interface LayoutEngine {
  // 计算整个文档的布局
  calculate(doc: MindMapNode): LayoutResult
  
  // 增量布局 (只计算变化的部分)
  calculateIncremental(doc: MindMapNode, changes: ChangeSet): LayoutResult
  
  // 获取节点的首选尺寸
  getPreferredSize(node: MindMapNode): Size
}

interface LayoutResult {
  // 节点位置 (相对于父节点)
  nodePositions: Map<string, Position>
  
  // 连线路径
  connectionPaths: Map<string, PathData>
  
  // 整体边界
  bounds: Bounds
  
  // 布局元数据
  metadata: LayoutMetadata
}

interface LayoutMetadata {
  // 布局类型
  structureClass: string
  
  // 布局方向
  direction: Direction
  
  // 子节点分组信息
  childGroups: Map<string, ChildGroup>
}

interface ChildGroup {
  // 分组方向
  direction: Direction
  
  // 分组内的节点
  children: string[]
  
  // 分组边界
  bounds: Bounds
}
```

### 1.2 布局配置

```typescript
// @y-mindmap/layout/layout-config.ts

interface LayoutConfig {
  // 间距配置
  spacing: {
    // 主要间距 (父子节点之间)
    major: number      // 默认 20
    
    // 次要间距 (兄弟节点之间)
    minor: number      // 默认 8
    
    // 边界间距 (boundary 内边距)
    boundary: number   // 默认 10
    
    // 摘要间距
    summary: number    // 默认 10
  }
  
  // 对齐配置
  alignment: {
    // 水平对齐
    horizontal: 'start' | 'center' | 'end'
    
    // 垂直对齐
    vertical: 'start' | 'center' | 'end'
  }
  
  // 动画配置
  animation: {
    // 是否启用动画
    enabled: boolean
    
    // 动画时长
    duration: number
    
    // 缓动函数
    easing: string
  }
}
```

### 1.3 布局流程

```
输入: MindMapNode (文档树)
    │
    ▼
1. 选择布局策略 (根据 structureClass)
    │
    ▼
2. 计算节点尺寸
    │
    ▼
3. 分组子节点 (左右/上下)
    │
    ▼
4. 递归计算子布局
    │
    ▼
5. 计算节点位置
    │
    ▼
6. 计算连线路径
    │
    ▼
7. 计算整体边界
    │
    ▼
输出: LayoutResult
```

---

## 二、公共布局工具

### 2.1 子节点分组算法

```typescript
// @y-mindmap/layout/utils/grouping.ts

/**
 * Map 布局的左右分组算法
 * 
 * 目标: 将子节点分为左右两组，使两组的高度尽可能平衡
 * 
 * 算法: 加权中点分割
 * 1. 计算每个子节点的权重 (height + spacing)
 * 2. 计算总权重的一半
 * 3. 从左到右累加权重，当累加值 >= half 时分割
 */
function splitChildrenForMap(
  children: MindMapNode[],
  config: LayoutConfig
): { left: MindMapNode[]; right: MindMapNode[] } {
  const weights = children.map(child => getWeight(child, config))
  const totalWeight = weights.reduce((sum, w) => sum + w, 0)
  const halfWeight = totalWeight / 2
  
  let accumulated = 0
  let splitIndex = children.length
  
  for (let i = 0; i < children.length; i++) {
    accumulated += weights[i]
    if (accumulated >= halfWeight) {
      // 检查是否应该在前一个位置分割
      const prevAccumulated = accumulated - weights[i]
      if (halfWeight - prevAccumulated < accumulated - halfWeight) {
        splitIndex = i
      } else {
        splitIndex = i + 1
      }
      break
    }
  }
  
  return {
    right: children.slice(0, splitIndex),
    left: children.slice(splitIndex),
  }
}

/**
 * 计算节点权重
 * 
 * 权重 = boundaryBounds.height + spacing
 * 
 * 用于决定节点应该放在哪一侧
 */
function getWeight(node: MindMapNode, config: LayoutConfig): number {
  const bounds = getNodeBounds(node)
  return bounds.height + config.spacing.major * 1.5
}

/**
 * OrgChart 布局的上下分组
 * 
 * 目标: 将子节点分为上下两组
 * 
 * 算法: 类似 Map，但使用宽度作为权重
 */
function splitChildrenForOrgChart(
  children: MindMapNode[],
  config: LayoutConfig
): { top: MindMapNode[]; bottom: MindMapNode[] } {
  // 类似实现...
}
```

### 2.2 间距计算

```typescript
// @y-mindmap/layout/utils/spacing.ts

/**
 * 计算主要间距 (父子节点之间)
 * 
 * 影响因素:
 * 1. 基础间距 (config.spacing.major)
 * 2. 连线样式 (某些样式需要更大间距)
 * 3. 子节点数量 (子节点越多，间距越大)
 */
function calcMajorSpacing(
  parent: MindMapNode,
  children: MindMapNode[],
  config: LayoutConfig
): number {
  const baseSpacing = config.spacing.major
  const lineStyle = getConnectionStyle(parent)
  
  // 某些连线样式需要更大间距
  const slantLineStyles = ['curve', 'straight', 'fold', 'roundedFold']
  const multiplier = slantLineStyles.includes(lineStyle) ? 2 : 1
  
  // 子节点数量影响
  const childCountFactor = Math.min(1, children.length / 10)
  
  return baseSpacing * multiplier * (1 + childCountFactor * 0.2)
}

/**
 * 计算次要间距 (兄弟节点之间)
 * 
 * 影响因素:
 * 1. 基础间距 (config.spacing.minor)
 * 2. 节点边框宽度
 */
function calcMinorSpacing(
  node: MindMapNode,
  config: LayoutConfig
): number {
  const borderWidth = getBorderWidth(node)
  return config.spacing.minor + borderWidth
}
```

### 2.3 对齐算法

```typescript
// @y-mindmap/layout/utils/alignment.ts

/**
 * 居中对齐
 * 
 * 将子节点组居中对齐到父节点
 */
function alignCenter(
  parentBounds: Bounds,
  childrenBounds: Bounds,
  direction: Direction
): Position {
  if (direction === 'horizontal') {
    return {
      x: parentBounds.x + (parentBounds.width - childrenBounds.width) / 2,
      y: childrenBounds.y,
    }
  } else {
    return {
      x: childrenBounds.x,
      y: parentBounds.y + (parentBounds.height - childrenBounds.height) / 2,
    }
  }
}

/**
 * 起始对齐
 * 
 * 将子节点组对齐到父节点的起始位置
 */
function alignStart(
  parentBounds: Bounds,
  childrenBounds: Bounds,
  direction: Direction
): Position {
  if (direction === 'horizontal') {
    return {
      x: parentBounds.x,
      y: childrenBounds.y,
    }
  } else {
    return {
      x: childrenBounds.x,
      y: parentBounds.y,
    }
  }
}
```

---

## 三、Map 布局实现

### 3.1 平衡 Map 布局

**特点**: 中心节点居中，子节点向两侧展开，左右平衡

**算法流程**:

```
输入: rootBranch (根节点)
    │
    ▼
1. 获取所有子节点 attachedChildrenBranches
    │
    ▼
2. 计算左右分组 numRight = calcNumRight(branch)
    │
    ▼
3. 分组: rightChildren = children[0..numRight]
         leftChildren = children[numRight..]
    │
    ▼
4. 计算右侧位置 calSidePos({ side: 'right', children: rightChildren })
    │
    ▼
5. 计算左侧位置 calSidePos({ side: 'left', children: leftChildren })
    │
    ▼
6. 计算整体边界 calBounds(branch, newBounds)
    │
    ▼
输出: LayoutResult
```

**关键算法 - calcNumRight**:

```typescript
// @y-mindmap/layout/structures/map.ts

function calcNumRight(rootBranch: MindMapNode): number {
  const children = rootBranch.getChildrenByType('attached')
  const totalWeight = children.reduce((sum, child) => sum + getWeight(child), 0)
  const halfWeight = totalWeight / 2
  
  let rightWeight = 0
  let lastIndex = -1
  
  for (let i = 0; i < children.length; i++) {
    rightWeight += getWeight(children[i])
    
    // 检查是否在同一 boundary/summary 范围内
    if (!isInSameRange(rootBranch, i, i + 1)) {
      if (rightWeight >= halfWeight) {
        // 检查是否应该在前一个位置分割
        const prevWeight = rightWeight - getWeight(children[i])
        if (halfWeight - prevWeight < rightWeight - halfWeight && lastIndex >= 0) {
          return lastIndex + 1
        }
        return i + 1
      }
      lastIndex = i
    }
  }
  
  return children.length
}
```

**关键算法 - calSidePos**:

```typescript
// @y-mindmap/layout/structures/map.ts

function calSidePos(params: {
  branch: MindMapNode
  children: MindMapNode[]
  side: 'left' | 'right'
  spacingMajor: number
  spacingMinor: number
  newBounds: Bounds
}): void {
  const { branch, children, side, spacingMajor, spacingMinor, newBounds } = params
  
  if (children.length === 0) return
  
  // 1. 计算每个子节点相对于第一个子节点的 Y 偏移
  const yOffsets: number[] = [0]
  
  for (let i = 1; i < children.length; i++) {
    const prev = children[i - 1]
    const curr = children[i]
    
    const prevBottom = yOffsets[i - 1] + prev.bounds.y + prev.bounds.height
    const currTop = curr.bounds.y
    
    yOffsets[i] = Math.max(
      yOffsets[i - 1] + prev.bounds.height + spacingMinor,
      prevBottom + spacingMinor - currTop
    )
  }
  
  // 2. 计算父节点相对于第一个子节点的 Y 位置
  const firstChildEndY = getEndAnchorPosition(children[0]).y
  const lastChildEndY = getEndAnchorPosition(children[children.length - 1]).y
  
  const parentY = (firstChildEndY + yOffsets[0] + lastChildEndY + yOffsets[children.length - 1]) / 2
  
  // 3. 计算 X 位置
  let x: number
  if (side === 'right') {
    x = newBounds.x + newBounds.width + spacingMajor
  } else {
    x = newBounds.x - spacingMajor
  }
  
  // 4. 应用位置
  children.forEach((child, index) => {
    const posX = side === 'right'
      ? x - child.bounds.x
      : x + child.bounds.x - child.bounds.width
    
    const posY = -parentY + yOffsets[index]
    
    child.setPosition(posX, posY)
  })
  
  // 5. 更新边界
  const childrenBounds = getUnionBounds(children)
  newBounds.x = Math.min(newBounds.x, childrenBounds.x)
  newBounds.y = Math.min(newBounds.y, childrenBounds.y)
  newBounds.width = Math.max(newBounds.width, childrenBounds.x + childrenBounds.width - newBounds.x)
  newBounds.height = Math.max(newBounds.height, childrenBounds.y + childrenBounds.height - newBounds.y)
}
```

### 3.2 非平衡 Map 布局

**特点**: 固定左右分配，不自动平衡

**区别**:
- 不调用 `calcNumRight()`
- 使用固定的分组规则 (如前 N 个在右侧)

### 3.3 顺时针/逆时针 Map 布局

**特点**: 子节点按顺时针或逆时针方向排列

**区别**:
- 左侧子节点的排列顺序相反
- 连线方向调整

### 3.4 浮动 Map 布局

**特点**: 浮动节点可以自由定位

**处理**:
- 浮动节点不参与布局计算
- 使用碰撞检测避免重叠

---

## 四、Tree 布局实现

### 4.1 向右 Tree 布局

**特点**: 树形结构，单方向向右展开

**算法流程**:

```
输入: branch (当前节点)
    │
    ▼
1. 获取子节点 attachedChildrenBranches
    │
    ▼
2. 计算 X 位置: childrenX = spacingMajor + endPointLineOffset
    │
    ▼
3. 计算 Y 起始位置: childrenY = newBounds.y + newBounds.height + padding
    │
    ▼
4. 遍历子节点:
   for each child:
     posX = childrenX - child.bounds.x + maxOffset
     posY = childrenY - child.bounds.y
     child.setPosition(posX, posY)
     childrenY += child.bounds.height + spacingMinor
    │
    ▼
5. 更新边界
    │
    ▼
输出: LayoutResult
```

**关键代码**:

```typescript
// @y-mindmap/layout/structures/tree-right.ts

function calAttachedChildrenPos(
  branch: MindMapNode,
  newBounds: Bounds,
  isRight: boolean
): void {
  const children = branch.getChildrenByType('attached')
  const spacingMajor = 10  // BOUNDARYGAP
  const spacingMinor = getMinorSpacing(branch)
  const lineWidth = getBorderWidth(branch)
  
  if (children.length === 0) return
  
  // 计算 X 位置
  const childrenX = isRight
    ? spacingMajor + (branch.isRoot ? 30 : 0)
    : -spacingMajor - (branch.isRoot ? 30 : 0)
  
  // 计算 Y 起始位置
  let childrenY = newBounds.y + newBounds.height + 20  // PADDING * 2
  
  // 计算最大偏移 (用于对齐)
  const maxOffset = children.reduce((max, child) => {
    return isRight
      ? Math.max(max, child.bounds.x - child.boundaryBounds.x)
      : Math.max(max, child.boundaryBounds.x + child.boundaryBounds.width - child.bounds.x - child.bounds.width)
  }, 0)
  
  // 遍历子节点
  children.forEach((child) => {
    const posX = isRight
      ? childrenX - child.bounds.x + maxOffset
      : childrenX + child.bounds.x - maxOffset
    
    const posY = childrenY - child.boundaryBounds.y
    
    child.setPosition(posX, posY)
    
    childrenY += child.boundaryBounds.height + spacingMinor + lineWidth
  })
  
  // 更新边界
  const childrenBounds = getUnionBounds(children)
  Object.assign(newBounds, getUnionBounds([newBounds, childrenBounds]))
}
```

### 4.2 向左 Tree 布局

**特点**: 镜像向右 Tree

**区别**:
- X 位置取反
- 子节点排列顺序相反

### 4.3 双侧 Tree 布局

**特点**: 子节点分为左右两侧

**实现**:
- 使用 `splitChildrenForMap()` 分组
- 左侧使用 `calSidePos({ side: 'left' })`
- 右侧使用 `calSidePos({ side: 'right' })`

---

## 五、Logic 布局实现

### 5.1 向右 Logic 布局

**特点**: 类似 Tree，但连线从父节点右侧连接到子节点左侧

**算法流程**:

```
与 Tree 类似，但:
1. 父节点连接点在右侧
2. 子节点连接点在左侧
3. 连线路径不同
```

**关键代码**:

```typescript
// @y-mindmap/layout/structures/logic-right.ts

function calAttachedChildrenPos(
  branch: MindMapNode,
  newBounds: Bounds,
  isRight: boolean
): void {
  const children = branch.getChildrenByType('attached')
  const spacingMajor = calcSpacingMajor(branch)
  const spacingMinor = getMinorSpacing(branch)
  const lineWidth = getBorderWidth(branch)
  
  if (children.length === 0) return
  
  // 计算子节点尺寸
  const childrenSize = getChildrenSize(branch, isRight)
  
  // 计算 X 位置
  let childrenX: number
  if (isRight) {
    childrenX = newBounds.x + newBounds.width + spacingMajor
  } else {
    childrenX = newBounds.x - spacingMajor
    newBounds.x = childrenX - childrenSize.width
  }
  
  // 计算 Y 位置 (居中对齐)
  const controlPosY = getControlPosition(branch, children[0]).y - branch.linePosition.y
  const topEndPosY = getEndAnchorPosition(children[0]).y - children[0].linePosition.y
  const bottomEndPosY = getEndAnchorPosition(children[children.length - 1]).y - children[children.length - 1].linePosition.y
  
  let childrenY = (
    children[children.length - 1].boundaryBounds.y +
    children[children.length - 1].boundaryBounds.height -
    topEndPosY -
    bottomEndPosY -
    children[0].boundaryBounds.y -
    childrenSize.height
  ) / 2 + children[0].boundaryBounds.y + controlPosY
  
  // 遍历子节点
  children.forEach((child) => {
    const posX = isRight
      ? childrenX - child.bounds.x + maxOffset
      : childrenX + child.bounds.x - maxOffset
    
    const posY = childrenY - child.boundaryBounds.y
    
    child.setPosition(posX, posY)
    
    childrenY += child.boundaryBounds.height + spacingMinor + lineWidth
  })
  
  // 更新边界
  // ...
}
```

### 5.2 向左 Logic 布局

**特点**: 镜像向右 Logic

### 5.3 双侧 Logic 布局

**特点**: 子节点分为左右两侧

---

## 六、OrgChart 布局实现

### 6.1 向下 OrgChart 布局

**特点**: 组织结构图，层级向下展开

**算法流程**:

```
输入: branch (当前节点)
    │
    ▼
1. 获取子节点 attachedChildrenBranches
    │
    ▼
2. 计算子节点总宽度 childrenSize.width
    │
    ▼
3. 计算起始 X: minChildX = -childrenSize.width / 2
    │
    ▼
4. 计算 Y 位置: childrenY = newBounds.y + newBounds.height + spacingMajor
    │
    ▼
5. 遍历子节点:
   for each child:
     posX = currentChildX - child.bounds.x
     posY = childrenY - child.bounds.y
     child.setPosition(posX, posY)
     currentChildX += child.bounds.width + spacingMinor
    │
    ▼
6. 更新边界
    │
    ▼
输出: LayoutResult
```

**关键代码**:

```typescript
// @y-mindmap/layout/structures/orgchart-down.ts

function calAttachedChildrenPos(
  branch: MindMapNode,
  newBounds: Bounds,
  isDown: boolean
): void {
  const children = branch.getChildrenByType('attached')
  const spacingMajor = calcSpacingMajor(branch)
  const spacingMinor = getMinorSpacing(branch)
  const lineWidth = getBorderWidth(branch)
  
  if (children.length === 0) return
  
  // 计算子节点总尺寸
  const childrenSize = getChildrenSize(branch)
  
  // 计算起始 X (居中)
  let minChildX = -childrenSize.width / 2
  if (children.length > 1) {
    let levelWidth = childrenSize.width
    levelWidth += children[0].boundaryBounds.x
    levelWidth -= children[children.length - 1].boundaryBounds.width
    levelWidth -= children[children.length - 1].boundaryBounds.x
    minChildX = -levelWidth / 2 + children[0].boundaryBounds.x
  }
  
  // 计算 Y 位置
  let childrenY: number
  if (isDown) {
    childrenY = newBounds.y + newBounds.height + spacingMajor
  } else {
    childrenY = newBounds.y - spacingMajor
    newBounds.y = Math.min(newBounds.y, childrenY - childrenSize.height)
  }
  
  // 计算最大偏移 (用于对齐)
  let maxOffset = 0
  children.forEach((child) => {
    if (isDown) {
      maxOffset = Math.max(maxOffset, child.bounds.y - child.boundaryBounds.y)
    } else {
      maxOffset = Math.max(maxOffset, child.boundaryBounds.y + child.boundaryBounds.height - child.bounds.y - child.bounds.height)
    }
  })
  
  // 遍历子节点
  let currentChildX = minChildX
  children.forEach((child) => {
    const posX = currentChildX - child.boundaryBounds.x
    const posY = isDown
      ? childrenY - child.bounds.y + maxOffset
      : childrenY + child.bounds.y - maxOffset
    
    child.setPosition(posX, posY)
    
    currentChildX += child.boundaryBounds.width + spacingMinor + lineWidth
  })
  
  // 更新边界
  // ...
}
```

### 6.2 向上 OrgChart 布局

**特点**: 镜像向下 OrgChart

### 6.3 双侧 OrgChart 布局

**特点**: 子节点分为上下两侧

---

## 七、Fishbone 布局实现

### 7.1 左头 Fishbone 布局

**特点**: 鱼骨图，鱼头在左侧

**算法流程**:

```
输入: branch (当前节点)
    │
    ▼
1. 获取子节点
    │
    ▼
2. 分为上下两组 (上骨/下骨)
    │
    ▼
3. 计算主骨长度和位置
    │
    ▼
4. 计算分支角度 (60°)
    │
    ▼
5. 计算每个分支的位置
    │
    ▼
6. 计算连线路径
    │
    ▼
输出: LayoutResult
```

**关键代码**:

```typescript
// @y-mindmap/layout/structures/fishbone-left.ts

interface FishboneConfig {
  bonePaddingH: number    // 主骨水平内边距
  bonePaddingV: number    // 主骨垂直内边距
  subBonePaddingV: number // 分支垂直内边距
  connectionDistance: number // 连线距离
  connectionAngle: number   // 连线角度 (度)
}

function calAttachedChildrenPos(
  branch: MindMapNode,
  newBounds: Bounds,
  config: FishboneConfig
): void {
  const children = branch.getChildrenByType('attached')
  
  if (children.length === 0) return
  
  // 分为上下两组
  const halfIndex = Math.ceil(children.length / 2)
  const topChildren = children.slice(0, halfIndex)
  const bottomChildren = children.slice(halfIndex)
  
  // 计算主骨长度
  const mainBoneLength = Math.max(
    getChildrenTotalHeight(topChildren),
    getChildrenTotalHeight(bottomChildren)
  ) + config.bonePaddingV * 2
  
  // 计算分支角度 (弧度)
  const angle = config.connectionAngle * Math.PI / 180
  
  // 计算上骨分支位置
  let currentY = -mainBoneLength / 2
  topChildren.forEach((child) => {
    const offsetX = Math.abs(currentY) * Math.tan(angle)
    const posX = -offsetX - child.bounds.width - config.connectionDistance
    const posY = currentY - child.bounds.y
    
    child.setPosition(posX, posY)
    
    currentY += child.bounds.height + config.subBonePaddingV
  })
  
  // 计算下骨分支位置
  currentY = mainBoneLength / 2
  bottomChildren.forEach((child) => {
    const offsetX = Math.abs(currentY) * Math.tan(angle)
    const posX = -offsetX - child.bounds.width - config.connectionDistance
    const posY = currentY - child.bounds.y
    
    child.setPosition(posX, posY)
    
    currentY -= child.bounds.height + config.subBonePaddingV
  })
  
  // 更新边界
  // ...
}
```

### 7.2 右头 Fishbone 布局

**特点**: 镜像左头 Fishbone

---

## 八、Timeline 布局实现

### 8.1 水平 Timeline 布局

**特点**: 时间线水平排列

**算法流程**:

```
输入: branch (当前节点)
    │
    ▼
1. 获取子节点
    │
    ▼
2. 计算时间线长度
    │
    ▼
3. 计算每个节点在时间线上的位置
    │
    ▼
4. 计算节点相对于时间线的位置 (上方/下方)
    │
    ▼
5. 计算连线路径
    │
    ▼
输出: LayoutResult
```

**关键代码**:

```typescript
// @y-mindmap/layout/structures/timeline-horizontal.ts

function calAttachedChildrenPos(
  branch: MindMapNode,
  newBounds: Bounds
): void {
  const children = branch.getChildrenByType('attached')
  const spacing = 20  // 节点间距
  
  if (children.length === 0) return
  
  // 计算总宽度
  const totalWidth = children.reduce((sum, child) => sum + child.bounds.width, 0) +
    spacing * (children.length - 1)
  
  // 计算起始位置
  let currentX = -totalWidth / 2
  
  // 遍历子节点
  children.forEach((child, index) => {
    // 交替放在上方和下方
    const isAbove = index % 2 === 0
    
    const posX = currentX - child.bounds.x + child.bounds.width / 2
    const posY = isAbove
      ? -spacing - child.bounds.height - child.bounds.y
      : spacing - child.bounds.y
    
    child.setPosition(posX, posY)
    
    currentX += child.bounds.width + spacing
  })
  
  // 更新边界
  // ...
}
```

### 8.2 垂直 Timeline 布局

**特点**: 时间线垂直排列

### 8.3 侧向 Timeline 布局

**特点**: 时间线在侧面

---

## 九、Spreadsheet 布局实现

### 9.1 行 Spreadsheet 布局

**特点**: 按行排列

**算法流程**:

```
1. 计算列数和行数
2. 计算每个单元格的尺寸
3. 计算每个节点在网格中的位置
4. 计算连线路径
```

### 9.2 列 Spreadsheet 布局

**特点**: 按列排列

---

## 十、Brace 布局实现

### 10.1 左 Brace 布局

**特点**: 括号在左侧

**算法流程**:

```
1. 获取子节点
2. 计算括号的起始和结束位置
3. 计算每个节点的位置
4. 生成括号路径
```

### 10.2 右 Brace 布局

**特点**: 括号在右侧

### 10.3 双侧 Brace 布局

**特点**: 左右都有括号

---

## 十一、TreeTable 布局实现

### 11.1 TreeTable 布局

**特点**: 树形表格

**算法流程**:

```
1. 计算表格的行和列
2. 计算每个单元格的尺寸
3. 计算每个节点在表格中的位置
4. 计算连线路径
```

### 11.2 顶标题 TreeTable 布局

**特点**: 顶部有标题行

---

## 十二、布局切换

### 12.1 切换动画

```typescript
// @y-mindmap/layout/animation/layout-transition.ts

class LayoutTransition {
  /**
   * 计算布局切换动画
   * 
   * @param oldLayout 旧布局结果
   * @param newLayout 新布局结果
   * @param duration 动画时长
   * @returns 动画关键帧
   */
  calculate(
    oldLayout: LayoutResult,
    newLayout: LayoutResult,
    duration: number
  ): AnimationKeyframes {
    const keyframes: AnimationKeyframes = new Map()
    
    // 遍历所有节点
    const allNodeIds = new Set([
      ...oldLayout.nodePositions.keys(),
      ...newLayout.nodePositions.keys(),
    ])
    
    allNodeIds.forEach((nodeId) => {
      const oldPos = oldLayout.nodePositions.get(nodeId)
      const newPos = newLayout.nodePositions.get(nodeId)
      
      if (oldPos && newPos) {
        // 节点存在新旧位置，需要动画
        keyframes.set(nodeId, {
          from: oldPos,
          to: newPos,
          duration,
          easing: 'easeInOut',
        })
      } else if (oldPos && !newPos) {
        // 节点被删除，淡出动画
        keyframes.set(nodeId, {
          from: oldPos,
          to: { ...oldPos, opacity: 0 },
          duration,
          easing: 'easeOut',
        })
      } else if (!oldPos && newPos) {
        // 节点被添加，淡入动画
        keyframes.set(nodeId, {
          from: { ...newPos, opacity: 0 },
          to: newPos,
          duration,
          easing: 'easeIn',
        })
      }
    })
    
    return keyframes
  }
}
```

### 12.2 切换策略

```typescript
// @y-mindmap/layout/transition-strategy.ts

enum TransitionStrategy {
  // 即时切换
  INSTANT = 'instant',
  
  // 渐变切换
  GRADUAL = 'gradual',
  
  // 局部切换
  PARTIAL = 'partial',
}

function applyTransition(
  editor: EditorView,
  oldLayout: LayoutResult,
  newLayout: LayoutResult,
  strategy: TransitionStrategy
): void {
  switch (strategy) {
    case TransitionStrategy.INSTANT:
      // 立即应用新布局
      applyLayout(editor, newLayout)
      break
    
    case TransitionStrategy.GRADUAL:
      // 计算动画
      const transition = new LayoutTransition()
      const keyframes = transition.calculate(oldLayout, newLayout, 300)
      
      // 播放动画
      playAnimation(editor, keyframes)
      break
    
    case TransitionStrategy.PARTIAL:
      // 只动画变化的部分
      const partialKeyframes = calculatePartialAnimation(oldLayout, newLayout)
      playAnimation(editor, partialKeyframes)
      break
  }
}
```

---

## 十三、增量布局

### 13.1 变更检测

```typescript
// @y-mindmap/layout/incremental/change-detector.ts

interface ChangeSet {
  // 添加的节点
  added: Set<string>
  
  // 删除的节点
  removed: Set<string>
  
  // 移动的节点
  moved: Map<string, { from: string; to: string }>
  
  // 属性变更的节点
  modified: Set<string>
}

function detectChanges(
  oldDoc: MindMapNode,
  newDoc: MindMapNode
): ChangeSet {
  const changes: ChangeSet = {
    added: new Set(),
    removed: new Set(),
    moved: new Map(),
    modified: new Set(),
  }
  
  // 遍历新文档
  newDoc.descendants((node) => {
    const oldNode = oldDoc.getNodeById(node.id)
    
    if (!oldNode) {
      // 新增节点
      changes.added.add(node.id)
    } else {
      // 检查是否移动
      if (oldNode.parentId !== node.parentId) {
        changes.moved.set(node.id, {
          from: oldNode.parentId,
          to: node.parentId,
        })
      }
      
      // 检查属性是否变更
      if (!node.eq(oldNode)) {
        changes.modified.add(node.id)
      }
    }
  })
  
  // 遍历旧文档
  oldDoc.descendants((node) => {
    const newNode = newDoc.getNodeById(node.id)
    
    if (!newNode) {
      // 删除的节点
      changes.removed.add(node.id)
    }
  })
  
  return changes
}
```

### 13.2 增量计算

```typescript
// @y-mindmap/layout/incremental/incremental-layout.ts

function calculateIncremental(
  doc: MindMapNode,
  changes: ChangeSet,
  previousLayout: LayoutResult
): LayoutResult {
  // 1. 识别受影响的节点
  const affectedNodes = identifyAffectedNodes(doc, changes)
  
  // 2. 只重新计算受影响的节点
  const newPositions = new Map(previousLayout.nodePositions)
  
  affectedNodes.forEach((nodeId) => {
    const node = doc.getNodeById(nodeId)
    if (node) {
      const position = calculateNodePosition(node, doc)
      newPositions.set(nodeId, position)
    }
  })
  
  // 3. 合并结果
  return {
    nodePositions: newPositions,
    connectionPaths: calculateConnectionPaths(doc, newPositions),
    bounds: calculateBounds(doc, newPositions),
    metadata: previousLayout.metadata,
  }
}

function identifyAffectedNodes(
  doc: MindMapNode,
  changes: ChangeSet
): Set<string> {
  const affected = new Set<string>()
  
  // 添加的节点及其祖先
  changes.added.forEach((nodeId) => {
    const node = doc.getNodeById(nodeId)
    if (node) {
      affected.add(nodeId)
      node.ancestors.forEach((ancestor) => affected.add(ancestor.id))
    }
  })
  
  // 删除的节点的父节点
  changes.removed.forEach((nodeId) => {
    // 需要从旧文档获取父节点
    // ...
  })
  
  // 移动的节点及其新旧父节点
  changes.moved.forEach((nodeId, { from, to }) => {
    affected.add(nodeId)
    affected.add(from)
    affected.add(to)
  })
  
  // 属性变更的节点
  changes.modified.forEach((nodeId) => {
    affected.add(nodeId)
  })
  
  return affected
}
```

---

## 十四、布局缓存

### 14.1 缓存策略

```typescript
// @y-mindmap/layout/cache/layout-cache.ts

class LayoutCache {
  private cache: Map<string, LayoutResult> = new Map()
  private maxSize: number = 100
  
  // 生成缓存键
  private generateKey(doc: MindMapNode): string {
    // 使用文档的哈希值作为缓存键
    return hashDocument(doc)
  }
  
  // 获取缓存
  get(doc: MindMapNode): LayoutResult | null {
    const key = this.generateKey(doc)
    return this.cache.get(key) || null
  }
  
  // 设置缓存
  set(doc: MindMapNode, result: LayoutResult): void {
    const key = this.generateKey(doc)
    
    // 检查缓存大小
    if (this.cache.size >= this.maxSize) {
      // 删除最旧的缓存
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    
    this.cache.set(key, result)
  }
  
  // 失效缓存
  invalidate(doc: MindMapNode): void {
    const key = this.generateKey(doc)
    this.cache.delete(key)
  }
  
  // 清空缓存
  clear(): void {
    this.cache.clear()
  }
}
```

### 14.2 预计算

```typescript
// @y-mindmap/layout/cache/precalculator.ts

class Precalculator {
  private layoutEngine: LayoutEngine
  private cache: LayoutCache
  
  constructor(layoutEngine: LayoutEngine, cache: LayoutCache) {
    this.layoutEngine = layoutEngine
    this.cache = cache
  }
  
  // 预计算可能的布局
  precalculate(doc: MindMapNode): void {
    // 1. 预计算当前文档
    const currentResult = this.layoutEngine.calculate(doc)
    this.cache.set(doc, currentResult)
    
    // 2. 预计算可能的变更
    this.precalculatePossibleChanges(doc)
  }
  
  private precalculatePossibleChanges(doc: MindMapNode): void {
    // 预测用户可能的操作
    // 例如: 添加子节点、折叠/展开等
    
    doc.descendants((node) => {
      // 预计算添加子节点的情况
      const withNewChild = doc.addChild(node.id, createEmptyTopic())
      const result = this.layoutEngine.calculate(withNewChild)
      this.cache.set(withNewChild, result)
      
      // 预计算折叠/展开的情况
      if (node.children.length > 0) {
        const folded = doc.toggleFold(node.id)
        const foldedResult = this.layoutEngine.calculate(folded)
        this.cache.set(folded, foldedResult)
      }
    })
  }
}
```

---

## 十五、Snowbrush 布局参考

### 15.1 布局结构清单

| 结构 | 标识符 | 类别 | 方向 |
|------|--------|------|------|
| Map | `org.xmind.ui.map` | 径向 | 左右 |
| Map Clockwise | `org.xmind.ui.map.clockwise` | 径向 | 顺时针 |
| Map Anticlockwise | `org.xmind.ui.map.anticlockwise` | 径向 | 逆时针 |
| Map Unbalanced | `org.xmind.ui.map.unbalanced` | 径向 | 固定左右 |
| Logic Right | `org.xmind.ui.logic.right` | 逻辑 | 右 |
| Logic Left | `org.xmind.ui.logic.left` | 逻辑 | 左 |
| Tree Right | `org.xmind.ui.tree.right` | 树形 | 右 |
| Tree Left | `org.xmind.ui.tree.left` | 树形 | 左 |
| OrgChart Down | `org.xmind.ui.org-chart.down` | 组织图 | 下 |
| OrgChart Up | `org.xmind.ui.org-chart.up` | 组织图 | 上 |
| Fishbone Left | `org.xmind.ui.fishbone.leftHeaded` | 鱼骨 | 左头 |
| Fishbone Right | `org.xmind.ui.fishbone.rightHeaded` | 鱼骨 | 右头 |
| Timeline Horizontal | `org.xmind.ui.timeline.horizontal` | 时间线 | 水平 |
| Timeline Vertical | `org.xmind.ui.timeline.vertical` | 时间线 | 垂直 |
| Spreadsheet | `org.xmind.ui.spreadsheet` | 表格 | 行 |
| Column Spreadsheet | `org.xmind.ui.spreadsheet.column` | 表格 | 列 |
| Brace Left | `org.xmind.ui.brace.left` | 括号 | 左 |
| Brace Right | `org.xmind.ui.brace.right` | 括号 | 右 |
| Tree Table | `org.xmind.ui.treetable` | 树表 | - |
| Top Title Tree Table | `org.xmind.ui.treetable.toptitle` | 树表 | 顶标题 |

### 15.2 布局方向常量

```typescript
enum DIRECTION {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  NONE = 'none',
}
```

### 15.3 布局间距常量

```typescript
const layoutConstant = {
  PADDING: 20,
  BOUNDARYGAP: 10,
  SUMMARYLINEMARGIN: {
    TOSUMMARY: 10,
    TORANGE: 10,
    TOBOUNDARY: 5,
  },
  LINECOLPOS: 13,
  STACKGAP: 5,
  COL_GAP: 13,
  EXT_GAP: 14,
  COL_RADIUS: 6,
  EXT_RADIUS: 8,
}
```

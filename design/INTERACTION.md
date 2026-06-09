# INTERACTION.md - 交互层设计

> 用户交互系统详细设计

---

## 一、交互架构

### 1.1 交互层职责

```
用户输入 (键盘/鼠标/触摸)
    │
    ▼
交互层 (Interaction Layer)
    │
    ├── 1. 事件识别 (识别用户意图)
    ├── 2. 状态管理 (维护交互状态)
    ├── 3. 命令触发 (调用 Command)
    └── 4. 反馈处理 (更新视图)
    │
    ▼
Command 层 → State 层 → View 层
```

### 1.2 事件流

```
DOM 事件
    │
    ▼
事件标准化 (统一鼠标/触摸/键盘事件格式)
    │
    ▼
事件分发 (根据事件类型分发到处理器)
    │
    ▼
交互处理器 (Interaction Handler)
    │
    ├── 状态检查 (当前状态是否允许此操作)
    ├── 意图识别 (用户想要做什么)
    └── 命令触发 (调用对应的 Command)
    │
    ▼
Command 执行 → State 更新 → View 更新
```

### 1.3 交互状态机

```typescript
// @y-mindmap/interaction/state-machine.ts

enum InteractionState {
  // 空闲状态
  IDLE = 'idle',
  
  // 已选择节点
  SELECTED = 'selected',
  
  // 编辑中
  EDITING = 'editing',
  
  // 拖拽中
  DRAGGING = 'dragging',
  
  // 平移中
  PANNING = 'panning',
  
  // 缩放中
  ZOOMING = 'zooming',
  
  // 框选中
  BOX_SELECTING = 'box_selecting',
  
  // 等待放置
  DROP_TARGET = 'drop_target',
}

interface InteractionContext {
  // 当前状态
  state: InteractionState
  
  // 选中的节点
  selectedNodes: Set<string>
  
  // 编辑中的节点
  editingNodeId: string | null
  
  // 拖拽状态
  dragState: DragState | null
  
  // 视口状态
  viewportState: ViewportState
  
  // 鼠标位置
  mousePosition: Point | null
  
  // 按下的按键
  pressedKeys: Set<string>
}

interface DragState {
  // 源节点
  sourceNodeId: string
  
  // 起始位置
  startPosition: Point
  
  // 当前位置
  currentPosition: Point
  
  // 目标节点
  targetNodeId: string | null
  
  // 放置位置
  dropPosition: DropPosition | null
  
  // 拖拽预览
  preview: DragPreview | null
}

interface ViewportState {
  // 缩放比例
  zoom: number
  
  // 平移位置
  pan: Point
  
  // 视口尺寸
  size: Size
}
```

---

## 二、选择交互

### 2.1 单选

```typescript
// @y-mindmap/interaction/handlers/select.ts

class SelectHandler {
  handle(event: PointerEvent, context: InteractionContext): Command | null {
    const target = this.findTarget(event)
    
    if (!target) {
      // 点击空白处，取消选择
      return commands.clearSelection()
    }
    
    if (target.type === 'topic') {
      // 选择节点
      return commands.selectNode(target.id)
    }
    
    return null
  }
  
  private findTarget(event: PointerEvent): Target | null {
    // 通过坐标查找目标元素
    const pos = { x: event.clientX, y: event.clientY }
    return this.hitTest(pos)
  }
}
```

### 2.2 多选

```typescript
// @y-mindmap/interaction/handlers/multi-select.ts

class MultiSelectHandler {
  handle(event: PointerEvent, context: InteractionContext): Command | null {
    // Ctrl/Command + 点击
    if (!event.ctrlKey && !event.metaKey) {
      return null
    }
    
    const target = this.findTarget(event)
    
    if (!target) {
      return null
    }
    
    if (context.selectedNodes.has(target.id)) {
      // 已选中，取消选择
      return commands.deselectNode(target.id)
    } else {
      // 未选中，添加到选择
      return commands.addToSelection(target.id)
    }
  }
}
```

### 2.3 范围选择

```typescript
// @y-mindmap/interaction/handlers/range-select.ts

class RangeSelectHandler {
  handle(event: PointerEvent, context: InteractionContext): Command | null {
    // Shift + 点击
    if (!event.shiftKey) {
      return null
    }
    
    const target = this.findTarget(event)
    
    if (!target || target.type !== 'topic') {
      return null
    }
    
    // 获取锚点 (最后选中的节点)
    const anchorId = this.getAnchor(context)
    
    if (!anchorId) {
      return commands.selectNode(target.id)
    }
    
    // 计算范围
    const range = this.calcRange(anchorId, target.id)
    
    return commands.selectRange(range)
  }
  
  private calcRange(from: string, to: string): string[] {
    // 获取两个节点之间的所有节点
    const fromNode = this.getNode(from)
    const toNode = this.getNode(to)
    
    // 检查是否有共同父节点
    if (fromNode.parentId !== toNode.parentId) {
      return [to]
    }
    
    // 获取兄弟节点范围
    const parent = this.getNode(fromNode.parentId)
    const children = parent.getChildrenByType('attached')
    
    const fromIndex = children.findIndex(c => c.id === from)
    const toIndex = children.findIndex(c => c.id === to)
    
    const start = Math.min(fromIndex, toIndex)
    const end = Math.max(fromIndex, toIndex)
    
    return children.slice(start, end + 1).map(c => c.id)
  }
}
```

### 2.4 框选

```typescript
// @y-mindmap/interaction/handlers/box-select.ts

class BoxSelectHandler {
  private startPoint: Point | null = null
  private currentPoint: Point | null = null
  
  handle(event: PointerEvent, context: InteractionContext): Command | null {
    switch (event.type) {
      case 'pointerdown':
        return this.handleStart(event, context)
      case 'pointermove':
        return this.handleMove(event, context)
      case 'pointerup':
        return this.handleEnd(event, context)
      default:
        return null
    }
  }
  
  private handleStart(event: PointerEvent, context: InteractionContext): Command | null {
    // 只在空白处按下时触发
    const target = this.findTarget(event)
    if (target) {
      return null
    }
    
    this.startPoint = { x: event.clientX, y: event.clientY }
    
    return commands.startBoxSelect(this.startPoint)
  }
  
  private handleMove(event: PointerEvent, context: InteractionContext): Command | null {
    if (!this.startPoint) {
      return null
    }
    
    this.currentPoint = { x: event.clientX, y: event.clientY }
    
    // 计算选择框
    const rect = this.calcRect(this.startPoint, this.currentPoint)
    
    // 查找框内的节点
    const nodesInBox = this.findNodesInRect(rect)
    
    return commands.updateBoxSelect(rect, nodesInBox)
  }
  
  private handleEnd(event: PointerEvent, context: InteractionContext): Command | null {
    if (!this.startPoint) {
      return null
    }
    
    this.currentPoint = { x: event.clientX, y: event.clientY }
    
    // 计算最终选择框
    const rect = this.calcRect(this.startPoint, this.currentPoint)
    
    // 查找框内的节点
    const nodesInBox = this.findNodesInRect(rect)
    
    // 清理状态
    this.startPoint = null
    this.currentPoint = null
    
    return commands.endBoxSelect(nodesInBox)
  }
  
  private calcRect(start: Point, end: Point): Rect {
    return {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    }
  }
  
  private findNodesInRect(rect: Rect): string[] {
    // 查找与选择框相交的所有节点
    const nodes: string[] = []
    
    this.doc.descendants((node) => {
      const bounds = this.getNodeBounds(node.id)
      if (this.isIntersecting(rect, bounds)) {
        nodes.push(node.id)
      }
    })
    
    return nodes
  }
}
```

### 2.5 键盘选择

```typescript
// @y-mindmap/interaction/handlers/keyboard-select.ts

class KeyboardSelectHandler {
  handle(event: KeyboardEvent, context: InteractionContext): Command | null {
    switch (event.key) {
      case 'ArrowUp':
        return this.handleArrowUp(event, context)
      case 'ArrowDown':
        return this.handleArrowDown(event, context)
      case 'ArrowLeft':
        return this.handleArrowLeft(event, context)
      case 'ArrowRight':
        return this.handleArrowRight(event, context)
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          return commands.selectAll()
        }
        return null
      default:
        return null
    }
  }
  
  private handleArrowUp(event: KeyboardEvent, context: InteractionContext): Command | null {
    const current = this.getCurrentNode(context)
    if (!current) return null
    
    const prev = this.getPreviousSibling(current)
    if (!prev) return null
    
    if (event.shiftKey) {
      return commands.extendSelection(prev.id)
    } else {
      return commands.selectNode(prev.id)
    }
  }
  
  private handleArrowDown(event: KeyboardEvent, context: InteractionContext): Command | null {
    const current = this.getCurrentNode(context)
    if (!current) return null
    
    const next = this.getNextSibling(current)
    if (!next) return null
    
    if (event.shiftKey) {
      return commands.extendSelection(next.id)
    } else {
      return commands.selectNode(next.id)
    }
  }
  
  private handleArrowLeft(event: KeyboardEvent, context: InteractionContext): Command | null {
    const current = this.getCurrentNode(context)
    if (!current) return null
    
    const parent = this.getParent(current)
    if (!parent) return null
    
    if (event.shiftKey) {
      return commands.extendSelection(parent.id)
    } else {
      return commands.selectNode(parent.id)
    }
  }
  
  private handleArrowRight(event: KeyboardEvent, context: InteractionContext): Command | null {
    const current = this.getCurrentNode(context)
    if (!current) return null
    
    const firstChild = this.getFirstChild(current)
    if (!firstChild) return null
    
    if (event.shiftKey) {
      return commands.extendSelection(firstChild.id)
    } else {
      return commands.selectNode(firstChild.id)
    }
  }
}
```

### 2.6 选择渲染

```typescript
// @y-mindmap/interaction/renderers/selection-renderer.ts

class SelectionRenderer {
  render(
    container: Group,
    selectedNodes: Set<string>,
    focusedNode: string | null
  ): void {
    // 清除旧的选择框
    container.clear()
    
    // 渲染选中节点的选择框
    selectedNodes.forEach((nodeId) => {
      const bounds = this.getNodeBounds(nodeId)
      const isSelected = nodeId === focusedNode
      
      this.renderSelectBox(container, bounds, {
        color: isSelected ? '#FF6B6B' : '#4A90D9',
        lineWidth: isSelected ? 3 : 2,
        dash: isSelected ? [] : [4, 4],
      })
    })
    
    // 渲染焦点指示器
    if (focusedNode) {
      const bounds = this.getNodeBounds(focusedNode)
      this.renderFocusIndicator(container, bounds)
    }
  }
  
  private renderSelectBox(
    container: Group,
    bounds: Bounds,
    style: SelectBoxStyle
  ): void {
    const padding = 4
    
    const box = new Rect({
      x: bounds.x - padding,
      y: bounds.y - padding,
      width: bounds.width + padding * 2,
      height: bounds.height + padding * 2,
      fill: 'none',
      stroke: {
        color: style.color,
        width: style.lineWidth,
        dash: style.dash,
      },
      cornerRadius: 4,
    })
    
    container.add(box)
  }
  
  private renderFocusIndicator(container: Group, bounds: Bounds): void {
    const indicator = new Rect({
      x: bounds.x - 2,
      y: bounds.y - 2,
      width: bounds.width + 4,
      height: bounds.height + 4,
      fill: 'none',
      stroke: {
        color: '#FF6B6B',
        width: 2,
      },
      cornerRadius: 4,
    })
    
    container.add(indicator)
  }
}
```

---

## 三、编辑交互

### 3.1 进入编辑

```typescript
// @y-mindmap/interaction/handlers/start-editing.ts

class StartEditingHandler {
  handle(event: Event, context: InteractionContext): Command | null {
    // 双击进入编辑
    if (event.type === 'dblclick') {
      return this.handleDblClick(event, context)
    }
    
    // Enter 键进入编辑
    if (event.type === 'keydown' && event.key === 'Enter') {
      return this.handleEnter(event, context)
    }
    
    // F2 键进入编辑
    if (event.type === 'keydown' && event.key === 'F2') {
      return this.handleF2(event, context)
    }
    
    return null
  }
  
  private handleDblClick(event: MouseEvent, context: InteractionContext): Command | null {
    const target = this.findTarget(event)
    
    if (!target || target.type !== 'topic') {
      return null
    }
    
    return commands.startEditing(target.id)
  }
  
  private handleEnter(event: KeyboardEvent, context: InteractionContext): Command | null {
    if (context.selectedNodes.size !== 1) {
      return null
    }
    
    const nodeId = [...context.selectedNodes][0]
    return commands.startEditing(nodeId)
  }
  
  private handleF2(event: KeyboardEvent, context: InteractionContext): Command | null {
    if (context.selectedNodes.size !== 1) {
      return null
    }
    
    const nodeId = [...context.selectedNodes][0]
    return commands.startEditing(nodeId)
  }
}
```

### 3.2 文本编辑

```typescript
// @y-mindmap/interaction/handlers/text-editing.ts

class TextEditingHandler {
  private editorElement: HTMLTextAreaElement | null = null
  
  startEditing(nodeId: string, bounds: Bounds): void {
    // 创建编辑框
    this.editorElement = document.createElement('textarea')
    this.editorElement.value = this.getNodeTitle(nodeId)
    this.editorElement.style.position = 'absolute'
    this.editorElement.style.left = `${bounds.x}px`
    this.editorElement.style.top = `${bounds.y}px`
    this.editorElement.style.width = `${bounds.width}px`
    this.editorElement.style.height = `${bounds.height}px`
    
    document.body.appendChild(this.editorElement)
    this.editorElement.focus()
    this.editorElement.select()
    
    // 绑定事件
    this.editorElement.addEventListener('keydown', (e) => {
      this.handleKeyDown(e, nodeId)
    })
    
    this.editorElement.addEventListener('blur', () => {
      this.finishEditing(nodeId)
    })
  }
  
  private handleKeyDown(event: KeyboardEvent, nodeId: string): void {
    switch (event.key) {
      case 'Enter':
        if (!event.shiftKey) {
          event.preventDefault()
          this.finishEditing(nodeId)
        }
        break
      
      case 'Escape':
        event.preventDefault()
        this.cancelEditing(nodeId)
        break
      
      case 'Tab':
        event.preventDefault()
        // Tab 键添加子节点
        this.finishEditing(nodeId)
        this.addSubTopic(nodeId)
        break
    }
  }
  
  private finishEditing(nodeId: string): void {
    if (!this.editorElement) return
    
    const newTitle = this.editorElement.value
    
    // 清理
    document.body.removeChild(this.editorElement)
    this.editorElement = null
    
    // 触发命令
    this.dispatch(commands.finishEditing(nodeId, newTitle))
  }
  
  private cancelEditing(nodeId: string): void {
    if (!this.editorElement) return
    
    // 清理
    document.body.removeChild(this.editorElement)
    this.editorElement = null
    
    // 触发命令
    this.dispatch(commands.cancelEditing(nodeId))
  }
}
```

### 3.3 编辑验证

```typescript
// @y-mindmap/interaction/validation/edit-validator.ts

class EditValidator {
  validate(nodeId: string, newTitle: string): ValidationResult {
    const errors: ValidationError[] = []
    
    // 必填验证
    if (!newTitle || newTitle.trim().length === 0) {
      errors.push({
        type: 'required',
        message: '标题不能为空',
      })
    }
    
    // 长度验证
    if (newTitle.length > 1000) {
      errors.push({
        type: 'maxLength',
        message: '标题不能超过 1000 个字符',
      })
    }
    
    // 格式验证 (可选)
    // ...
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

interface ValidationError {
  type: string
  message: string
}
```

---

## 四、拖拽交互

### 4.1 拖拽识别

```typescript
// @y-mindmap/interaction/handlers/drag-recognizer.ts

class DragRecognizer {
  private threshold: number = 5  // 拖拽阈值 (像素)
  private startPoint: Point | null = null
  private isDragging: boolean = false
  
  handle(event: PointerEvent, context: InteractionContext): DragResult | null {
    switch (event.type) {
      case 'pointerdown':
        return this.handleStart(event, context)
      case 'pointermove':
        return this.handleMove(event, context)
      case 'pointerup':
        return this.handleEnd(event, context)
      default:
        return null
    }
  }
  
  private handleStart(event: PointerEvent, context: InteractionContext): DragResult | null {
    const target = this.findTarget(event)
    
    if (!target || target.type !== 'topic') {
      return null
    }
    
    this.startPoint = { x: event.clientX, y: event.clientY }
    this.isDragging = false
    
    return {
      type: 'potential',
      sourceNodeId: target.id,
      startPosition: this.startPoint,
    }
  }
  
  private handleMove(event: PointerEvent, context: InteractionContext): DragResult | null {
    if (!this.startPoint) {
      return null
    }
    
    const currentPoint = { x: event.clientX, y: event.clientY }
    const distance = this.calcDistance(this.startPoint, currentPoint)
    
    if (!this.isDragging && distance >= this.threshold) {
      // 超过阈值，开始拖拽
      this.isDragging = true
      
      return {
        type: 'start',
        startPosition: this.startPoint,
        currentPosition: currentPoint,
      }
    }
    
    if (this.isDragging) {
      return {
        type: 'move',
        currentPosition: currentPoint,
      }
    }
    
    return null
  }
  
  private handleEnd(event: PointerEvent, context: InteractionContext): DragResult | null {
    if (!this.isDragging) {
      this.startPoint = null
      return null
    }
    
    const currentPoint = { x: event.clientX, y: event.clientY }
    
    this.startPoint = null
    this.isDragging = false
    
    return {
      type: 'end',
      currentPosition: currentPoint,
    }
  }
  
  private calcDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }
}

interface DragResult {
  type: 'potential' | 'start' | 'move' | 'end'
  sourceNodeId?: string
  startPosition?: Point
  currentPosition?: Point
}
```

### 4.2 拖拽预览

```typescript
// @y-mindmap/interaction/drag/drag-preview.ts

class DragPreviewManager {
  private preview: Group | null = null
  
  create(topic: TopicData, position: Point): void {
    // 创建半透明阴影
    this.preview = new Group({
      x: position.x,
      y: position.y,
      opacity: 0.5,
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
    })
    this.preview.add(shapeEl)
    
    // 渲染标题
    const title = new Text({
      text: topic.title,
      x: 20,
      y: 15,
      fontSize: 14,
      fill: '#333',
    })
    this.preview.add(title)
    
    // 添加到覆盖层
    this.overlayLayer.add(this.preview)
  }
  
  update(position: Point): void {
    if (this.preview) {
      this.preview.x = position.x
      this.preview.y = position.y
    }
  }
  
  destroy(): void {
    if (this.preview) {
      this.preview.remove()
      this.preview = null
    }
  }
}
```

### 4.3 放置目标检测

```typescript
// @y-mindmap/interaction/drag/drop-target-detector.ts

class DropTargetDetector {
  /**
   * 检测放置目标
   * 
   * @param position 鼠标位置
   * @param sourceNodeId 被拖拽的节点 ID
   * @returns 放置目标信息
   */
  detect(position: Point, sourceNodeId: string): DropTarget | null {
    // 1. 查找鼠标下方的节点
    const targetNode = this.hitTest(position)
    
    if (!targetNode) {
      return null
    }
    
    // 2. 检查是否可以放置
    if (!this.canDrop(sourceNodeId, targetNode.id)) {
      return null
    }
    
    // 3. 计算放置位置
    const dropPosition = this.calcDropPosition(position, targetNode)
    
    return {
      nodeId: targetNode.id,
      position: dropPosition,
    }
  }
  
  private canDrop(sourceId: string, targetId: string): boolean {
    // 不能放置在自己身上
    if (sourceId === targetId) {
      return false
    }
    
    // 不能放置在自己的子节点上
    const sourceNode = this.getNode(sourceId)
    if (this.isDescendant(targetId, sourceNode)) {
      return false
    }
    
    // 不能放置在只读节点上
    const targetNode = this.getNode(targetId)
    if (targetNode.isReadOnly) {
      return false
    }
    
    return true
  }
  
  private calcDropPosition(mousePos: Point, targetNode: NodeInfo): DropPosition {
    const bounds = targetNode.bounds
    
    // 计算鼠标相对于节点的位置
    const relativeY = mousePos.y - bounds.y
    const ratio = relativeY / bounds.height
    
    if (ratio < 0.33) {
      // 上方
      return { type: 'before', index: targetNode.index }
    } else if (ratio > 0.67) {
      // 下方
      return { type: 'after', index: targetNode.index + 1 }
    } else {
      // 内部
      return { type: 'inside', index: 0 }
    }
  }
}

interface DropTarget {
  nodeId: string
  position: DropPosition
}

interface DropPosition {
  type: 'before' | 'after' | 'inside'
  index: number
}
```

### 4.4 放置执行

```typescript
// @y-mindmap/interaction/drag/drop-executor.ts

class DropExecutor {
  execute(
    sourceNodeId: string,
    target: DropTarget,
    context: InteractionContext
  ): Command | null {
    const { nodeId: targetNodeId, position } = target
    
    switch (position.type) {
      case 'before':
        return commands.moveNodeBefore(sourceNodeId, targetNodeId)
      
      case 'after':
        return commands.moveNodeAfter(sourceNodeId, targetNodeId)
      
      case 'inside':
        return commands.moveNodeInside(sourceNodeId, targetNodeId, position.index)
      
      default:
        return null
    }
  }
}
```

### 4.5 拖拽取消

```typescript
// @y-mindmap/interaction/drag/drag-canceller.ts

class DragCanceller {
  cancel(context: InteractionContext): Command | null {
    // ESC 键取消拖拽
    // 无效区域释放取消拖拽
    
    return commands.cancelDrag()
  }
}
```

---

## 五、导航交互

### 5.1 键盘导航

```typescript
// @y-mindmap/interaction/handlers/keyboard-navigation.ts

class KeyboardNavigationHandler {
  handle(event: KeyboardEvent, context: InteractionContext): Command | null {
    // Tab: 添加子节点
    if (event.key === 'Tab') {
      return this.handleTab(event, context)
    }
    
    // Enter: 添加兄弟节点
    if (event.key === 'Enter') {
      return this.handleEnter(event, context)
    }
    
    // Delete: 删除节点
    if (event.key === 'Delete' || event.key === 'Backspace') {
      return this.handleDelete(event, context)
    }
    
    // Space: 折叠/展开
    if (event.key === ' ') {
      return this.handleSpace(event, context)
    }
    
    return null
  }
  
  private handleTab(event: KeyboardEvent, context: InteractionContext): Command | null {
    event.preventDefault()
    
    if (context.selectedNodes.size !== 1) {
      return null
    }
    
    const nodeId = [...context.selectedNodes][0]
    return commands.addSubTopic(nodeId)
  }
  
  private handleEnter(event: KeyboardEvent, context: InteractionContext): Command | null {
    event.preventDefault()
    
    if (context.selectedNodes.size !== 1) {
      return null
    }
    
    const nodeId = [...context.selectedNodes][0]
    
    if (event.shiftKey) {
      return commands.addTopicBefore(nodeId)
    } else {
      return commands.addTopicAfter(nodeId)
    }
  }
  
  private handleDelete(event: KeyboardEvent, context: InteractionContext): Command | null {
    event.preventDefault()
    
    if (context.selectedNodes.size === 0) {
      return null
    }
    
    return commands.deleteNodes([...context.selectedNodes])
  }
  
  private handleSpace(event: KeyboardEvent, context: InteractionContext): Command | null {
    event.preventDefault()
    
    if (context.selectedNodes.size !== 1) {
      return null
    }
    
    const nodeId = [...context.selectedNodes][0]
    return commands.toggleFold(nodeId)
  }
}
```

### 5.2 焦点管理

```typescript
// @y-mindmap/interaction/focus/focus-manager.ts

class FocusManager {
  private focusedNodeId: string | null = null
  
  focus(nodeId: string): void {
    this.focusedNodeId = nodeId
    
    // 确保节点在视口内
    this.ensureVisible(nodeId)
    
    // 触发焦点变更事件
    this.emit('focusChanged', nodeId)
  }
  
  unfocus(): void {
    this.focusedNodeId = null
    this.emit('focusChanged', null)
  }
  
  getFocused(): string | null {
    return this.focusedNodeId
  }
  
  private ensureVisible(nodeId: string): void {
    const bounds = this.getNodeBounds(nodeId)
    const viewport = this.getViewport()
    
    // 检查节点是否在视口内
    if (!this.isInViewport(bounds, viewport)) {
      // 滚动到节点
      this.scrollToNode(nodeId)
    }
  }
  
  private isInViewport(bounds: Bounds, viewport: Viewport): boolean {
    return (
      bounds.x >= viewport.x &&
      bounds.y >= viewport.y &&
      bounds.x + bounds.width <= viewport.x + viewport.width &&
      bounds.y + bounds.height <= viewport.y + viewport.height
    )
  }
  
  private scrollToNode(nodeId: string): void {
    const bounds = this.getNodeBounds(nodeId)
    
    // 计算目标位置 (节点居中)
    const targetX = bounds.x + bounds.width / 2
    const targetY = bounds.y + bounds.height / 2
    
    // 平滑滚动
    this.smoothScrollTo(targetX, targetY)
  }
}
```

---

## 六、视口交互

### 6.1 缩放交互

```typescript
// @y-mindmap/interaction/handlers/zoom-handler.ts

class ZoomHandler {
  private minZoom: number = 0.1
  private maxZoom: number = 10
  
  handle(event: WheelEvent, context: InteractionContext): Command | null {
    // Ctrl + 滚轮缩放
    if (!event.ctrlKey && !event.metaKey) {
      return null
    }
    
    event.preventDefault()
    
    const delta = event.deltaY > 0 ? 0.9 : 1.1
    const newZoom = context.viewportState.zoom * delta
    
    // 限制缩放范围
    const clampedZoom = Math.max(this.minZoom, Math.min(this.maxZoom, newZoom))
    
    // 计算缩放中心
    const center = { x: event.clientX, y: event.clientY }
    
    return commands.zoom(clampedZoom, center)
  }
}
```

### 6.2 平移交互

```typescript
// @y-mindmap/interaction/handlers/pan-handler.ts

class PanHandler {
  private isPanning: boolean = false
  private lastPosition: Point | null = null
  
  handle(event: PointerEvent, context: InteractionContext): Command | null {
    switch (event.type) {
      case 'pointerdown':
        return this.handleStart(event, context)
      case 'pointermove':
        return this.handleMove(event, context)
      case 'pointerup':
        return this.handleEnd(event, context)
      default:
        return null
    }
  }
  
  private handleStart(event: PointerEvent, context: InteractionContext): Command | null {
    // 中键或 Alt + 左键触发平移
    if (event.button !== 1 && !(event.button === 0 && event.altKey)) {
      return null
    }
    
    this.isPanning = true
    this.lastPosition = { x: event.clientX, y: event.clientY }
    
    return commands.startPan()
  }
  
  private handleMove(event: PointerEvent, context: InteractionContext): Command | null {
    if (!this.isPanning || !this.lastPosition) {
      return null
    }
    
    const currentPosition = { x: event.clientX, y: event.clientY }
    const dx = currentPosition.x - this.lastPosition.x
    const dy = currentPosition.y - this.lastPosition.y
    
    this.lastPosition = currentPosition
    
    return commands.pan(dx, dy)
  }
  
  private handleEnd(event: PointerEvent, context: InteractionContext): Command | null {
    if (!this.isPanning) {
      return null
    }
    
    this.isPanning = false
    this.lastPosition = null
    
    return commands.endPan()
  }
}
```

### 6.3 边缘自动滚动

```typescript
// @y-mindmap/interaction/viewport/edge-scroll.ts

class EdgeScrollController {
  private edgeSize: number = 20  // 边缘检测区域大小
  private scrollSpeed: number = 5  // 滚动速度 (像素/帧)
  private animationFrame: number | null = null
  
  check(mousePos: Point, viewport: Viewport): void {
    const direction = this.getScrollDirection(mousePos, viewport)
    
    if (direction) {
      this.startScroll(direction)
    } else {
      this.stopScroll()
    }
  }
  
  private getScrollDirection(mousePos: Point, viewport: Viewport): Direction | null {
    const { x, y, width, height } = viewport
    
    if (mousePos.x < x + this.edgeSize) {
      return 'left'
    }
    if (mousePos.x > x + width - this.edgeSize) {
      return 'right'
    }
    if (mousePos.y < y + this.edgeSize) {
      return 'up'
    }
    if (mousePos.y > y + height - this.edgeSize) {
      return 'down'
    }
    
    return null
  }
  
  private startScroll(direction: Direction): void {
    if (this.animationFrame) {
      return
    }
    
    const scroll = () => {
      switch (direction) {
        case 'left':
          this.dispatch(commands.pan(this.scrollSpeed, 0))
          break
        case 'right':
          this.dispatch(commands.pan(-this.scrollSpeed, 0))
          break
        case 'up':
          this.dispatch(commands.pan(0, this.scrollSpeed))
          break
        case 'down':
          this.dispatch(commands.pan(0, -this.scrollSpeed))
          break
      }
      
      this.animationFrame = requestAnimationFrame(scroll)
    }
    
    this.animationFrame = requestAnimationFrame(scroll)
  }
  
  private stopScroll(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }
}
```

### 6.4 惯性滚动

```typescript
// @y-mindmap/interaction/viewport/inertial-scroll.ts

class InertialScrollController {
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
    
    this.animate(vx, vy, last.time, callback)
  }
  
  private animate(
    vx: number,
    vy: number,
    lastTime: number,
    callback: (dx: number, dy: number) => void
  ): void {
    this.animationFrame = requestAnimationFrame(() => {
      const now = Date.now()
      const dt = now - lastTime
      
      // 速度衰减
      vx += this.friction * dt
      vy += this.friction * dt
      
      if (vx <= 0 && vy <= 0) {
        return
      }
      
      const dx = vx * dt
      const dy = vy * dt
      
      callback(dx, dy)
      
      this.animate(vx, vy, now, callback)
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

## 七、手势交互

### 7.1 触摸手势

```typescript
// @y-mindmap/interaction/gesture/touch-gesture.ts

class TouchGestureHandler {
  private touches: Map<number, Point> = new Map()
  private initialDistance: number | null = null
  private initialZoom: number | null = null
  
  handle(event: TouchEvent, context: InteractionContext): Command | null {
    switch (event.type) {
      case 'touchstart':
        return this.handleStart(event, context)
      case 'touchmove':
        return this.handleMove(event, context)
      case 'touchend':
        return this.handleEnd(event, context)
      default:
        return null
    }
  }
  
  private handleStart(event: TouchEvent, context: InteractionContext): Command | null {
    // 记录所有触控点
    for (const touch of event.changedTouches) {
      this.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
      })
    }
    
    // 双指手势
    if (this.touches.size === 2) {
      const points = [...this.touches.values()]
      this.initialDistance = this.calcDistance(points[0], points[1])
      this.initialZoom = context.viewportState.zoom
    }
    
    return null
  }
  
  private handleMove(event: TouchEvent, context: InteractionContext): Command | null {
    // 更新触控点位置
    for (const touch of event.changedTouches) {
      this.touches.set(touch.identifier, {
        x: touch.clientX,
        y: touch.clientY,
      })
    }
    
    // 双指缩放
    if (this.touches.size === 2 && this.initialDistance && this.initialZoom) {
      const points = [...this.touches.values()]
      const currentDistance = this.calcDistance(points[0], points[1])
      const scale = currentDistance / this.initialDistance
      const newZoom = this.initialZoom * scale
      
      // 计算缩放中心
      const center = {
        x: (points[0].x + points[1].x) / 2,
        y: (points[0].y + points[1].y) / 2,
      }
      
      return commands.zoom(newZoom, center)
    }
    
    return null
  }
  
  private handleEnd(event: TouchEvent, context: InteractionContext): Command | null {
    // 移除触控点
    for (const touch of event.changedTouches) {
      this.touches.delete(touch.identifier)
    }
    
    // 重置状态
    if (this.touches.size < 2) {
      this.initialDistance = null
      this.initialZoom = null
    }
    
    return null
  }
  
  private calcDistance(p1: Point, p2: Point): number {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }
}
```

---

## 八、右键菜单

### 8.1 菜单结构

```typescript
// @y-mindmap/interaction/context-menu/menu-structure.ts

interface MenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  divider?: boolean
  children?: MenuItem[]
  action: () => void
}

function createTopicMenu(nodeId: string, context: InteractionContext): MenuItem[] {
  return [
    {
      id: 'edit',
      label: '编辑',
      icon: '✏️',
      shortcut: 'Enter',
      action: () => commands.startEditing(nodeId),
    },
    {
      id: 'divider1',
      divider: true,
      action: () => {},
    },
    {
      id: 'addSubTopic',
      label: '添加子节点',
      icon: '➕',
      shortcut: 'Tab',
      action: () => commands.addSubTopic(nodeId),
    },
    {
      id: 'addSibling',
      label: '添加兄弟节点',
      icon: '➕',
      shortcut: 'Enter',
      action: () => commands.addTopicAfter(nodeId),
    },
    {
      id: 'divider2',
      divider: true,
      action: () => {},
    },
    {
      id: 'delete',
      label: '删除',
      icon: '🗑️',
      shortcut: 'Delete',
      action: () => commands.deleteNode(nodeId),
    },
    {
      id: 'divider3',
      divider: true,
      action: () => {},
    },
    {
      id: 'fold',
      label: '折叠/展开',
      icon: '📁',
      shortcut: 'Space',
      action: () => commands.toggleFold(nodeId),
    },
    {
      id: 'divider4',
      divider: true,
      action: () => {},
    },
    {
      id: 'copy',
      label: '复制',
      icon: '📋',
      shortcut: 'Ctrl+C',
      action: () => commands.copy(nodeId),
    },
    {
      id: 'cut',
      label: '剪切',
      icon: '✂️',
      shortcut: 'Ctrl+X',
      action: () => commands.cut(nodeId),
    },
    {
      id: 'paste',
      label: '粘贴',
      icon: '📋',
      shortcut: 'Ctrl+V',
      action: () => commands.paste(nodeId),
    },
  ]
}

function createEmptyMenu(context: InteractionContext): MenuItem[] {
  return [
    {
      id: 'paste',
      label: '粘贴',
      icon: '📋',
      shortcut: 'Ctrl+V',
      action: () => commands.paste(),
    },
    {
      id: 'divider1',
      divider: true,
      action: () => {},
    },
    {
      id: 'selectAll',
      label: '全选',
      icon: '📋',
      shortcut: 'Ctrl+A',
      action: () => commands.selectAll(),
    },
    {
      id: 'divider2',
      divider: true,
      action: () => {},
    },
    {
      id: 'fitToContent',
      label: '适应内容',
      icon: '🔍',
      shortcut: 'Ctrl+0',
      action: () => commands.fitToContent(),
    },
  ]
}
```

### 8.2 菜单渲染

```typescript
// @y-mindmap/interaction/context-menu/menu-renderer.ts

class ContextMenuRenderer {
  private menuElement: HTMLElement | null = null
  
  show(items: MenuItem[], position: Point): void {
    // 创建菜单容器
    this.menuElement = document.createElement('div')
    this.menuElement.className = 'context-menu'
    this.menuElement.style.position = 'fixed'
    this.menuElement.style.left = `${position.x}px`
    this.menuElement.style.top = `${position.y}px`
    
    // 渲染菜单项
    items.forEach((item) => {
      if (item.divider) {
        const divider = document.createElement('div')
        divider.className = 'menu-divider'
        this.menuElement.appendChild(divider)
      } else {
        const menuItem = this.createMenuItem(item)
        this.menuElement.appendChild(menuItem)
      }
    })
    
    document.body.appendChild(this.menuElement)
    
    // 调整位置避免超出屏幕
    this.adjustPosition()
    
    // 点击外部关闭
    document.addEventListener('click', this.handleOutsideClick)
    document.addEventListener('contextmenu', this.handleOutsideClick)
  }
  
  hide(): void {
    if (this.menuElement) {
      document.body.removeChild(this.menuElement)
      this.menuElement = null
    }
    
    document.removeEventListener('click', this.handleOutsideClick)
    document.removeEventListener('contextmenu', this.handleOutsideClick)
  }
  
  private createMenuItem(item: MenuItem): HTMLElement {
    const menuItem = document.createElement('div')
    menuItem.className = 'menu-item'
    
    if (item.disabled) {
      menuItem.classList.add('disabled')
    }
    
    // 图标
    if (item.icon) {
      const icon = document.createElement('span')
      icon.className = 'menu-icon'
      icon.textContent = item.icon
      menuItem.appendChild(icon)
    }
    
    // 标签
    const label = document.createElement('span')
    label.className = 'menu-label'
    label.textContent = item.label
    menuItem.appendChild(label)
    
    // 快捷键
    if (item.shortcut) {
      const shortcut = document.createElement('span')
      shortcut.className = 'menu-shortcut'
      shortcut.textContent = item.shortcut
      menuItem.appendChild(shortcut)
    }
    
    // 点击事件
    menuItem.addEventListener('click', () => {
      if (!item.disabled) {
        item.action()
        this.hide()
      }
    })
    
    return menuItem
  }
  
  private adjustPosition(): void {
    if (!this.menuElement) return
    
    const rect = this.menuElement.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    
    // 右侧超出
    if (rect.right > viewportWidth) {
      this.menuElement.style.left = `${viewportWidth - rect.width - 10}px`
    }
    
    // 底部超出
    if (rect.bottom > viewportHeight) {
      this.menuElement.style.top = `${viewportHeight - rect.height - 10}px`
    }
  }
  
  private handleOutsideClick = (event: Event): void => {
    if (this.menuElement && !this.menuElement.contains(event.target as Node)) {
      this.hide()
    }
  }
}
```

---

## 九、拖放交互

### 9.1 外部拖放

```typescript
// @y-mindmap/interaction/drag-drop/external-drop.ts

class ExternalDropHandler {
  handle(event: DragEvent, context: InteractionContext): Command | null {
    event.preventDefault()
    
    const dataTransfer = event.dataTransfer
    if (!dataTransfer) return null
    
    // 检查拖放数据类型
    if (dataTransfer.types.includes('Files')) {
      return this.handleFileDrop(event, context)
    }
    
    if (dataTransfer.types.includes('text/plain')) {
      return this.handleTextDrop(event, context)
    }
    
    return null
  }
  
  private handleFileDrop(event: DragEvent, context: InteractionContext): Command | null {
    const files = event.dataTransfer?.files
    if (!files || files.length === 0) return null
    
    const file = files[0]
    const position = { x: event.clientX, y: event.clientY }
    
    // 检查文件类型
    if (file.type.startsWith('image/')) {
      return commands.addImage(file, position)
    }
    
    return null
  }
  
  private handleTextDrop(event: DragEvent, context: InteractionContext): Command | null {
    const text = event.dataTransfer?.getData('text/plain')
    if (!text) return null
    
    const position = { x: event.clientX, y: event.clientY }
    
    return commands.addTopicFromText(text, position)
  }
}
```

---

## 十、交互反馈

### 10.1 视觉反馈

```typescript
// @y-mindmap/interaction/feedback/visual-feedback.ts

class VisualFeedbackManager {
  // 悬停效果
  showHoverEffect(nodeId: string): void {
    const node = this.getNodeView(nodeId)
    if (node) {
      node.addClass('hover')
    }
  }
  
  hideHoverEffect(nodeId: string): void {
    const node = this.getNodeView(nodeId)
    if (node) {
      node.removeClass('hover')
    }
  }
  
  // 按下效果
  showPressEffect(nodeId: string): void {
    const node = this.getNodeView(nodeId)
    if (node) {
      node.addClass('pressed')
    }
  }
  
  hidePressEffect(nodeId: string): void {
    const node = this.getNodeView(nodeId)
    if (node) {
      node.removeClass('pressed')
    }
  }
  
  // 拖拽效果
  showDragEffect(nodeId: string): void {
    const node = this.getNodeView(nodeId)
    if (node) {
      node.addClass('dragging')
      node.setOpacity(0.5)
    }
  }
  
  hideDragEffect(nodeId: string): void {
    const node = this.getNodeView(nodeId)
    if (node) {
      node.removeClass('dragging')
      node.setOpacity(1)
    }
  }
  
  // 放置目标效果
  showDropTargetEffect(nodeId: string): void {
    const node = this.getNodeView(nodeId)
    if (node) {
      node.addClass('drop-target')
    }
  }
  
  hideDropTargetEffect(nodeId: string): void {
    const node = this.getNodeView(nodeId)
    if (node) {
      node.removeClass('drop-target')
    }
  }
}
```

### 10.2 光标反馈

```typescript
// @y-mindmap/interaction/feedback/cursor-feedback.ts

class CursorFeedbackManager {
  private cursorMap: Map<string, string> = new Map([
    ['default', 'default'],
    ['topic', 'pointer'],
    ['editing', 'text'],
    ['dragging', 'grabbing'],
    ['panning', 'grab'],
    ['zooming', 'zoom-in'],
    ['drop-target', 'copy'],
  ])
  
  setCursor(type: string): void {
    const cursor = this.cursorMap.get(type) || 'default'
    document.body.style.cursor = cursor
  }
  
  resetCursor(): void {
    document.body.style.cursor = 'default'
  }
}
```

### 10.3 动画反馈

```typescript
// @y-mindmap/interaction/feedback/animation-feedback.ts

class AnimationFeedbackManager {
  // 选择动画
  animateSelection(nodeId: string): void {
    const node = this.getNodeView(nodeId)
    if (node) {
      node.animate({
        scale: { from: 0.95, to: 1 },
        duration: 200,
        easing: 'ease-out',
      })
    }
  }
  
  // 展开/折叠动画
  animateToggleFold(nodeId: string, isExpanding: boolean): void {
    const node = this.getNodeView(nodeId)
    if (node) {
      const children = node.getChildren()
      
      children.forEach((child, index) => {
        child.animate({
          opacity: { from: isExpanding ? 0 : 1, to: isExpanding ? 1 : 0 },
          y: { from: isExpanding ? -20 : 0, to: isExpanding ? 0 : -20 },
          duration: 300,
          delay: index * 50,
          easing: 'ease-out',
        })
      })
    }
  }
  
  // 移动动画
  animateMove(nodeId: string, from: Point, to: Point): void {
    const node = this.getNodeView(nodeId)
    if (node) {
      node.animate({
        x: { from: from.x, to: to.x },
        y: { from: from.y, to: to.y },
        duration: 300,
        easing: 'ease-in-out',
      })
    }
  }
}
```

---

## 十一、无障碍访问

### 11.1 键盘导航

```typescript
// @y-mindmap/interaction/accessibility/keyboard-a11y.ts

class KeyboardAccessibility {
  // Tab 顺序
  private tabOrder: string[] = []
  private currentTabIndex: number = -1
  
  initTabOrder(doc: MindMapNode): void {
    this.tabOrder = []
    
    // 深度优先遍历
    doc.descendants((node) => {
      this.tabOrder.push(node.id)
    })
  }
  
  handleTab(event: KeyboardEvent): void {
    event.preventDefault()
    
    if (event.shiftKey) {
      // Shift+Tab: 上一个
      this.currentTabIndex = Math.max(0, this.currentTabIndex - 1)
    } else {
      // Tab: 下一个
      this.currentTabIndex = Math.min(this.tabOrder.length - 1, this.currentTabIndex + 1)
    }
    
    const nodeId = this.tabOrder[this.currentTabIndex]
    this.focusNode(nodeId)
  }
  
  private focusNode(nodeId: string): void {
    // 更新焦点
    this.focusManager.focus(nodeId)
    
    // 更新 ARIA 属性
    this.updateAriaAttributes(nodeId)
    
    // 滚动到可见区域
    this.ensureVisible(nodeId)
  }
}
```

### 11.2 ARIA 支持

```typescript
// @y-mindmap/interaction/accessibility/aria-support.ts

class AriaSupport {
  updateNodeAttributes(nodeId: string, element: HTMLElement): void {
    const node = this.getNode(nodeId)
    
    // 设置 ARIA 属性
    element.setAttribute('role', 'treeitem')
    element.setAttribute('aria-label', node.title)
    element.setAttribute('aria-level', String(node.depth + 1))
    
    if (node.children.length > 0) {
      element.setAttribute('aria-expanded', String(!node.isFolded))
    }
    
    if (node.isSelected) {
      element.setAttribute('aria-selected', 'true')
    }
  }
  
  updateTreeAttributes(container: HTMLElement): void {
    container.setAttribute('role', 'tree')
    container.setAttribute('aria-label', '思维导图')
  }
}
```

---

## 十二、快捷键系统

### 12.1 快捷键注册

```typescript
// @y-mindmap/interaction/keymap/keymap-manager.ts

class KeymapManager {
  private bindings: Map<string, Command> = new Map()
  
  register(key: string, command: Command): void {
    this.bindings.set(key, command)
  }
  
  unregister(key: string): void {
    this.bindings.delete(key)
  }
  
  handle(event: KeyboardEvent): Command | null {
    const key = this.buildKeyString(event)
    return this.bindings.get(key) || null
  }
  
  private buildKeyString(event: KeyboardEvent): string {
    const parts: string[] = []
    
    if (event.ctrlKey || event.metaKey) parts.push('Ctrl')
    if (event.shiftKey) parts.push('Shift')
    if (event.altKey) parts.push('Alt')
    
    parts.push(event.key)
    
    return parts.join('+')
  }
}

// 注册默认快捷键
function registerDefaultKeymap(keymap: KeymapManager): void {
  // 节点操作
  keymap.register('Tab', commands.addSubTopic)
  keymap.register('Enter', commands.addTopicAfter)
  keymap.register('Shift+Enter', commands.addTopicBefore)
  keymap.register('Delete', commands.deleteNode)
  keymap.register('Backspace', commands.deleteNode)
  
  // 编辑
  keymap.register('F2', commands.startEditing)
  keymap.register('Escape', commands.cancelEditing)
  
  // 选择
  keymap.register('Ctrl+a', commands.selectAll)
  
  // 撤销/重做
  keymap.register('Ctrl+z', commands.undo)
  keymap.register('Ctrl+Shift+z', commands.redo)
  
  // 复制/粘贴
  keymap.register('Ctrl+c', commands.copy)
  keymap.register('Ctrl+x', commands.cut)
  keymap.register('Ctrl+v', commands.paste)
  
  // 视口
  keymap.register('Ctrl+=', commands.zoomIn)
  keymap.register('Ctrl+-', commands.zoomOut)
  keymap.register('Ctrl+0', commands.resetZoom)
  keymap.register('Ctrl+Shift+0', commands.fitToContent)
  
  // 导航
  keymap.register('ArrowUp', commands.selectPrevious)
  keymap.register('ArrowDown', commands.selectNext)
  keymap.register('ArrowLeft', commands.selectParent)
  keymap.register('ArrowRight', commands.selectFirstChild)
  
  // 折叠
  keymap.register('Space', commands.toggleFold)
}
```

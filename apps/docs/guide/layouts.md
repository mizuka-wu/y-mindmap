# 布局系统

## 概述

Y-MindMap 支持 21 种布局算法，覆盖思维导图、逻辑图、组织图、鱼骨图等多种结构。

## 可用布局

| 布局 | ID | 说明 |
|------|-----|------|
| 思维导图 | `org.xmind.ui.map` | 中心向外扩展 |
| 逻辑图（右） | `org.xmind.ui.logic.right` | 向右展开 |
| 逻辑图（左） | `org.xmind.ui.logic.left` | 向左展开 |
| 树形图（右） | `org.xmind.ui.tree.right` | 树状向右 |
| 树形图（左） | `org.xmind.ui.tree.left` | 树状向左 |
| 组织图（下） | `org.xmind.ui.org-chart.down` | 向下展开 |
| 组织图（上） | `org.xmind.ui.org-chart.up` | 向上展开 |
| 鱼骨图（左） | `org.xmind.ui.fishbone.leftHeaded` | 左侧鱼头 |
| 鱼骨图（右） | `org.xmind.ui.fishbone.rightHeaded` | 右侧鱼头 |
| 时间线（水平） | `org.xmind.ui.timeline.horizontal` | 水平时间线 |
| 时间线（垂直） | `org.xmind.ui.timeline.vertical` | 垂直时间线 |
| 表格 | `org.xmind.ui.spreadsheet` | 表格布局 |
| 括号（左） | `org.xmind.ui.brace.left` | 左侧括号 |
| 括号（右） | `org.xmind.ui.brace.right` | 右侧括号 |
| 树表 | `org.xmind.ui.treetable` | 树表混合 |

## 使用方式

### 切换布局

```typescript
import { StructureType } from '@y-mindmap/core'

// 通过命令切换
editor.executeCommand('setStructureClass', {
  structureClass: StructureType.LOGIC_RIGHT,
})

// 通过节点属性
const node = editor.getDocument().root
const updated = node.withStructureClass(StructureType.TREE_RIGHT)
```

### 自定义布局引擎

```typescript
import { LayoutEngine, LayoutResult, MindMapNode } from '@y-mindmap/core'

class CustomLayout implements LayoutEngine {
  calculate(root: MindMapNode): LayoutResult {
    const nodes = new Map()
    const connections = new Map()
    
    // 自定义布局逻辑
    this.layoutNode(root, 0, 0, nodes, connections)
    
    return {
      nodes,
      connections,
      bounds: this.calculateBounds(nodes),
    }
  }
  
  private layoutNode(
    node: MindMapNode,
    x: number,
    y: number,
    nodes: Map<string, NodeLayout>,
    connections: Map<string, ConnectionLayout>
  ): void {
    // 递归布局
  }
}

// 使用自定义布局
const editor = new MindMapEditor({
  container: document.getElementById('app')!,
  layoutEngine: new CustomLayout(),
})
```

## 增量布局

只重新计算变化的节点：

```typescript
import { IncrementalLayout } from '@y-mindmap/layout'

const layout = new IncrementalLayout(baseLayout)
const result = layout.calculate(root)
```

## 布局动画

切换布局时支持动画过渡：

```typescript
import { AnimatedLayoutEngine } from '@y-mindmap/layout'

const animatedLayout = new AnimatedLayoutEngine(baseLayout, {
  duration: 300,
  easing: 'ease-out',
  stagger: 20,
})
```

## 布局缓存

LRU 缓存策略，避免重复计算：

```typescript
import { LayoutCache } from '@y-mindmap/layout'

const cache = new LayoutCache({
  maxSize: 100,
  ttl: 5 * 60 * 1000, // 5 分钟
})
```

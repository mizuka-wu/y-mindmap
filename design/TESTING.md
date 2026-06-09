# TESTING.md - 测试策略

> 思维导图编辑器测试策略设计

---

## 一、测试架构

### 1.1 测试金字塔

```
                    ┌─────────┐
                    │  E2E    │  少量
                    │ Tests   │
                ┌───┴─────────┴───┐
                │  Integration    │  适量
                │  Tests          │
            ┌───┴─────────────────┴───┐
            │      Unit Tests         │  大量
            │                         │
            └─────────────────────────┘
```

### 1.2 测试覆盖率目标

| 测试类型 | 覆盖率目标 | 说明 |
|----------|-----------|------|
| 单元测试 | 80%+ | 核心逻辑必须覆盖 |
| 集成测试 | 60%+ | 关键流程必须覆盖 |
| E2E 测试 | 核心场景 | 用户关键路径 |

---

## 二、单元测试

### 2.1 测试框架

```typescript
// 使用 Vitest
import { describe, it, expect, beforeEach } from 'vitest'
```

### 2.2 Model 层测试

```typescript
// @y-mindmap/model/__tests__/topic.test.ts

describe('MindMapNode', () => {
  let node: MindMapNode
  
  beforeEach(() => {
    node = new MindMapNode({
      id: 'test-1',
      title: 'Test Node',
      type: TopicType.ROOT,
    })
  })
  
  describe('constructor', () => {
    it('should create a node with default values', () => {
      expect(node.id).toBe('test-1')
      expect(node.title).toBe('Test Node')
      expect(node.type).toBe(TopicType.ROOT)
    })
  })
  
  describe('addChild', () => {
    it('should add a child node', () => {
      const child = new MindMapNode({
        id: 'child-1',
        title: 'Child Node',
        type: TopicType.ATTACHED,
      })
      
      const updated = node.addChild(child)
      
      expect(updated.children.attached).toHaveLength(1)
      expect(updated.children.attached[0].id).toBe('child-1')
    })
    
    it('should not modify original node', () => {
      const child = new MindMapNode({
        id: 'child-1',
        title: 'Child Node',
        type: TopicType.ATTACHED,
      })
      
      node.addChild(child)
      
      expect(node.children.attached).toHaveLength(0)
    })
  })
  
  describe('removeChild', () => {
    it('should remove a child node', () => {
      const child = new MindMapNode({
        id: 'child-1',
        title: 'Child Node',
        type: TopicType.ATTACHED,
      })
      
      const withChild = node.addChild(child)
      const withoutChild = withChild.removeChild('child-1')
      
      expect(withoutChild.children.attached).toHaveLength(0)
    })
  })
  
  describe('updateTitle', () => {
    it('should update the title', () => {
      const updated = node.updateTitle('New Title')
      
      expect(updated.title).toBe('New Title')
      expect(node.title).toBe('Test Node')
    })
  })
})
```

### 2.3 Transform 层测试

```typescript
// @y-mindmap/transform/__tests__/transform.test.ts

describe('Transform', () => {
  let doc: MindMapNode
  let transform: Transform
  
  beforeEach(() => {
    doc = new MindMapNode({
      id: 'root',
      title: 'Root',
      type: TopicType.ROOT,
      children: {
        attached: [
          new MindMapNode({
            id: 'child-1',
            title: 'Child 1',
            type: TopicType.ATTACHED,
          }),
        ],
      },
    })
    
    transform = new Transform(doc)
  })
  
  describe('addNode', () => {
    it('should add a node to the document', () => {
      const newTopic = new MindMapNode({
        id: 'new-1',
        title: 'New Topic',
        type: TopicType.ATTACHED,
      })
      
      const result = transform.addNode('root', newTopic)
      
      expect(result.doc.getChild('root')?.children.attached).toHaveLength(2)
    })
  })
  
  describe('removeNode', () => {
    it('should remove a node from the document', () => {
      const result = transform.removeNode('child-1')
      
      expect(result.doc.getChild('root')?.children.attached).toHaveLength(0)
    })
  })
  
  describe('moveNode', () => {
    it('should move a node to a new parent', () => {
      const parent2 = new MindMapNode({
        id: 'parent-2',
        title: 'Parent 2',
        type: TopicType.ATTACHED,
      })
      
      const withParent = transform.addNode('root', parent2)
      const moved = withParent.moveNode('child-1', 'parent-2')
      
      expect(moved.doc.getChild('root')?.children.attached).toHaveLength(1)
      expect(moved.doc.getChild('parent-2')?.children.attached).toHaveLength(1)
    })
  })
})
```

### 2.4 算法测试

```typescript
// @y-mindmap/layout/__tests__/map-layout.test.ts

describe('MapLayout', () => {
  let layout: MapLayout
  
  beforeEach(() => {
    layout = new MapLayout()
  })
  
  describe('calculate', () => {
    it('should balance children left and right', () => {
      const doc = createTestDocument(6)
      const result = layout.calculate(doc)
      
      // 检查左右平衡
      const leftCount = countChildren(result, 'left')
      const rightCount = countChildren(result, 'right')
      
      expect(Math.abs(leftCount - rightCount)).toBeLessThanOrEqual(1)
    })
    
    it('should not overlap nodes', () => {
      const doc = createTestDocument(10)
      const result = layout.calculate(doc)
      
      const positions = Array.from(result.nodePositions.values())
      
      // 检查没有重叠
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          expect(isOverlapping(positions[i], positions[j])).toBe(false)
        }
      }
    })
  })
})
```

---

## 三、集成测试

### 3.1 State + View 测试

```typescript
// @y-mindmap/__tests__/editor-integration.test.ts

describe('Editor Integration', () => {
  let editor: EditorView
  
  beforeEach(() => {
    const container = document.createElement('div')
    editor = new EditorView({ container })
  })
  
  describe('selection', () => {
    it('should select a node on click', async () => {
      const doc = createTestDocument()
      editor.loadDocument(doc)
      
      const node = doc.getChild('child-1')!
      const bounds = editor.getNodeBounds(node.id)
      
      await editor.click(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
      
      expect(editor.getSelection()).toContain(node.id)
    })
  })
  
  describe('editing', () => {
    it('should enter edit mode on double click', async () => {
      const doc = createTestDocument()
      editor.loadDocument(doc)
      
      const node = doc.getChild('child-1')!
      const bounds = editor.getNodeBounds(node.id)
      
      await editor.dblClick(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2)
      
      expect(editor.isEditing()).toBe(true)
      expect(editor.getEditingNodeId()).toBe(node.id)
    })
    
    it('should update title on edit', async () => {
      const doc = createTestDocument()
      editor.loadDocument(doc)
      
      // 进入编辑模式
      await editor.startEditing('child-1')
      
      // 输入新标题
      await editor.typeText('New Title')
      
      // 确认编辑
      await editor.pressKey('Enter')
      
      // 验证
      const updated = editor.getDocument()
      expect(updated.getChild('child-1')?.title).toBe('New Title')
    })
  })
  
  describe('undo/redo', () => {
    it('should undo an action', async () => {
      const doc = createTestDocument()
      editor.loadDocument(doc)
      
      // 执行操作
      await editor.executeCommand('addSubTopic', { nodeId: 'root' })
      
      // 验证添加成功
      expect(editor.getDocument().getChild('root')?.children.attached).toHaveLength(2)
      
      // 撤销
      await editor.executeCommand('undo')
      
      // 验证撤销成功
      expect(editor.getDocument().getChild('root')?.children.attached).toHaveLength(1)
    })
  })
})
```

### 3.2 Command 测试

```typescript
// @y-mindmap/commands/__tests__/commands.test.ts

describe('Commands', () => {
  let state: EditorState
  
  beforeEach(() => {
    state = createTestState()
  })
  
  describe('addSubTopic', () => {
    it('should add a sub topic', () => {
      const result = commands.addSubTopic.execute(state)
      
      expect(result).not.toBeNull()
      
      const newState = state.apply(result!)
      const children = newState.doc.getChild('root')?.children.attached
      
      expect(children).toHaveLength(2)
    })
    
    it('should be disabled when no selection', () => {
      const emptySelection = Selection.empty()
      const stateWithEmpty = state.setSelection(emptySelection)
      
      expect(commands.addSubTopic.isEnabled(stateWithEmpty)).toBe(false)
    })
  })
  
  describe('deleteNode', () => {
    it('should delete selected node', () => {
      const result = commands.deleteNode.execute(state)
      
      expect(result).not.toBeNull()
      
      const newState = state.apply(result!)
      
      expect(newState.doc.getChild('child-1')).toBeNull()
    })
  })
})
```

---

## 四、E2E 测试

### 4.1 测试框架

```typescript
// 使用 Playwright
import { test, expect } from '@playwright/test'
```

### 4.2 E2E 测试用例

```typescript
// e2e/editor.spec.ts

test.describe('MindMap Editor', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForSelector('.editor-container')
  })
  
  test('should create a new topic', async ({ page }) => {
    // 选择根节点
    await page.click('[data-node-id="root"]')
    
    // 添加子节点
    await page.keyboard.press('Tab')
    
    // 验证新节点创建
    const newTopic = page.locator('[data-node-id]:not([data-node-id="root"])')
    await expect(newTopic).toBeVisible()
  })
  
  test('should edit topic title', async ({ page }) => {
    // 双击节点进入编辑
    await page.dblClick('[data-node-id="child-1"]')
    
    // 清除并输入新标题
    await page.keyboard.press('Control+a')
    await page.keyboard.type('New Title')
    
    // 确认编辑
    await page.keyboard.press('Enter')
    
    // 验证标题更新
    await expect(page.locator('[data-node-id="child-1"]')).toContainText('New Title')
  })
  
  test('should delete topic', async ({ page }) => {
    // 选择节点
    await page.click('[data-node-id="child-1"]')
    
    // 删除
    await page.keyboard.press('Delete')
    
    // 确认对话框
    await page.click('[data-action="confirm"]')
    
    // 验证节点删除
    await expect(page.locator('[data-node-id="child-1"]')).not.toBeVisible()
  })
  
  test('should undo/redo', async ({ page }) => {
    // 执行操作
    await page.click('[data-node-id="root"]')
    await page.keyboard.press('Tab')
    
    // 撤销
    await page.keyboard.press('Control+z')
    
    // 验证撤销
    const children = page.locator('[data-type="attached"]')
    await expect(children).toHaveCount(1)
    
    // 重做
    await page.keyboard.press('Control+Shift+z')
    
    // 验证重做
    await expect(children).toHaveCount(2)
  })
  
  test('should zoom in/out', async ({ page }) => {
    const initialZoom = await page.locator('.zoom-level').textContent()
    
    // 放大
    await page.keyboard.press('Control+=')
    
    const zoomedIn = await page.locator('.zoom-level').textContent()
    expect(parseInt(zoomedIn)).toBeGreaterThan(parseInt(initialZoom))
    
    // 缩小
    await page.keyboard.press('Control+-')
    
    const zoomedOut = await page.locator('.zoom-level').textContent()
    expect(parseInt(zoomedOut)).toBe(parseInt(initialZoom))
  })
})
```

---

## 五、测试工具

### 5.1 测试配置

```typescript
// vitest.config.ts

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/**/*.test.ts',
        'src/**/*.spec.ts',
      ],
    },
  },
})
```

### 5.2 Mock 策略

```typescript
// @y-mindmap/__mocks__/editor.ts

export function createMockEditor(): EditorView {
  return {
    getDocument: vi.fn(),
    getSelection: vi.fn(),
    getZoom: vi.fn(),
    executeCommand: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    // ...
  } as any
}

export function createTestDocument(nodeCount: number = 5): MindMapNode {
  const children: MindMapNode[] = []
  
  for (let i = 0; i < nodeCount; i++) {
    children.push(new MindMapNode({
      id: `child-${i}`,
      title: `Child ${i}`,
      type: TopicType.ATTACHED,
    }))
  }
  
  return new MindMapNode({
    id: 'root',
    title: 'Root',
    type: TopicType.ROOT,
    children: { attached: children },
  })
}
```

### 5.3 测试数据生成

```typescript
// @y-mindmap/__fixtures__/documents.ts

export function createSimpleDocument(): MindMapNode {
  return new MindMapNode({
    id: 'root',
    title: 'Central Topic',
    type: TopicType.ROOT,
    children: {
      attached: [
        new MindMapNode({
          id: 'branch-1',
          title: 'Branch 1',
          type: TopicType.ATTACHED,
        }),
        new MindMapNode({
          id: 'branch-2',
          title: 'Branch 2',
          type: TopicType.ATTACHED,
        }),
      ],
    },
  })
}

export function createComplexDocument(): MindMapNode {
  // 创建包含各种元素的复杂文档
  // ...
}

export function createLargeDocument(nodeCount: number): MindMapNode {
  // 创建大型文档用于性能测试
  // ...
}
```

---

## 六、测试运行

### 6.1 命令

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test:unit

# 运行集成测试
pnpm test:integration

# 运行 E2E 测试
pnpm test:e2e

# 生成覆盖率报告
pnpm test:coverage

# 监听模式
pnpm test:watch
```

### 6.2 CI 配置

```yaml
# .github/workflows/test.yml

name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Run unit tests
        run: pnpm test:unit
      
      - name: Run integration tests
        run: pnpm test:integration
      
      - name: Run E2E tests
        run: pnpm test:e2e
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

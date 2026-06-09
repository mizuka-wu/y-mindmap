import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NodeView, DirtyFlag, type Size } from './node-view'
import type { MindMapNode } from '@y-mindmap/state'

vi.mock('leafer-ui', () => ({
  Group: vi.fn().mockImplementation(() => ({
    add: vi.fn(),
    remove: vi.fn(),
    x: 0,
    y: 0,
    visible: true,
    opacity: 1,
    scaleX: 1,
    scaleY: 1,
  })),
}))

function createMockMindMapNode(id: string = 'test'): MindMapNode {
  return {
    id,
    title: 'Test Node',
    type: 'attached',
    children: {},
    markers: [],
    labels: [],
    attachedChildren: [],
    hasChildren: false,
  } as unknown as MindMapNode
}

class TestNodeView extends NodeView {
  protected _preferredSize: Size = { width: 100, height: 40 }

  protected initialize(): void {}

  protected calculatePreferredSize(): Size {
    return this._preferredSize
  }

  protected applyLayout(): void {}

  protected applyPaint(): void {}

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  setPreferredSizeForTest(size: Size): void {
    this._preferredSize = size
  }
}

describe('NodeView', () => {
  let nodeView: TestNodeView
  let mockNode: MindMapNode

  beforeEach(() => {
    mockNode = createMockMindMapNode()
    nodeView = new TestNodeView(mockNode)
  })

  describe('constructor', () => {
    it('should initialize with node id', () => {
      expect(nodeView.nodeId).toBe('test')
    })

    it('should initialize as dirty', () => {
      expect(nodeView.isDirty()).toBe(true)
    })

    it('should initialize with default size', () => {
      const size = nodeView.getSize()
      expect(size.width).toBe(-1)
      expect(size.height).toBe(-1)
    })
  })

  describe('dirty flags', () => {
    it('should track layout dirty flag', () => {
      nodeView.clearDirtyFlags(DirtyFlag.ALL)
      expect(nodeView.isDirty(DirtyFlag.LAYOUT)).toBe(false)

      nodeView.invalidateLayout()
      expect(nodeView.isDirty(DirtyFlag.LAYOUT)).toBe(true)
    })

    it('should track paint dirty flag', () => {
      nodeView.clearDirtyFlags(DirtyFlag.ALL)
      expect(nodeView.isDirty(DirtyFlag.PAINT)).toBe(false)

      nodeView.invalidatePaint()
      expect(nodeView.isDirty(DirtyFlag.PAINT)).toBe(true)
    })

    it('should propagate layout invalidation to parent', () => {
      const parent = new TestNodeView(createMockMindMapNode('parent'))
      parent.addChild(nodeView)
      parent.clearDirtyFlags(DirtyFlag.ALL)
      nodeView.clearDirtyFlags(DirtyFlag.ALL)

      nodeView.invalidateLayout()
      expect(parent.isDirty(DirtyFlag.LAYOUT)).toBe(true)
    })

    it('should collect dirty node ids', () => {
      nodeView.clearDirtyFlags(DirtyFlag.ALL)
      nodeView.invalidateLayout()

      const dirtyIds = nodeView.collectDirtyNodeIds()
      expect(dirtyIds.has('test')).toBe(true)
    })

    it('should not propagate when forbidInvalidateLayout is set', () => {
      const parent = new TestNodeView(createMockMindMapNode('parent'))
      parent.addChild(nodeView)
      parent.clearDirtyFlags(DirtyFlag.ALL)
      nodeView.clearDirtyFlags(DirtyFlag.ALL)

      ;(nodeView as any)._forbidInvalidateLayout = true
      nodeView.invalidateLayout()
      expect(parent.isDirty(DirtyFlag.LAYOUT)).toBe(false)
    })
  })

  describe('size management', () => {
    it('should set size', () => {
      nodeView.clearDirtyFlags(DirtyFlag.ALL)
      nodeView.setSize({ width: 200, height: 80 })

      const size = nodeView.getSize()
      expect(size.width).toBe(200)
      expect(size.height).toBe(80)
      expect(nodeView.isDirty(DirtyFlag.SIZE)).toBe(true)
    })

    it('should not invalidate when same size', () => {
      nodeView.setSize({ width: 200, height: 80 })
      nodeView.clearDirtyFlags(DirtyFlag.ALL)
      nodeView.setSize({ width: 200, height: 80 })

      expect(nodeView.isDirty()).toBe(false)
    })

    it('should force update when forceUpdate is true', () => {
      nodeView.setSize({ width: 200, height: 80 })
      nodeView.clearDirtyFlags(DirtyFlag.ALL)
      nodeView.setSize({ width: 200, height: 80 }, true)

      expect(nodeView.isDirty(DirtyFlag.SIZE)).toBe(true)
    })

    it('should get preferred size', () => {
      const preferred = nodeView.getPreferredSize()
      expect(preferred.width).toBe(100)
      expect(preferred.height).toBe(40)
    })

    it('should refresh preferred size when requested', () => {
      nodeView.setPreferredSizeForTest({ width: 150, height: 60 })
      const preferred = nodeView.getPreferredSize(true)
      expect(preferred.width).toBe(150)
      expect(preferred.height).toBe(60)
    })
  })

  describe('position management', () => {
    it('should set position', () => {
      nodeView.setPosition({ x: 100, y: 200 })

      const pos = nodeView.getPosition()
      expect(pos.x).toBe(100)
      expect(pos.y).toBe(200)
    })

    it('should not invalidate when same position', () => {
      nodeView.setPosition({ x: 100, y: 200 })
      nodeView.clearDirtyFlags(DirtyFlag.ALL)
      nodeView.setPosition({ x: 100, y: 200 })

      expect(nodeView.isDirty()).toBe(false)
    })
  })

  describe('visibility', () => {
    it('should manage visibility', () => {
      expect(nodeView.isVisible()).toBe(true)

      nodeView.setVisible(false)
      expect(nodeView.isVisible()).toBe(false)
    })

    it('should manage forced invisible', () => {
      expect(nodeView.isForcedInvisible()).toBe(false)

      nodeView.setForcedInvisible(true)
      expect(nodeView.isForcedInvisible()).toBe(true)
    })

    it('should update group visibility based on forced invisible', () => {
      nodeView.setForcedInvisible(true)
      expect((nodeView as any).group.visible).toBe(false)

      nodeView.setForcedInvisible(false)
      expect((nodeView as any).group.visible).toBe(true)
    })
  })

  describe('opacity', () => {
    it('should set opacity', () => {
      nodeView.setOpacity(0.5)
      expect(nodeView.getOpacity()).toBe(0.5)
    })
  })

  describe('selection', () => {
    it('should manage selection state', () => {
      expect(nodeView.isSelected()).toBe(false)

      nodeView.setSelected(true)
      expect(nodeView.isSelected()).toBe(true)
      expect(nodeView.isDirty(DirtyFlag.PAINT)).toBe(true)
    })
  })

  describe('parent-child relationships', () => {
    it('should add child', () => {
      const child = new TestNodeView(createMockMindMapNode('child'))
      nodeView.addChild(child)

      expect(nodeView.getChildren()).toContain(child)
      expect(child.getParent()).toBe(nodeView)
    })

    it('should not add duplicate child', () => {
      const child = new TestNodeView(createMockMindMapNode('child'))
      nodeView.addChild(child)
      nodeView.addChild(child)

      expect(nodeView.getChildren().length).toBe(1)
    })

    it('should remove child', () => {
      const child = new TestNodeView(createMockMindMapNode('child'))
      nodeView.addChild(child)
      nodeView.removeChild(child)

      expect(nodeView.getChildren()).not.toContain(child)
      expect(child.getParent()).toBeNull()
    })

    it('should get central node view', () => {
      const child = new TestNodeView(createMockMindMapNode('child'))
      const grandchild = new TestNodeView(createMockMindMapNode('grandchild'))
      nodeView.addChild(child)
      child.addChild(grandchild)

      expect(grandchild.getCentralNodeView()).toBe(nodeView)
    })
  })

  describe('validation', () => {
    it('should validate layout', () => {
      nodeView.invalidateLayout()
      nodeView.validateLayout()

      expect(nodeView.isDirty(DirtyFlag.LAYOUT)).toBe(false)
    })

    it('should validate paint', () => {
      nodeView.invalidatePaint()
      nodeView.validatePaint()

      expect(nodeView.isDirty(DirtyFlag.PAINT)).toBe(false)
    })

    it('should validate all', () => {
      nodeView.invalidate(DirtyFlag.ALL)
      nodeView.validate()

      expect(nodeView.isDirty()).toBe(false)
    })
  })

  describe('bounds', () => {
    it('should get bounds', () => {
      nodeView.setPosition({ x: 10, y: 20 })
      nodeView.setSize({ width: 100, height: 50 })

      const bounds = nodeView.getBounds()
      expect(bounds.x).toBe(10)
      expect(bounds.y).toBe(20)
      expect(bounds.width).toBe(100)
      expect(bounds.height).toBe(50)
    })
  })

  describe('disposal', () => {
    it('should dispose properly', () => {
      nodeView.destroy()
      expect(nodeView.isDisposed()).toBe(true)
    })

    it('should not dispose twice', () => {
      nodeView.destroy()
      expect(() => nodeView.destroy()).not.toThrow()
    })
  })
})

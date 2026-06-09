import { describe, it, expect, beforeEach } from 'vitest'
import { MapLayoutEngine, TreeLayoutEngine, FishboneLayoutEngine, TimelineLayoutEngine } from './layout-engine'
import { MindMapNode } from '@y-mindmap/state'
import { TopicType } from '@y-mindmap/core'

function createNode(id: string, title: string, children: MindMapNode[] = []): MindMapNode {
  const data: any = {
    id,
    title,
    type: id === 'root' ? TopicType.ROOT : TopicType.ATTACHED,
  }
  if (children.length > 0) {
    data.children = {
      attached: children.map(c => c.toJSON()),
    }
  }
  return new MindMapNode(data)
}

describe('MapLayoutEngine', () => {
  let engine: MapLayoutEngine

  beforeEach(() => {
    engine = new MapLayoutEngine()
  })

  describe('calculate', () => {
    it('should layout single root node', () => {
      const root = createNode('root', 'Root')
      const result = engine.calculate(root)

      expect(result.nodes.has('root')).toBe(true)
      const rootLayout = result.nodes.get('root')!
      expect(rootLayout.width).toBeGreaterThan(0)
      expect(rootLayout.height).toBeGreaterThan(0)
    })

    it('should layout root with children', () => {
      const child1 = createNode('c1', 'Child 1')
      const child2 = createNode('c2', 'Child 2')
      const root = createNode('root', 'Root', [child1, child2])

      const result = engine.calculate(root)

      expect(result.nodes.has('root')).toBe(true)
      expect(result.nodes.has('c1')).toBe(true)
      expect(result.nodes.has('c2')).toBe(true)
    })

    it('should generate connections', () => {
      const child = createNode('c1', 'Child')
      const root = createNode('root', 'Root', [child])

      const result = engine.calculate(root)

      expect(result.connections.size).toBe(1)
      const connection = Array.from(result.connections.values())[0]!
      expect(connection.fromId).toBe('root')
      expect(connection.toId).toBe('c1')
    })

    it('should split children left and right', () => {
      const children = Array.from({ length: 6 }, (_, i) => 
        createNode(`c${i}`, `Child ${i}`)
      )
      const root = createNode('root', 'Root', children)

      const result = engine.calculate(root)
      const rootLayout = result.nodes.get('root')!

      const rightChildren = children.filter(c => {
        const layout = result.nodes.get(c.id)!
        return layout.x > rootLayout.x
      })
      const leftChildren = children.filter(c => {
        const layout = result.nodes.get(c.id)!
        return layout.x < rootLayout.x
      })

      expect(rightChildren.length).toBeGreaterThan(0)
      expect(leftChildren.length).toBeGreaterThan(0)
    })
  })

  describe('incremental layout', () => {
    it('should use cache for clean subtrees', () => {
      const child1 = createNode('c1', 'Child 1')
      const child2 = createNode('c2', 'Child 2')
      const root = createNode('root', 'Root', [child1, child2])

      const result1 = engine.calculate(root)
      
      const dirtyNodes = new Set<string>(['c1'])
      const result2 = engine.calculate(root, undefined, dirtyNodes)

      expect(result2.nodes.has('root')).toBe(true)
      expect(result2.nodes.has('c1')).toBe(true)
      expect(result2.nodes.has('c2')).toBe(true)
    })

    it('should recalculate dirty nodes', () => {
      const child = createNode('c1', 'Child')
      const root = createNode('root', 'Root', [child])

      engine.calculate(root)
      
      const dirtyNodes = new Set<string>(['c1'])
      const result = engine.calculate(root, undefined, dirtyNodes)

      const childLayout = result.nodes.get('c1')!
      expect(childLayout).toBeDefined()
    })
  })

  describe('calculateNodeSize', () => {
    it('should calculate node size based on title', () => {
      const node = createNode('test', 'Short')
      const size = engine.calculateNodeSize(node)

      expect(size.width).toBeGreaterThanOrEqual(120)
      expect(size.height).toBeGreaterThanOrEqual(40)
    })

    it('should scale with title length', () => {
      const shortNode = createNode('short', 'Hi')
      const longNode = createNode('long', 'This is a much longer title that should be wider')

      const shortSize = engine.calculateNodeSize(shortNode)
      const longSize = engine.calculateNodeSize(longNode)

      expect(longSize.width).toBeGreaterThan(shortSize.width)
    })
  })

  describe('calculateConnectionPath', () => {
    it('should generate valid SVG path', () => {
      const from = { id: 'from', x: 0, y: 0, width: 100, height: 40, childrenBounds: { x: 0, y: 0, width: 0, height: 0 } }
      const to = { id: 'to', x: 200, y: 0, width: 100, height: 40, childrenBounds: { x: 0, y: 0, width: 0, height: 0 } }

      const path = engine.calculateConnectionPath(from, to)
      expect(path).toMatch(/^M \d+ \d+ C/)
    })

    it('should handle left-side connections', () => {
      const from = { id: 'from', x: 200, y: 0, width: 100, height: 40, childrenBounds: { x: 0, y: 0, width: 0, height: 0 } }
      const to = { id: 'to', x: 0, y: 0, width: 100, height: 40, childrenBounds: { x: 0, y: 0, width: 0, height: 0 } }

      const path = engine.calculateConnectionPath(from, to)
      expect(path).toMatch(/^M \d+ \d+ C/)
    })
  })

  describe('clearCache', () => {
    it('should clear all caches', () => {
      const root = createNode('root', 'Root')
      engine.calculate(root)

      engine.clearCache()

      const result = engine.calculate(root)
      expect(result.nodes.size).toBeGreaterThan(0)
    })
  })
})

describe('TreeLayoutEngine', () => {
  let engine: TreeLayoutEngine

  beforeEach(() => {
    engine = new TreeLayoutEngine()
  })

  describe('calculate', () => {
    it('should layout tree structure', () => {
      const child1 = createNode('c1', 'Child 1')
      const child2 = createNode('c2', 'Child 2')
      const root = createNode('root', 'Root', [child1, child2])

      const result = engine.calculate(root)

      expect(result.nodes.size).toBe(3)
      
      const rootLayout = result.nodes.get('root')!
      const child1Layout = result.nodes.get('c1')!
      const child2Layout = result.nodes.get('c2')!

      expect(child1Layout.y).toBeGreaterThan(rootLayout.y)
      expect(child2Layout.y).toBeGreaterThan(rootLayout.y)
    })

    it('should generate vertical connections', () => {
      const child = createNode('c1', 'Child')
      const root = createNode('root', 'Root', [child])

      const result = engine.calculate(root)
      const connection = Array.from(result.connections.values())[0]!

      expect(connection.path).toMatch(/^M \d+ \d+ L/)
    })
  })
})

describe('FishboneLayoutEngine', () => {
  let engine: FishboneLayoutEngine

  beforeEach(() => {
    engine = new FishboneLayoutEngine()
  })

  describe('calculate', () => {
    it('should layout fishbone structure', () => {
      const child1 = createNode('c1', 'Child 1')
      const child2 = createNode('c2', 'Child 2')
      const root = createNode('root', 'Root', [child1, child2])

      const result = engine.calculate(root)

      expect(result.nodes.size).toBe(3)
    })

    it('should alternate children above and below', () => {
      const children = Array.from({ length: 4 }, (_, i) => 
        createNode(`c${i}`, `Child ${i}`)
      )
      const root = createNode('root', 'Root', children)

      const result = engine.calculate(root)
      const rootLayout = result.nodes.get('root')!
      const rootCenterY = rootLayout.y + rootLayout.height / 2

      const above = children.filter(c => {
        const layout = result.nodes.get(c.id)!
        return layout.y + layout.height / 2 < rootCenterY
      })
      const below = children.filter(c => {
        const layout = result.nodes.get(c.id)!
        return layout.y + layout.height / 2 > rootCenterY
      })

      expect(above.length).toBeGreaterThan(0)
      expect(below.length).toBeGreaterThan(0)
    })
  })
})

describe('TimelineLayoutEngine', () => {
  describe('horizontal', () => {
    it('should layout horizontally', () => {
      const engine = new TimelineLayoutEngine('horizontal')
      const child1 = createNode('c1', 'Child 1')
      const child2 = createNode('c2', 'Child 2')
      const root = createNode('root', 'Root', [child1, child2])

      const result = engine.calculate(root)
      const rootLayout = result.nodes.get('root')!
      const child1Layout = result.nodes.get('c1')!
      const child2Layout = result.nodes.get('c2')!

      expect(child1Layout.x).toBeGreaterThan(rootLayout.x)
      expect(child2Layout.x).toBeGreaterThan(child1Layout.x)
    })
  })

  describe('vertical', () => {
    it('should layout vertically', () => {
      const engine = new TimelineLayoutEngine('vertical')
      const child1 = createNode('c1', 'Child 1')
      const child2 = createNode('c2', 'Child 2')
      const root = createNode('root', 'Root', [child1, child2])

      const result = engine.calculate(root)
      const rootLayout = result.nodes.get('root')!
      const child1Layout = result.nodes.get('c1')!
      const child2Layout = result.nodes.get('c2')!

      expect(child1Layout.y).toBeGreaterThan(rootLayout.y)
      expect(child2Layout.y).toBeGreaterThan(child1Layout.y)
    })
  })
})

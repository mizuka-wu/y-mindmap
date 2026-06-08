import { describe, it, expect } from 'vitest'
import { MindMapNode } from './mind-map-node'
import { TopicType } from '@y-mindmap/core'

describe('MindMapNode', () => {
  const createTestNode = (id: string, title: string, children?: MindMapNode[]) => {
    const data: any = {
      id,
      title,
      type: TopicType.ROOT,
    }
    if (children && children.length > 0) {
      data.children = {
        attached: children.map(c => c.toJSON()),
      }
    }
    return new MindMapNode(data)
  }

  describe('constructor', () => {
    it('should create node with basic properties', () => {
      const node = createTestNode('1', 'Root')

      expect(node.id).toBe('1')
      expect(node.title).toBe('Root')
      expect(node.type).toBe(TopicType.ROOT)
    })

    it('should initialize empty arrays', () => {
      const node = createTestNode('1', 'Root')

      expect(node.markers).toEqual([])
      expect(node.labels).toEqual([])
      expect(node.attachedChildren).toEqual([])
    })

    it('should create children', () => {
      const child = createTestNode('2', 'Child')
      const root = createTestNode('1', 'Root', [child])

      expect(root.attachedChildren).toHaveLength(1)
      expect(root.attachedChildren[0]!.id).toBe('2')
    })
  })

  describe('immutable updates', () => {
    it('withTitle should return new node', () => {
      const node = createTestNode('1', 'Root')
      const updated = node.withTitle('New Title')

      expect(updated.title).toBe('New Title')
      expect(updated.id).toBe(node.id)
      expect(node.title).toBe('Root')
    })

    it('withLabels should return new node', () => {
      const node = createTestNode('1', 'Root')
      const updated = node.withLabels(['tag1', 'tag2'])

      expect(updated.labels).toEqual(['tag1', 'tag2'])
      expect(node.labels).toEqual([])
    })
  })

  describe('tree operations', () => {
    it('hasChildren should check if node has children', () => {
      const leaf = createTestNode('1', 'Leaf')
      const child = createTestNode('2', 'Child')
      const parent = createTestNode('3', 'Parent', [child])

      expect(leaf.hasChildren).toBe(false)
      expect(parent.hasChildren).toBe(true)
    })

    it('descendants should traverse all descendants', () => {
      const grandchild = createTestNode('3', 'Grandchild')
      const child = createTestNode('2', 'Child', [grandchild])
      const root = createTestNode('1', 'Root', [child])

      const ids: string[] = []
      root.descendants(node => {
        ids.push(node.id)
        return true
      })

      expect(ids).toEqual(['1', '2', '3'])
    })

    it('findDescendant should find node by predicate', () => {
      const child = createTestNode('2', 'Child')
      const root = createTestNode('1', 'Root', [child])

      const found = root.findDescendant(node => node.id === '2')
      expect(found?.id).toBe('2')

      const notFound = root.findDescendant(node => node.id === '999')
      expect(notFound).toBeNull()
    })
  })

  describe('fold operations', () => {
    it('isFolded should check fold state', () => {
      const node = createTestNode('1', 'Root')
      expect(node.isFolded).toBe(false)

      const folded = node.withBranch('folded')
      expect(folded.isFolded).toBe(true)
    })

    it('toggleFold should toggle fold state', () => {
      const node = createTestNode('1', 'Root')
      const folded = node.toggleFold()
      const expanded = folded.toggleFold()

      expect(folded.isFolded).toBe(true)
      expect(expanded.isFolded).toBe(false)
    })
  })

  describe('serialization', () => {
    it('toJSON should serialize node', () => {
      const node = createTestNode('1', 'Root')
      const json = node.toJSON()

      expect(json.id).toBe('1')
      expect(json.title).toBe('Root')
      expect(json.type).toBe(TopicType.ROOT)
    })

    it('should roundtrip through JSON', () => {
      const child = createTestNode('2', 'Child')
      const root = createTestNode('1', 'Root', [child])
      const json = root.toJSON()
      const restored = new MindMapNode(json)

      expect(restored.id).toBe(root.id)
      expect(restored.title).toBe(root.title)
      expect(restored.attachedChildren).toHaveLength(1)
    })
  })
})

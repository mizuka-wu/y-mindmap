import { describe, it, expect, beforeEach } from 'vitest'
import { StateDescriber } from './state-describer'
import { ContextProvider } from './context-provider'
import { QueryBuilder } from './query-builder'
import { SuggestionEngine } from './suggestion-engine'
import { EditorState, MindMapDocument, MindMapNode } from '@y-mindmap/state'
import { TopicType } from '@y-mindmap/core'

function createTestDocument(): MindMapDocument {
  const root = new MindMapNode({
    id: 'root',
    title: 'Test Root',
    type: TopicType.ROOT,
    children: {
      attached: [
        {
          id: 'child1',
          title: 'Child 1',
          type: TopicType.ATTACHED,
          children: {
            attached: [
              {
                id: 'grandchild1',
                title: 'Grandchild 1',
                type: TopicType.ATTACHED,
              },
            ],
          },
        },
        {
          id: 'child2',
          title: 'Child 2',
          type: TopicType.ATTACHED,
          labels: ['important'],
        },
      ],
    },
  })
  return new MindMapDocument(root)
}

describe('StateDescriber', () => {
  let state: EditorState
  let describer: StateDescriber

  beforeEach(() => {
    const doc = createTestDocument()
    state = EditorState.create(doc)
    describer = new StateDescriber(state, 'en-US')
  })

  it('should describe the mind map', () => {
    const description = describer.describe()

    expect(description).toContain('Test Root')
    expect(description).toContain('4 nodes')
  })

  it('should describe a specific node', () => {
    const description = describer.describeNode('child1')

    expect(description).toContain('Child 1')
    expect(description).toContain('Children (1)')
  })

  it('should handle non-existent node', () => {
    const description = describer.describeNode('non-existent')

    expect(description).toContain('not found')
  })
})

describe('ContextProvider', () => {
  let state: EditorState
  let context: ContextProvider

  beforeEach(() => {
    const doc = createTestDocument()
    state = EditorState.create(doc)
    context = new ContextProvider(state)
  })

  it('should provide document context', () => {
    const docContext = context.getDocumentContext()

    expect(docContext.title).toBe('Test Root')
    expect(docContext.nodeCount).toBe(4)
    expect(docContext.branchCount).toBe(2)
  })

  it('should provide statistics', () => {
    const stats = context.getStatistics()

    expect(stats.totalNodes).toBe(4)
    expect(stats.nodesByType[TopicType.ROOT]).toBe(1)
    expect(stats.nodesByType[TopicType.ATTACHED]).toBe(3)
  })

  it('should provide full context', () => {
    const fullContext = context.getFullContext()

    expect(fullContext.document).toBeDefined()
    expect(fullContext.selection).toBeDefined()
    expect(fullContext.statistics).toBeDefined()
  })
})

describe('QueryBuilder', () => {
  let state: EditorState
  let query: QueryBuilder

  beforeEach(() => {
    const doc = createTestDocument()
    state = EditorState.create(doc)
    query = new QueryBuilder(state)
  })

  it('should find all nodes', () => {
    const result = query.find()

    expect(result.nodes).toHaveLength(4)
  })

  it('should find nodes by type', () => {
    const result = query.where({ type: TopicType.ATTACHED }).find()

    expect(result.nodes).toHaveLength(3)
  })

  it('should find nodes by title', () => {
    const result = query.where({ title: 'Child 1' }).find()

    expect(result.nodes).toHaveLength(1)
    expect(result.nodes[0].id).toBe('child1')
  })

  it('should find nodes with labels', () => {
    const result = query.where({ hasLabels: true }).find()

    expect(result.nodes).toHaveLength(1)
    expect(result.nodes[0].id).toBe('child2')
  })

  it('should find children', () => {
    const children = query.findChildren('root')

    expect(children).toHaveLength(2)
  })

  it('should find descendants', () => {
    const descendants = query.findDescendants('root')

    expect(descendants).toHaveLength(3)
  })

  it('should count nodes', () => {
    const count = query.where({ type: TopicType.ATTACHED }).count()

    expect(count).toBe(3)
  })
})

describe('SuggestionEngine', () => {
  let state: EditorState
  let engine: SuggestionEngine

  beforeEach(() => {
    const doc = createTestDocument()
    state = EditorState.create(doc)
    engine = new SuggestionEngine(state, 'en-US')
  })

  it('should provide suggestions', () => {
    const suggestions = engine.getSuggestions()

    expect(Array.isArray(suggestions)).toBe(true)
  })

  it('should have valid suggestion structure', () => {
    const suggestions = engine.getSuggestions()

    for (const suggestion of suggestions) {
      expect(suggestion.action).toBeDefined()
      expect(suggestion.reason).toBeDefined()
      expect(['high', 'medium', 'low']).toContain(suggestion.priority)
      expect(['structure', 'content', 'organization', 'style']).toContain(suggestion.category)
    }
  })
})

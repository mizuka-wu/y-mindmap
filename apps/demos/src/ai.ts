import { createMindMap, RootTopic, MindMapNode, TopicType } from '@y-mindmap/vanilla'
import { StateDescriber, SuggestionEngine, QueryBuilder } from '@y-mindmap/ai'

const container = document.getElementById('app')
if (!container) {
  throw new Error('Container not found')
}

const editor = createMindMap(container, {
  showToolbar: true,
  showPropertyPanel: true,
  showStatusBar: true,
})

setupDemo()
setupAIUI()

function setupDemo() {
  const doc = createDemoDocument()
  editor.loadDocument(doc)
  editor.fitToContent()
}

function createDemoDocument(): RootTopic {
  const root = new MindMapNode({
    id: 'root',
    title: '项目计划',
    type: TopicType.ROOT,
    children: {
      attached: [
        {
          id: 'requirements',
          title: '需求分析',
          type: TopicType.ATTACHED,
          children: {
            attached: [
              { id: 'func-req', title: '功能需求', type: TopicType.ATTACHED },
              { id: 'non-func-req', title: '非功能需求', type: TopicType.ATTACHED },
              { id: 'constraints', title: '约束条件', type: TopicType.ATTACHED },
            ],
          },
        },
        {
          id: 'timeline',
          title: '时间线',
          type: TopicType.ATTACHED,
          children: {
            attached: [
              { id: 'phase1', title: '阶段 1: 规划', type: TopicType.ATTACHED },
              { id: 'phase2', title: '阶段 2: 开发', type: TopicType.ATTACHED },
              { id: 'phase3', title: '阶段 3: 测试', type: TopicType.ATTACHED },
              { id: 'phase4', title: '阶段 4: 发布', type: TopicType.ATTACHED },
            ],
          },
        },
        {
          id: 'resources',
          title: '资源',
          type: TopicType.ATTACHED,
          children: {
            attached: [
              { id: 'team', title: '团队', type: TopicType.ATTACHED },
              { id: 'budget', title: '预算', type: TopicType.ATTACHED },
            ],
          },
        },
        {
          id: 'empty-node',
          title: '',
          type: TopicType.ATTACHED,
        },
      ],
    },
  })

  return new RootTopic(root)
}

function setupAIUI() {
  const state = editor.getState()

  document.getElementById('btn-describe')!.addEventListener('click', () => {
    const describer = new StateDescriber(state, 'zh-CN')
    const output = document.getElementById('describe-output')!
    output.textContent = describer.describe()
  })

  document.getElementById('btn-suggest')!.addEventListener('click', () => {
    const engine = new SuggestionEngine(state, 'zh-CN')
    const suggestions = engine.getSuggestions()
    const output = document.getElementById('suggest-output')!
    output.textContent = suggestions.map(s => 
      `[${s.priority}] ${s.reason}`
    ).join('\n')
  })

  document.getElementById('btn-query-children')!.addEventListener('click', () => {
    const query = new QueryBuilder(state)
    const result = query.where({ hasChildren: true }).find()
    const output = document.getElementById('query-output')!
    output.textContent = `有子节点的节点:\n${result.nodes.map(n => `- ${n.title || '(空)'}`).join('\n')}`
  })

  document.getElementById('btn-query-depth')!.addEventListener('click', () => {
    const query = new QueryBuilder(state)
    const result = query.where({ depth: { $gt: 1 } }).find()
    const output = document.getElementById('query-output')!
    output.textContent = `深度 > 1 的节点:\n${result.nodes.map(n => `- ${n.title || '(空)'}`).join('\n')}`
  })

  document.getElementById('btn-query-empty')!.addEventListener('click', () => {
    const query = new QueryBuilder(state)
    const result = query.where({ title: '' }).find()
    const output = document.getElementById('query-output')!
    output.textContent = `空节点:\n${result.nodes.map(n => `- ID: ${n.id}`).join('\n')}`
  })
}

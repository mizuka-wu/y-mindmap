import { createMindMap, MindMapDocument, MindMapNode, TopicType, StructureType } from '@y-mindmap/vanilla'

const container = document.getElementById('app')
if (!container) {
  throw new Error('Container not found')
}

const layouts = [
  { id: StructureType.MAP, name: '思维导图', icon: '🗺️' },
  { id: StructureType.LOGIC_RIGHT, name: '逻辑图（右）', icon: '→' },
  { id: StructureType.LOGIC_LEFT, name: '逻辑图（左）', icon: '←' },
  { id: StructureType.TREE_RIGHT, name: '树形图（右）', icon: '🌳' },
  { id: StructureType.TREE_LEFT, name: '树形图（左）', icon: '🌲' },
  { id: StructureType.ORG_CHART_DOWN, name: '组织图（下）', icon: '🏢' },
  { id: StructureType.ORG_CHART_UP, name: '组织图（上）', icon: '⬆️' },
  { id: StructureType.FISHBONE_LEFT, name: '鱼骨图（左）', icon: '🐟' },
  { id: StructureType.FISHBONE_RIGHT, name: '鱼骨图（右）', icon: '🐠' },
  { id: StructureType.TIMELINE_HORIZONTAL, name: '时间线（水平）', icon: '📅' },
  { id: StructureType.TIMELINE_VERTICAL, name: '时间线（垂直）', icon: '📆' },
  { id: StructureType.SPREADSHEET, name: '表格', icon: '📊' },
  { id: StructureType.BRACE_LEFT, name: '括号（左）', icon: 'brace' },
  { id: StructureType.BRACE_RIGHT, name: '括号（右）', icon: 'brace' },
  { id: StructureType.TREE_TABLE, name: '树表', icon: '📋' },
]

const editor = createMindMap(container, {
  showToolbar: true,
  showPropertyPanel: true,
  showStatusBar: true,
})

setupDemo()
setupLayoutUI()

function setupDemo() {
  const doc = createDemoDocument()
  editor.loadDocument(doc)
  editor.fitToContent()
}

function createDemoDocument(): MindMapDocument {
  const root = new MindMapNode({
    id: 'root',
    title: '布局演示',
    type: TopicType.ROOT,
    children: {
      attached: [
        {
          id: 'branch-1',
          title: '分支 1',
          type: TopicType.ATTACHED,
          children: {
            attached: [
              { id: 'child-1-1', title: '子节点 1-1', type: TopicType.ATTACHED },
              { id: 'child-1-2', title: '子节点 1-2', type: TopicType.ATTACHED },
            ],
          },
        },
        {
          id: 'branch-2',
          title: '分支 2',
          type: TopicType.ATTACHED,
          children: {
            attached: [
              { id: 'child-2-1', title: '子节点 2-1', type: TopicType.ATTACHED },
              { id: 'child-2-2', title: '子节点 2-2', type: TopicType.ATTACHED },
              { id: 'child-2-3', title: '子节点 2-3', type: TopicType.ATTACHED },
            ],
          },
        },
        {
          id: 'branch-3',
          title: '分支 3',
          type: TopicType.ATTACHED,
        },
      ],
    },
  })

  return new MindMapDocument(root)
}

function setupLayoutUI() {
  const grid = document.getElementById('layout-grid')!
  
  for (const layout of layouts) {
    const btn = document.createElement('div')
    btn.className = 'layout-btn'
    
    btn.innerHTML = `
      <div class="icon">${layout.icon}</div>
      <div class="name">${layout.name}</div>
    `
    
    btn.addEventListener('click', () => {
      document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      editor.executeCommand('setStructureClass', { structureClass: layout.id })
    })
    
    grid.appendChild(btn)
  }
}

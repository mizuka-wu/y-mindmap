import { createMindMap, MindMapDocument, MindMapNode, TopicType } from '@y-mindmap/vanilla'
import { 
  CLASSIC_THEME, DARK_THEME, COLORFUL_THEME, 
  MINIMALIST_THEME, OCEAN_THEME, FOREST_THEME, SUNSET_THEME 
} from '@y-mindmap/view'

const container = document.getElementById('app')
if (!container) {
  throw new Error('Container not found')
}

const themes = [
  { id: 'classic', name: '经典', theme: CLASSIC_THEME, colors: ['#4A90D9', '#ffffff', '#333333'] },
  { id: 'dark', name: '暗黑', theme: DARK_THEME, colors: ['#1a1a2e', '#16213e', '#e94560'] },
  { id: 'colorful', name: '彩色', theme: COLORFUL_THEME, colors: ['#FF6B6B', '#4ECDC4', '#45B7D1'] },
  { id: 'minimalist', name: '极简', theme: MINIMALIST_THEME, colors: ['#ffffff', '#f5f5f5', '#333333'] },
  { id: 'ocean', name: '海洋', theme: OCEAN_THEME, colors: ['#0077b6', '#023e8a', '#90e0ef'] },
  { id: 'forest', name: '森林', theme: FOREST_THEME, colors: ['#2d6a4f', '#40916c', '#95d5b2'] },
  { id: 'sunset', name: '日落', theme: SUNSET_THEME, colors: ['#ff6b6b', '#feca57', '#ff9ff3'] },
]

const editor = createMindMap(container, {
  showToolbar: true,
  showPropertyPanel: true,
  showStatusBar: true,
})

setupDemo()
setupThemeUI()

function setupDemo() {
  const doc = createDemoDocument()
  editor.loadDocument(doc)
  editor.fitToContent()
}

function createDemoDocument(): MindMapDocument {
  const root = new MindMapNode({
    id: 'root',
    title: '主题演示',
    type: TopicType.ROOT,
    children: {
      attached: [
        {
          id: 'node-1',
          title: '节点 1',
          type: TopicType.ATTACHED,
          children: {
            attached: [
              { id: 'child-1', title: '子节点 1', type: TopicType.ATTACHED },
              { id: 'child-2', title: '子节点 2', type: TopicType.ATTACHED },
            ],
          },
        },
        {
          id: 'node-2',
          title: '节点 2',
          type: TopicType.ATTACHED,
        },
        {
          id: 'node-3',
          title: '节点 3',
          type: TopicType.ATTACHED,
        },
      ],
    },
  })

  return new MindMapDocument(root)
}

function setupThemeUI() {
  const grid = document.getElementById('theme-grid')!
  
  for (const theme of themes) {
    const btn = document.createElement('div')
    btn.className = 'theme-btn'
    
    btn.innerHTML = `
      <div class="preview">
        <div style="background-color: ${theme.colors[0]}"></div>
        <div style="background-color: ${theme.colors[1]}"></div>
        <div style="background-color: ${theme.colors[2]}"></div>
      </div>
      <div class="name">${theme.name}</div>
    `
    
    btn.addEventListener('click', () => {
      document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
    })
    
    grid.appendChild(btn)
  }
}

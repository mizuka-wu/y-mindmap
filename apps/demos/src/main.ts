import { createMindMap, MindMapDocument, MindMapNode, TopicType, StructureType } from '@y-mindmap/vanilla'

const container = document.getElementById('app')
if (!container) {
  throw new Error('Container not found')
}

const editor = createMindMap(container, {
  showToolbar: true,
  showPropertyPanel: true,
  showStatusBar: true,
  showMiniMap: true,
})

setupDemo()

function setupDemo() {
  const doc = createDemoDocument()
  editor.loadDocument(doc)
  editor.fitToContent()
}

function createDemoDocument(): MindMapDocument {
  const root = new MindMapNode({
    id: 'root',
    title: 'Y-MindMap 功能演示',
    type: TopicType.ROOT,
    children: {
      attached: [
        {
          id: 'features',
          title: '核心功能',
          type: TopicType.ATTACHED,
          children: {
            attached: [
              { id: 'shapes', title: '54 种节点形状', type: TopicType.ATTACHED },
              { id: 'connections', title: '22 种连线样式', type: TopicType.ATTACHED },
              { id: 'layouts', title: '21 种布局算法', type: TopicType.ATTACHED },
              { id: 'themes', title: '7 个预置主题', type: TopicType.ATTACHED },
            ],
          },
        },
        {
          id: 'interaction',
          title: '交互系统',
          type: TopicType.ATTACHED,
          children: {
            attached: [
              { id: 'select', title: '选择', type: TopicType.ATTACHED },
              { id: 'drag', title: '拖拽', type: TopicType.ATTACHED },
              { id: 'keyboard', title: '键盘导航', type: TopicType.ATTACHED },
              { id: 'gesture', title: '手势识别', type: TopicType.ATTACHED },
            ],
          },
        },
        {
          id: 'formats',
          title: '格式支持',
          type: TopicType.ATTACHED,
          children: {
            attached: [
              { id: 'xmind', title: 'XMind 导入导出', type: TopicType.ATTACHED },
              { id: 'markdown', title: 'Markdown 导入导出', type: TopicType.ATTACHED },
              { id: 'png', title: 'PNG 导出', type: TopicType.ATTACHED },
              { id: 'pdf', title: 'PDF 导出', type: TopicType.ATTACHED },
            ],
          },
        },
        {
          id: 'advanced',
          title: '高级功能',
          type: TopicType.ATTACHED,
          children: {
            attached: [
              { id: 'collab', title: '协作编辑', type: TopicType.ATTACHED },
              { id: 'richtext', title: '富文本', type: TopicType.ATTACHED },
              { id: 'ai', title: 'AI 集成', type: TopicType.ATTACHED },
              { id: 'plugins', title: '插件系统', type: TopicType.ATTACHED },
            ],
          },
        },
      ],
    },
  })

  return new MindMapDocument(root)
}

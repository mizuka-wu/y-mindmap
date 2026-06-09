import { createMindMap, RootTopic, MindMapNode, TopicType } from '@y-mindmap/vanilla'
import { AttributeTitle } from '@y-mindmap/core'

const container = document.getElementById('app')
if (!container) {
  throw new Error('Container not found')
}

const editor = createMindMap(container, {
  showToolbar: true,
  showPropertyPanel: true,
  showStatusBar: true,
  enableRichText: true,
})

setupDemo()

function setupDemo() {
  const doc = createRichTextDocument()
  editor.loadDocument(doc)
  editor.fitToContent()
}

function createRichTextDocument(): RootTopic {
  const boldTitle: AttributeTitle = [
    { text: '粗体文本', 'fo:font-weight': 'bold' },
  ]

  const italicTitle: AttributeTitle = [
    { text: '斜体文本', 'fo:font-style': 'italic' },
  ]

  const colorTitle: AttributeTitle = [
    { text: '红色', 'fo:color': '#ff0000' },
    { text: ' + ' },
    { text: '绿色', 'fo:color': '#00ff00' },
    { text: ' + ' },
    { text: '蓝色', 'fo:color': '#0000ff' },
  ]

  const mixedTitle: AttributeTitle = [
    { text: '粗体', 'fo:font-weight': 'bold' },
    { text: ' + ' },
    { text: '斜体', 'fo:font-style': 'italic' },
    { text: ' + ' },
    { text: '下划线', 'fo:text-decoration': 'underline' },
  ]

  const largeTitle: AttributeTitle = [
    { text: '大号字体', 'fo:font-size': 24 },
  ]

  const smallTitle: AttributeTitle = [
    { text: '小号字体', 'fo:font-size': 10 },
  ]

  const mixedStyleTitle: AttributeTitle = [
    { text: 'Hello ', 'fo:font-weight': 'bold', 'fo:font-size': 18 },
    { text: 'World', 'fo:color': '#ff6b6b', 'fo:font-style': 'italic' },
  ]

  const root = new MindMapNode({
    id: 'root',
    title: '富文本演示',
    type: TopicType.ROOT,
    children: {
      attached: [
        {
          id: 'bold',
          title: '粗体文本',
          attributeTitle: boldTitle,
          type: TopicType.ATTACHED,
        },
        {
          id: 'italic',
          title: '斜体文本',
          attributeTitle: italicTitle,
          type: TopicType.ATTACHED,
        },
        {
          id: 'color',
          title: '彩色文本',
          attributeTitle: colorTitle,
          type: TopicType.ATTACHED,
        },
        {
          id: 'mixed',
          title: '混合样式',
          attributeTitle: mixedTitle,
          type: TopicType.ATTACHED,
        },
        {
          id: 'size',
          title: '字号演示',
          type: TopicType.ATTACHED,
          children: {
            attached: [
              {
                id: 'large',
                title: '大号字体',
                attributeTitle: largeTitle,
                type: TopicType.ATTACHED,
              },
              {
                id: 'small',
                title: '小号字体',
                attributeTitle: smallTitle,
                type: TopicType.ATTACHED,
              },
            ],
          },
        },
        {
          id: 'mixed-style',
          title: 'Hello World',
          attributeTitle: mixedStyleTitle,
          type: TopicType.ATTACHED,
        },
        {
          id: 'plain',
          title: '纯文本节点（无富文本）',
          type: TopicType.ATTACHED,
        },
      ],
    },
  })

  return new RootTopic(root)
}

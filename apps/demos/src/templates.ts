import { createMindMap, RootTopic, MindMapNode, TopicType } from '@y-mindmap/vanilla'
import { ALL_TEMPLATES, getTemplateById, TEMPLATE_CATEGORIES } from '@y-mindmap/templates'

const container = document.getElementById('app')
if (!container) {
  throw new Error('Container not found')
}

const editor = createMindMap(container, {
  showToolbar: true,
  showPropertyPanel: true,
  showStatusBar: true,
})

setupTemplateUI()

function setupTemplateUI() {
  const grid = document.getElementById('template-grid')!
  
  for (const template of ALL_TEMPLATES) {
    const card = document.createElement('div')
    card.className = 'template-card'
    
    const categoryInfo = TEMPLATE_CATEGORIES[template.category]
    
    card.innerHTML = `
      <h3>${template.name}</h3>
      <p>${template.description}</p>
      <span class="category">${categoryInfo.icon} ${categoryInfo.name}</span>
    `
    
    card.addEventListener('click', () => {
      loadTemplate(template.id)
    })
    
    grid.appendChild(card)
  }
}

function loadTemplate(templateId: string) {
  const template = getTemplateById(templateId)
  if (!template) return
  
  const doc = RootTopic.fromJSON(template.root)
  editor.loadDocument(doc)
  editor.fitToContent()
}

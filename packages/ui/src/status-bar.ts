import { EditorState, MindMapNode } from '@y-mindmap/state'

export interface UIContext {
  state: EditorState
  getSelection: () => string[]
  getDocument: () => MindMapNode
  getZoom: () => number
}

export class StatusBar {
  private container: HTMLElement
  private context: UIContext

  constructor(container: HTMLElement, context: UIContext) {
    this.container = container
    this.context = context
    this.render()
  }

  update(): void {
    this.render()
  }

  private render(): void {
    this.container.innerHTML = ''
    this.container.className = 'y-mindmap-status-bar'

    const left = document.createElement('div')
    left.className = 'status-left'

    const nodeCount = document.createElement('span')
    nodeCount.className = 'status-item'
    const doc = this.context.getDocument()
    let count = 0
    doc.descendants(() => count++)
    nodeCount.textContent = `节点数: ${count}`
    left.appendChild(nodeCount)

    const selectionInfo = document.createElement('span')
    selectionInfo.className = 'status-item'
    const selectedIds = this.context.getSelection()
    if (selectedIds.length === 0) {
      selectionInfo.textContent = '未选择'
    } else if (selectedIds.length === 1) {
      const nodeId = selectedIds[0]
      if (nodeId) {
        const node = this.context.state.doc.getNodeById(nodeId)
        selectionInfo.textContent = `已选择: ${node?.title || ''}`
      }
    } else {
      selectionInfo.textContent = `已选择 ${selectedIds.length} 个节点`
    }
    left.appendChild(selectionInfo)

    this.container.appendChild(left)

    const right = document.createElement('div')
    right.className = 'status-right'

    const zoom = document.createElement('span')
    zoom.className = 'status-item'
    zoom.textContent = `${Math.round(this.context.getZoom() * 100)}%`
    right.appendChild(zoom)

    this.container.appendChild(right)
  }
}

import { EditorState, MindMapNode } from '@y-mindmap/state'
import { Point } from '@y-mindmap/core'

export interface MenuItem {
  id: string
  label: string
  icon?: string
  shortcut?: string
  disabled?: boolean
  divider?: boolean
  children?: MenuItem[]
  action?: () => void
}

export interface UIContext {
  state: EditorState
  executeCommand: (name: string, payload?: any) => boolean
  getSelection: () => string[]
  getDocument: () => MindMapNode
}

export class ContextMenu {
  private container: HTMLElement | null = null
  private context: UIContext

  constructor(context: UIContext) {
    this.context = context
  }

  show(position: Point, nodeId?: string): void {
    this.hide()

    const items = this.getItems(nodeId)

    this.container = document.createElement('div')
    this.container.className = 'y-mindmap-context-menu'
    this.container.style.position = 'fixed'
    this.container.style.left = `${position.x}px`
    this.container.style.top = `${position.y}px`

    for (const item of items) {
      if (item.divider) {
        const divider = document.createElement('div')
        divider.className = 'menu-divider'
        this.container.appendChild(divider)
        continue
      }

      const menuItem = document.createElement('div')
      menuItem.className = `menu-item ${item.disabled ? 'disabled' : ''}`

      if (item.icon) {
        const icon = document.createElement('span')
        icon.className = 'menu-icon'
        icon.textContent = item.icon
        menuItem.appendChild(icon)
      }

      const label = document.createElement('span')
      label.className = 'menu-label'
      label.textContent = item.label
      menuItem.appendChild(label)

      if (item.shortcut) {
        const shortcut = document.createElement('span')
        shortcut.className = 'menu-shortcut'
        shortcut.textContent = item.shortcut
        menuItem.appendChild(shortcut)
      }

      if (!item.disabled && item.action) {
        menuItem.addEventListener('click', () => {
          item.action!()
          this.hide()
        })
      }

      this.container.appendChild(menuItem)
    }

    document.body.appendChild(this.container)

    this.adjustPosition()

    document.addEventListener('click', this.handleOutsideClick)
    document.addEventListener('contextmenu', this.handleOutsideClick)
  }

  hide(): void {
    if (this.container) {
      document.body.removeChild(this.container)
      this.container = null
    }

    document.removeEventListener('click', this.handleOutsideClick)
    document.removeEventListener('contextmenu', this.handleOutsideClick)
  }

  private getItems(nodeId?: string): MenuItem[] {
    if (!nodeId) {
      return this.getEmptyMenuItems()
    }

    const node = this.context.state.doc.getNodeById(nodeId)
    if (!node) return []

    return this.getNodeMenuItems(node)
  }

  private getNodeMenuItems(node: MindMapNode): MenuItem[] {
    return [
      {
        id: 'edit',
        label: '编辑',
        icon: '✏️',
        shortcut: 'Enter',
        action: () => this.context.executeCommand('startEditing'),
      },
      { id: 'divider1', divider: true, label: '' },
      {
        id: 'addSubTopic',
        label: '添加子节点',
        icon: '➕',
        shortcut: 'Tab',
        action: () => this.context.executeCommand('addSubTopic'),
      },
      {
        id: 'addSiblingTopic',
        label: '添加兄弟节点',
        icon: '➕',
        shortcut: 'Enter',
        action: () => this.context.executeCommand('addSiblingTopic'),
      },
      { id: 'divider2', divider: true, label: '' },
      {
        id: 'delete',
        label: '删除',
        icon: '🗑️',
        shortcut: 'Delete',
        action: () => this.context.executeCommand('deleteNode'),
      },
      { id: 'divider3', divider: true, label: '' },
      {
        id: 'fold',
        label: '折叠/展开',
        icon: '📁',
        shortcut: 'Space',
        action: () => this.context.executeCommand('toggleFold'),
      },
      { id: 'divider4', divider: true, label: '' },
      {
        id: 'copy',
        label: '复制',
        icon: '📋',
        shortcut: 'Ctrl+C',
        action: () => this.context.executeCommand('copy'),
      },
      {
        id: 'cut',
        label: '剪切',
        icon: '✂️',
        shortcut: 'Ctrl+X',
        action: () => this.context.executeCommand('cut'),
      },
      {
        id: 'paste',
        label: '粘贴',
        icon: '📋',
        shortcut: 'Ctrl+V',
        action: () => this.context.executeCommand('paste'),
      },
    ]
  }

  private getEmptyMenuItems(): MenuItem[] {
    return [
      {
        id: 'paste',
        label: '粘贴',
        icon: '📋',
        shortcut: 'Ctrl+V',
        action: () => this.context.executeCommand('paste'),
      },
      { id: 'divider1', divider: true, label: '' },
      {
        id: 'selectAll',
        label: '全选',
        icon: '📋',
        shortcut: 'Ctrl+A',
        action: () => this.context.executeCommand('selectAll'),
      },
      { id: 'divider2', divider: true, label: '' },
      {
        id: 'fitToContent',
        label: '适应内容',
        icon: '🔍',
        action: () => this.context.executeCommand('fitToContent'),
      },
    ]
  }

  private adjustPosition(): void {
    if (!this.container) return

    const rect = this.container.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight

    if (rect.right > viewportWidth) {
      this.container.style.left = `${viewportWidth - rect.width - 10}px`
    }

    if (rect.bottom > viewportHeight) {
      this.container.style.top = `${viewportHeight - rect.height - 10}px`
    }
  }

  private handleOutsideClick = (event: Event): void => {
    if (this.container && !this.container.contains(event.target as Node)) {
      this.hide()
    }
  }
}

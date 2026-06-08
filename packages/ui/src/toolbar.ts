import { EditorState, MindMapNode, Selection } from '@y-mindmap/state'
import { Command, CommandRegistry } from '@y-mindmap/commands'

export interface UIContext {
  state: EditorState
  executeCommand: (name: string) => boolean
  getSelection: () => string[]
  getDocument: () => MindMapNode
  getZoom: () => number
  canUndo: () => boolean
  canRedo: () => boolean
}

interface ToolbarItem {
  id: string
  label?: string
  icon?: string
  shortcut?: string
  divider?: boolean
  disabled?: boolean
  active?: boolean
}

interface ToolbarGroup {
  name: string
  items: ToolbarItem[]
}

export class Toolbar {
  private container: HTMLElement
  private context: UIContext
  private buttons: Map<string, HTMLButtonElement> = new Map()
  private selects: Map<string, HTMLSelectElement> = new Map()

  constructor(container: HTMLElement, context: UIContext) {
    this.container = container
    this.context = context
    this.render()
  }

  update(): void {
    this.updateButtonStates()
    this.updateSelectStates()
  }

  private render(): void {
    this.container.innerHTML = ''
    this.container.className = 'y-mindmap-toolbar'

    const groups = this.getToolbarGroups()

    for (const group of groups) {
      const groupEl = document.createElement('div')
      groupEl.className = 'toolbar-group'

      for (const item of group.items) {
        if (item.divider) {
          const divider = document.createElement('div')
          divider.className = 'toolbar-divider'
          groupEl.appendChild(divider)
          continue
        }

        if (item.id.startsWith('select-')) {
          const select = this.createSelect(item)
          this.selects.set(item.id, select)
          groupEl.appendChild(select)
        } else {
          const button = this.createButton(item)
          this.buttons.set(item.id, button)
          groupEl.appendChild(button)
        }
      }

      this.container.appendChild(groupEl)
    }
  }

  private getToolbarGroups(): ToolbarGroup[] {
    return [
      {
        name: 'file',
        items: [
          { id: 'new', label: '新建', icon: '📄' },
          { id: 'open', label: '打开', icon: '📂' },
          { id: 'save', label: '保存', icon: '💾' },
        ],
      },
      {
        name: 'edit',
        items: [
          { id: 'undo', label: '撤销', icon: '↩️', shortcut: 'Ctrl+Z' },
          { id: 'redo', label: '重做', icon: '↪️', shortcut: 'Ctrl+Shift+Z' },
          { id: 'divider1', divider: true },
          { id: 'cut', label: '剪切', icon: '✂️', shortcut: 'Ctrl+X' },
          { id: 'copy', label: '复制', icon: '📋', shortcut: 'Ctrl+C' },
          { id: 'paste', label: '粘贴', icon: '📋', shortcut: 'Ctrl+V' },
          { id: 'duplicate', label: '复制节点', icon: '📋', shortcut: 'Ctrl+D' },
        ],
      },
      {
        name: 'insert',
        items: [
          { id: 'addSubTopic', label: '添加子节点', icon: '➕', shortcut: 'Tab' },
          { id: 'addSiblingTopic', label: '添加兄弟节点', icon: '➕', shortcut: 'Enter' },
          { id: 'divider2', divider: true },
          { id: 'deleteNode', label: '删除', icon: '🗑️', shortcut: 'Delete' },
          { id: 'toggleFold', label: '折叠/展开', icon: '📁', shortcut: 'Space' },
        ],
      },
      {
        name: 'structure',
        items: [
          {
            id: 'select-structure',
            label: '布局',
            icon: '📐',
          },
        ],
      },
      {
        name: 'view',
        items: [
          { id: 'zoomIn', label: '放大', icon: '🔍+', shortcut: 'Ctrl+=' },
          { id: 'zoomOut', label: '缩小', icon: '🔍-', shortcut: 'Ctrl+-' },
          { id: 'fitToContent', label: '适应', icon: '📐', shortcut: 'Ctrl+0' },
        ],
      },
    ]
  }

  private createButton(item: ToolbarItem): HTMLButtonElement {
    const button = document.createElement('button')
    button.className = 'toolbar-button'
    button.dataset.action = item.id
    button.title = item.shortcut ? `${item.label} (${item.shortcut})` : (item.label || '')
    button.innerHTML = `${item.icon || ''} ${item.label || ''}`
    button.disabled = item.disabled || false

    if (item.active) {
      button.classList.add('active')
    }

    button.addEventListener('click', () => {
      if (!button.disabled) {
        this.context.executeCommand(item.id)
      }
    })

    return button
  }

  private createSelect(item: ToolbarItem): HTMLSelectElement {
    const select = document.createElement('select')
    select.className = 'toolbar-select'
    select.dataset.action = item.id

    const options = this.getSelectOptions(item.id)
    for (const option of options) {
      const optionEl = document.createElement('option')
      optionEl.value = option.value
      optionEl.textContent = option.label
      select.appendChild(optionEl)
    }

    select.addEventListener('change', () => {
      this.context.executeCommand(item.id)
    })

    return select
  }

  private getSelectOptions(selectId: string): Array<{ value: string; label: string }> {
    switch (selectId) {
      case 'select-structure':
        return [
          { value: 'org.xmind.ui.map', label: '思维导图' },
          { value: 'org.xmind.ui.logic.right', label: '逻辑图' },
          { value: 'org.xmind.ui.tree.right', label: '树形图' },
          { value: 'org.xmind.ui.org-chart.down', label: '组织图' },
          { value: 'org.xmind.ui.fishbone.leftHeaded', label: '鱼骨图' },
          { value: 'org.xmind.ui.timeline.horizontal', label: '时间线' },
          { value: 'org.xmind.ui.spreadsheet', label: '表格' },
          { value: 'org.xmind.ui.brace.right', label: '括号' },
          { value: 'org.xmind.ui.treetable', label: '树表' },
        ]
      default:
        return []
    }
  }

  private updateButtonStates(): void {
    const undoBtn = this.buttons.get('undo')
    const redoBtn = this.buttons.get('redo')
    const deleteBtn = this.buttons.get('deleteNode')
    const cutBtn = this.buttons.get('cut')
    const copyBtn = this.buttons.get('copy')
    const pasteBtn = this.buttons.get('paste')
    const duplicateBtn = this.buttons.get('duplicate')
    const addSubTopicBtn = this.buttons.get('addSubTopic')
    const addSiblingTopicBtn = this.buttons.get('addSiblingTopic')
    const toggleFoldBtn = this.buttons.get('toggleFold')

    if (undoBtn) {
      undoBtn.disabled = !this.context.canUndo()
    }

    if (redoBtn) {
      redoBtn.disabled = !this.context.canRedo()
    }

    const hasSelection = this.context.getSelection().length > 0
    const hasSingleSelection = this.context.getSelection().length === 1

    if (deleteBtn) {
      deleteBtn.disabled = !hasSelection
    }

    if (cutBtn) {
      cutBtn.disabled = !hasSelection
    }

    if (copyBtn) {
      copyBtn.disabled = !hasSelection
    }

    if (pasteBtn) {
      pasteBtn.disabled = !hasSingleSelection
    }

    if (duplicateBtn) {
      duplicateBtn.disabled = !hasSelection
    }

    if (addSubTopicBtn) {
      addSubTopicBtn.disabled = !hasSingleSelection
    }

    if (addSiblingTopicBtn) {
      addSiblingTopicBtn.disabled = !hasSingleSelection
    }

    if (toggleFoldBtn) {
      toggleFoldBtn.disabled = !hasSingleSelection
    }
  }

  private updateSelectStates(): void {
    const structureSelect = this.selects.get('select-structure')
    if (structureSelect) {
      const selectedIds = this.context.getSelection()
      if (selectedIds.length === 1) {
        const nodeId = selectedIds[0]
        if (nodeId) {
          const node = this.context.state.doc.getNodeById(nodeId)
          if (node) {
            structureSelect.value = node.structureClass || 'org.xmind.ui.map'
            structureSelect.disabled = false
          }
        }
      } else {
        structureSelect.disabled = true
      }
    }
  }
}

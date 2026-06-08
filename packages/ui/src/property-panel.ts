import { EditorState, MindMapNode, Transaction } from '@y-mindmap/state'
import { NodeStyle, DEFAULT_TOPIC_STYLE } from '@y-mindmap/core'

export interface UIContext {
  state: EditorState
  dispatch: (tr: Transaction) => void
  executeCommand: (name: string, args?: any) => boolean
  getSelection: () => string[]
}

export class PropertyPanel {
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
    this.container.className = 'y-mindmap-property-panel'

    const selectedIds = this.context.getSelection()

    if (selectedIds.length === 0) {
      this.renderEmpty()
    } else if (selectedIds.length === 1) {
      const nodeId = selectedIds[0]
      if (nodeId) {
        const node = this.context.state.doc.getNodeById(nodeId)
        if (node) {
          this.renderSingleNode(node)
        }
      }
    } else {
      this.renderMultipleNodes(selectedIds.length)
    }
  }

  private renderEmpty(): void {
    const empty = document.createElement('div')
    empty.className = 'panel-empty'
    empty.textContent = '选择一个节点查看属性'
    this.container.appendChild(empty)
  }

  private renderSingleNode(node: MindMapNode): void {
    const style = node.style?.properties || {}

    this.renderTitleSection(node)
    this.renderStyleSection(node, style)
    this.renderMarkerSection(node)
    this.renderNoteSection(node)
    this.renderLinkSection(node)
    this.renderStructureSection(node)
  }

  private renderMultipleNodes(count: number): void {
    const section = this.createSection('多选')
    const info = document.createElement('p')
    info.textContent = `已选择 ${count} 个节点`
    section.appendChild(info)
    this.container.appendChild(section)

    this.renderBatchStyleSection()
  }

  private renderTitleSection(node: MindMapNode): void {
    const section = this.createSection('标题')
    const input = document.createElement('textarea')
    input.value = node.title || ''
    input.rows = 3
    input.addEventListener('change', () => {
      this.context.executeCommand('updateTitle', { nodeId: node.id, title: input.value })
    })
    section.appendChild(input)
    this.container.appendChild(section)
  }

  private renderStyleSection(node: MindMapNode, style: Record<string, any>): void {
    const section = this.createSection('样式')

    const shapeField = this.createSelectField('形状', [
      { value: 'roundedRect', label: '圆角矩形' },
      { value: 'rect', label: '矩形' },
      { value: 'ellipse', label: '椭圆' },
      { value: 'diamond', label: '菱形' },
      { value: 'hexagon', label: '六边形' },
      { value: 'cloud', label: '云朵' },
      { value: 'callout', label: '标注' },
      { value: 'pill', label: '胶囊' },
      { value: 'parallelogram', label: '平行四边形' },
      { value: 'trapezoid', label: '梯形' },
    ], style['shape-class'] || 'roundedRect', (value) => {
      this.context.executeCommand('updateStyle', { nodeId: node.id, style: { 'shape-class': value } })
    })
    section.appendChild(shapeField)

    const fillField = this.createColorField('填充颜色', style['fill-color'] || '#4A90D9', (value) => {
      this.context.executeCommand('updateStyle', { nodeId: node.id, style: { 'fill-color': value } })
    })
    section.appendChild(fillField)

    const borderField = this.createColorField('边框颜色', style['border-color'] || '#2E6DB4', (value) => {
      this.context.executeCommand('updateStyle', { nodeId: node.id, style: { 'border-color': value } })
    })
    section.appendChild(borderField)

    const textColorField = this.createColorField('文字颜色', style['text-color'] || '#333333', (value) => {
      this.context.executeCommand('updateStyle', { nodeId: node.id, style: { 'text-color': value } })
    })
    section.appendChild(textColorField)

    const fontSizeField = this.createNumberField('字号', style['font-size'] || 14, 8, 72, (value) => {
      this.context.executeCommand('updateStyle', { nodeId: node.id, style: { 'font-size': value } })
    })
    section.appendChild(fontSizeField)

    const fontWeightField = this.createSelectField('字重', [
      { value: 'normal', label: '正常' },
      { value: 'bold', label: '粗体' },
    ], style['font-weight'] || 'normal', (value) => {
      this.context.executeCommand('updateStyle', { nodeId: node.id, style: { 'font-weight': value } })
    })
    section.appendChild(fontWeightField)

    this.container.appendChild(section)
  }

  private renderBatchStyleSection(): void {
    const section = this.createSection('批量样式')

    const fillField = this.createColorField('填充颜色', '#4A90D9', (value) => {
      const selectedIds = this.context.getSelection()
      for (const id of selectedIds) {
        this.context.executeCommand('updateStyle', { nodeId: id, style: { 'fill-color': value } })
      }
    })
    section.appendChild(fillField)

    const textColorField = this.createColorField('文字颜色', '#333333', (value) => {
      const selectedIds = this.context.getSelection()
      for (const id of selectedIds) {
        this.context.executeCommand('updateStyle', { nodeId: id, style: { 'text-color': value } })
      }
    })
    section.appendChild(textColorField)

    this.container.appendChild(section)
  }

  private renderMarkerSection(node: MindMapNode): void {
    if (!node.markers || node.markers.length === 0) return

    const section = this.createSection('标记')
    const markerList = document.createElement('div')
    markerList.className = 'marker-list'

    for (const marker of node.markers) {
      const markerItem = document.createElement('span')
      markerItem.className = 'marker-item'
      markerItem.textContent = this.getMarkerIcon(marker.markerId)
      markerItem.title = marker.markerId
      markerList.appendChild(markerItem)
    }

    section.appendChild(markerList)
    this.container.appendChild(section)
  }

  private renderNoteSection(node: MindMapNode): void {
    if (!node.notes) return

    const section = this.createSection('备注')
    const content = document.createElement('div')
    content.className = 'note-content'
    content.textContent = node.notes.plain || ''
    section.appendChild(content)
    this.container.appendChild(section)
  }

  private renderLinkSection(node: MindMapNode): void {
    if (!node.href) return

    const section = this.createSection('链接')
    const link = document.createElement('a')
    link.href = node.href
    link.textContent = node.href
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    section.appendChild(link)
    this.container.appendChild(section)
  }

  private renderStructureSection(node: MindMapNode): void {
    const section = this.createSection('布局')
    const select = this.createSelectField('结构类型', [
      { value: 'org.xmind.ui.map', label: '思维导图' },
      { value: 'org.xmind.ui.logic.right', label: '逻辑图' },
      { value: 'org.xmind.ui.tree.right', label: '树形图' },
      { value: 'org.xmind.ui.org-chart.down', label: '组织图' },
      { value: 'org.xmind.ui.fishbone.leftHeaded', label: '鱼骨图' },
      { value: 'org.xmind.ui.timeline.horizontal', label: '时间线' },
    ], node.structureClass || 'org.xmind.ui.map', (value) => {
      this.context.executeCommand('setStructureClass', { nodeId: node.id, structureClass: value })
    })
    section.appendChild(select)
    this.container.appendChild(section)
  }

  private createSection(title: string): HTMLElement {
    const section = document.createElement('div')
    section.className = 'panel-section'

    const header = document.createElement('h3')
    header.textContent = title
    section.appendChild(header)

    return section
  }

  private createSelectField(
    label: string,
    options: Array<{ value: string; label: string }>,
    value: string,
    onChange: (value: string) => void
  ): HTMLElement {
    const field = document.createElement('div')
    field.className = 'panel-field'

    const labelEl = document.createElement('label')
    labelEl.textContent = label
    field.appendChild(labelEl)

    const select = document.createElement('select')
    for (const option of options) {
      const optionEl = document.createElement('option')
      optionEl.value = option.value
      optionEl.textContent = option.label
      optionEl.selected = option.value === value
      select.appendChild(optionEl)
    }
    select.addEventListener('change', () => {
      onChange(select.value)
    })
    field.appendChild(select)

    return field
  }

  private createColorField(
    label: string,
    value: string,
    onChange: (value: string) => void
  ): HTMLElement {
    const field = document.createElement('div')
    field.className = 'panel-field'

    const labelEl = document.createElement('label')
    labelEl.textContent = label
    field.appendChild(labelEl)

    const input = document.createElement('input')
    input.type = 'color'
    input.value = value
    input.addEventListener('change', () => {
      onChange(input.value)
    })
    field.appendChild(input)

    return field
  }

  private createNumberField(
    label: string,
    value: number,
    min: number,
    max: number,
    onChange: (value: number) => void
  ): HTMLElement {
    const field = document.createElement('div')
    field.className = 'panel-field'

    const labelEl = document.createElement('label')
    labelEl.textContent = label
    field.appendChild(labelEl)

    const input = document.createElement('input')
    input.type = 'number'
    input.value = String(value)
    input.min = String(min)
    input.max = String(max)
    input.addEventListener('change', () => {
      onChange(Number(input.value))
    })
    field.appendChild(input)

    return field
  }

  private getMarkerIcon(markerId: string): string {
    const icons: Record<string, string> = {
      'priority-1': '🔴',
      'priority-2': '🟡',
      'priority-3': '🟢',
      'flag': '🚩',
      'star': '⭐',
      'smile': '😊',
      'task': '✅',
      'question': '❓',
      'exclamation': '❗',
      'info': 'ℹ️',
    }
    return icons[markerId] || '•'
  }
}

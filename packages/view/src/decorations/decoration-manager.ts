import { Group, Rect, Text, Path, Ellipse } from 'leafer-ui'
import { Decoration, DecorationSet, DecorationSpec, InlineDecorationSpec, NodeDecorationSpec, WidgetDecorationSpec } from './decoration'
import { MindMapNode } from '@y-mindmap/state'
import { Bounds } from '@y-mindmap/core'

export interface DecorationRenderer {
  renderInline(nodeId: string, spec: InlineDecorationSpec, container: Group): void
  renderNode(nodeId: string, spec: NodeDecorationSpec, container: Group): void
  renderWidget(nodeId: string, spec: WidgetDecorationSpec, container: Group): void
  clear(): void
}

export class DefaultDecorationRenderer implements DecorationRenderer {
  private elements: Map<string, Group[]> = new Map()

  renderInline(nodeId: string, spec: InlineDecorationSpec, container: Group): void {
    const className = spec.class || ''
    const style = spec.style || {}

    const highlight = new Rect({
      x: 0,
      y: 0,
      width: container.width || 100,
      height: container.height || 20,
      fill: style.background || 'rgba(255, 255, 0, 0.3)',
      cornerRadius: 2,
    })

    container.add(highlight)
    this.addElement(nodeId, highlight as any)
  }

  renderNode(nodeId: string, spec: NodeDecorationSpec, container: Group): void {
    const className = spec.class || ''
    const style = spec.style || {}

    if (className.includes('drop-target')) {
      const border = new Rect({
        x: -2,
        y: -2,
        width: (container.width || 100) + 4,
        height: (container.height || 40) + 4,
        fill: 'none',
        stroke: '#4A90D9',
        strokeWidth: 3,
        cornerRadius: 10,
      })
      container.add(border)
      this.addElement(nodeId, border as any)
    }

    if (className.includes('hover')) {
      const glow = new Rect({
        x: -4,
        y: -4,
        width: (container.width || 100) + 8,
        height: (container.height || 40) + 8,
        fill: 'none',
        stroke: 'rgba(74, 144, 217, 0.5)',
        strokeWidth: 2,
        cornerRadius: 12,
      })
      container.add(glow)
      this.addElement(nodeId, glow as any)
    }

    if (className.includes('error')) {
      const errorIcon = new Text({
        text: '⚠️',
        x: (container.width || 100) - 20,
        y: -10,
        fontSize: 14,
      })
      container.add(errorIcon)
      this.addElement(nodeId, errorIcon as any)
    }

    if (className.includes('search-highlight')) {
      const highlight = new Rect({
        x: 0,
        y: 0,
        width: container.width || 100,
        height: container.height || 40,
        fill: 'rgba(255, 255, 0, 0.2)',
        cornerRadius: 6,
      })
      container.add(highlight)
      this.addElement(nodeId, highlight as any)
    }
  }

  renderWidget(nodeId: string, spec: WidgetDecorationSpec, container: Group): void {
    const element = spec.createElement()
    
    const widget = new Group({
      x: spec.side === -1 ? -30 : (container.width || 100) + 5,
      y: (container.height || 40) / 2 - 10,
    })

    const rect = new Rect({
      x: 0,
      y: 0,
      width: 20,
      height: 20,
      fill: '#4A90D9',
      cornerRadius: 4,
    })
    widget.add(rect)

    const text = new Text({
      text: element.textContent || '...',
      x: 4,
      y: 4,
      fontSize: 10,
      fill: '#fff',
    })
    widget.add(text)

    container.add(widget)
    this.addElement(nodeId, widget)
  }

  clear(): void {
    for (const elements of this.elements.values()) {
      for (const el of elements) {
        el.remove()
      }
    }
    this.elements.clear()
  }

  private addElement(nodeId: string, element: any): void {
    const existing = this.elements.get(nodeId) || []
    existing.push(element)
    this.elements.set(nodeId, existing)
  }
}

export class DecorationManager {
  private decorations: DecorationSet = DecorationSet.empty()
  private renderer: DecorationRenderer
  private nodeViews: Map<string, Group> = new Map()

  constructor(renderer?: DecorationRenderer) {
    this.renderer = renderer || new DefaultDecorationRenderer()
  }

  setNodeView(nodeId: string, view: Group): void {
    this.nodeViews.set(nodeId, view)
  }

  removeNodeView(nodeId: string): void {
    this.nodeViews.delete(nodeId)
  }

  addDecoration(decoration: Decoration): void {
    this.decorations = this.decorations.add(decoration)
    this.renderDecoration(decoration)
  }

  removeDecoration(predicate: (dec: Decoration) => boolean): void {
    this.decorations = this.decorations.remove(predicate)
    this.renderAll()
  }

  setDecorations(decorations: DecorationSet): void {
    this.decorations = decorations
    this.renderAll()
  }

  getDecorations(): DecorationSet {
    return this.decorations
  }

  getNodeDecorations(nodeId: string): Decoration[] {
    return this.decorations.getForNode(nodeId)
  }

  clear(): void {
    this.decorations = DecorationSet.empty()
    this.renderer.clear()
  }

  private renderAll(): void {
    this.renderer.clear()

    this.decorations.forEach((nodeId, decs) => {
      const view = this.nodeViews.get(nodeId)
      if (!view) return

      for (const dec of decs) {
        this.renderDecoration(dec)
      }
    })
  }

  private renderDecoration(dec: Decoration): void {
    const view = this.nodeViews.get(dec.nodeId)
    if (!view) return

    switch (dec.spec.type) {
      case 'inline':
        this.renderer.renderInline(dec.nodeId, dec.spec, view)
        break
      case 'node':
        this.renderer.renderNode(dec.nodeId, dec.spec, view)
        break
      case 'widget':
        this.renderer.renderWidget(dec.nodeId, dec.spec, view)
        break
    }
  }
}

export function createSearchHighlight(nodeId: string, query: string): Decoration {
  return Decoration.node(nodeId, {
    class: 'search-highlight',
    style: {
      background: 'rgba(255, 255, 0, 0.2)',
    },
  })
}

export function createDropTarget(nodeId: string): Decoration {
  return Decoration.node(nodeId, {
    class: 'drop-target',
    style: {
      borderColor: '#4A90D9',
      borderWidth: '3px',
    },
  })
}

export function createHoverEffect(nodeId: string): Decoration {
  return Decoration.node(nodeId, {
    class: 'hover',
    style: {
      borderColor: 'rgba(74, 144, 217, 0.5)',
    },
  })
}

export function createErrorDecoration(nodeId: string, message: string): Decoration {
  return Decoration.widget(nodeId, {
    createElement: () => {
      const el = document.createElement('div')
      el.className = 'error-widget'
      el.textContent = '⚠️'
      el.title = message
      return el
    },
    side: 1,
  })
}

export function createCollaboratorCursor(nodeId: string, userId: string, color: string): Decoration {
  return Decoration.widget(nodeId, {
    createElement: () => {
      const el = document.createElement('div')
      el.className = 'collaborator-cursor'
      el.style.backgroundColor = color
      el.textContent = userId.charAt(0).toUpperCase()
      return el
    },
    side: 1,
    key: `collaborator-${userId}`,
  })
}

import { EditorState, MindMapNode, Transaction } from '@y-mindmap/state'
import { Toolbar } from './toolbar'
import { ContextMenu } from './context-menu'
import { PropertyPanel } from './property-panel'
import { StatusBar } from './status-bar'
import { MiniMap } from './minimap'
import { injectStyles } from './styles'
import { Bounds, Point } from '@y-mindmap/core'

export interface UIContext {
  state: EditorState
  dispatch: (tr: Transaction) => void
  executeCommand: (name: string, args?: any) => boolean
  getSelection: () => string[]
  getDocument: () => MindMapNode
  getZoom: () => number
  setZoom: (zoom: number) => void
  panTo: (x: number, y: number) => void
  fitToContent: () => void
  getNodeBounds: (nodeId: string) => Bounds | null
  getViewportBounds: () => Bounds
  canUndo: () => boolean
  canRedo: () => boolean
}

export interface UIManagerConfig {
  container: HTMLElement
  showToolbar?: boolean
  showPropertyPanel?: boolean
  showStatusBar?: boolean
  showMiniMap?: boolean
}

export class UIManager {
  private container: HTMLElement
  private context: UIContext

  private toolbar: Toolbar | null = null
  private contextMenu: ContextMenu
  private propertyPanel: PropertyPanel | null = null
  private statusBar: StatusBar | null = null
  private miniMap: MiniMap | null = null

  private editorContainer: HTMLElement
  private toolbarContainer: HTMLElement | null = null
  private panelContainer: HTMLElement | null = null
  private statusContainer: HTMLElement | null = null
  private minimapContainer: HTMLElement | null = null

  constructor(config: UIManagerConfig, context: UIContext) {
    this.container = config.container
    this.context = context

    injectStyles()

    this.container.className = 'y-mindmap-container'

    this.editorContainer = document.createElement('div')
    this.editorContainer.className = 'y-mindmap-editor-container'

    this.contextMenu = new ContextMenu(context)

    if (config.showToolbar !== false) {
      this.createToolbar()
    }

    this.container.appendChild(this.editorContainer)

    if (config.showPropertyPanel !== false) {
      this.createPropertyPanel()
    }

    if (config.showStatusBar !== false) {
      this.createStatusBar()
    }

    if (config.showMiniMap !== false) {
      this.createMiniMap()
    }
  }

  getEditorContainer(): HTMLElement {
    return this.editorContainer
  }

  update(): void {
    this.toolbar?.update()
    this.propertyPanel?.update()
    this.statusBar?.update()
    this.miniMap?.update()
  }

  showContextMenu(position: Point, nodeId?: string): void {
    this.contextMenu.show(position, nodeId)
  }

  hideContextMenu(): void {
    this.contextMenu.hide()
  }

  private createToolbar(): void {
    this.toolbarContainer = document.createElement('div')
    this.container.appendChild(this.toolbarContainer)
    this.toolbar = new Toolbar(this.toolbarContainer, this.context)
  }

  private createPropertyPanel(): void {
    this.panelContainer = document.createElement('div')
    this.panelContainer.className = 'y-mindmap-panel-container'
    this.container.appendChild(this.panelContainer)
    this.propertyPanel = new PropertyPanel(this.panelContainer, this.context)
  }

  private createStatusBar(): void {
    this.statusContainer = document.createElement('div')
    this.container.appendChild(this.statusContainer)
    this.statusBar = new StatusBar(this.statusContainer, this.context)
  }

  private createMiniMap(): void {
    this.minimapContainer = document.createElement('div')
    this.minimapContainer.className = 'y-mindmap-minimap-container'
    this.container.appendChild(this.minimapContainer)
    this.miniMap = new MiniMap(this.minimapContainer, this.context)
  }

  destroy(): void {
    this.toolbarContainer?.remove()
    this.panelContainer?.remove()
    this.statusContainer?.remove()
    this.minimapContainer?.remove()
    this.miniMap?.destroy()
    this.contextMenu.hide()
  }
}

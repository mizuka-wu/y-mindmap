export interface ZoomControlsConfig {
  /** Show zoom percentage label */
  showPercentage?: boolean
  /** Show fit button */
  showFit?: boolean
  /** Minimum zoom level */
  minZoom?: number
  /** Maximum zoom level */
  maxZoom?: number
  /** Zoom step for +/- buttons */
  zoomStep?: number
}

interface ZoomControlsDependencies {
  getZoom: () => number
  zoomTo: (level: number) => void
  zoomIn: () => void
  zoomOut: () => void
  fitToContent: () => void
}

export class ZoomControls {
  private container: HTMLElement
  private deps: ZoomControlsDependencies
  private showPercentage: boolean
  private showFit: boolean

  private root: HTMLElement
  private percentageLabel: HTMLElement | null = null

  private _boundUpdateLabel: () => void

  constructor(container: HTMLElement, deps: ZoomControlsDependencies, config?: ZoomControlsConfig) {
    this.container = container
    this.deps = deps
    this.showPercentage = config?.showPercentage ?? true
    this.showFit = config?.showFit ?? true

    this._boundUpdateLabel = this.updateLabel.bind(this)

    this.root = document.createElement('div')
    this.root.style.cssText = `
      display: flex;
      align-items: center;
      gap: 2px;
      background: #fff;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      padding: 2px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      user-select: none;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 12px;
    `

    this.buildUI()
    this.container.appendChild(this.root)
  }

  update(): void {
    this.updateLabel()
  }

  destroy(): void {
    this.root.remove()
  }

  private buildUI(): void {
    const zoomOutBtn = this.createButton('−', '缩小 (Ctrl+-)')
    zoomOutBtn.addEventListener('click', () => this.deps.zoomOut())
    this.root.appendChild(zoomOutBtn)

    if (this.showPercentage) {
      this.percentageLabel = document.createElement('span')
      this.percentageLabel.style.cssText = `
        min-width: 48px;
        text-align: center;
        color: #333;
        font-variant-numeric: tabular-nums;
        cursor: pointer;
      `
      this.percentageLabel.title = '点击重置为 100%'
      this.percentageLabel.addEventListener('click', () => this.deps.zoomTo(1))
      this.root.appendChild(this.percentageLabel)
    }

    const zoomInBtn = this.createButton('+', '放大 (Ctrl+=)')
    zoomInBtn.addEventListener('click', () => this.deps.zoomIn())
    this.root.appendChild(zoomInBtn)

    if (this.showFit) {
      const separator = document.createElement('div')
      separator.style.cssText = `
        width: 1px;
        height: 20px;
        background: #e0e0e0;
        margin: 0 2px;
      `
      this.root.appendChild(separator)

      const fitBtn = this.createButton('⊡', '适应内容 (Ctrl+0)')
      fitBtn.addEventListener('click', () => this.deps.fitToContent())
      this.root.appendChild(fitBtn)
    }

    this.updateLabel()
  }

  private createButton(text: string, title: string): HTMLButtonElement {
    const btn = document.createElement('button')
    btn.textContent = text
    btn.title = title
    btn.style.cssText = `
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 4px;
      background: transparent;
      color: #333;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: background 0.15s ease;
      padding: 0;
      line-height: 1;
    `

    btn.addEventListener('mouseenter', () => {
      btn.style.background = '#f0f0f0'
    })
    btn.addEventListener('mouseleave', () => {
      btn.style.background = 'transparent'
    })

    return btn
  }

  private updateLabel(): void {
    if (!this.percentageLabel) return
    const zoom = this.deps.getZoom()
    this.percentageLabel.textContent = `${Math.round(zoom * 100)}%`
  }
}

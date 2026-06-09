import { Rect, Text, Path, Group } from 'leafer-ui'
import { NodeView, Size, Bounds } from '../../core/node-view'
import type { MindMapNode } from '@y-mindmap/state'

export class MatrixNodeView extends NodeView {
  private _rows: number = 2
  private _columns: number = 2
  private _cellPadding: number = 8
  private _borderColor: string = '#cccccc'
  private _borderWidth: number = 1
  
  private cells: MatrixCellNodeView[][] = []

  constructor(node: MindMapNode, rows: number = 2, columns: number = 2) {
    super(node)
    this._rows = rows
    this._columns = columns
  }

  protected initialize(): void {
    this.createCells()
  }

  private createCells(): void {
    for (const row of this.cells) {
      for (const cell of row) {
        cell.destroy()
      }
    }
    this.cells = []

    for (let r = 0; r < this._rows; r++) {
      const row: MatrixCellNodeView[] = []
      for (let c = 0; c < this._columns; c++) {
        const cell = new MatrixCellNodeView(this._node, r, c)
        row.push(cell)
        this.addChild(cell)
      }
      this.cells.push(row)
    }
  }

  protected calculatePreferredSize(): Size {
    let maxCellWidth = 0
    let maxCellHeight = 0
    
    for (const row of this.cells) {
      for (const cell of row) {
        const cellSize = cell.getPreferredSize()
        maxCellWidth = Math.max(maxCellWidth, cellSize.width)
        maxCellHeight = Math.max(maxCellHeight, cellSize.height)
      }
    }
    
    const totalWidth = maxCellWidth * this._columns + this._cellPadding * (this._columns + 1)
    const totalHeight = maxCellHeight * this._rows + this._cellPadding * (this._rows + 1)
    
    return { width: totalWidth, height: totalHeight }
  }

  protected applyLayout(): void {
    const cellWidth = (this._size.width - this._cellPadding * (this._columns + 1)) / this._columns
    const cellHeight = (this._size.height - this._cellPadding * (this._rows + 1)) / this._rows
    
    for (let r = 0; r < this._rows; r++) {
      for (let c = 0; c < this._columns; c++) {
        const cell = this.cells[r][c]
        cell.setPosition({
          x: this._cellPadding + c * (cellWidth + this._cellPadding),
          y: this._cellPadding + r * (cellHeight + this._cellPadding),
        })
        cell.setSize({ width: cellWidth, height: cellHeight })
      }
    }
  }

  protected applyPaint(): void {
  }

  protected updateStyle(): void {
    this.invalidateLayout()
  }

  getCell(row: number, column: number): MatrixCellNodeView | null {
    if (row < 0 || row >= this._rows || column < 0 || column >= this._columns) {
      return null
    }
    return this.cells[row][column]
  }

  setRows(rows: number): void {
    if (this._rows === rows) return
    this._rows = rows
    this.createCells()
    this.invalidateLayout()
  }

  setColumns(columns: number): void {
    if (this._columns === columns) return
    this._columns = columns
    this.createCells()
    this.invalidateLayout()
  }

  setCellPadding(padding: number): void {
    if (this._cellPadding === padding) return
    this._cellPadding = padding
    this.invalidateLayout()
  }

  setBorderColor(color: string): void {
    if (this._borderColor === color) return
    this._borderColor = color
    this.invalidatePaint()
  }

  setBorderWidth(width: number): void {
    if (this._borderWidth === width) return
    this._borderWidth = width
    this.invalidatePaint()
  }
}

export class MatrixCellNodeView extends NodeView {
  private _row: number
  private _column: number
  private _text: string = ''
  private _backgroundColor: string = 'transparent'
  private _textColor: string = '#333333'
  
  private backgroundElement: Rect | null = null
  private textElement: Text | null = null

  constructor(node: MindMapNode, row: number, column: number) {
    super(node)
    this._row = row
    this._column = column
  }

  protected initialize(): void {
    this.backgroundElement = new Rect({
      fill: this._backgroundColor,
      stroke: '#cccccc',
      strokeWidth: 1,
    })
    this.group.add(this.backgroundElement)

    this.textElement = new Text({
      text: this._text,
      fontSize: 14,
      fill: this._textColor,
      textAlign: 'center',
      verticalAlign: 'middle',
    })
    this.group.add(this.textElement)
  }

  protected calculatePreferredSize(): Size {
    return { width: 100, height: 40 }
  }

  protected applyLayout(): void {
    if (this.backgroundElement) {
      this.backgroundElement.width = this._size.width
      this.backgroundElement.height = this._size.height
    }
    if (this.textElement) {
      this.textElement.width = this._size.width
      this.textElement.height = this._size.height
    }
  }

  protected applyPaint(): void {
    if (this.backgroundElement) {
      this.backgroundElement.fill = this._backgroundColor
    }
    if (this.textElement) {
      this.textElement.fill = this._textColor
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  getRow(): number {
    return this._row
  }

  getColumn(): number {
    return this._column
  }

  getText(): string {
    return this._text
  }

  setText(text: string): void {
    if (this._text === text) return
    this._text = text
    if (this.textElement) {
      this.textElement.text = text
    }
    this.invalidateLayout()
  }

  setBackgroundColor(color: string): void {
    if (this._backgroundColor === color) return
    this._backgroundColor = color
    this.invalidatePaint()
  }

  setTextColor(color: string): void {
    if (this._textColor === color) return
    this._textColor = color
    this.invalidatePaint()
  }
}

export class TreeTableCellNodeView extends NodeView {
  private _text: string
  private _isHeader: boolean
  private _backgroundColor: string = '#f5f5f5'
  private _textColor: string = '#333333'
  
  private backgroundElement: Rect | null = null
  private textElement: Text | null = null

  constructor(node: MindMapNode, text: string, isHeader: boolean = false) {
    super(node)
    this._text = text
    this._isHeader = isHeader
  }

  protected initialize(): void {
    this.backgroundElement = new Rect({
      fill: this._isHeader ? '#e0e0e0' : '#ffffff',
      stroke: '#cccccc',
      strokeWidth: 1,
    })
    this.group.add(this.backgroundElement)

    this.textElement = new Text({
      text: this._text,
      fontSize: this._isHeader ? 14 : 12,
      fontWeight: this._isHeader ? 'bold' : 'normal',
      fill: this._textColor,
      textAlign: 'center',
      verticalAlign: 'middle',
    })
    this.group.add(this.textElement)
  }

  protected calculatePreferredSize(): Size {
    return { width: 120, height: 32 }
  }

  protected applyLayout(): void {
    if (this.backgroundElement) {
      this.backgroundElement.width = this._size.width
      this.backgroundElement.height = this._size.height
    }
    if (this.textElement) {
      this.textElement.width = this._size.width
      this.textElement.height = this._size.height
    }
  }

  protected applyPaint(): void {
    if (this.backgroundElement) {
      this.backgroundElement.fill = this._isHeader ? '#e0e0e0' : '#ffffff'
    }
    if (this.textElement) {
      this.textElement.fill = this._textColor
      this.textElement.fontWeight = this._isHeader ? 'bold' : 'normal'
    }
  }

  protected updateStyle(): void {
    this.invalidatePaint()
  }

  getText(): string {
    return this._text
  }

  setText(text: string): void {
    if (this._text === text) return
    this._text = text
    if (this.textElement) {
      this.textElement.text = text
    }
    this.invalidateLayout()
  }

  isHeader(): boolean {
    return this._isHeader
  }

  setHeader(isHeader: boolean): void {
    if (this._isHeader === isHeader) return
    this._isHeader = isHeader
    this.invalidatePaint()
  }
}

export default MatrixNodeView

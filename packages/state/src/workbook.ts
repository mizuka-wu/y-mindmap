import { Sheet } from './sheet'

export class Workbook {
  readonly id: string
  readonly title: string
  readonly sheets: readonly Sheet[]
  readonly activeSheetId: string

  constructor(data: {
    id: string
    title: string
    sheets?: readonly Sheet[]
    activeSheetId?: string
  }) {
    this.id = data.id
    this.title = data.title
    this.sheets = data.sheets ?? []
    this.activeSheetId = data.activeSheetId ?? (this.sheets[0]?.id ?? '')
  }

  get activeSheet(): Sheet | undefined {
    return this.sheets.find((s) => s.id === this.activeSheetId)
  }

  getSheetById(id: string): Sheet | undefined {
    return this.sheets.find((s) => s.id === id)
  }

  addSheet(sheet: Sheet): Workbook {
    return new Workbook({
      ...this.toData(),
      sheets: [...this.sheets, sheet],
      activeSheetId: this.activeSheetId || sheet.id,
    })
  }

  removeSheet(id: string): Workbook {
    const newSheets = this.sheets.filter((s) => s.id !== id)
    let newActiveId = this.activeSheetId
    if (this.activeSheetId === id && newSheets.length > 0) {
      newActiveId = newSheets[0]!.id
    }
    return new Workbook({
      ...this.toData(),
      sheets: newSheets,
      activeSheetId: newActiveId,
    })
  }

  setActiveSheet(id: string): Workbook {
    if (!this.sheets.find((s) => s.id === id)) return this
    return new Workbook({
      ...this.toData(),
      activeSheetId: id,
    })
  }

  updateSheet(id: string, updater: (s: Sheet) => Sheet): Workbook {
    return new Workbook({
      ...this.toData(),
      sheets: this.sheets.map((s) =>
        s.id === id ? updater(s) : s,
      ),
    })
  }

  withTitle(title: string): Workbook {
    return new Workbook({ ...this.toData(), title })
  }

  private toData() {
    return {
      id: this.id,
      title: this.title,
      sheets: this.sheets,
      activeSheetId: this.activeSheetId,
    }
  }
}

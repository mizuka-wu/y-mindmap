export class Selection {
  readonly type: 'none' | 'single' | 'multiple' | 'range' | 'box'
  readonly selectedIds: ReadonlySet<string>
  readonly anchorId: string | null
  readonly focusId: string | null

  constructor(data: {
    type: 'none' | 'single' | 'multiple' | 'range' | 'box'
    selectedIds: Set<string>
    anchorId?: string | null
    focusId?: string | null
  }) {
    this.type = data.type
    this.selectedIds = data.selectedIds
    this.anchorId = data.anchorId ?? null
    this.focusId = data.focusId ?? null
  }

  get isEmpty(): boolean {
    return this.selectedIds.size === 0
  }

  get isSingle(): boolean {
    return this.selectedIds.size === 1
  }

  get isMultiple(): boolean {
    return this.selectedIds.size > 1
  }

  get first(): string | null {
    return this.selectedIds.values().next().value ?? null
  }

  get all(): string[] {
    return Array.from(this.selectedIds)
  }

  get size(): number {
    return this.selectedIds.size
  }

  static empty(): Selection {
    return new Selection({
      type: 'none',
      selectedIds: new Set(),
    })
  }

  static single(id: string): Selection {
    return new Selection({
      type: 'single',
      selectedIds: new Set([id]),
      anchorId: id,
      focusId: id,
    })
  }

  static multiple(ids: string[]): Selection {
    return new Selection({
      type: 'multiple',
      selectedIds: new Set(ids),
      anchorId: ids[0] ?? null,
      focusId: ids[ids.length - 1] ?? null,
    })
  }

  isSelected(id: string): boolean {
    return this.selectedIds.has(id)
  }

  add(id: string): Selection {
    const newIds = new Set(this.selectedIds)
    newIds.add(id)
    return new Selection({
      type: newIds.size > 1 ? 'multiple' : 'single',
      selectedIds: newIds,
      anchorId: this.anchorId ?? id,
      focusId: id,
    })
  }

  remove(id: string): Selection {
    const newIds = new Set(this.selectedIds)
    newIds.delete(id)
    return new Selection({
      type: newIds.size === 0 ? 'none' : newIds.size === 1 ? 'single' : 'multiple',
      selectedIds: newIds,
      anchorId: this.anchorId === id ? (newIds.values().next().value ?? null) : this.anchorId,
      focusId: this.focusId === id ? (newIds.values().next().value ?? null) : this.focusId,
    })
  }

  toggle(id: string): Selection {
    if (this.isSelected(id)) {
      return this.remove(id)
    }
    return this.add(id)
  }

  clear(): Selection {
    return Selection.empty()
  }

  toJSON(): any {
    return {
      type: this.type,
      selectedIds: Array.from(this.selectedIds),
      anchorId: this.anchorId,
      focusId: this.focusId,
    }
  }

  static fromJSON(data: any): Selection {
    return new Selection({
      type: data.type,
      selectedIds: new Set(data.selectedIds),
      anchorId: data.anchorId,
      focusId: data.focusId,
    })
  }
}

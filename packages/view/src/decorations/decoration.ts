import { Bounds, Point } from '@y-mindmap/core'

export type DecorationType = 'inline' | 'node' | 'widget'

export interface InlineDecorationSpec {
  type: 'inline'
  class?: string
  style?: Record<string, string>
  attributes?: Record<string, string>
  inclusiveStart?: boolean
  inclusiveEnd?: boolean
}

export interface NodeDecorationSpec {
  type: 'node'
  class?: string
  style?: Record<string, string>
  attributes?: Record<string, string>
}

export interface WidgetDecorationSpec {
  type: 'widget'
  side?: number
  stopEvent?: (event: Event) => boolean
  ignoreSelection?: boolean
  key?: string
  createElement: () => HTMLElement
}

export type DecorationSpec = InlineDecorationSpec | NodeDecorationSpec | WidgetDecorationSpec

export class Decoration {
  readonly nodeId: string
  readonly spec: DecorationSpec

  private constructor(nodeId: string, spec: DecorationSpec) {
    this.nodeId = nodeId
    this.spec = spec
  }

  static inline(nodeId: string, spec: Omit<InlineDecorationSpec, 'type'>): Decoration {
    return new Decoration(nodeId, { ...spec, type: 'inline' })
  }

  static node(nodeId: string, spec: Omit<NodeDecorationSpec, 'type'>): Decoration {
    return new Decoration(nodeId, { ...spec, type: 'node' })
  }

  static widget(nodeId: string, spec: Omit<WidgetDecorationSpec, 'type'>): Decoration {
    return new Decoration(nodeId, { ...spec, type: 'widget' })
  }

  get type(): DecorationType {
    return this.spec.type
  }

  eq(other: Decoration): boolean {
    if (this.nodeId !== other.nodeId) return false
    if (this.spec.type !== other.spec.type) return false
    return JSON.stringify(this.spec) === JSON.stringify(other.spec)
  }
}

export class DecorationSet {
  private decorations: Map<string, Decoration[]> = new Map()

  private constructor(decorations: Map<string, Decoration[]>) {
    this.decorations = decorations
  }

  static empty(): DecorationSet {
    return new DecorationSet(new Map())
  }

  static create(decorations: Decoration[]): DecorationSet {
    const map = new Map<string, Decoration[]>()

    for (const dec of decorations) {
      const existing = map.get(dec.nodeId) || []
      existing.push(dec)
      map.set(dec.nodeId, existing)
    }

    return new DecorationSet(map)
  }

  static merge(...sets: DecorationSet[]): DecorationSet {
    const merged = new Map<string, Decoration[]>()

    for (const set of sets) {
      for (const [nodeId, decs] of set.decorations) {
        const existing = merged.get(nodeId) || []
        existing.push(...decs)
        merged.set(nodeId, existing)
      }
    }

    return new DecorationSet(merged)
  }

  find(fromNodeId?: string, toNodeId?: string): Decoration[] {
    const result: Decoration[] = []

    for (const [nodeId, decs] of this.decorations) {
      if (fromNodeId && nodeId < fromNodeId) continue
      if (toNodeId && nodeId > toNodeId) continue
      result.push(...decs)
    }

    return result
  }

  getForNode(nodeId: string): Decoration[] {
    return this.decorations.get(nodeId) || []
  }

  hasDecorations(): boolean {
    return this.decorations.size > 0
  }

  map(mapFn: (nodeId: string) => string | null): DecorationSet {
    const mapped = new Map<string, Decoration[]>()

    for (const [nodeId, decs] of this.decorations) {
      const newId = mapFn(nodeId)
      if (newId !== null) {
        const existing = mapped.get(newId) || []
        existing.push(...decs)
        mapped.set(newId, existing)
      }
    }

    return new DecorationSet(mapped)
  }

  add(decoration: Decoration): DecorationSet {
    const newMap = new Map(this.decorations)
    const existing = newMap.get(decoration.nodeId) || []
    newMap.set(decoration.nodeId, [...existing, decoration])
    return new DecorationSet(newMap)
  }

  remove(predicate: (dec: Decoration) => boolean): DecorationSet {
    const newMap = new Map<string, Decoration[]>()

    for (const [nodeId, decs] of this.decorations) {
      const filtered = decs.filter(d => !predicate(d))
      if (filtered.length > 0) {
        newMap.set(nodeId, filtered)
      }
    }

    return new DecorationSet(newMap)
  }

  removeByNode(nodeId: string): DecorationSet {
    const newMap = new Map(this.decorations)
    newMap.delete(nodeId)
    return new DecorationSet(newMap)
  }

  forEach(fn: (nodeId: string, decorations: Decoration[]) => void): void {
    this.decorations.forEach((decs, nodeId) => fn(nodeId, decs))
  }

  toArray(): Decoration[] {
    const result: Decoration[] = []
    this.decorations.forEach(decs => result.push(...decs))
    return result
  }

  get size(): number {
    let count = 0
    this.decorations.forEach(decs => count += decs.length)
    return count
  }
}

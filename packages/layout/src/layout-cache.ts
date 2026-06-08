import { MindMapNode } from '@y-mindmap/state'
import { LayoutResult } from './types'

export interface CacheEntry {
  result: LayoutResult
  timestamp: number
  accessCount: number
  hash: string
}

export class LayoutCache {
  private cache: Map<string, CacheEntry> = new Map()
  private maxSize: number = 100
  private ttl: number = 5 * 60 * 1000

  constructor(maxSize?: number, ttl?: number) {
    if (maxSize) this.maxSize = maxSize
    if (ttl) this.ttl = ttl
  }

  get(node: MindMapNode): LayoutResult | null {
    const hash = this.computeHash(node)
    const entry = this.cache.get(hash)

    if (!entry) return null

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(hash)
      return null
    }

    entry.accessCount++
    return entry.result
  }

  set(node: MindMapNode, result: LayoutResult): void {
    const hash = this.computeHash(node)

    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }

    this.cache.set(hash, {
      result,
      timestamp: Date.now(),
      accessCount: 1,
      hash,
    })
  }

  invalidate(node: MindMapNode): void {
    const hash = this.computeHash(node)
    this.cache.delete(hash)
  }

  invalidateAll(): void {
    this.cache.clear()
  }

  private computeHash(node: MindMapNode): string {
    const parts: string[] = []
    this.hashNode(node, parts)
    return parts.join('|')
  }

  private hashNode(node: MindMapNode, parts: string[]): void {
    parts.push(node.id)
    parts.push(node.title)
    parts.push(node.type)
    parts.push(JSON.stringify(node.style || {}))

    for (const child of node.getAllChildren()) {
      this.hashNode(child, parts)
    }
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null
    let leastUsedCount = Infinity

    for (const [key, entry] of this.cache) {
      if (entry.accessCount < leastUsedCount) {
        leastUsedCount = entry.accessCount
        leastUsedKey = key
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
    }
  }

  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0,
    }
  }
}

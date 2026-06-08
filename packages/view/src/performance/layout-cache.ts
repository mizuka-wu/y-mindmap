import { MindMapNode } from '@y-mindmap/state'

export interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
  hits: number
}

export class LayoutCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private maxSize: number
  private ttl: number
  private hitCount: number = 0
  private missCount: number = 0

  constructor(maxSize: number = 1000, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize
    this.ttl = ttl
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) {
      this.missCount++
      return null
    }

    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      this.missCount++
      return null
    }

    entry.hits++
    this.hitCount++
    return entry.value
  }

  set(key: string, value: T): void {
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed()
    }

    this.cache.set(key, {
      key,
      value,
      timestamp: Date.now(),
      hits: 0,
    })
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key)
      return false
    }
    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
    this.hitCount = 0
    this.missCount = 0
  }

  private evictLeastUsed(): void {
    let leastUsedKey: string | null = null
    let leastHits = Infinity
    let oldestTimestamp = Infinity

    for (const [key, entry] of this.cache) {
      if (entry.hits < leastHits || (entry.hits === leastHits && entry.timestamp < oldestTimestamp)) {
        leastUsedKey = key
        leastHits = entry.hits
        oldestTimestamp = entry.timestamp
      }
    }

    if (leastUsedKey) {
      this.cache.delete(leastUsedKey)
    }
  }

  getStats(): { size: number; hitRate: number; hits: number; misses: number } {
    const total = this.hitCount + this.missCount
    return {
      size: this.cache.size,
      hitRate: total > 0 ? this.hitCount / total : 0,
      hits: this.hitCount,
      misses: this.missCount,
    }
  }
}

export function generateNodeCacheKey(node: MindMapNode): string {
  const parts = [
    node.id,
    node.title,
    node.type,
    node.style?.id || '',
    node.markers.length.toString(),
    node.labels.join(','),
  ]
  return parts.join(':')
}

export function generateSubtreeCacheKey(node: MindMapNode): string {
  const parts = [generateNodeCacheKey(node)]
  
  for (const children of Object.values(node.children)) {
    for (const child of children) {
      parts.push(generateSubtreeCacheKey(child))
    }
  }

  return parts.join('|')
}

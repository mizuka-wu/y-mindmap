import { MindMapNode } from '@y-mindmap/state'

export interface SearchOptions {
  caseSensitive?: boolean
  wholeWord?: boolean
  regex?: boolean
  searchIn?: ('title' | 'notes' | 'labels' | 'href')[]
}

export interface SearchResult {
  nodeId: string
  title: string
  matches: SearchMatch[]
  score: number
}

export interface SearchMatch {
  field: string
  value: string
  index: number
  length: number
}

export class SearchEngine {
  private lastResults: SearchResult[] = []
  private currentIndex: number = -1

  search(
    doc: MindMapNode,
    query: string,
    options?: SearchOptions
  ): SearchResult[] {
    if (!query || query.trim().length === 0) {
      this.lastResults = []
      this.currentIndex = -1
      return []
    }

    const opts: SearchOptions = {
      caseSensitive: false,
      wholeWord: false,
      regex: false,
      searchIn: ['title', 'notes', 'labels'],
      ...options,
    }

    const results: SearchResult[] = []
    const normalizedQuery = opts.caseSensitive ? query : query.toLowerCase()

    doc.descendants((node) => {
      const matches = this.matchNode(node, normalizedQuery, opts)
      if (matches.length > 0) {
        results.push({
          nodeId: node.id,
          title: node.title,
          matches,
          score: this.calculateScore(matches),
        })
      }
    })

    results.sort((a, b) => b.score - a.score)
    this.lastResults = results
    this.currentIndex = results.length > 0 ? 0 : -1

    return results
  }

  private matchNode(
    node: MindMapNode,
    query: string,
    options: SearchOptions
  ): SearchMatch[] {
    const matches: SearchMatch[] = []
    const searchIn = options.searchIn || ['title']

    if (searchIn.includes('title')) {
      const titleMatches = this.matchText(
        node.title || '',
        query,
        options,
        'title'
      )
      matches.push(...titleMatches)
    }

    if (searchIn.includes('notes') && node.notes?.plain) {
      const noteMatches = this.matchText(
        node.notes.plain,
        query,
        options,
        'notes'
      )
      matches.push(...noteMatches)
    }

    if (searchIn.includes('labels') && node.labels) {
      for (const label of node.labels) {
        const labelMatches = this.matchText(label, query, options, 'labels')
        matches.push(...labelMatches)
      }
    }

    if (searchIn.includes('href') && node.href) {
      const hrefMatches = this.matchText(
        node.href,
        query,
        options,
        'href'
      )
      matches.push(...hrefMatches)
    }

    return matches
  }

  private matchText(
    text: string,
    query: string,
    options: SearchOptions,
    field: string
  ): SearchMatch[] {
    const matches: SearchMatch[] = []
    const normalizedText = options.caseSensitive ? text : text.toLowerCase()
    const normalizedQuery = options.caseSensitive ? query : query.toLowerCase()

    if (options.regex) {
      try {
        const flags = options.caseSensitive ? 'g' : 'gi'
        const regex = new RegExp(normalizedQuery, flags)
        let match
        while ((match = regex.exec(text)) !== null) {
          matches.push({
            field,
            value: text.substring(match.index, match.index + match[0].length),
            index: match.index,
            length: match[0].length,
          })
        }
      } catch (e) {
        // Invalid regex
      }
    } else if (options.wholeWord) {
      const flags = options.caseSensitive ? 'g' : 'gi'
      const regex = new RegExp(`\\b${this.escapeRegex(normalizedQuery)}\\b`, flags)
      let match
      while ((match = regex.exec(text)) !== null) {
        matches.push({
          field,
          value: text.substring(match.index, match.index + match[0].length),
          index: match.index,
          length: match[0].length,
        })
      }
    } else {
      let startIndex = 0
      while (true) {
        const index = normalizedText.indexOf(normalizedQuery, startIndex)
        if (index === -1) break

        matches.push({
          field,
          value: text.substring(index, index + query.length),
          index,
          length: query.length,
        })
        startIndex = index + 1
      }
    }

    return matches
  }

  private calculateScore(matches: SearchMatch[]): number {
    let score = 0
    for (const match of matches) {
      if (match.field === 'title') {
        score += 10
      } else {
        score += 1
      }
    }
    return score
  }

  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }

  getLastResults(): SearchResult[] {
    return this.lastResults
  }

  getCurrentIndex(): number {
    return this.currentIndex
  }

  setCurrentIndex(index: number): void {
    if (index >= 0 && index < this.lastResults.length) {
      this.currentIndex = index
    }
  }

  getNext(): SearchResult | null {
    if (this.lastResults.length === 0) return null
    this.currentIndex = (this.currentIndex + 1) % this.lastResults.length
    return this.lastResults[this.currentIndex] ?? null
  }

  getPrevious(): SearchResult | null {
    if (this.lastResults.length === 0) return null
    this.currentIndex =
      (this.currentIndex - 1 + this.lastResults.length) %
      this.lastResults.length
    return this.lastResults[this.currentIndex] ?? null
  }
}

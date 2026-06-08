import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StyleResolver } from './style-resolver'

describe('StyleResolver', () => {
  let resolver: StyleResolver

  beforeEach(() => {
    resolver = new StyleResolver({
      'fo:font-family': 'Arial',
      'fo:font-size': 14,
      'fo:color': '#333',
    })
  })

  it('should resolve unit with explicit styles', () => {
    const unit = { text: 'Hello', 'fo:font-weight': 'bold' }
    const resolved = resolver.resolveUnit(unit)
    expect(resolved['fo:font-weight']).toBe('bold')
  })

  it('should use theme defaults', () => {
    const unit = { text: 'Hello' }
    const resolved = resolver.resolveUnit(unit)
    expect(resolved['fo:font-family']).toBe('Arial')
    expect(resolved['fo:font-size']).toBe(14)
  })

  it('should use parent style over theme defaults', () => {
    const unit = { text: 'Hello' }
    const context = {
      parentStyle: {
        'fo:font-family': 'Helvetica',
      },
    }
    const resolved = resolver.resolveUnit(unit, context)
    expect(resolved['fo:font-family']).toBe('Helvetica')
  })

  it('should use explicit style over parent style', () => {
    const unit = { text: 'Hello', 'fo:font-family': 'Courier' }
    const context = {
      parentStyle: {
        'fo:font-family': 'Helvetica',
      },
    }
    const resolved = resolver.resolveUnit(unit, context)
    expect(resolved['fo:font-family']).toBe('Courier')
  })

  it('should get base style', () => {
    const base = resolver.getBaseStyle()
    expect(base['fo:font-family']).toBe('Arial')
    expect(base['fo:font-size']).toBe(14)
  })

  it('should clear cache and still work', () => {
    resolver.resolveUnit({ text: 'Hello' })
    resolver.clearCache()
    const resolved = resolver.resolveUnit({ text: 'Hello' })
    expect(resolved['fo:font-family']).toBe('Arial')
  })
})

import { describe, it, expect } from 'vitest'
import {
  AttributeTitle,
  isAttributeTitleEmpty,
  isRichAttributeTitle,
  getPlainTextFromAttributeTitle,
  createAttributeTitleFromPlainText,
  createAttributeTitleUnit,
  normalizeAttributeTitle,
  isEqualAttributeTitle,
  extractGlobalStyle,
  removeGlobalStyleFromAttributeTitle,
} from '@y-mindmap/core'

describe('AttributeTitle', () => {
  describe('isAttributeTitleEmpty', () => {
    it('should return true for undefined', () => {
      expect(isAttributeTitleEmpty(undefined)).toBe(true)
    })

    it('should return true for empty array', () => {
      expect(isAttributeTitleEmpty([])).toBe(true)
    })

    it('should return false for non-empty array', () => {
      expect(isAttributeTitleEmpty([{ text: 'Hello' }])).toBe(false)
    })
  })

  describe('isRichAttributeTitle', () => {
    it('should return false for undefined', () => {
      expect(isRichAttributeTitle(undefined)).toBe(false)
    })

    it('should return false for empty array', () => {
      expect(isRichAttributeTitle([])).toBe(false)
    })

    it('should return false for plain text only', () => {
      expect(isRichAttributeTitle([{ text: 'Hello' }])).toBe(false)
    })

    it('should return true for styled text', () => {
      expect(isRichAttributeTitle([
        { text: 'Hello', 'fo:font-weight': 'bold' },
      ])).toBe(true)
    })

    it('should return true for text with href', () => {
      expect(isRichAttributeTitle([
        { text: 'Link', href: 'https://example.com' },
      ])).toBe(true)
    })

    it('should return true for text with formula', () => {
      expect(isRichAttributeTitle([
        { text: 'E=mc²', formula: 'mc^2' },
      ])).toBe(true)
    })
  })

  describe('getPlainTextFromAttributeTitle', () => {
    it('should return empty string for undefined', () => {
      expect(getPlainTextFromAttributeTitle(undefined)).toBe('')
    })

    it('should return empty string for empty array', () => {
      expect(getPlainTextFromAttributeTitle([])).toBe('')
    })

    it('should concatenate text from all units', () => {
      const title: AttributeTitle = [
        { text: 'Hello ' },
        { text: 'World' },
      ]
      expect(getPlainTextFromAttributeTitle(title)).toBe('Hello World')
    })
  })

  describe('createAttributeTitleFromPlainText', () => {
    it('should create array with single unit', () => {
      const result = createAttributeTitleFromPlainText('Hello World')
      expect(result).toEqual([{ text: 'Hello World' }])
    })

    it('should return empty array for empty string', () => {
      expect(createAttributeTitleFromPlainText('')).toEqual([])
    })
  })

  describe('createAttributeTitleUnit', () => {
    it('should create unit with text only', () => {
      const unit = createAttributeTitleUnit('Hello')
      expect(unit).toEqual({ text: 'Hello' })
    })

    it('should create unit with styles', () => {
      const unit = createAttributeTitleUnit('Hello', {
        'fo:font-weight': 'bold',
        'fo:color': '#ff0000',
      })
      expect(unit).toEqual({
        text: 'Hello',
        'fo:font-weight': 'bold',
        'fo:color': '#ff0000',
      })
    })

    it('should create unit with extras', () => {
      const unit = createAttributeTitleUnit('Link', undefined, {
        href: 'https://example.com',
      })
      expect(unit).toEqual({
        text: 'Link',
        href: 'https://example.com',
      })
    })
  })

  describe('normalizeAttributeTitle', () => {
    it('should return plain title for empty attributeTitle', () => {
      const result = normalizeAttributeTitle([], 'Hello')
      expect(result).toEqual({ title: 'Hello' })
    })

    it('should return both title and attributeTitle', () => {
      const attributeTitle: AttributeTitle = [
        { text: 'Hello ' },
        { text: 'World', 'fo:color': '#ff0000' },
      ]
      const result = normalizeAttributeTitle(attributeTitle, 'Old Title')
      expect(result.title).toBe('Hello World')
      expect(result.attributeTitle).toEqual(attributeTitle)
    })
  })

  describe('isEqualAttributeTitle', () => {
    it('should return true for both undefined', () => {
      expect(isEqualAttributeTitle(undefined, undefined)).toBe(true)
    })

    it('should return true for both empty', () => {
      expect(isEqualAttributeTitle([], [])).toBe(true)
    })

    it('should return false for different lengths', () => {
      expect(isEqualAttributeTitle(
        [{ text: 'Hello' }],
        [{ text: 'Hello' }, { text: ' World' }],
      )).toBe(false)
    })

    it('should return true for identical content', () => {
      const a: AttributeTitle = [
        { text: 'Hello ', 'fo:font-weight': 'bold' },
        { text: 'World', 'fo:color': '#ff0000' },
      ]
      const b: AttributeTitle = [
        { text: 'Hello ', 'fo:font-weight': 'bold' },
        { text: 'World', 'fo:color': '#ff0000' },
      ]
      expect(isEqualAttributeTitle(a, b)).toBe(true)
    })

    it('should return false for different content', () => {
      const a: AttributeTitle = [{ text: 'Hello' }]
      const b: AttributeTitle = [{ text: 'World' }]
      expect(isEqualAttributeTitle(a, b)).toBe(false)
    })

    it('should return false for different styles', () => {
      const a: AttributeTitle = [{ text: 'Hello', 'fo:font-weight': 'bold' }]
      const b: AttributeTitle = [{ text: 'Hello', 'fo:font-weight': 'normal' }]
      expect(isEqualAttributeTitle(a, b)).toBe(false)
    })
  })

  describe('extractGlobalStyle', () => {
    it('should return undefined for empty title', () => {
      expect(extractGlobalStyle([])).toBeUndefined()
    })

    it('should return undefined for undefined', () => {
      expect(extractGlobalStyle(undefined)).toBeUndefined()
    })

    it('should extract common style', () => {
      const title: AttributeTitle = [
        { text: 'Hello', 'fo:font-weight': 'bold' },
        { text: 'World', 'fo:font-weight': 'bold' },
      ]
      const result = extractGlobalStyle(title)
      expect(result).toEqual({ 'fo:font-weight': 'bold' })
    })

    it('should return undefined for mixed styles', () => {
      const title: AttributeTitle = [
        { text: 'Hello', 'fo:font-weight': 'bold' },
        { text: 'World', 'fo:font-weight': 'normal' },
      ]
      const result = extractGlobalStyle(title)
      expect(result).toBeUndefined()
    })
  })

  describe('removeGlobalStyleFromAttributeTitle', () => {
    it('should remove global style from all units', () => {
      const title: AttributeTitle = [
        { text: 'Hello', 'fo:font-weight': 'bold', 'fo:color': '#ff0000' },
        { text: 'World', 'fo:font-weight': 'bold', 'fo:color': '#00ff00' },
      ]
      const result = removeGlobalStyleFromAttributeTitle(title, {
        'fo:font-weight': 'bold',
      })
      expect(result).toEqual([
        { text: 'Hello', 'fo:color': '#ff0000' },
        { text: 'World', 'fo:color': '#00ff00' },
      ])
    })
  })
})

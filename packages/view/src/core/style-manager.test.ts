import { describe, it, expect, beforeEach, vi } from 'vitest'
import { StyleManager } from './style-manager'
import { StyleKey, DEFAULT_TOPIC_STYLE, DEFAULT_CONNECTION_STYLE } from '@y-mindmap/core'
import type { NodeView } from './node-view'
import type { MindMapNode } from '@y-mindmap/state'

vi.mock('./theme-manager', () => ({
  themeManager: {
    getThemeStyleValue: vi.fn(),
  },
}))

function createMockNodeView(overrides: Partial<NodeView> = {}): NodeView {
  return {
    getNode: () => ({
      id: 'test-node',
      type: 'attached',
      style: null,
    } as unknown as MindMapNode),
    getParent: () => null,
    ...overrides,
  } as unknown as NodeView
}

describe('StyleManager', () => {
  let styleManager: StyleManager

  beforeEach(() => {
    styleManager = new StyleManager()
  })

  describe('getStyleValue', () => {
    it('should return node style when available', () => {
      const nodeView = createMockNodeView({
        getNode: () => ({
          id: 'test',
          type: 'attached',
          style: {
            properties: {
              [StyleKey.FILL_COLOR]: '#ff0000',
            },
          },
        } as unknown as MindMapNode),
      })

      const value = styleManager.getStyleValue(nodeView, StyleKey.FILL_COLOR)
      expect(value).toBe('#ff0000')
    })

    it('should return default style when no node style', () => {
      const nodeView = createMockNodeView()
      const value = styleManager.getStyleValue(nodeView, StyleKey.FILL_COLOR)
      expect(value).toBe(DEFAULT_TOPIC_STYLE.fillColor)
    })

    it('should cache style values', () => {
      const nodeView = createMockNodeView()
      
      const value1 = styleManager.getStyleValue(nodeView, StyleKey.FILL_COLOR)
      const value2 = styleManager.getStyleValue(nodeView, StyleKey.FILL_COLOR)
      
      expect(value1).toBe(value2)
    })
  })

  describe('invalidateCache', () => {
    it('should clear cache for specific node', () => {
      const nodeView = createMockNodeView()
      
      styleManager.getStyleValue(nodeView, StyleKey.FILL_COLOR)
      styleManager.invalidateCache(nodeView)
      
      const value = styleManager.getStyleValue(nodeView, StyleKey.FILL_COLOR)
      expect(value).toBeDefined()
    })
  })

  describe('getDefaultStyleValue', () => {
    it('should return default fill color', () => {
      const value = styleManager.getDefaultStyleValue(StyleKey.FILL_COLOR)
      expect(value).toBe(DEFAULT_TOPIC_STYLE.fillColor)
    })

    it('should return default text color', () => {
      const value = styleManager.getDefaultStyleValue(StyleKey.TEXT_COLOR)
      expect(value).toBe(DEFAULT_TOPIC_STYLE.textColor)
    })

    it('should return default line color', () => {
      const value = styleManager.getDefaultStyleValue(StyleKey.LINE_COLOR)
      expect(value).toBe(DEFAULT_CONNECTION_STYLE.lineColor)
    })

    it('should return default font size', () => {
      const value = styleManager.getDefaultStyleValue(StyleKey.FONT_SIZE)
      expect(value).toBe(DEFAULT_TOPIC_STYLE.fontSize)
    })
  })

  describe('computeVisualFillColor', () => {
    it('should return undefined for none fill', () => {
      const nodeView = createMockNodeView({
        getNode: () => ({
          id: 'test',
          type: 'attached',
          style: {
            properties: {
              [StyleKey.FILL_COLOR]: 'none',
            },
          },
        } as unknown as MindMapNode),
      })

      const result = styleManager.computeVisualFillColor(nodeView)
      expect(result).toBeUndefined()
    })

    it('should return full opacity color as-is', () => {
      const nodeView = createMockNodeView({
        getNode: () => ({
          id: 'test',
          type: 'attached',
          style: {
            properties: {
              [StyleKey.FILL_COLOR]: '#ff0000',
            },
          },
        } as unknown as MindMapNode),
      })

      const result = styleManager.computeVisualFillColor(nodeView)
      expect(result).toBe('#ff0000')
    })

    it('should blend semi-transparent color with background', () => {
      const nodeView = createMockNodeView({
        getNode: () => ({
          id: 'test',
          type: 'attached',
          style: {
            properties: {
              [StyleKey.FILL_COLOR]: 'rgba(255, 0, 0, 0.5)',
            },
          },
        } as unknown as MindMapNode),
      })

      const result = styleManager.computeVisualFillColor(nodeView, '#ffffff')
      expect(result).toBeDefined()
      expect(result).not.toBe('rgba(255, 0, 0, 0.5)')
    })
  })

  describe('getStyleValueOrDefault', () => {
    it('should return style value when available', () => {
      const nodeView = createMockNodeView({
        getNode: () => ({
          id: 'test',
          type: 'attached',
          style: {
            properties: {
              [StyleKey.FILL_COLOR]: '#custom',
            },
          },
        } as unknown as MindMapNode),
      })

      const value = styleManager.getStyleValueOrDefault(nodeView, StyleKey.FILL_COLOR, '#default')
      expect(value).toBe('#custom')
    })

    it('should return default when style not available', () => {
      const nodeView = createMockNodeView()
      const value = styleManager.getStyleValueOrDefault(nodeView, StyleKey.FILL_COLOR, '#default')
      expect(value).not.toBe('#default')
    })
  })
})

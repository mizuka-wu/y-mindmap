import type { ThemeData, StyleData } from '@y-mindmap/core'
import { StyleKey, PRESET_THEMES } from '@y-mindmap/core'

export type ThemeChangeListener = (theme: ThemeData) => void

export class ThemeManager {
  private static instance: ThemeManager
  private _currentTheme: ThemeData
  private _listeners: Set<ThemeChangeListener> = new Set()

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  constructor() {
    this._currentTheme = PRESET_THEMES.default!
  }

  getTheme(): ThemeData {
    return this._currentTheme
  }

  setTheme(theme: ThemeData): void {
    this._currentTheme = theme
    this._notifyListeners()
  }

  setThemeById(themeId: string): void {
    const theme = PRESET_THEMES[themeId]
    if (theme) {
      this.setTheme(theme)
    }
  }

  onThemeChange(listener: ThemeChangeListener): () => void {
    this._listeners.add(listener)
    return () => {
      this._listeners.delete(listener)
    }
  }

  private _notifyListeners(): void {
    for (const listener of this._listeners) {
      listener(this._currentTheme)
    }
  }

  /**
   * Get theme style value for a specific node level
   * @param level - 'central' | 'main' | 'sub'
   * @param key - StyleKey to look up
   */
  getThemeStyleValue(level: 'central' | 'main' | 'sub', key: StyleKey): any {
    const styleMap: Record<string, StyleData | undefined> = {
      central: this._currentTheme.centralTopic,
      main: this._currentTheme.mainTopic,
      sub: this._currentTheme.subTopic,
    }

    const style = styleMap[level]
    if (!style?.properties) return undefined
    return style.properties[key]
  }

  /**
   * Get connection style from theme
   */
  getConnectionStyleValue(key: StyleKey): any {
    const connections = this._currentTheme.connections
    if (!connections?.properties) return undefined
    return connections.properties[key]
  }

  /**
   * Get background color from theme
   */
  getBackgroundColor(): string | undefined {
    return this._currentTheme.background?.color
  }
}

export const themeManager = ThemeManager.getInstance()

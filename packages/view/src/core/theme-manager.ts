import type { ThemeData, StyleData } from '@y-mindmap/core'
import { StyleKey, PRESET_THEMES } from '@y-mindmap/core'

export type ThemeChangeListener = (theme: ThemeData) => void

export class ThemeManager {
  private static instance: ThemeManager
  private _currentTheme: ThemeData
  private _registeredThemes: Map<string, ThemeData> = new Map()
  private _listeners: Set<ThemeChangeListener> = new Set()

  static getInstance(): ThemeManager {
    if (!ThemeManager.instance) {
      ThemeManager.instance = new ThemeManager()
    }
    return ThemeManager.instance
  }

  constructor() {
    // Register all preset themes
    for (const [id, theme] of Object.entries(PRESET_THEMES)) {
      this._registeredThemes.set(id, theme)
    }
    this._currentTheme = this._registeredThemes.get('default')!
  }

  // ── Theme access ──

  getTheme(): ThemeData {
    return this._currentTheme
  }

  setTheme(theme: ThemeData): void {
    this._currentTheme = theme
    // Auto-register if it has an id and isn't already registered
    if (theme.id && !this._registeredThemes.has(theme.id)) {
      this._registeredThemes.set(theme.id, theme)
    }
    this._notifyListeners()
  }

  setThemeById(themeId: string): void {
    const theme = this._registeredThemes.get(themeId)
    if (theme) {
      this.setTheme(theme)
    }
  }

  // ── Theme registry ──

  /**
   * Register a custom theme. If a theme with the same id exists, it is overwritten.
   */
  registerTheme(theme: ThemeData): void {
    this._registeredThemes.set(theme.id, theme)
  }

  /**
   * Unregister a custom theme. Preset themes cannot be removed.
   */
  unregisterTheme(themeId: string): void {
    if (PRESET_THEMES[themeId]) return // protect presets
    this._registeredThemes.delete(themeId)
  }

  /**
   * Get a theme by id (preset or registered).
   */
  getThemeById(themeId: string): ThemeData | undefined {
    return this._registeredThemes.get(themeId)
  }

  /**
   * List all available themes (presets + registered).
   * Returns lightweight descriptors: { id, title }.
   */
  getAvailableThemes(): Array<{ id: string; title: string }> {
    const seen = new Set<string>()
    const result: Array<{ id: string; title: string }> = []
    for (const [id, theme] of this._registeredThemes) {
      if (!seen.has(id)) {
        seen.add(id)
        result.push({ id, title: theme.title ?? id })
      }
    }
    return result
  }

  /**
   * Export a theme as a plain JSON-serializable object.
   * If no id is given, exports the current theme.
   */
  exportTheme(themeId?: string): ThemeData | null {
    if (themeId) {
      return this._registeredThemes.get(themeId) ?? null
    }
    return { ...this._currentTheme }
  }

  /**
   * Import a theme from a plain object and register it.
   */
  importTheme(data: ThemeData): void {
    if (!data.id) return
    this.registerTheme(data)
  }

  // ── Listener ──

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

  // ── Style resolution ──

  /**
   * All node-level theme categories, in lookup order.
   * Maps a resolved node level to the ThemeData field.
   */
  private static readonly LEVEL_FIELDS: Record<string, keyof ThemeData> = {
    central: 'centralTopic',
    main: 'mainTopic',
    sub: 'subTopic',
    floating: 'floatingTopic',
    boundary: 'boundary',
    relationship: 'relationship',
    summary: 'summary',
  }

  /**
   * Get theme style value for a specific node level.
   */
  getThemeStyleValue(level: string, key: StyleKey): any {
    const fieldName = ThemeManager.LEVEL_FIELDS[level]
    if (!fieldName) return undefined

    const style = this._currentTheme[fieldName] as StyleData | undefined
    if (!style?.properties) return undefined
    return style.properties[key]
  }

  /**
   * Get connection style from theme.
   */
  getConnectionStyleValue(key: StyleKey): any {
    const connections = this._currentTheme.connections
    if (!connections?.properties) return undefined
    return connections.properties[key]
  }

  /**
   * Get map-level style from theme.
   */
  getMapStyleValue(key: StyleKey): any {
    const map = this._currentTheme.map
    if (!map?.properties) return undefined
    return map.properties[key]
  }

  /**
   * Get background color from theme.
   */
  getBackgroundColor(): string | undefined {
    return this._currentTheme.background?.color
  }

  /**
   * Get background gradient from theme.
   */
  getBackgroundGradient(): ThemeData['background'] {
    return this._currentTheme.background
  }

  /**
   * Get wallpaper from theme.
   */
  getWallpaper(): ThemeData['wallpaper'] {
    return this._currentTheme.wallpaper
  }
}

export const themeManager = ThemeManager.getInstance()

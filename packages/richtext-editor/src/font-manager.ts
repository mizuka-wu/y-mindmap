export interface FontFace {
  family: string
  src: string
  weight?: string
  style?: string
  display?: string
}

export interface FontLoadEvent {
  family: string
  status: 'loading' | 'loaded' | 'error'
}

export class FontManager {
  private loadedFonts: Map<string, FontFace> = new Map()
  private loadingFonts: Map<string, Promise<void>> = new Map()
  private callbacks: Set<(event: FontLoadEvent) => void> = new Set()
  private observer: FontFaceSetLoadObserver | null = null

  constructor() {
    if (typeof document !== 'undefined' && document.fonts) {
      this.observer = new FontFaceSetLoadObserver()
      document.fonts.addEventListener('loadingdone', () => {
        this.notifyAll()
      })
    }
  }

  async loadFont(family: string, src: string, options: Partial<FontFace> = {}): Promise<void> {
    if (this.loadedFonts.has(family)) {
      return
    }

    if (this.loadingFonts.has(family)) {
      return this.loadingFonts.get(family)
    }

    const promise = this.doLoadFont(family, src, options)
    this.loadingFonts.set(family, promise)

    try {
      await promise
      this.loadedFonts.set(family, { family, src, ...options })
      this.emit({ family, status: 'loaded' })
    } catch (error) {
      this.emit({ family, status: 'error' })
      throw error
    } finally {
      this.loadingFonts.delete(family)
    }
  }

  async loadFonts(fonts: FontFace[]): Promise<void> {
    await Promise.all(fonts.map(font => 
      this.loadFont(font.family, font.src, font)
    ))
  }

  isFontLoaded(family: string): boolean {
    return this.loadedFonts.has(family)
  }

  isFontLoading(family: string): boolean {
    return this.loadingFonts.has(family)
  }

  getLoadedFonts(): FontFace[] {
    return Array.from(this.loadedFonts.values())
  }

  onFontLoaded(callback: (event: FontLoadEvent) => void): void {
    this.callbacks.add(callback)
  }

  offFontLoaded(callback: (event: FontLoadEvent) => void): void {
    this.callbacks.delete(callback)
  }

  waitForFont(family: string, timeout: number = 5000): Promise<boolean> {
    if (this.isFontLoaded(family)) {
      return Promise.resolve(true)
    }

    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.offFontLoaded(listener)
        resolve(false)
      }, timeout)

      const listener = (event: FontLoadEvent) => {
        if (event.family === family) {
          clearTimeout(timer)
          this.offFontLoaded(listener)
          resolve(event.status === 'loaded')
        }
      }

      this.onFontLoaded(listener)
    })
  }

  async ensureFontsLoaded(families: string[]): Promise<void> {
    const promises = families.map(family => this.waitForFont(family))
    await Promise.all(promises)
  }

  destroy(): void {
    this.callbacks.clear()
    this.loadingFonts.clear()
    this.loadedFonts.clear()
  }

  private async doLoadFont(family: string, src: string, options: Partial<FontFace>): Promise<void> {
    if (typeof FontFace === 'undefined') {
      throw new Error('FontFace API not supported')
    }

    const fontFace = new FontFace(family, `url(${src})`, {
      weight: options.weight || 'normal',
      style: options.style || 'normal',
      display: (options.display || 'swap') as FontDisplay,
    })

    const loadedFace = await fontFace.load()
    document.fonts.add(loadedFace)
  }

  private emit(event: FontLoadEvent): void {
    for (const callback of this.callbacks) {
      try {
        callback(event)
      } catch (error) {
        console.error('Font load callback error:', error)
      }
    }
  }

  private notifyAll(): void {
    for (const [family] of this.loadedFonts) {
      this.emit({ family, status: 'loaded' })
    }
  }
}

class FontFaceSetLoadObserver {
  constructor() {
  }
}

let globalFontManager: FontManager | null = null

export function getFontManager(): FontManager {
  if (!globalFontManager) {
    globalFontManager = new FontManager()
  }
  return globalFontManager
}

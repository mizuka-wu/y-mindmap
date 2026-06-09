import katex from 'katex'

export interface MathJaxRenderOptions {
  fontSize?: number
  color?: string
  display?: boolean
}

export interface MathJaxRenderResult {
  html: string
  width: number
  height: number
  dataUri: string
}

const renderCache = new Map<string, MathJaxRenderResult>()

function getCacheKey(formula: string, options: MathJaxRenderOptions): string {
  return `${formula}::${options.fontSize || 14}::${options.color || '#333333'}::${options.display || false}`
}

function htmlToDataUri(html: string): string {
  const encoded = encodeURIComponent(html)
  return `data:text/html,${encoded}`
}

export function renderFormula(
  formula: string,
  options: MathJaxRenderOptions = {}
): MathJaxRenderResult {
  const cacheKey = getCacheKey(formula, options)
  const cached = renderCache.get(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const html = katex.renderToString(formula, {
      displayMode: options.display ?? true,
      throwOnError: false,
      output: 'html',
    })

    const fontSize = options.fontSize || 14
    const estimatedWidth = Math.max(50, formula.length * fontSize * 0.6)
    const estimatedHeight = fontSize * 2

    const dataUri = htmlToDataUri(html)

    const result: MathJaxRenderResult = {
      html,
      width: estimatedWidth,
      height: estimatedHeight,
      dataUri,
    }

    renderCache.set(cacheKey, result)
    return result
  } catch (error) {
    console.error('KaTeX rendering failed:', error)
    return {
      html: formula,
      width: 100,
      height: 30,
      dataUri: htmlToDataUri(formula),
    }
  }
}

export function clearCache(): void {
  renderCache.clear()
}

export default {
  renderFormula,
  clearCache,
}

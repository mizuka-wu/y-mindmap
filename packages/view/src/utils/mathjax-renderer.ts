import { mathjax } from 'mathjax-full/js/mathjax.js'
import { TeX } from 'mathjax-full/js/input/tex.js'
import { SVG } from 'mathjax-full/js/output/svg.js'
import { liteAdaptor } from 'mathjax-full/js/adaptors/liteAdaptor.js'
import { RegisterHTMLHandler } from 'mathjax-full/js/handlers/html.js'
import { AllPackages } from 'mathjax-full/js/input/tex/AllPackages.js'

export interface MathJaxRenderOptions {
  fontSize?: number
  color?: string
  display?: boolean
}

export interface MathJaxRenderResult {
  svg: string
  width: number
  height: number
  dataUri: string
}

const renderCache = new Map<string, MathJaxRenderResult>()
let mathJaxInstance: ReturnType<typeof mathjax.document> | null = null

function getMathJaxDocument() {
  if (mathJaxInstance) {
    return mathJaxInstance
  }

  const adaptor = liteAdaptor()
  RegisterHTMLHandler(adaptor)

  mathJaxInstance = mathjax.document('', {
    InputJax: new TeX({
      packages: AllPackages,
      inlineMath: [['$', '$']],
      displayMath: [['$$', '$$']],
    }),
    OutputJax: new SVG({
      fontCache: 'none',
    }),
  })

  return mathJaxInstance
}

function getCacheKey(formula: string, options: MathJaxRenderOptions): string {
  return `${formula}::${options.fontSize || 14}::${options.color || '#333333'}::${options.display || false}`
}

function svgToDataUri(svg: string): string {
  const encoded = encodeURIComponent(svg)
  return `data:image/svg+xml,${encoded}`
}

function extractSvgDimensions(svg: string): { width: number; height: number } {
  const widthMatch = svg.match(/width="([^"]+)"/)
  const heightMatch = svg.match(/height="([^"]+)"/)

  let width = 0
  let height = 0

  if (widthMatch?.[1]) {
    width = parseFloat(widthMatch[1])
  }
  if (heightMatch?.[1]) {
    height = parseFloat(heightMatch[1])
  }

  if (width === 0 || height === 0) {
    const viewBoxMatch = svg.match(/viewBox="([^"]+)"/)
    if (viewBoxMatch?.[1]) {
      const parts = viewBoxMatch[1].split(/\s+/)
      if (parts.length === 4 && parts[2] && parts[3]) {
        width = parseFloat(parts[2])
        height = parseFloat(parts[3])
      }
    }
  }

  return { width, height }
}

export async function renderFormula(
  formula: string,
  options: MathJaxRenderOptions = {}
): Promise<MathJaxRenderResult> {
  const cacheKey = getCacheKey(formula, options)
  const cached = renderCache.get(cacheKey)
  if (cached) {
    return cached
  }

  try {
    const doc = getMathJaxDocument()
    const node = doc.convert(formula, {
      display: options.display ?? true,
    })

    const adaptor = doc.adaptor
    let svg = adaptor.outerHTML(node)
    const { width, height } = extractSvgDimensions(svg)

    if (options.color) {
      svg = svg.replace(/fill="[^"]*"/g, `fill="${options.color}"`)
      svg = svg.replace(/stroke="[^"]*"/g, `stroke="${options.color}"`)
    }

    const dataUri = svgToDataUri(svg)

    const result: MathJaxRenderResult = {
      svg,
      width,
      height,
      dataUri,
    }

    renderCache.set(cacheKey, result)

    return result
  } catch (error) {
    console.error('MathJax rendering failed:', error)
    const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="30"><text x="10" y="20" fill="#999">${formula}</text></svg>`
    return {
      svg: fallbackSvg,
      width: 100,
      height: 30,
      dataUri: svgToDataUri(fallbackSvg),
    }
  }
}

export function clearCache(): void {
  renderCache.clear()
}

export async function warmup(): Promise<void> {
  await renderFormula('x^2 + y^2 = z^2').catch(() => {})
}

export default {
  renderFormula,
  clearCache,
  warmup,
}

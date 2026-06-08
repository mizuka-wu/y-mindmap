import { Size, Bounds, DEFAULT_TOPIC_STYLE } from '@y-mindmap/core'

/**
 * 标题测量器接口
 * 
 * 抽象层，支持多种测量实现：
 * - PlainTextMeasurer: 纯文本测量
 * - RichTextMeasurer: 富文本测量 (未来)
 * - CanvasMeasurer: Canvas 测量 (未来)
 */
export interface TitleMeasurer {
  /** 测量器类型 */
  readonly type: 'plain' | 'richtext' | 'canvas'
  
  /**
   * 测量标题尺寸
   * @param text 标题文本
   * @param style 样式配置
   * @param constraints 约束条件
   * @returns 测量结果
   */
  measure(text: string, style: TitleStyle, constraints?: MeasureConstraints): MeasureResult
  
  /**
   * 测量单行文字高度
   * @param style 样式配置
   * @returns 行高
   */
  getLineHeight(style: TitleStyle): number
  
  /**
   * 测量文字宽度
   * @param text 文字内容
   * @param style 样式配置
   * @returns 宽度
   */
  measureWidth(text: string, style: TitleStyle): number
  
  /**
   * 计算自动换行
   * @param text 文字内容
   * @param maxWidth 最大宽度
   * @param style 样式配置
   * @returns 换行后的行数组
   */
  wrapText(text: string, maxWidth: number, style: TitleStyle): string[]
  
  /**
   * 销毁测量器
   */
  destroy(): void
}

export interface TitleStyle {
  fontFamily: string
  fontSize: number
  fontWeight: string | number
  fontStyle: string
  letterSpacing?: number
  lineHeight?: number
}

export interface MeasureConstraints {
  /** 最大宽度 */
  maxWidth?: number
  
  /** 最大高度 */
  maxHeight?: number
  
  /** 最大行数 */
  maxLines?: number
  
  /** 最小宽度 */
  minWidth?: number
  
  /** 最小高度 */
  minHeight?: number
}

export interface MeasureResult {
  /** 测量后的宽度 */
  width: number
  
  /** 测量后的高度 */
  height: number
  
  /** 换行后的行数 */
  lineCount: number
  
  /** 每行的内容 */
  lines: string[]
  
  /** 是否被截断 */
  truncated: boolean
  
  /** 实际使用的字体大小 */
  actualFontSize: number
}

/**
 * 默认节点尺寸
 */
export const DEFAULT_NODE_SIZES = {
  /** 最小宽度 */
  MIN_WIDTH: 80,
  
  /** 最小高度 */
  MIN_HEIGHT: 32,
  
  /** 最大宽度 */
  MAX_WIDTH: 400,
  
  /** 最大高度 */
  MAX_HEIGHT: 200,
  
  /** 水平内边距 */
  PADDING_X: 20,
  
  /** 垂直内边距 */
  PADDING_Y: 16,
  
  /** 默认行高倍数 */
  LINE_HEIGHT_RATIO: 1.2,
}

/**
 * 获取节点样式
 */
export function getNodeStyle(node: any): TitleStyle {
  const nodeStyle = node.style?.properties || {}
  
  return {
    fontFamily: nodeStyle['font-family'] || DEFAULT_TOPIC_STYLE.fontFamily || 'Arial',
    fontSize: nodeStyle['font-size'] || DEFAULT_TOPIC_STYLE.fontSize || 14,
    fontWeight: nodeStyle['font-weight'] || DEFAULT_TOPIC_STYLE.fontWeight || 'normal',
    fontStyle: nodeStyle['font-style'] || DEFAULT_TOPIC_STYLE.fontStyle || 'normal',
    letterSpacing: nodeStyle['letter-spacing'] || 0,
    lineHeight: nodeStyle['line-height'] || DEFAULT_NODE_SIZES.LINE_HEIGHT_RATIO,
  }
}

/**
 * 计算节点尺寸
 */
export function calculateNodeSize(
  node: any,
  measurer: TitleMeasurer,
  constraints?: MeasureConstraints
): Size {
  const style = getNodeStyle(node)
  const title = node.title || ''
  
  const result = measurer.measure(title, style, {
    maxWidth: DEFAULT_NODE_SIZES.MAX_WIDTH - DEFAULT_NODE_SIZES.PADDING_X * 2,
    maxHeight: DEFAULT_NODE_SIZES.MAX_HEIGHT - DEFAULT_NODE_SIZES.PADDING_Y * 2,
    ...constraints,
  })
  
  return {
    width: Math.max(
      DEFAULT_NODE_SIZES.MIN_WIDTH,
      Math.min(
        DEFAULT_NODE_SIZES.MAX_WIDTH,
        result.width + DEFAULT_NODE_SIZES.PADDING_X * 2
      )
    ),
    height: Math.max(
      DEFAULT_NODE_SIZES.MIN_HEIGHT,
      Math.min(
        DEFAULT_NODE_SIZES.MAX_HEIGHT,
        result.height + DEFAULT_NODE_SIZES.PADDING_Y * 2
      )
    ),
  }
}

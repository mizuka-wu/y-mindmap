import { Bounds, Point } from '@y-mindmap/core'

/**
 * 标题编辑器接口
 * 
 * 抽象层，支持多种编辑器实现：
 * - PlainTextEditor: 纯文本编辑器
 * - RichTextEditor: 富文本编辑器 (未来)
 * - MarkdownEditor: Markdown 编辑器 (未来)
 */
export interface TitleEditor {
  /** 编辑器类型 */
  readonly type: 'plain' | 'richtext' | 'markdown'
  
  /** 是否正在编辑 */
  readonly isEditing: boolean
  
  /** 当前编辑的节点 ID */
  readonly editingNodeId: string | null
  
  /**
   * 开始编辑
   * @param nodeId 节点 ID
   * @param title 当前标题
   * @param bounds 节点边界 (用于定位编辑器)
   * @param options 编辑选项
   */
  startEditing(
    nodeId: string,
    title: string,
    bounds: Bounds,
    options?: EditOptions
  ): void
  
  /**
   * 停止编辑并确认
   * @returns 编辑后的内容
   */
  stopEditing(): EditResult | null
  
  /**
   * 取消编辑
   */
  cancelEditing(): void
  
  /**
   * 获取当前编辑内容
   */
  getContent(): string
  
  /**
   * 设置编辑内容
   */
  setContent(content: string): void
  
  /**
   * 选中所有内容
   */
  selectAll(): void
  
  /**
   * 销毁编辑器
   */
  destroy(): void
}

export interface EditOptions {
  /** 占位符 */
  placeholder?: string
  
  /** 最大长度 */
  maxLength?: number
  
  /** 是否允许多行 */
  multiline?: boolean
  
  /** 自动选中 */
  autoSelect?: boolean
  
  /** 自动调整大小 */
  autoResize?: boolean
}

export interface EditResult {
  /** 节点 ID */
  nodeId: string
  
  /** 编辑后的内容 */
  content: string
  
  /** 原始内容 */
  originalContent: string
  
  /** 是否有变更 */
  changed: boolean
}

/**
 * 标题渲染器接口
 * 
 * 负责将标题内容渲染为可视元素
 */
export interface TitleRenderer {
  /** 渲染器类型 */
  readonly type: 'plain' | 'richtext' | 'markdown'
  
  /**
   * 渲染标题
   * @param content 标题内容
   * @param bounds 可用区域
   * @param style 样式配置
   * @returns 渲染结果
   */
  render(content: string, bounds: Bounds, style: TitleStyle): RenderResult
  
  /**
   * 测量标题尺寸
   * @param content 标题内容
   * @param maxWidth 最大宽度
   * @param style 样式配置
   * @returns 尺寸
   */
  measure(content: string, maxWidth: number, style: TitleStyle): Size
  
  /**
   * 销毁渲染器
   */
  destroy(): void
}

export interface TitleStyle {
  fontFamily: string
  fontSize: number
  fontWeight: string | number
  fontStyle: string
  color: string
  textAlign: 'left' | 'center' | 'right'
  lineHeight: number
  letterSpacing?: number
}

export interface RenderResult {
  /** 渲染的元素 */
  element: any
  
  /** 实际尺寸 */
  size: Size
  
  /** 是否被截断 */
  truncated: boolean
  
  /** 截断后的内容 */
  truncatedContent?: string
}

export interface Size {
  width: number
  height: number
}

/**
 * 编辑器事件
 */
export interface TitleEditorEvents {
  /** 开始编辑 */
  onEditStart?: (nodeId: string) => void
  
  /** 编辑中 */
  onEditing?: (nodeId: string, content: string) => void
  
  /** 确认编辑 */
  onEditConfirm?: (nodeId: string, content: string) => void
  
  /** 取消编辑 */
  onEditCancel?: (nodeId: string) => void
  
  /** 编辑错误 */
  onEditError?: (nodeId: string, error: Error) => void
}

import { StyleKey, DEFAULT_TOPIC_STYLE } from '@y-mindmap/core'
import { NodeView } from './node-view'
import { styleManager } from './style-manager'

/**
 * TitleableView - Base class for views with text titles.
 * Provides unified text style refresh logic matching Snowbrush's TitleableView pattern.
 * Subclasses must implement getStyledNode() to return the style source node.
 */
export abstract class TitleableView extends NodeView {
  protected abstract getStyledNode(): NodeView

  refreshTextStyles(): void {
    this.refreshTextColor()
    this.refreshTextDecoration()
    this.refreshTextAlign()
    this.refreshTextTransform()
    this.refreshFontSize()
    this.refreshFontFamily()
    this.refreshFontStyle()
    this.refreshFontWeight()
  }

  protected refreshTextColor(): void {
    const color = styleManager.getStyleValueOrDefault(
      this.getStyledNode(),
      StyleKey.TEXT_COLOR,
      DEFAULT_TOPIC_STYLE.textColor
    )
    this._applyTextColor(color)
  }

  protected refreshTextDecoration(): void {
    const decoration = styleManager.getStyleValueOrDefault(
      this.getStyledNode(),
      StyleKey.TEXT_DECORATION,
      DEFAULT_TOPIC_STYLE.textDecoration
    )
    this._applyTextDecoration(decoration)
  }

  protected refreshTextAlign(): void {
    const align = styleManager.getStyleValueOrDefault(
      this.getStyledNode(),
      StyleKey.TEXT_ALIGN,
      DEFAULT_TOPIC_STYLE.textAlign
    )
    this._applyTextAlign(align)
  }

  protected refreshTextTransform(): void {
    const transform = styleManager.getStyleValueOrDefault(
      this.getStyledNode(),
      StyleKey.TEXT_TRANSFORM,
      DEFAULT_TOPIC_STYLE.textTransform
    )
    this._applyTextTransform(transform)
  }

  protected refreshFontSize(): void {
    const size = styleManager.getStyleValueOrDefault(
      this.getStyledNode(),
      StyleKey.FONT_SIZE,
      DEFAULT_TOPIC_STYLE.fontSize
    )
    this._applyFontSize(typeof size === 'string' ? parseInt(size, 10) : size)
  }

  protected refreshFontFamily(): void {
    const family = styleManager.getStyleValueOrDefault(
      this.getStyledNode(),
      StyleKey.FONT_FAMILY,
      DEFAULT_TOPIC_STYLE.fontFamily
    )
    this._applyFontFamily(family)
  }

  protected refreshFontStyle(): void {
    const style = styleManager.getStyleValueOrDefault(
      this.getStyledNode(),
      StyleKey.FONT_STYLE,
      DEFAULT_TOPIC_STYLE.fontStyle
    )
    this._applyFontStyle(style)
  }

  protected refreshFontWeight(): void {
    const weight = styleManager.getStyleValueOrDefault(
      this.getStyledNode(),
      StyleKey.FONT_WEIGHT,
      DEFAULT_TOPIC_STYLE.fontWeight
    )
    this._applyFontWeight(weight)
  }

  protected _applyTextColor(_color: string): void {}
  protected _applyTextDecoration(_decoration: string): void {}
  protected _applyTextAlign(_align: string): void {}
  protected _applyTextTransform(_transform: string): void {}
  protected _applyFontSize(_size: number): void {}
  protected _applyFontFamily(_family: string): void {}
  protected _applyFontStyle(_style: string): void {}
  protected _applyFontWeight(_weight: string | number): void {}
}

export default TitleableView

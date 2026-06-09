import { StyleKey, DEFAULT_TOPIC_STYLE, DEFAULT_CONNECTION_STYLE } from '@y-mindmap/core'
import type { NodeView } from './node-view'

// Style inheritance (matching Snowbrush):
// - If parent is BranchNodeView → read from parent's node
// - If parent is TopicNodeView → read from parent's node (temp hierarchy)
// - BranchNodeView reads from own node
export class StyleManager {
  private static instance: StyleManager

  static getInstance(): StyleManager {
    if (!StyleManager.instance) {
      StyleManager.instance = new StyleManager()
    }
    return StyleManager.instance
  }

  getStyleValue(nodeView: NodeView, key: StyleKey): any {
    const sourceNode = this.getStyleSourceNode(nodeView)
    if (!sourceNode) return undefined

    const style = sourceNode.getNode().style
    if (!style?.properties) return undefined

    return style.properties[key]
  }

  getStyleValueOrDefault(nodeView: NodeView, key: StyleKey, defaultValue: any): any {
    const value = this.getStyleValue(nodeView, key)
    return value !== undefined ? value : defaultValue
  }

  // TopicNodeView → read from parent (BranchNodeView or TopicNodeView)
  // BranchNodeView → read from self
  private getStyleSourceNode(nodeView: NodeView): NodeView | null {
    const parent = nodeView.getParent()
    if (!parent) return nodeView

    // If parent has getStructureClass, it's a BranchNodeView
    if (this.isBranchNodeView(parent)) {
      return parent
    }

    // Parent is TopicNodeView (current hierarchy) - read from parent
    return parent
  }

  private isBranchNodeView(nodeView: NodeView): boolean {
    return typeof (nodeView as any).getStructureClass === 'function'
  }

  isCalloutBranch(branchView: NodeView): boolean {
    return branchView.getNode().type === 'callout'
  }

  getDefaultStyleValue(key: StyleKey): any {
    const defaults: Record<string, any> = {
      'shape-class': DEFAULT_TOPIC_STYLE.shapeClass,
      'corner-radius': DEFAULT_TOPIC_STYLE.cornerRadius,
      'fill-color': DEFAULT_TOPIC_STYLE.fillColor,
      'fill-opacity': DEFAULT_TOPIC_STYLE.fillOpacity,
      'border-color': DEFAULT_TOPIC_STYLE.borderColor,
      'border-width': DEFAULT_TOPIC_STYLE.borderWidth,
      'border-pattern': DEFAULT_TOPIC_STYLE.borderStyle,
      'border-opacity': DEFAULT_TOPIC_STYLE.borderOpacity,
      'font-family': DEFAULT_TOPIC_STYLE.fontFamily,
      'font-size': DEFAULT_TOPIC_STYLE.fontSize,
      'font-weight': DEFAULT_TOPIC_STYLE.fontWeight,
      'font-style': DEFAULT_TOPIC_STYLE.fontStyle,
      'text-color': DEFAULT_TOPIC_STYLE.textColor,
      'text-align': DEFAULT_TOPIC_STYLE.textAlign,
      'text-decoration': DEFAULT_TOPIC_STYLE.textDecoration,
      'text-transform': DEFAULT_TOPIC_STYLE.textTransform,
      'line-class': DEFAULT_CONNECTION_STYLE.lineClass,
      'line-color': DEFAULT_CONNECTION_STYLE.lineColor,
      'line-width': DEFAULT_CONNECTION_STYLE.lineWidth,
      'line-pattern': DEFAULT_CONNECTION_STYLE.lineStyle,
      'line-tapered': DEFAULT_CONNECTION_STYLE.tapered,
    }
    return defaults[key]
  }
}

export const styleManager = StyleManager.getInstance()

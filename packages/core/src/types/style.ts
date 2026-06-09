export interface StyleData {
  id: string
  properties: Partial<Record<StyleKey, any>>
}

export enum StyleKey {
  SHAPE_CLASS = 'shape-class',
  CORNER_RADIUS = 'corner-radius',
  FILL_COLOR = 'fill-color',
  FILL_GRADIENT = 'fill-gradient',
  FILL_PATTERN = 'fill-pattern',
  FILL_OPACITY = 'fill-opacity',
  BORDER_COLOR = 'border-color',
  BORDER_WIDTH = 'border-width',
  BORDER_PATTERN = 'border-pattern',
  BORDER_OPACITY = 'border-opacity',
  FONT_FAMILY = 'font-family',
  FONT_SIZE = 'font-size',
  FONT_WEIGHT = 'font-weight',
  FONT_STYLE = 'font-style',
  TEXT_COLOR = 'text-color',
  TEXT_ALIGN = 'text-align',
  TEXT_DECORATION = 'text-decoration',
  TEXT_TRANSFORM = 'text-transform',
  LINE_CLASS = 'line-class',
  LINE_COLOR = 'line-color',
  LINE_WIDTH = 'line-width',
  LINE_PATTERN = 'line-pattern',
  LINE_TAPERED = 'line-tapered',
  START_ARROW = 'start-arrow',
  END_ARROW = 'end-arrow',
  BORDER_LINE_PATTERN = 'border-line-pattern',
  LINE_CORNER = 'line-corner',
  SHADOW_COLOR = 'shadow-color',
  SHADOW_BLUR = 'shadow-blur',
  SHADOW_OFFSET_X = 'shadow-offset-x',
  SHADOW_OFFSET_Y = 'shadow-offset-y',
  PADDING_TOP = 'padding-top',
  PADDING_RIGHT = 'padding-right',
  PADDING_BOTTOM = 'padding-bottom',
  PADDING_LEFT = 'padding-left',
  MARGIN_TOP = 'margin-top',
  MARGIN_RIGHT = 'margin-right',
  MARGIN_BOTTOM = 'margin-bottom',
  MARGIN_LEFT = 'margin-left',
}

export interface NodeStyle {
  shapeClass?: string
  cornerRadius?: number
  fillColor?: string
  fillGradient?: GradientData
  fillPattern?: PatternData
  fillOpacity?: number
  borderColor?: string
  borderWidth?: number
  borderStyle?: 'solid' | 'dashed' | 'dotted'
  borderOpacity?: number
  fontFamily?: string
  fontSize?: number
  fontWeight?: 'normal' | 'bold' | number
  fontStyle?: 'normal' | 'italic'
  textColor?: string
  textAlign?: 'left' | 'center' | 'right'
  textDecoration?: 'none' | 'underline' | 'line-through'
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize'
  lineHeight?: number
  shadowColor?: string
  shadowBlur?: number
  shadowOffsetX?: number
  shadowOffsetY?: number
  paddingTop?: number
  paddingRight?: number
  paddingBottom?: number
  paddingLeft?: number
  marginTop?: number
  marginRight?: number
  marginBottom?: number
  marginLeft?: number
}

export interface ConnectionStyle {
  lineClass?: string
  lineColor?: string
  lineWidth?: number
  lineStyle?: 'solid' | 'dashed' | 'dotted'
  lineOpacity?: number
  lineCorner?: number
  tapered?: boolean
  startArrow?: ArrowStyle
  endArrow?: ArrowStyle
}

export interface ArrowStyle {
  type: 'none' | 'arrow' | 'circle' | 'diamond'
  size?: number
}

export interface GradientData {
  type: 'linear' | 'radial'
  stops: { offset: number; color: string }[]
  angle?: number
}

export interface PatternData {
  type: 'image' | 'pattern'
  src?: string
  repeat?: 'repeat' | 'repeat-x' | 'repeat-y' | 'no-repeat'
}

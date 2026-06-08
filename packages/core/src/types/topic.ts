import { StyleData, Point } from './common'

export interface TopicData {
  id: string
  title: string
  attributeTitle?: AttributeTitle
  type: TopicType
  style?: StyleData
  children?: Record<string, TopicData[]>
  markers?: MarkerData[]
  labels?: string[]
  notes?: NotesData
  image?: ImageData
  href?: string
  position?: Point
  structureClass?: StructureType
  branch?: 'expanded' | 'folded'
  customWidth?: number
  extensions?: ExtensionData[]
  titleUnedited?: boolean
  createdAt?: number
  updatedAt?: number
  attachments?: AttachmentData[]
  mathFormulas?: MathFormulaData[]
  codeBlocks?: CodeBlockData[]
}

export type AttributeTitle = AttributeTitleUnit[]

export interface AttributeTitleStyle {
  'fo:font-family'?: string
  'fo:font-weight'?: string | number
  'fo:font-style'?: string
  'fo:font-size'?: string | number
  'fo:color'?: string
  'fo:text-decoration'?: string
  'fo:background-color'?: string
}

export interface AttributeTitleUnit extends Partial<AttributeTitleStyle> {
  text: string
  href?: string
  embedLink?: string
  embedLinkIcon?: string
  mention?: string
  formula?: string
}

export enum TopicType {
  ROOT = 'root',
  ATTACHED = 'attached',
  DETACHED = 'detached',
  SUMMARY = 'summary',
  CALLOUT = 'callout',
}

export enum StructureType {
  MAP = 'org.xmind.ui.map',
  LOGIC_RIGHT = 'org.xmind.ui.logic.right',
  LOGIC_LEFT = 'org.xmind.ui.logic.left',
  TREE_RIGHT = 'org.xmind.ui.tree.right',
  TREE_LEFT = 'org.xmind.ui.tree.left',
  ORG_CHART_DOWN = 'org.xmind.ui.org-chart.down',
  ORG_CHART_UP = 'org.xmind.ui.org-chart.up',
  FISHBONE_LEFT = 'org.xmind.ui.fishbone.leftHeaded',
  FISHBONE_RIGHT = 'org.xmind.ui.fishbone.rightHeaded',
  TIMELINE_HORIZONTAL = 'org.xmind.ui.timeline.horizontal',
  TIMELINE_VERTICAL = 'org.xmind.ui.timeline.vertical',
  SPREADSHEET = 'org.xmind.ui.spreadsheet',
  BRACE_LEFT = 'org.xmind.ui.brace.left',
  BRACE_RIGHT = 'org.xmind.ui.brace.right',
  TREE_TABLE = 'org.xmind.ui.treetable',
}

export interface MarkerData {
  markerId: string
  groupId?: string
}

export interface NotesData {
  plain?: string
  html?: string
}

export interface ImageData {
  src: string
  align?: 'top' | 'center' | 'bottom'
  size?: { width: number; height: number }
}

export interface ExtensionData {
  provider: string
  content: any
}

export interface AttachmentData {
  id: string
  name: string
  mimeType: string
  size: number
  url?: string
  data?: string
  createdAt: number
}

export interface MathFormulaData {
  id: string
  formula: string
  format: 'latex' | 'mathml'
  rendered?: string
}

export interface CodeBlockData {
  id: string
  code: string
  language?: string
  fileName?: string
}

export function isAttributeTitleEmpty(title: AttributeTitle | undefined): boolean {
  return !title || title.length === 0
}

export function isRichAttributeTitle(title: AttributeTitle | undefined): boolean {
  if (!title || title.length === 0) return false
  return title.some(unit => {
    const keys = Object.keys(unit).filter(k => k !== 'text')
    return keys.length > 0
  })
}

export function getPlainTextFromAttributeTitle(title: AttributeTitle | undefined): string {
  if (!title || title.length === 0) return ''
  return title.map(unit => unit.text).join('')
}

export function createAttributeTitleFromPlainText(text: string): AttributeTitle {
  if (!text) return []
  return [{ text }]
}

export function createAttributeTitleUnit(
  text: string,
  styles?: Partial<AttributeTitleStyle>,
  extras?: Partial<Omit<AttributeTitleUnit, 'text' | keyof AttributeTitleStyle>>
): AttributeTitleUnit {
  return {
    text,
    ...styles,
    ...extras,
  }
}

export function normalizeAttributeTitle(
  title: AttributeTitle | undefined,
  plainTitle: string
): { title: string; attributeTitle?: AttributeTitle } {
  if (isAttributeTitleEmpty(title)) {
    return { title: plainTitle }
  }
  return {
    title: getPlainTextFromAttributeTitle(title),
    attributeTitle: title,
  }
}

export function isEqualAttributeTitle(
  a: AttributeTitle | undefined,
  b: AttributeTitle | undefined
): boolean {
  if (a === b) return true
  if (!a && !b) return true
  if (!a || !b) return false
  if (a.length !== b.length) return false

  for (let i = 0; i < a.length; i++) {
    const unitA = a[i]!
    const unitB = b[i]!

    if (unitA.text !== unitB.text) return false
    if (unitA.href !== unitB.href) return false
    if (unitA.formula !== unitB.formula) return false
    if (unitA.embedLink !== unitB.embedLink) return false
    if (unitA.mention !== unitB.mention) return false

    const styleKeys: (keyof AttributeTitleStyle)[] = [
      'fo:font-family', 'fo:font-weight', 'fo:font-style',
      'fo:font-size', 'fo:color', 'fo:text-decoration', 'fo:background-color',
    ]

    for (const key of styleKeys) {
      if (unitA[key] !== unitB[key]) return false
    }
  }

  return true
}

export function extractGlobalStyle(title: AttributeTitle | undefined): Partial<AttributeTitleStyle> | undefined {
  if (!title || title.length === 0) return undefined

  const globalStyle: Partial<AttributeTitleStyle> = {}
  let hasGlobalStyle = false

  const firstUnit: AttributeTitleUnit | undefined = title[0]
  if (!firstUnit) return undefined

  const checkKey = (key: keyof AttributeTitleStyle) => {
    const firstValue = firstUnit[key]
    if (firstValue === undefined) return

    const allSame = title.every(unit => unit[key] === firstValue)
    if (allSame) {
      (globalStyle as any)[key] = firstValue
      hasGlobalStyle = true
    }
  }

  checkKey('fo:font-family')
  checkKey('fo:font-weight')
  checkKey('fo:font-style')
  checkKey('fo:font-size')
  checkKey('fo:color')
  checkKey('fo:text-decoration')
  checkKey('fo:background-color')

  return hasGlobalStyle ? globalStyle : undefined
}

export function removeGlobalStyleFromAttributeTitle(
  title: AttributeTitle,
  globalStyle: Partial<AttributeTitleStyle>
): AttributeTitle {
  const styleKeys = Object.keys(globalStyle) as (keyof AttributeTitleStyle)[]

  return title.map(unit => {
    const newUnit = { ...unit }
    for (const key of styleKeys) {
      delete newUnit[key]
    }
    return newUnit
  })
}

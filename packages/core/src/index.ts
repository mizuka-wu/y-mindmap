export type {
  StyleData,
  Point,
  Size,
  Bounds,
  EdgeInsets,
  Direction,
  SelectionType,
  SelectionData,
  TransactionData,
  StepData,
  LayoutResult,
  NodeStyle,
  ConnectionStyle,
  ArrowStyle,
  GradientData,
  PatternData,
  EditorConfig,
  FeatureFlags,
  KeymapConfig,
  StyleConfig,
} from './types/common'

export { StyleKey } from './types/common'

export type {
  TopicData,
  AttributeTitle,
  AttributeTitleUnit,
  AttributeTitleStyle,
  MarkerData,
  NotesData,
  ImageData,
  ExtensionData,
  AttachmentData,
  MathFormulaData,
  CodeBlockData,
} from './types/topic'

export {
  isAttributeTitleEmpty,
  isRichAttributeTitle,
  getPlainTextFromAttributeTitle,
  createAttributeTitleFromPlainText,
  createAttributeTitleUnit,
  normalizeAttributeTitle,
  isEqualAttributeTitle,
  extractGlobalStyle,
  removeGlobalStyleFromAttributeTitle,
} from './types/topic'

export {
  MindMapError,
  ValidationError,
  NotFoundError,
  AlreadyExistsError,
  PermissionDeniedError,
  ConflictError,
  InvalidStateError,
  InvalidOperationError,
  isMindMapError,
  getErrorCode,
  formatError,
} from './errors'

export type { ErrorCode, ErrorDetails } from './errors'

export { TopicType, StructureType } from './types/topic'

export type {
  SheetData,
  RelationshipData,
  BoundaryData,
  SummaryData,
  ThemeData,
  LegendData,
  MarkerGroup,
  UserMarker,
} from './types/sheet'

export {
  DEFAULT_TOPIC_STYLE,
  DEFAULT_CONNECTION_STYLE,
  LAYOUT_CONSTANTS,
  DEFAULT_KEYMAP,
} from './constants'

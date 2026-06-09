import { StyleData, Point, ExtensionData, GradientData } from './common'
import { TopicData } from './topic'

export interface SheetData {
  id: string
  title: string
  rootTopic: TopicData
  theme?: ThemeData
  style?: StyleData
  relationships?: RelationshipData[]
  legend?: LegendData
  extensions?: ExtensionData[]
  coreVersion?: string
  handDrawnModeActive?: boolean
  topicPositioning?: 'free' | 'fixed'
  topicOverlapping?: 'overlap' | 'none'
  floatingTopicFlexible?: boolean
}

export interface RelationshipData {
  id: string
  title?: string
  style?: StyleData
  end1Id: string
  end2Id: string
  controlPoints: { 1: Point; 2: Point }
  lineEndPoints?: { 1: Point; 2: Point }
  titleUnedited?: boolean
}

export interface BoundaryData {
  id: string
  title?: string
  style?: StyleData
  range: string
  titleUnedited?: boolean
}

export interface SummaryData {
  id: string
  style?: StyleData
  range: string
  topicId: string
}

export interface ThemeData {
  id: string
  title: string
  colorThemeId?: string
  skeletonThemeId?: string
  map?: StyleData
  centralTopic?: StyleData
  mainTopic?: StyleData
  subTopic?: StyleData
  floatingTopic?: StyleData
  boundary?: StyleData
  relationship?: StyleData
  summaryTopic?: StyleData
  summary?: StyleData
  connections?: StyleData
  background?: {
    color?: string
    gradient?: GradientData
    image?: string
  }
  wallpaper?: {
    color?: string
    image?: string
  }
}

export interface LegendData {
  visible: boolean
  position: Point
  markerGroups: MarkerGroup[]
  userMarkers: UserMarker[]
}

export interface MarkerGroup {
  id: string
  markerIds: string[]
}

export interface UserMarker {
  id: string
  markerId: string
}

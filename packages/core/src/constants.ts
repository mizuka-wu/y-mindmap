import { NodeStyle, ConnectionStyle } from './types/style'
import type { ThemeData } from './types/sheet'
import { StyleKey } from './types/common'

export const DEFAULT_TOPIC_STYLE: NodeStyle = {
  shapeClass: 'roundedRect',
  cornerRadius: 8,
  fillColor: '#4A90D9',
  fillOpacity: 1,
  borderColor: '#2E6DB4',
  borderWidth: 2,
  borderStyle: 'solid',
  borderOpacity: 1,
  fontFamily: 'Arial',
  fontSize: 14,
  fontWeight: 'normal',
  fontStyle: 'normal',
  textColor: '#333',
  textAlign: 'center',
  textDecoration: 'none',
  textTransform: 'none',
  lineHeight: 1.2,
  paddingTop: 10,
  paddingRight: 20,
  paddingBottom: 10,
  paddingLeft: 20,
  marginTop: 5,
  marginRight: 10,
  marginBottom: 5,
  marginLeft: 10,
}

export const DEFAULT_CONNECTION_STYLE: ConnectionStyle = {
  lineClass: 'curve',
  lineColor: '#999',
  lineWidth: 2,
  lineStyle: 'solid',
  lineOpacity: 1,
  lineCorner: 8,
  tapered: false,
}

export const LAYOUT_CONSTANTS = {
  PADDING: 20,
  BOUNDARYGAP: 10,
  SUMMARYLINEMARGIN: {
    TOSUMMARY: 10,
    TORANGE: 10,
    TOBOUNDARY: 5,
  },
  LINECOLPOS: 13,
  STACKGAP: 5,
  COL_GAP: 13,
  EXT_GAP: 14,
  COL_RADIUS: 6,
  EXT_RADIUS: 8,
}

export const DEFAULT_KEYMAP: Record<string, string> = {
  'Tab': 'addSubTopic',
  'Enter': 'addSiblingTopic',
  'Shift+Enter': 'addTopicBefore',
  'Delete': 'deleteNode',
  'Backspace': 'deleteNode',
  'F2': 'startEditing',
  'Escape': 'cancelEditing',
  'Ctrl+a': 'selectAll',
  'Ctrl+z': 'undo',
  'Ctrl+Shift+z': 'redo',
  'Ctrl+c': 'copy',
  'Ctrl+x': 'cut',
  'Ctrl+v': 'paste',
  'Ctrl+=': 'zoomIn',
  'Ctrl+-': 'zoomOut',
  'Ctrl+0': 'resetZoom',
  'Ctrl+Shift+0': 'fitToContent',
  'ArrowUp': 'selectPrevious',
  'ArrowDown': 'selectNext',
  'ArrowLeft': 'selectParent',
  'ArrowRight': 'selectFirstChild',
  'Space': 'toggleFold',
}

export const PRESET_THEMES: Record<string, ThemeData> = {
  default: {
    id: 'default',
    title: 'Default',
    centralTopic: {
      id: 'central',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'roundedRect',
        [StyleKey.FILL_COLOR]: '#4A90D9',
        [StyleKey.BORDER_COLOR]: '#2E6DB4',
        [StyleKey.BORDER_WIDTH]: 2,
        [StyleKey.TEXT_COLOR]: '#FFFFFF',
        [StyleKey.FONT_SIZE]: 18,
        [StyleKey.FONT_WEIGHT]: 'bold',
      }
    },
    mainTopic: {
      id: 'main',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'roundedRect',
        [StyleKey.FILL_COLOR]: '#E8F4FD',
        [StyleKey.BORDER_COLOR]: '#4A90D9',
        [StyleKey.BORDER_WIDTH]: 1,
        [StyleKey.TEXT_COLOR]: '#333333',
        [StyleKey.FONT_SIZE]: 14,
      }
    },
    subTopic: {
      id: 'sub',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'roundedRect',
        [StyleKey.FILL_COLOR]: '#FFFFFF',
        [StyleKey.BORDER_COLOR]: '#CCCCCC',
        [StyleKey.BORDER_WIDTH]: 1,
        [StyleKey.TEXT_COLOR]: '#666666',
        [StyleKey.FONT_SIZE]: 12,
      }
    },
    connections: {
      id: 'connections',
      properties: {
        [StyleKey.LINE_CLASS]: 'curve',
        [StyleKey.LINE_COLOR]: '#4A90D9',
        [StyleKey.LINE_WIDTH]: 2,
      }
    },
    background: { color: '#FFFFFF' }
  },
  dark: {
    id: 'dark',
    title: 'Dark',
    centralTopic: {
      id: 'central',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'roundedRect',
        [StyleKey.FILL_COLOR]: '#2D2D2D',
        [StyleKey.BORDER_COLOR]: '#555555',
        [StyleKey.BORDER_WIDTH]: 2,
        [StyleKey.TEXT_COLOR]: '#E0E0E0',
        [StyleKey.FONT_SIZE]: 18,
        [StyleKey.FONT_WEIGHT]: 'bold',
      }
    },
    mainTopic: {
      id: 'main',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'roundedRect',
        [StyleKey.FILL_COLOR]: '#383838',
        [StyleKey.BORDER_COLOR]: '#4A90D9',
        [StyleKey.BORDER_WIDTH]: 1,
        [StyleKey.TEXT_COLOR]: '#CCCCCC',
        [StyleKey.FONT_SIZE]: 14,
      }
    },
    subTopic: {
      id: 'sub',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'roundedRect',
        [StyleKey.FILL_COLOR]: '#2A2A2A',
        [StyleKey.BORDER_COLOR]: '#555555',
        [StyleKey.BORDER_WIDTH]: 1,
        [StyleKey.TEXT_COLOR]: '#AAAAAA',
        [StyleKey.FONT_SIZE]: 12,
      }
    },
    connections: {
      id: 'connections',
      properties: {
        [StyleKey.LINE_CLASS]: 'curve',
        [StyleKey.LINE_COLOR]: '#4A90D9',
        [StyleKey.LINE_WIDTH]: 2,
      }
    },
    background: { color: '#1E1E1E' }
  },
  colorful: {
    id: 'colorful',
    title: 'Colorful',
    centralTopic: {
      id: 'central',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'roundedRect',
        [StyleKey.FILL_COLOR]: '#FF6B6B',
        [StyleKey.BORDER_COLOR]: '#EE5A5A',
        [StyleKey.BORDER_WIDTH]: 2,
        [StyleKey.TEXT_COLOR]: '#FFFFFF',
        [StyleKey.FONT_SIZE]: 18,
        [StyleKey.FONT_WEIGHT]: 'bold',
      }
    },
    mainTopic: {
      id: 'main',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'roundedRect',
        [StyleKey.FILL_COLOR]: '#4ECDC4',
        [StyleKey.BORDER_COLOR]: '#3DBDB5',
        [StyleKey.BORDER_WIDTH]: 1,
        [StyleKey.TEXT_COLOR]: '#FFFFFF',
        [StyleKey.FONT_SIZE]: 14,
      }
    },
    subTopic: {
      id: 'sub',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'roundedRect',
        [StyleKey.FILL_COLOR]: '#FFE66D',
        [StyleKey.BORDER_COLOR]: '#F5D84D',
        [StyleKey.BORDER_WIDTH]: 1,
        [StyleKey.TEXT_COLOR]: '#333333',
        [StyleKey.FONT_SIZE]: 12,
      }
    },
    connections: {
      id: 'connections',
      properties: {
        [StyleKey.LINE_CLASS]: 'curve',
        [StyleKey.LINE_COLOR]: '#FF6B6B',
        [StyleKey.LINE_WIDTH]: 2,
      }
    },
    background: { color: '#F7F7F7' }
  },
  minimal: {
    id: 'minimal',
    title: 'Minimal',
    centralTopic: {
      id: 'central',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'rectangle',
        [StyleKey.FILL_COLOR]: 'none',
        [StyleKey.BORDER_COLOR]: 'none',
        [StyleKey.TEXT_COLOR]: '#333333',
        [StyleKey.FONT_SIZE]: 20,
        [StyleKey.FONT_WEIGHT]: 'bold',
      }
    },
    mainTopic: {
      id: 'main',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'rectangle',
        [StyleKey.FILL_COLOR]: 'none',
        [StyleKey.BORDER_COLOR]: 'none',
        [StyleKey.TEXT_COLOR]: '#555555',
        [StyleKey.FONT_SIZE]: 14,
      }
    },
    subTopic: {
      id: 'sub',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'rectangle',
        [StyleKey.FILL_COLOR]: 'none',
        [StyleKey.BORDER_COLOR]: 'none',
        [StyleKey.TEXT_COLOR]: '#777777',
        [StyleKey.FONT_SIZE]: 12,
      }
    },
    connections: {
      id: 'connections',
      properties: {
        [StyleKey.LINE_CLASS]: 'straight',
        [StyleKey.LINE_COLOR]: '#CCCCCC',
        [StyleKey.LINE_WIDTH]: 1,
      }
    },
    background: { color: '#FFFFFF' }
  },
  classic: {
    id: 'classic',
    title: 'Classic',
    centralTopic: {
      id: 'central',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'roundedRect',
        [StyleKey.FILL_COLOR]: '#1A365D',
        [StyleKey.BORDER_COLOR]: '#0D2137',
        [StyleKey.BORDER_WIDTH]: 2,
        [StyleKey.TEXT_COLOR]: '#FFFFFF',
        [StyleKey.FONT_SIZE]: 18,
        [StyleKey.FONT_WEIGHT]: 'bold',
        [StyleKey.CORNER_RADIUS]: 6,
      }
    },
    mainTopic: {
      id: 'main',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'roundedRect',
        [StyleKey.FILL_COLOR]: '#EBF5FB',
        [StyleKey.BORDER_COLOR]: '#1A365D',
        [StyleKey.BORDER_WIDTH]: 1,
        [StyleKey.TEXT_COLOR]: '#1A365D',
        [StyleKey.FONT_SIZE]: 14,
        [StyleKey.CORNER_RADIUS]: 4,
      }
    },
    subTopic: {
      id: 'sub',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'roundedRect',
        [StyleKey.FILL_COLOR]: '#FFFFFF',
        [StyleKey.BORDER_COLOR]: '#A0B4C8',
        [StyleKey.BORDER_WIDTH]: 1,
        [StyleKey.TEXT_COLOR]: '#333333',
        [StyleKey.FONT_SIZE]: 12,
        [StyleKey.CORNER_RADIUS]: 3,
      }
    },
    connections: {
      id: 'connections',
      properties: {
        [StyleKey.LINE_CLASS]: 'elbow',
        [StyleKey.LINE_COLOR]: '#1A365D',
        [StyleKey.LINE_WIDTH]: 2,
      }
    },
    background: { color: '#F8FAFC' }
  },
  nature: {
    id: 'nature',
    title: 'Nature',
    centralTopic: {
      id: 'central',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'roundedRect',
        [StyleKey.FILL_COLOR]: '#2D6A4F',
        [StyleKey.BORDER_COLOR]: '#1B4332',
        [StyleKey.BORDER_WIDTH]: 2,
        [StyleKey.TEXT_COLOR]: '#FFFFFF',
        [StyleKey.FONT_SIZE]: 18,
        [StyleKey.FONT_WEIGHT]: 'bold',
        [StyleKey.CORNER_RADIUS]: 12,
      }
    },
    mainTopic: {
      id: 'main',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'capsule',
        [StyleKey.FILL_COLOR]: '#D8F3DC',
        [StyleKey.BORDER_COLOR]: '#52B788',
        [StyleKey.BORDER_WIDTH]: 1,
        [StyleKey.TEXT_COLOR]: '#1B4332',
        [StyleKey.FONT_SIZE]: 14,
      }
    },
    subTopic: {
      id: 'sub',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'capsule',
        [StyleKey.FILL_COLOR]: '#F0FFF4',
        [StyleKey.BORDER_COLOR]: '#95D5B2',
        [StyleKey.BORDER_WIDTH]: 1,
        [StyleKey.TEXT_COLOR]: '#2D6A4F',
        [StyleKey.FONT_SIZE]: 12,
      }
    },
    connections: {
      id: 'connections',
      properties: {
        [StyleKey.LINE_CLASS]: 'curve',
        [StyleKey.LINE_COLOR]: '#52B788',
        [StyleKey.LINE_WIDTH]: 2,
      }
    },
    background: { color: '#F7FFF7' }
  },
  academic: {
    id: 'academic',
    title: 'Academic',
    centralTopic: {
      id: 'central',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'roundedRect',
        [StyleKey.FILL_COLOR]: '#7C3AED',
        [StyleKey.BORDER_COLOR]: '#5B21B6',
        [StyleKey.BORDER_WIDTH]: 2,
        [StyleKey.TEXT_COLOR]: '#FFFFFF',
        [StyleKey.FONT_SIZE]: 18,
        [StyleKey.FONT_WEIGHT]: 'bold',
        [StyleKey.CORNER_RADIUS]: 4,
      }
    },
    mainTopic: {
      id: 'main',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'roundedRect',
        [StyleKey.FILL_COLOR]: '#EDE9FE',
        [StyleKey.BORDER_COLOR]: '#7C3AED',
        [StyleKey.BORDER_WIDTH]: 1,
        [StyleKey.TEXT_COLOR]: '#3B0764',
        [StyleKey.FONT_SIZE]: 14,
        [StyleKey.CORNER_RADIUS]: 2,
      }
    },
    subTopic: {
      id: 'sub',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'rectangle',
        [StyleKey.FILL_COLOR]: '#FFFFFF',
        [StyleKey.BORDER_COLOR]: '#C4B5FD',
        [StyleKey.BORDER_WIDTH]: 1,
        [StyleKey.TEXT_COLOR]: '#4C1D95',
        [StyleKey.FONT_SIZE]: 12,
        [StyleKey.CORNER_RADIUS]: 0,
      }
    },
    connections: {
      id: 'connections',
      properties: {
        [StyleKey.LINE_CLASS]: 'straight',
        [StyleKey.LINE_COLOR]: '#7C3AED',
        [StyleKey.LINE_WIDTH]: 1,
      }
    },
    background: { color: '#FAFAFA' }
  },
  candy: {
    id: 'candy',
    title: 'Candy',
    centralTopic: {
      id: 'central',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'stadium',
        [StyleKey.FILL_COLOR]: '#EC4899',
        [StyleKey.BORDER_COLOR]: '#DB2777',
        [StyleKey.BORDER_WIDTH]: 2,
        [StyleKey.TEXT_COLOR]: '#FFFFFF',
        [StyleKey.FONT_SIZE]: 18,
        [StyleKey.FONT_WEIGHT]: 'bold',
      }
    },
    mainTopic: {
      id: 'main',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'capsule',
        [StyleKey.FILL_COLOR]: '#FDE68A',
        [StyleKey.BORDER_COLOR]: '#F59E0B',
        [StyleKey.BORDER_WIDTH]: 1,
        [StyleKey.TEXT_COLOR]: '#92400E',
        [StyleKey.FONT_SIZE]: 14,
      }
    },
    subTopic: {
      id: 'sub',
      properties: {
        [StyleKey.SHAPE_CLASS]: 'capsule',
        [StyleKey.FILL_COLOR]: '#BBF7D0',
        [StyleKey.BORDER_COLOR]: '#34D399',
        [StyleKey.BORDER_WIDTH]: 1,
        [StyleKey.TEXT_COLOR]: '#065F46',
        [StyleKey.FONT_SIZE]: 12,
      }
    },
    connections: {
      id: 'connections',
      properties: {
        [StyleKey.LINE_CLASS]: 'curve',
        [StyleKey.LINE_COLOR]: '#EC4899',
        [StyleKey.LINE_WIDTH]: 2,
      }
    },
    background: { color: '#FFF7ED' }
  }
}

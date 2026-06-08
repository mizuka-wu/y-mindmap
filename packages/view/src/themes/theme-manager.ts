import { NodeStyle, ConnectionStyle, DEFAULT_TOPIC_STYLE, DEFAULT_CONNECTION_STYLE } from '@y-mindmap/core'

export interface ThemeColors {
  primary: string
  secondary: string
  background: string
  surface: string
  text: string
  border: string
  accent: string
}

export interface ThemeFonts {
  family: string
  baseSize: number
  scaleRatio: number
}

export interface ThemeSpacing {
  unit: number
  horizontal: number
  vertical: number
}

export interface TopicStylePreset {
  shape: string
  fill: string
  border: string
  borderWidth: number
  textColor: string
  fontSize: number
  fontWeight: string
  cornerRadius: number
}

export interface ConnectionStylePreset {
  lineClass: string
  color: string
  width: number
  tapered: boolean
}

export interface Theme {
  id: string
  name: string
  colors: ThemeColors
  fonts: ThemeFonts
  spacing: ThemeSpacing
  topic: {
    central: TopicStylePreset
    main: TopicStylePreset
    sub: TopicStylePreset
    floating: TopicStylePreset
    callout: TopicStylePreset
  }
  connection: {
    default: ConnectionStylePreset
    selected: ConnectionStylePreset
  }
}

export const CLASSIC_THEME: Theme = {
  id: 'classic',
  name: 'Classic',
  colors: {
    primary: '#4A90D9',
    secondary: '#7B68EE',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    text: '#333333',
    border: '#DDDDDD',
    accent: '#FF6B6B',
  },
  fonts: {
    family: 'Arial',
    baseSize: 14,
    scaleRatio: 1.2,
  },
  spacing: {
    unit: 8,
    horizontal: 40,
    vertical: 20,
  },
  topic: {
    central: {
      shape: 'roundedRect',
      fill: '#4A90D9',
      border: '#2E6DB4',
      borderWidth: 2,
      textColor: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
      cornerRadius: 12,
    },
    main: {
      shape: 'roundedRect',
      fill: '#5BA0E9',
      border: '#3A8FD4',
      borderWidth: 2,
      textColor: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      cornerRadius: 8,
    },
    sub: {
      shape: 'roundedRect',
      fill: '#E8F0FE',
      border: '#B8D4F0',
      borderWidth: 1,
      textColor: '#333333',
      fontSize: 14,
      fontWeight: 'normal',
      cornerRadius: 6,
    },
    floating: {
      shape: 'roundedRect',
      fill: '#FFF3E0',
      border: '#FFB74D',
      borderWidth: 1,
      textColor: '#333333',
      fontSize: 14,
      fontWeight: 'normal',
      cornerRadius: 8,
    },
    callout: {
      shape: 'callout',
      fill: '#FFF9C4',
      border: '#F9A825',
      borderWidth: 1,
      textColor: '#333333',
      fontSize: 12,
      fontWeight: 'normal',
      cornerRadius: 4,
    },
  },
  connection: {
    default: {
      lineClass: 'curve',
      color: '#999999',
      width: 2,
      tapered: false,
    },
    selected: {
      lineClass: 'curve',
      color: '#4A90D9',
      width: 3,
      tapered: false,
    },
  },
}

export const DARK_THEME: Theme = {
  ...CLASSIC_THEME,
  id: 'dark',
  name: 'Dark',
  colors: {
    primary: '#6C9CE1',
    secondary: '#9B8EE8',
    background: '#1E1E1E',
    surface: '#2D2D2D',
    text: '#E0E0E0',
    border: '#444444',
    accent: '#FF8A8A',
  },
  topic: {
    central: {
      ...CLASSIC_THEME.topic.central,
      fill: '#3A5F8A',
      border: '#2E4A6D',
      textColor: '#FFFFFF',
    },
    main: {
      ...CLASSIC_THEME.topic.main,
      fill: '#4A6FA5',
      border: '#3A5F8A',
      textColor: '#FFFFFF',
    },
    sub: {
      ...CLASSIC_THEME.topic.sub,
      fill: '#2D2D2D',
      border: '#444444',
      textColor: '#E0E0E0',
    },
    floating: {
      ...CLASSIC_THEME.topic.floating,
      fill: '#3D3D2D',
      border: '#555544',
      textColor: '#E0E0E0',
    },
    callout: {
      ...CLASSIC_THEME.topic.callout,
      fill: '#3D3D2D',
      border: '#555544',
      textColor: '#E0E0E0',
    },
  },
  connection: {
    default: {
      ...CLASSIC_THEME.connection.default,
      color: '#666666',
    },
    selected: {
      ...CLASSIC_THEME.connection.selected,
      color: '#6C9CE1',
    },
  },
}

export const COLORFUL_THEME: Theme = {
  ...CLASSIC_THEME,
  id: 'colorful',
  name: 'Colorful',
  colors: {
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
    background: '#FFFFFF',
    surface: '#F7F7F7',
    text: '#333333',
    border: '#E0E0E0',
    accent: '#FFE66D',
  },
  topic: {
    central: {
      shape: 'roundedRect',
      fill: '#FF6B6B',
      border: '#E55555',
      borderWidth: 2,
      textColor: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
      cornerRadius: 12,
    },
    main: {
      shape: 'roundedRect',
      fill: '#4ECDC4',
      border: '#3DBDB5',
      borderWidth: 2,
      textColor: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      cornerRadius: 8,
    },
    sub: {
      shape: 'roundedRect',
      fill: '#FFE66D',
      border: '#E5D060',
      borderWidth: 1,
      textColor: '#333333',
      fontSize: 14,
      fontWeight: 'normal',
      cornerRadius: 6,
    },
    floating: {
      shape: 'roundedRect',
      fill: '#A8E6CF',
      border: '#8ED4B8',
      borderWidth: 1,
      textColor: '#333333',
      fontSize: 14,
      fontWeight: 'normal',
      cornerRadius: 8,
    },
    callout: {
      shape: 'callout',
      fill: '#FFD3B6',
      border: '#E5BFA0',
      borderWidth: 1,
      textColor: '#333333',
      fontSize: 12,
      fontWeight: 'normal',
      cornerRadius: 4,
    },
  },
  connection: {
    default: {
      lineClass: 'curve',
      color: '#AAAAAA',
      width: 2,
      tapered: false,
    },
    selected: {
      lineClass: 'curve',
      color: '#FF6B6B',
      width: 3,
      tapered: false,
    },
  },
}

export const MINIMALIST_THEME: Theme = {
  ...CLASSIC_THEME,
  id: 'minimalist',
  name: 'Minimalist',
  colors: {
    primary: '#333333',
    secondary: '#666666',
    background: '#FFFFFF',
    surface: '#FAFAFA',
    text: '#333333',
    border: '#CCCCCC',
    accent: '#0066CC',
  },
  topic: {
    central: {
      shape: 'roundedRect',
      fill: '#333333',
      border: '#222222',
      borderWidth: 1,
      textColor: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      cornerRadius: 4,
    },
    main: {
      shape: 'roundedRect',
      fill: '#666666',
      border: '#555555',
      borderWidth: 1,
      textColor: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
      cornerRadius: 4,
    },
    sub: {
      shape: 'roundedRect',
      fill: '#F0F0F0',
      border: '#CCCCCC',
      borderWidth: 1,
      textColor: '#333333',
      fontSize: 13,
      fontWeight: 'normal',
      cornerRadius: 4,
    },
    floating: {
      shape: 'roundedRect',
      fill: '#E8E8E8',
      border: '#BBBBBB',
      borderWidth: 1,
      textColor: '#333333',
      fontSize: 13,
      fontWeight: 'normal',
      cornerRadius: 4,
    },
    callout: {
      shape: 'callout',
      fill: '#F5F5F5',
      border: '#CCCCCC',
      borderWidth: 1,
      textColor: '#333333',
      fontSize: 12,
      fontWeight: 'normal',
      cornerRadius: 2,
    },
  },
  connection: {
    default: {
      lineClass: 'straight',
      color: '#999999',
      width: 1,
      tapered: false,
    },
    selected: {
      lineClass: 'straight',
      color: '#0066CC',
      width: 2,
      tapered: false,
    },
  },
}

export const OCEAN_THEME: Theme = {
  ...CLASSIC_THEME,
  id: 'ocean',
  name: 'Ocean',
  colors: {
    primary: '#0077B6',
    secondary: '#00B4D8',
    background: '#F0F8FF',
    surface: '#E6F3FF',
    text: '#1A365D',
    border: '#90CAF9',
    accent: '#FF6B6B',
  },
  topic: {
    central: {
      shape: 'roundedRect',
      fill: '#0077B6',
      border: '#005A8E',
      borderWidth: 2,
      textColor: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
      cornerRadius: 12,
    },
    main: {
      shape: 'roundedRect',
      fill: '#00B4D8',
      border: '#0090B0',
      borderWidth: 2,
      textColor: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      cornerRadius: 8,
    },
    sub: {
      shape: 'roundedRect',
      fill: '#E6F3FF',
      border: '#90CAF9',
      borderWidth: 1,
      textColor: '#1A365D',
      fontSize: 14,
      fontWeight: 'normal',
      cornerRadius: 6,
    },
    floating: {
      shape: 'roundedRect',
      fill: '#B8E6FF',
      border: '#7CC8F0',
      borderWidth: 1,
      textColor: '#1A365D',
      fontSize: 14,
      fontWeight: 'normal',
      cornerRadius: 8,
    },
    callout: {
      shape: 'callout',
      fill: '#D6EFFF',
      border: '#90CAF9',
      borderWidth: 1,
      textColor: '#1A365D',
      fontSize: 12,
      fontWeight: 'normal',
      cornerRadius: 4,
    },
  },
  connection: {
    default: {
      lineClass: 'curve',
      color: '#90CAF9',
      width: 2,
      tapered: false,
    },
    selected: {
      lineClass: 'curve',
      color: '#0077B6',
      width: 3,
      tapered: false,
    },
  },
}

export const FOREST_THEME: Theme = {
  ...CLASSIC_THEME,
  id: 'forest',
  name: 'Forest',
  colors: {
    primary: '#2D6A4F',
    secondary: '#40916C',
    background: '#F0FFF0',
    surface: '#E8F5E9',
    text: '#1B4332',
    border: '#A5D6A7',
    accent: '#FF8F00',
  },
  topic: {
    central: {
      shape: 'roundedRect',
      fill: '#2D6A4F',
      border: '#1B5E3B',
      borderWidth: 2,
      textColor: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
      cornerRadius: 12,
    },
    main: {
      shape: 'roundedRect',
      fill: '#40916C',
      border: '#2D7A5A',
      borderWidth: 2,
      textColor: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      cornerRadius: 8,
    },
    sub: {
      shape: 'roundedRect',
      fill: '#E8F5E9',
      border: '#A5D6A7',
      borderWidth: 1,
      textColor: '#1B4332',
      fontSize: 14,
      fontWeight: 'normal',
      cornerRadius: 6,
    },
    floating: {
      shape: 'roundedRect',
      fill: '#C8E6C9',
      border: '#81C784',
      borderWidth: 1,
      textColor: '#1B4332',
      fontSize: 14,
      fontWeight: 'normal',
      cornerRadius: 8,
    },
    callout: {
      shape: 'callout',
      fill: '#DCEDC8',
      border: '#AED581',
      borderWidth: 1,
      textColor: '#1B4332',
      fontSize: 12,
      fontWeight: 'normal',
      cornerRadius: 4,
    },
  },
  connection: {
    default: {
      lineClass: 'curve',
      color: '#81C784',
      width: 2,
      tapered: false,
    },
    selected: {
      lineClass: 'curve',
      color: '#2D6A4F',
      width: 3,
      tapered: false,
    },
  },
}

export const SUNSET_THEME: Theme = {
  ...CLASSIC_THEME,
  id: 'sunset',
  name: 'Sunset',
  colors: {
    primary: '#E85D75',
    secondary: '#FF8A5C',
    background: '#FFF5F5',
    surface: '#FFE8E8',
    text: '#4A1A2E',
    border: '#FFB3B3',
    accent: '#FFD93D',
  },
  topic: {
    central: {
      shape: 'roundedRect',
      fill: '#E85D75',
      border: '#D04A62',
      borderWidth: 2,
      textColor: '#FFFFFF',
      fontSize: 18,
      fontWeight: 'bold',
      cornerRadius: 12,
    },
    main: {
      shape: 'roundedRect',
      fill: '#FF8A5C',
      border: '#E57040',
      borderWidth: 2,
      textColor: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
      cornerRadius: 8,
    },
    sub: {
      shape: 'roundedRect',
      fill: '#FFE8E8',
      border: '#FFB3B3',
      borderWidth: 1,
      textColor: '#4A1A2E',
      fontSize: 14,
      fontWeight: 'normal',
      cornerRadius: 6,
    },
    floating: {
      shape: 'roundedRect',
      fill: '#FFD6D6',
      border: '#FF9999',
      borderWidth: 1,
      textColor: '#4A1A2E',
      fontSize: 14,
      fontWeight: 'normal',
      cornerRadius: 8,
    },
    callout: {
      shape: 'callout',
      fill: '#FFF0F0',
      border: '#FFD6D6',
      borderWidth: 1,
      textColor: '#4A1A2E',
      fontSize: 12,
      fontWeight: 'normal',
      cornerRadius: 4,
    },
  },
  connection: {
    default: {
      lineClass: 'curve',
      color: '#FFB3B3',
      width: 2,
      tapered: false,
    },
    selected: {
      lineClass: 'curve',
      color: '#E85D75',
      width: 3,
      tapered: false,
    },
  },
}

export class ThemeManager {
  private currentTheme: Theme
  private themes: Map<string, Theme> = new Map()

  constructor(initialTheme?: Theme) {
    this.currentTheme = initialTheme || CLASSIC_THEME
    this.registerTheme(CLASSIC_THEME)
    this.registerTheme(DARK_THEME)
    this.registerTheme(COLORFUL_THEME)
    this.registerTheme(MINIMALIST_THEME)
    this.registerTheme(OCEAN_THEME)
    this.registerTheme(FOREST_THEME)
    this.registerTheme(SUNSET_THEME)
  }

  getCurrentTheme(): Theme {
    return this.currentTheme
  }

  setTheme(themeId: string): void {
    const theme = this.themes.get(themeId)
    if (theme) {
      this.currentTheme = theme
    }
  }

  registerTheme(theme: Theme): void {
    this.themes.set(theme.id, theme)
  }

  getAvailableThemes(): Theme[] {
    return Array.from(this.themes.values())
  }

  getTopicStylePreset(nodeType: string, depth: number): TopicStylePreset {
    const theme = this.currentTheme

    if (nodeType === 'root') {
      return theme.topic.central
    }

    if (nodeType === 'detached') {
      return theme.topic.floating
    }

    if (nodeType === 'callout') {
      return theme.topic.callout
    }

    if (depth === 1) {
      return theme.topic.main
    }

    return theme.topic.sub
  }

  getConnectionStylePreset(selected: boolean): ConnectionStylePreset {
    return selected
      ? this.currentTheme.connection.selected
      : this.currentTheme.connection.default
  }

  toNodeStyle(preset: TopicStylePreset): Partial<NodeStyle> {
    return {
      shapeClass: preset.shape,
      fillColor: preset.fill,
      borderColor: preset.border,
      borderWidth: preset.borderWidth,
      textColor: preset.textColor,
      fontSize: preset.fontSize,
      fontWeight: preset.fontWeight as any,
      cornerRadius: preset.cornerRadius,
    }
  }

  toConnectionStyle(preset: ConnectionStylePreset): Partial<ConnectionStyle> {
    return {
      lineClass: preset.lineClass,
      lineColor: preset.color,
      lineWidth: preset.width,
      tapered: preset.tapered,
    }
  }
}

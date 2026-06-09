# CONFIGURATION.md - 配置系统设计

> 思维导图编辑器配置系统设计

---

## 一、配置结构

### 1.1 编辑器配置

```typescript
// @y-mindmap/config/editor-config.ts

interface EditorConfig {
  /** 容器元素 */
  container: HTMLElement | string
  
  /** 初始文档 */
  document?: MindMapNode
  
  /** 只读模式 */
  readOnly?: boolean
  
  /** 主题 */
  theme?: string | Theme
  
  /** 语言 */
  locale?: string
  
  /** 自动保存 */
  autoSave?: AutoSaveConfig
  
  /** 功能开关 */
  features?: FeatureFlags
  
  /** 快捷键 */
  keymap?: KeymapConfig
  
  /** 样式 */
  style?: StyleConfig
  
  /** 插件 */
  plugins?: Plugin[]
}

interface AutoSaveConfig {
  /** 是否启用 */
  enabled: boolean
  
  /** 间隔 (毫秒) */
  interval: number
  
  /** 存储提供者 */
  storage?: StorageProvider
}

interface FeatureFlags {
  /** 启用拖拽 */
  drag?: boolean
  
  /** 启用多选 */
  multiSelect?: boolean
  
  /** 启用框选 */
  boxSelect?: boolean
  
  /** 启用关系线 */
  relationships?: boolean
  
  /** 启用边界 */
  boundaries?: boolean
  
  /** 启用摘要 */
  summaries?: boolean
  
  /** 启用浮动节点 */
  floatingTopics?: boolean
  
  /** 启用标注 */
  callouts?: boolean
  
  /** 启用标记 */
  markers?: boolean
  
  /** 启用图片 */
  images?: boolean
  
  /** 启用备注 */
  notes?: boolean
  
  /** 启用链接 */
  links?: boolean
  
  /** 启用小地图 */
  minimap?: boolean
  
  /** 启用键盘导航 */
  keyboardNavigation?: boolean
  
  /** 启用动画 */
  animation?: boolean
}

interface KeymapConfig {
  /** 自定义快捷键 */
  bindings?: Record<string, string>
  
  /** 禁用的快捷键 */
  disabled?: string[]
}

interface StyleConfig {
  /** 默认节点样式 */
  defaultTopicStyle?: Partial<NodeStyle>
  
  /** 默认连线样式 */
  defaultConnectionStyle?: Partial<ConnectionStyle>
}
```

---

## 二、配置管理器

### 2.1 配置管理器实现

```typescript
// @y-mindmap/config/config-manager.ts

class ConfigManager {
  private config: EditorConfig
  private defaults: EditorConfig
  private listeners: Set<(config: EditorConfig) => void> = new Set()
  
  constructor(config?: Partial<EditorConfig>) {
    this.defaults = this.getDefaultConfig()
    this.config = { ...this.defaults, ...config }
  }
  
  /**
   * 获取默认配置
   */
  private getDefaultConfig(): EditorConfig {
    return {
      container: document.body,
      readOnly: false,
      locale: 'zh-CN',
      
      autoSave: {
        enabled: true,
        interval: 30000,
      },
      
      features: {
        drag: true,
        multiSelect: true,
        boxSelect: true,
        relationships: true,
        boundaries: true,
        summaries: true,
        floatingTopics: true,
        callouts: true,
        markers: true,
        images: true,
        notes: true,
        links: true,
        minimap: true,
        keyboardNavigation: true,
        animation: true,
      },
      
      keymap: {
        bindings: {},
        disabled: [],
      },
      
      style: {
        defaultTopicStyle: {},
        defaultConnectionStyle: {},
      },
    }
  }
  
  /**
   * 获取配置
   */
  get<K extends keyof EditorConfig>(key: K): EditorConfig[K] {
    return this.config[key]
  }
  
  /**
   * 设置配置
   */
  set<K extends keyof EditorConfig>(key: K, value: EditorConfig[K]): void {
    this.config[key] = value
    this.notifyListeners()
  }
  
  /**
   * 获取完整配置
   */
  getAll(): EditorConfig {
    return { ...this.config }
  }
  
  /**
   * 更新配置
   */
  update(updates: Partial<EditorConfig>): void {
    this.config = { ...this.config, ...updates }
    this.notifyListeners()
  }
  
  /**
   * 重置为默认配置
   */
  reset(): void {
    this.config = { ...this.defaults }
    this.notifyListeners()
  }
  
  /**
   * 监听配置变更
   */
  onChange(listener: (config: EditorConfig) => void): () => void {
    this.listeners.add(listener)
    
    return () => {
      this.listeners.delete(listener)
    }
  }
  
  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.config))
  }
  
  /**
   * 检查功能是否启用
   */
  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.features?.[feature] ?? true
  }
  
  /**
   * 获取快捷键
   */
  getKeymap(): Record<string, string> {
    const defaultKeymap = this.getDefaultKeymap()
    const customKeymap = this.config.keymap?.bindings || {}
    const disabled = new Set(this.config.keymap?.disabled || [])
    
    const keymap: Record<string, string> = {}
    
    // 合并默认和自定义快捷键
    Object.entries({ ...defaultKeymap, ...customKeymap }).forEach(([key, command]) => {
      if (!disabled.has(key)) {
        keymap[key] = command
      }
    })
    
    return keymap
  }
  
  /**
   * 获取默认快捷键
   */
  private getDefaultKeymap(): Record<string, string> {
    return {
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
  }
}
```

---

## 三、配置验证

### 3.1 配置验证器

```typescript
// @y-mindmap/config/validator.ts

class ConfigValidator {
  /**
   * 验证配置
   */
  validate(config: Partial<EditorConfig>): ValidationResult {
    const errors: ValidationError[] = []
    
    // 验证容器
    if (config.container) {
      if (typeof config.container === 'string') {
        if (!document.querySelector(config.container)) {
          errors.push({
            field: 'container',
            message: `Container element not found: ${config.container}`,
          })
        }
      } else if (!(config.container instanceof HTMLElement)) {
        errors.push({
          field: 'container',
          message: 'Container must be an HTMLElement or selector string',
        })
      }
    }
    
    // 验证自动保存间隔
    if (config.autoSave?.interval !== undefined) {
      if (config.autoSave.interval < 1000) {
        errors.push({
          field: 'autoSave.interval',
          message: 'Auto-save interval must be at least 1000ms',
        })
      }
    }
    
    // 验证语言
    if (config.locale) {
      const supportedLocales = ['zh-CN', 'en-US', 'ja-JP']
      if (!supportedLocales.includes(config.locale)) {
        errors.push({
          field: 'locale',
          message: `Unsupported locale: ${config.locale}`,
        })
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
}

interface ValidationError {
  field: string
  message: string
}
```

---

## 四、配置持久化

### 4.1 配置存储

```typescript
// @y-mindmap/config/storage.ts

class ConfigStorage {
  private storageKey: string = 'y-mindmap-config'
  
  /**
   * 保存配置
   */
  save(config: EditorConfig): void {
    const serialized = JSON.stringify(config)
    localStorage.setItem(this.storageKey, serialized)
  }
  
  /**
   * 加载配置
   */
  load(): Partial<EditorConfig> | null {
    const serialized = localStorage.getItem(this.storageKey)
    
    if (!serialized) {
      return null
    }
    
    try {
      return JSON.parse(serialized)
    } catch {
      return null
    }
  }
  
  /**
   * 清除配置
   */
  clear(): void {
    localStorage.removeItem(this.storageKey)
  }
}
```

---

## 五、Snowbrush 配置参考

### 5.1 配置常量

```typescript
// 来源: /src/common/constants/config.ts

const CONFIG = {
  NO_KEYBIND: 'noKeybind',
  NO_EDIT_RECEIVER: 'noEditReceiver',
  NO_VIEW_PORT_MOVE: 'noViewPortMove',
  NO_MULTI_SELECT: 'noMultiSelect',
  NO_LISTEN_RESIZE: 'noListenResize',
  PADDING_FACTOR: 'paddingFactor',
  LOGGER: 'logger',
  LIMITED_OPERATION_HANDLER: 'limitedOperationHandler',
}
```

### 5.2 配置使用

```typescript
// 来源: /src/core/sheeteditor.ts

class SheetEditor {
  private _config: Config
  
  config(key: string, value?: any): any {
    if (value !== undefined) {
      this._config.set(key, value)
    }
    return this._config.get(key)
  }
  
  isReadOnly(): boolean {
    return this.config(CONFIG.READ_ONLY) === true
  }
}
```

# DATA-MODEL.md - 数据模型设计

> 思维导图数据模型详细设计

---

## 一、核心数据结构

### 1.1 TopicData - 节点数据

```typescript
// @y-mindmap/model/types/topic.ts

interface TopicData {
  // ===== 基本信息 =====
  
  /** 节点唯一标识 */
  id: string
  
  /** 节点标题 */
  title: string
  
  /** 节点类型 */
  type: TopicType
  
  // ===== 结构信息 =====
  
  /** 父节点 ID (根节点为 null) */
  parentId: string | null
  
  /** 子节点 ID 列表 (按类型分组) */
  children: {
    attached?: string[]    // 附着节点
    detached?: string[]    // 浮动节点
    summary?: string[]     // 摘要节点
    callout?: string[]     // 标注节点
  }
  
  /** 布局结构类型 */
  structureClass?: StructureType
  
  /** 折叠状态 */
  branch?: 'expanded' | 'folded'
  
  /** 自由位置 (浮动节点) */
  position?: Point
  
  /** 自定义宽度 */
  customWidth?: number
  
  // ===== 样式信息 =====
  
  /** 样式数据 */
  style?: StyleData
  
  // ===== 扩展数据 =====
  
  /** 标记列表 */
  markers?: MarkerData[]
  
  /** 标签列表 */
  labels?: string[]
  
  /** 编号 */
  numbering?: NumberingData
  
  /** 备注 */
  notes?: NotesData
  
  /** 图片 */
  image?: ImageData
  
  /** 超链接 */
  href?: string
  
  /** 扩展信息 */
  extensions?: ExtensionData[]
  
  // ===== 元数据 =====
  
  /** 标题是否未编辑过 */
  titleUnedited?: boolean
  
  /** 创建时间 */
  createdAt?: number
  
  /** 更新时间 */
  updatedAt?: number
}

enum TopicType {
  /** 附着节点 (主分支) */
  ATTACHED = 'attached',
  
  /** 浮动节点 */
  DETACHED = 'detached',
  
  /** 摘要节点 */
  SUMMARY = 'summary',
  
  /** 标注节点 */
  CALLOUT = 'callout',
  
  /** 根节点 */
  ROOT = 'root',
}
```

### 1.2 SheetData - Sheet 数据

```typescript
// @y-mindmap/model/types/sheet.ts

interface SheetData {
  /** Sheet 唯一标识 */
  id: string
  
  /** Sheet 标题 */
  title: string
  
  /** 根节点 */
  rootTopic: TopicData
  
  /** 主题数据 */
  theme?: ThemeData
  
  /** 样式数据 */
  style?: StyleData
  
  /** 关系线列表 */
  relationships?: RelationshipData[]
  
  /** 图例 */
  legend?: LegendData
  
  /** 扩展信息 */
  extensions?: ExtensionData[]
  
  /** 核心版本 */
  coreVersion?: string
  
  /** 是否启用手绘模式 */
  handDrawnModeActive?: boolean
  
  /** 紧凑布局模式级别 */
  compactLayoutModeLevel?: CompactLayoutModeLevel
  
  /** 设置 */
  settings?: Record<string, SettingItem[]>
  
  /** 主题定位模式 */
  topicPositioning?: 'free' | 'fixed'
  
  /** 主题重叠模式 */
  topicOverlapping?: 'overlap' | 'none'
  
  /** 浮动主题是否可灵活定位 */
  floatingTopicFlexible?: boolean
}
```

### 1.3 RelationshipData - 关系线数据

```typescript
// @y-mindmap/model/types/relationship.ts

interface RelationshipData {
  /** 关系线唯一标识 */
  id: string
  
  /** 关系线标题 */
  title?: string
  
  /** 样式数据 */
  style?: StyleData
  
  /** 起始节点 ID */
  end1Id: string
  
  /** 结束节点 ID */
  end2Id: string
  
  /** 控制点 */
  controlPoints: {
    1: Point
    2: Point
  }
  
  /** 线端点 */
  lineEndPoints?: {
    1: Point
    2: Point
  }
  
  /** 标题是否未编辑过 */
  titleUnedited?: boolean
}
```

### 1.4 BoundaryData - 边界数据

```typescript
// @y-mindmap/model/types/boundary.ts

interface BoundaryData {
  /** 边界唯一标识 */
  id: string
  
  /** 边界标题 */
  title?: string
  
  /** 样式数据 */
  style?: StyleData
  
  /** 范围 (如 "(0,3)" 表示第 0 到第 3 个子节点) */
  range: string
  
  /** 标题是否未编辑过 */
  titleUnedited?: boolean
}
```

### 1.5 SummaryData - 摘要数据

```typescript
// @y-mindmap/model/types/summary.ts

interface SummaryData {
  /** 摘要唯一标识 */
  id: string
  
  /** 样式数据 */
  style?: StyleData
  
  /** 范围 */
  range: string
  
  /** 摘要主题节点 ID */
  topicId: string
}
```

### 1.6 StyleData - 样式数据

```typescript
// @y-mindmap/model/types/style.ts

interface StyleData {
  /** 样式唯一标识 */
  id: string
  
  /** 样式属性 */
  properties: Partial<Record<StyleKey, any>>
}

enum StyleKey {
  // 形状
  SHAPE_CLASS = 'shape-class',
  CORNER_RADIUS = 'corner-radius',
  
  // 填充
  FILL_COLOR = 'fill-color',
  FILL_GRADIENT = 'fill-gradient',
  FILL_PATTERN = 'fill-pattern',
  FILL_OPACITY = 'fill-opacity',
  
  // 边框
  BORDER_COLOR = 'border-color',
  BORDER_WIDTH = 'border-width',
  BORDER_PATTERN = 'border-pattern',
  BORDER_OPACITY = 'border-opacity',
  
  // 文字
  FONT_FAMILY = 'font-family',
  FONT_SIZE = 'font-size',
  FONT_WEIGHT = 'font-weight',
  FONT_STYLE = 'font-style',
  TEXT_COLOR = 'text-color',
  TEXT_ALIGN = 'text-align',
  TEXT_DECORATION = 'text-decoration',
  TEXT_TRANSFORM = 'text-transform',
  
  // 连线
  LINE_CLASS = 'line-class',
  LINE_COLOR = 'line-color',
  LINE_WIDTH = 'line-width',
  LINE_PATTERN = 'line-pattern',
  LINE_TAPERED = 'line-tapered',
  
  // 箭头
  START_ARROW = 'start-arrow',
  END_ARROW = 'end-arrow',
  
  // 阴影
  SHADOW_COLOR = 'shadow-color',
  SHADOW_BLUR = 'shadow-blur',
  SHADOW_OFFSET_X = 'shadow-offset-x',
  SHADOW_OFFSET_Y = 'shadow-offset-y',
  
  // 内边距
  PADDING_TOP = 'padding-top',
  PADDING_RIGHT = 'padding-right',
  PADDING_BOTTOM = 'padding-bottom',
  PADDING_LEFT = 'padding-left',
  
  // 外边距
  MARGIN_TOP = 'margin-top',
  MARGIN_RIGHT = 'margin-right',
  MARGIN_BOTTOM = 'margin-bottom',
  MARGIN_LEFT = 'margin-left',
}
```

### 1.7 ThemeData - 主题数据

```typescript
// @y-mindmap/model/types/theme.ts

interface ThemeData {
  /** 主题唯一标识 */
  id: string
  
  /** 主题标题 */
  title: string
  
  /** 颜色主题 ID */
  colorThemeId?: string
  
  /** 骨架主题 ID */
  skeletonThemeId?: string
  
  /** 各类组件的样式 */
  map?: StyleData
  centralTopic?: StyleData
  mainTopic?: StyleData
  subTopic?: StyleData
  floatingTopic?: StyleData
  boundary?: StyleData
  relationship?: StyleData
  summaryTopic?: StyleData
  summary?: StyleData
}
```

### 1.8 MarkerData - 标记数据

```typescript
// @y-mindmap/model/types/marker.ts

interface MarkerData {
  /** 标记 ID (如 "priority-1", "flag", "star") */
  markerId: string
  
  /** 标记组 */
  groupId?: string
}
```

### 1.9 NotesData - 备注数据

```typescript
// @y-mindmap/model/types/notes.ts

interface NotesData {
  /** 纯文本备注 */
  plain?: string
  
  /** HTML 备注 */
  html?: string
}
```

### 1.10 ImageData - 图片数据

```typescript
// @y-mindmap/model/types/image.ts

interface ImageData {
  /** 图片源 (URL 或 base64) */
  src: string
  
  /** 图片对齐方式 */
  align?: 'top' | 'center' | 'bottom'
  
  /** 图片尺寸 */
  size?: {
    width: number
    height: number
  }
  
  /** SVG 内容 (可选) */
  svg?: string
}
```

### 1.11 NumberingData - 编号数据

```typescript
// @y-mindmap/model/types/numbering.ts

interface NumberingData {
  /** 编号格式 */
  format: string
  
  /** 前缀 */
  prefix?: string
  
  /** 后缀 */
  suffix?: string
}
```

### 1.12 ExtensionData - 扩展数据

```typescript
// @y-mindmap/model/types/extension.ts

interface ExtensionData {
  /** 扩展提供者 */
  provider: string
  
  /** 扩展内容 */
  content: any
}
```

### 1.13 LegendData - 图例数据

```typescript
// @y-mindmap/model/types/legend.ts

interface LegendData {
  /** 是否显示图例 */
  visible: boolean
  
  /** 图例位置 */
  position: Point
  
  /** 标记分组 */
  markerGroups: MarkerGroup[]
  
  /** 用户标记 */
  userMarkers: UserMarker[]
}

interface MarkerGroup {
  id: string
  markerIds: string[]
}

interface UserMarker {
  id: string
  markerId: string
}
```

---

## 二、数据约束

### 2.1 唯一性约束

```typescript
// @y-mindmap/model/constraints/uniqueness.ts

class UniquenessConstraint {
  /**
   * 验证 ID 唯一性
   */
  validateIdUniqueness(doc: MindMapNode): ValidationResult {
    const ids = new Set<string>()
    const duplicates: string[] = []
    
    doc.descendants((node) => {
      if (ids.has(node.id)) {
        duplicates.push(node.id)
      } else {
        ids.add(node.id)
      }
    })
    
    return {
      valid: duplicates.length === 0,
      errors: duplicates.map(id => ({
        type: 'duplicate-id',
        message: `Duplicate ID: ${id}`,
        data: { id },
      })),
    }
  }
}
```

### 2.2 引用完整性

```typescript
// @y-mindmap/model/constraints/integrity.ts

class IntegrityConstraint {
  /**
   * 验证父子关系完整性
   */
  validateParentChildIntegrity(doc: MindMapNode): ValidationResult {
    const errors: ValidationError[] = []
    
    doc.descendants((node) => {
      // 检查父节点是否存在
      if (node.parentId) {
        const parent = doc.getNodeById(node.parentId)
        if (!parent) {
          errors.push({
            type: 'missing-parent',
            message: `Node ${node.id} references non-existent parent ${node.parentId}`,
            data: { nodeId: node.id, parentId: node.parentId },
          })
        } else {
          // 检查父节点是否包含此子节点
          const children = parent.getChildrenByType(node.type)
          if (!children.some(c => c.id === node.id)) {
            errors.push({
              type: 'orphan-node',
              message: `Node ${node.id} is not listed in parent ${node.parentId}'s children`,
              data: { nodeId: node.id, parentId: node.parentId },
            })
          }
        }
      }
      
      // 检查子节点是否存在
      Object.entries(node.children).forEach(([type, childIds]) => {
        childIds.forEach(childId => {
          const child = doc.getNodeById(childId)
          if (!child) {
            errors.push({
              type: 'missing-child',
              message: `Node ${node.id} references non-existent child ${childId}`,
              data: { nodeId: node.id, childId },
            })
          } else if (child.parentId !== node.id) {
            errors.push({
              type: 'inconsistent-parent',
              message: `Child ${childId} has inconsistent parent reference`,
              data: { nodeId: node.id, childId, childParentId: child.parentId },
            })
          }
        })
      })
    })
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
  
  /**
   * 验证关系线引用完整性
   */
  validateRelationshipIntegrity(
    doc: MindMapNode,
    relationships: RelationshipData[]
  ): ValidationResult {
    const errors: ValidationError[] = []
    
    relationships.forEach(rel => {
      const end1 = doc.getNodeById(rel.end1Id)
      const end2 = doc.getNodeById(rel.end2Id)
      
      if (!end1) {
        errors.push({
          type: 'missing-relationship-endpoint',
          message: `Relationship ${rel.id} references non-existent node ${rel.end1Id}`,
          data: { relationshipId: rel.id, nodeId: rel.end1Id },
        })
      }
      
      if (!end2) {
        errors.push({
          type: 'missing-relationship-endpoint',
          message: `Relationship ${rel.id} references non-existent node ${rel.end2Id}`,
          data: { relationshipId: rel.id, nodeId: rel.end2Id },
        })
      }
    })
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
```

### 2.3 范围约束

```typescript
// @y-mindmap/model/constraints/range.ts

class RangeConstraint {
  /**
   * 验证 Boundary/Summary 范围
   */
  validateRange(
    parent: MindMapNode,
    range: string
  ): ValidationResult {
    const errors: ValidationError[] = []
    
    // 解析范围
    const parsed = this.parseRange(range)
    if (!parsed) {
      errors.push({
        type: 'invalid-range',
        message: `Invalid range format: ${range}`,
        data: { range },
      })
      return { valid: false, errors }
    }
    
    const { start, end } = parsed
    const children = parent.getChildrenByType('attached')
    
    // 检查范围是否有效
    if (start < 0 || end >= children.length || start > end) {
      errors.push({
        type: 'out-of-range',
        message: `Range [${start}, ${end}] is out of bounds for parent with ${children.length} children`,
        data: { range, start, end, childrenCount: children.length },
      })
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
  
  private parseRange(range: string): { start: number; end: number } | null {
    // 解析 "(0,3)" 格式
    const match = range.match(/^\((\d+),(\d+)\)$/)
    if (!match) return null
    
    return {
      start: parseInt(match[1]),
      end: parseInt(match[2]),
    }
  }
}
```

### 2.4 循环依赖检测

```typescript
// @y-mindmap/model/constraints/cycle.ts

class CycleConstraint {
  /**
   * 检测循环依赖
   */
  detectCycles(doc: MindMapNode): ValidationResult {
    const errors: ValidationError[] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    const dfs = (nodeId: string, path: string[]): boolean => {
      visited.add(nodeId)
      recursionStack.add(nodeId)
      path.push(nodeId)
      
      const node = doc.getNodeById(nodeId)
      if (!node) return false
      
      // 检查所有子节点
      for (const childId of node.getAllChildrenIds()) {
        if (!visited.has(childId)) {
          if (dfs(childId, [...path])) {
            return true
          }
        } else if (recursionStack.has(childId)) {
          // 发现循环
          const cycleStart = path.indexOf(childId)
          const cycle = path.slice(cycleStart)
          
          errors.push({
            type: 'cycle-detected',
            message: `Cycle detected: ${cycle.join(' → ')} → ${childId}`,
            data: { cycle },
          })
          
          return true
        }
      }
      
      recursionStack.delete(nodeId)
      return false
    }
    
    // 从根节点开始检测
    dfs(doc.id, [])
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
```

---

## 三、数据验证

### 3.1 创建时验证

```typescript
// @y-mindmap/model/validation/creation.ts

class CreationValidator {
  /**
   * 验证新节点
   */
  validateNewTopic(data: Partial<TopicData>): ValidationResult {
    const errors: ValidationError[] = []
    
    // 必填字段
    if (!data.id) {
      errors.push({
        type: 'required',
        message: 'ID is required',
        data: { field: 'id' },
      })
    }
    
    if (!data.title && data.title !== '') {
      errors.push({
        type: 'required',
        message: 'Title is required',
        data: { field: 'title' },
      })
    }
    
    // ID 格式
    if (data.id && !this.isValidId(data.id)) {
      errors.push({
        type: 'invalid-format',
        message: 'Invalid ID format',
        data: { field: 'id', value: data.id },
      })
    }
    
    // 标题长度
    if (data.title && data.title.length > 1000) {
      errors.push({
        type: 'max-length',
        message: 'Title exceeds maximum length of 1000 characters',
        data: { field: 'title', length: data.title.length },
      })
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
  
  private isValidId(id: string): boolean {
    // UUID 格式或自定义格式
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const customRegex = /^[a-zA-Z0-9_-]+$/
    
    return uuidRegex.test(id) || customRegex.test(id)
  }
}
```

### 3.2 更新时验证

```typescript
// @y-mindmap/model/validation/update.ts

class UpdateValidator {
  /**
   * 验证节点更新
   */
  validateUpdate(
    node: MindMapNode,
    changes: Partial<TopicData>
  ): ValidationResult {
    const errors: ValidationError[] = []
    
    // 不允许修改 ID
    if (changes.id && changes.id !== node.id) {
      errors.push({
        type: 'immutable',
        message: 'ID cannot be changed',
        data: { field: 'id' },
      })
    }
    
    // 不允许修改类型
    if (changes.type && changes.type !== node.type) {
      errors.push({
        type: 'immutable',
        message: 'Type cannot be changed',
        data: { field: 'type' },
      })
    }
    
    // 标题长度
    if (changes.title && changes.title.length > 1000) {
      errors.push({
        type: 'max-length',
        message: 'Title exceeds maximum length of 1000 characters',
        data: { field: 'title', length: changes.title.length },
      })
    }
    
    // 结构类型有效性
    if (changes.structureClass && !this.isValidStructure(changes.structureClass)) {
      errors.push({
        type: 'invalid-value',
        message: `Invalid structure class: ${changes.structureClass}`,
        data: { field: 'structureClass', value: changes.structureClass },
      })
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
  
  private isValidStructure(structure: string): boolean {
    const validStructures = [
      'org.xmind.ui.map',
      'org.xmind.ui.logic.right',
      'org.xmind.ui.logic.left',
      'org.xmind.ui.tree.right',
      'org.xmind.ui.tree.left',
      'org.xmind.ui.org-chart.down',
      'org.xmind.ui.org-chart.up',
      // ... 更多
    ]
    
    return validStructures.includes(structure)
  }
}
```

### 3.3 删除时验证

```typescript
// @y-mindmap/model/validation/deletion.ts

class DeletionValidator {
  /**
   * 验证节点删除
   */
  validateDeletion(
    doc: MindMapNode,
    nodeId: string
  ): ValidationResult {
    const errors: ValidationError[] = []
    
    const node = doc.getNodeById(nodeId)
    if (!node) {
      errors.push({
        type: 'not-found',
        message: `Node ${nodeId} not found`,
        data: { nodeId },
      })
      return { valid: false, errors }
    }
    
    // 不允许删除根节点
    if (node.isRoot) {
      errors.push({
        type: 'root-node',
        message: 'Cannot delete root node',
        data: { nodeId },
      })
    }
    
    // 检查是否有关系线引用
    const relationships = this.getRelationshipsReferencing(nodeId)
    if (relationships.length > 0) {
      errors.push({
        type: 'referenced',
        message: `Node ${nodeId} is referenced by ${relationships.length} relationships`,
        data: { nodeId, relationshipIds: relationships.map(r => r.id) },
      })
    }
    
    return {
      valid: errors.length === 0,
      errors,
    }
  }
}
```

---

## 四、数据迁移

### 4.1 版本号管理

```typescript
// @y-mindmap/model/migration/version.ts

class VersionManager {
  private currentVersion: string = '1.0.0'
  
  /**
   * 获取当前版本
   */
  getCurrentVersion(): string {
    return this.currentVersion
  }
  
  /**
   * 比较版本
   */
  compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)
    
    for (let i = 0; i < 3; i++) {
      if (parts1[i] > parts2[i]) return 1
      if (parts1[i] < parts2[i]) return -1
    }
    
    return 0
  }
  
  /**
   * 检查是否需要迁移
   */
  needsMigration(dataVersion: string): boolean {
    return this.compareVersions(dataVersion, this.currentVersion) < 0
  }
}
```

### 4.2 数据迁移

```typescript
// @y-mindmap/model/migration/migrator.ts

class DataMigrator {
  private migrations: Migration[] = [
    { from: '0.9.0', to: '1.0.0', migrate: this.migrate_0_9_0_to_1_0_0 },
    // 更多迁移...
  ]
  
  /**
   * 执行迁移
   */
  migrate(data: any, fromVersion: string): any {
    let currentData = { ...data }
    let currentVersion = fromVersion
    
    // 按顺序执行迁移
    for (const migration of this.migrations) {
      if (this.shouldApplyMigration(currentVersion, migration)) {
        currentData = migration.migrate(currentData)
        currentVersion = migration.to
      }
    }
    
    return currentData
  }
  
  private shouldApplyMigration(
    currentVersion: string,
    migration: Migration
  ): boolean {
    return (
      this.compareVersions(currentVersion, migration.from) >= 0 &&
      this.compareVersions(currentVersion, migration.to) < 0
    )
  }
  
  /**
   * 迁移 0.9.0 → 1.0.0
   */
  private migrate_0_9_0_to_1_0_0(data: any): any {
    // 示例: 添加新字段
    if (data.rootTopic) {
      data.rootTopic.createdAt = data.rootTopic.createdAt || Date.now()
      data.rootTopic.updatedAt = data.rootTopic.updatedAt || Date.now()
    }
    
    return data
  }
}

interface Migration {
  from: string
  to: string
  migrate: (data: any) => any
}
```

---

## 五、Snowbrush 数据参考

### 5.1 Topic 数据结构

```typescript
// 来源: /src/models/topic.ts

type TopicData = {
  id: string
  title: string
  style?: StyleData
  class: string
  position?: Point
  structureClass?: STRUCTURECLASS
  branch?: string            // 'folded' = collapsed
  width?: number
  labels?: string[]
  numbering?: NumberingData
  href?: string
  notes?: NotesData
  image?: ImageData
  customWidth?: number
  children?: { [index: string]: TopicData[] }
  markers?: MarkerData[]
  boundaries?: BoundaryData[]
  summaries?: SummaryData[]
  extensions?: ExtensionData[]
  titleUnedited?: boolean
  comments?: IComment[]
}
```

### 5.2 Sheet 数据结构

```typescript
// 来源: /src/models/sheet.ts

interface SheetData {
  id: string
  title: string
  rootTopic: TopicData
  style?: StyleData
  topicPositioning?: 'free' | 'fixed'
  topicOverlapping?: 'overlap' | 'none'
  floatingTopicFlexible?: boolean
  theme?: ThemeData
  relationships?: RelationshipData[]
  legend?: LegendData
  extensions: ExtensionData[]
  coreVersion?: string
  handDrawnModeActive?: boolean
  compactLayoutModeLevel?: COMPACT_LAYOUT_MODE_LEVEL
  settings?: { [key: string]: ISettingItem[] }
}
```

### 5.3 样式键常量

```typescript
// 来源: /src/common/constants/styles.ts

const STYLE_KEYS = {
  SHAPE_CLASS: 'shape-class',
  FILL_COLOR: 'fill-color',
  LINE_COLOR: 'line-color',
  BORDER_LINE_COLOR: 'border-line-color',
  BORDER_LINE_WIDTH: 'border-line-width',
  FONT_SIZE: 'font-size',
  FONT_FAMILY: 'font-family',
  FONT_WEIGHT: 'font-weight',
  TEXT_COLOR: 'text-color',
  // ... 更多
}
```

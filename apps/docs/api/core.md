# @y-mindmap/core

核心类型、常量和错误处理。

## 类型

### TopicData

```typescript
interface TopicData {
  id: string
  title: string
  attributeTitle?: AttributeTitleSegment[]
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
```

### TopicType

```typescript
enum TopicType {
  ROOT = 'root',
  ATTACHED = 'attached',
  DETACHED = 'detached',
  SUMMARY = 'summary',
  CALLOUT = 'callout',
}
```

### StructureType

```typescript
enum StructureType {
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
```

## 错误类

### MindMapError

所有错误的基类。

```typescript
class MindMapError extends Error {
  code: ErrorCode
  context?: Record<string, any>
  cause?: Error
}
```

### ValidationError

输入验证失败。

```typescript
class ValidationError extends MindMapError {
  field?: string
  value?: any
}
```

### NotFoundError

资源不存在。

```typescript
class NotFoundError extends MindMapError {
  resourceType: string
  resourceId: string
}
```

### ConflictError

冲突错误（如协作锁）。

```typescript
class ConflictError extends MindMapError {
  conflictType: string
}
```

## 工具函数

```typescript
isMindMapError(error: unknown): error is MindMapError
getErrorCode(error: unknown): ErrorCode
formatError(error: unknown): string
```

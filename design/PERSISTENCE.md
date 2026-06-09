# PERSISTENCE.md - 数据持久化设计

> 思维导图数据存储、自动保存、恢复机制设计

---

## 一、存储架构

### 1.1 存储层次

```
┌─────────────────────────────────────────────────────────────┐
│ Remote Storage (远程存储)                                     │
│ - REST API                                                   │
│ - GraphQL                                                    │
│ - WebSocket (实时同步)                                        │
├─────────────────────────────────────────────────────────────┤
│ Local Storage (本地存储)                                      │
│ - IndexedDB (主要)                                           │
│ - LocalStorage (备用)                                        │
│ - File System (Electron)                                     │
├─────────────────────────────────────────────────────────────┤
│ Memory (内存)                                                │
│ - EditorState (当前状态)                                      │
│ - UndoStack / RedoStack (历史记录)                            │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 存储接口

```typescript
// @y-mindmap/persistence/storage.ts

interface StorageProvider {
  /** 保存数据 */
  save(key: string, data: any): Promise<void>
  
  /** 加载数据 */
  load(key: string): Promise<any>
  
  /** 删除数据 */
  delete(key: string): Promise<void>
  
  /** 列出所有键 */
  list(): Promise<string[]>
  
  /** 检查是否存在 */
  exists(key: string): Promise<boolean>
}
```

---

## 二、本地存储

### 2.1 IndexedDB 存储

```typescript
// @y-mindmap/persistence/indexeddb.ts

class IndexedDBStorage implements StorageProvider {
  private dbName: string = 'y-mindmap'
  private storeName: string = 'documents'
  private version: number = 1
  
  private db: IDBDatabase | null = null
  
  /**
   * 打开数据库
   */
  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        
        // 创建对象存储
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' })
        }
      }
      
      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        resolve()
      }
      
      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error)
      }
    })
  }
  
  /**
   * 保存数据
   */
  async save(key: string, data: any): Promise<void> {
    if (!this.db) await this.open()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const request = store.put({ id: key, data, updatedAt: Date.now() })
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  /**
   * 加载数据
   */
  async load(key: string): Promise<any> {
    if (!this.db) await this.open()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      const request = store.get(key)
      
      request.onsuccess = () => {
        const result = request.result
        resolve(result ? result.data : null)
      }
      
      request.onerror = () => reject(request.error)
    })
  }
  
  /**
   * 删除数据
   */
  async delete(key: string): Promise<void> {
    if (!this.db) await this.open()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const request = store.delete(key)
      
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  /**
   * 列出所有键
   */
  async list(): Promise<string[]> {
    if (!this.db) await this.open()
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(this.storeName, 'readonly')
      const store = transaction.objectStore(this.storeName)
      
      const request = store.getAllKeys()
      
      request.onsuccess = () => resolve(request.result as string[])
      request.onerror = () => reject(request.error)
    })
  }
  
  /**
   * 检查是否存在
   */
  async exists(key: string): Promise<boolean> {
    const keys = await this.list()
    return keys.includes(key)
  }
}
```

### 2.2 LocalStorage 存储

```typescript
// @y-mindmap/persistence/localstorage.ts

class LocalStorageStorage implements StorageProvider {
  private prefix: string = 'y-mindmap:'
  
  /**
   * 保存数据
   */
  async save(key: string, data: any): Promise<void> {
    const serialized = JSON.stringify({
      data,
      updatedAt: Date.now(),
    })
    
    localStorage.setItem(this.prefix + key, serialized)
  }
  
  /**
   * 加载数据
   */
  async load(key: string): Promise<any> {
    const serialized = localStorage.getItem(this.prefix + key)
    
    if (!serialized) {
      return null
    }
    
    const { data } = JSON.parse(serialized)
    return data
  }
  
  /**
   * 删除数据
   */
  async delete(key: string): Promise<void> {
    localStorage.removeItem(this.prefix + key)
  }
  
  /**
   * 列出所有键
   */
  async list(): Promise<string[]> {
    const keys: string[] = []
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.slice(this.prefix.length))
      }
    }
    
    return keys
  }
  
  /**
   * 检查是否存在
   */
  async exists(key: string): Promise<boolean> {
    return localStorage.getItem(this.prefix + key) !== null
  }
}
```

---

## 三、自动保存

### 3.1 自动保存管理器

```typescript
// @y-mindmap/persistence/auto-save.ts

class AutoSaveManager {
  private storage: StorageProvider
  private editor: EditorView
  private config: AutoSaveConfig
  
  private saveTimer: ReturnType<typeof setTimeout> | null = null
  private lastSaveTime: number = 0
  private isDirty: boolean = false
  
  constructor(
    storage: StorageProvider,
    editor: EditorView,
    config: AutoSaveConfig
  ) {
    this.storage = storage
    this.editor = editor
    this.config = config
    
    this.init()
  }
  
  private init(): void {
    // 监听状态变更
    this.editor.on('stateChanged', () => {
      this.markDirty()
    })
    
    // 监听窗口失焦
    window.addEventListener('blur', () => {
      if (this.config.saveOnBlur) {
        this.save()
      }
    })
    
    // 监听页面关闭
    window.addEventListener('beforeunload', (event) => {
      if (this.isDirty) {
        this.save()
        
        // 提示用户
        event.preventDefault()
        event.returnValue = ''
      }
    })
  }
  
  /**
   * 标记为脏
   */
  private markDirty(): void {
    this.isDirty = true
    
    // 防抖保存
    if (this.config.debounceTime > 0) {
      this.debounceSave()
    }
  }
  
  /**
   * 防抖保存
   */
  private debounceSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }
    
    this.saveTimer = setTimeout(() => {
      this.save()
    }, this.config.debounceTime)
  }
  
  /**
   * 保存
   */
  async save(): Promise<void> {
    // 检查是否需要保存
    if (!this.isDirty) {
      return
    }
    
    // 检查保存间隔
    const now = Date.now()
    if (now - this.lastSaveTime < this.config.minInterval) {
      return
    }
    
    try {
      // 获取当前状态
      const state = this.editor.getState()
      const doc = state.doc
      
      // 序列化
      const data = doc.toJSON()
      
      // 保存
      await this.storage.save(this.config.documentId, data)
      
      // 更新状态
      this.isDirty = false
      this.lastSaveTime = now
      
      // 触发事件
      this.editor.emit('saved', { timestamp: now })
    } catch (error) {
      console.error('Auto-save failed:', error)
      
      // 触发错误事件
      this.editor.emit('saveError', { error })
    }
  }
  
  /**
   * 强制保存
   */
  async forceSave(): Promise<void> {
    this.isDirty = true
    await this.save()
  }
  
  /**
   * 停止自动保存
   */
  stop(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
  }
}

interface AutoSaveConfig {
  /** 文档 ID */
  documentId: string
  
  /** 防抖时间 (毫秒) */
  debounceTime: number      // 默认 1000
  
  /** 最小保存间隔 (毫秒) */
  minInterval: number        // 默认 5000
  
  /** 失焦时保存 */
  saveOnBlur: boolean        // 默认 true
  
  /** 关闭时保存 */
  saveOnClose: boolean       // 默认 true
}
```

### 3.2 保存策略

```typescript
// @y-mindmap/persistence/save-strategy.ts

enum SaveStrategy {
  /** 全量保存 */
  FULL = 'full',
  
  /** 增量保存 */
  INCREMENTAL = 'incremental',
  
  /** 差异保存 */
  DIFF = 'diff',
}

class SaveStrategyExecutor {
  /**
   * 执行保存
   */
  async execute(
    strategy: SaveStrategy,
    storage: StorageProvider,
    documentId: string,
    currentState: MindMapNode,
    previousState: MindMapNode | null
  ): Promise<void> {
    switch (strategy) {
      case SaveStrategy.FULL:
        return this.fullSave(storage, documentId, currentState)
      
      case SaveStrategy.INCREMENTAL:
        return this.incrementalSave(storage, documentId, currentState, previousState)
      
      case SaveStrategy.DIFF:
        return this.diffSave(storage, documentId, currentState, previousState)
    }
  }
  
  /**
   * 全量保存
   */
  private async fullSave(
    storage: StorageProvider,
    documentId: string,
    state: MindMapNode
  ): Promise<void> {
    const data = state.toJSON()
    await storage.save(documentId, data)
  }
  
  /**
   * 增量保存
   */
  private async incrementalSave(
    storage: StorageProvider,
    documentId: string,
    state: MindMapNode,
    previousState: MindMapNode | null
  ): Promise<void> {
    if (!previousState) {
      return this.fullSave(storage, documentId, state)
    }
    
    // 计算变更
    const changes = this.detectChanges(previousState, state)
    
    if (changes.length === 0) {
      return
    }
    
    // 保存变更
    const changeKey = `${documentId}:changes:${Date.now()}`
    await storage.save(changeKey, changes)
  }
  
  /**
   * 差异保存
   */
  private async diffSave(
    storage: StorageProvider,
    documentId: string,
    state: MindMapNode,
    previousState: MindMapNode | null
  ): Promise<void> {
    if (!previousState) {
      return this.fullSave(storage, documentId, state)
    }
    
    // 计算差异
    const diff = this.calcDiff(previousState, state)
    
    if (Object.keys(diff).length === 0) {
      return
    }
    
    // 保存差异
    await storage.save(documentId, { diff, timestamp: Date.now() })
  }
  
  /**
   * 检测变更
   */
  private detectChanges(
    oldState: MindMapNode,
    newState: MindMapNode
  ): Change[] {
    const changes: Change[] = []
    
    // 遍历新状态
    newState.descendants((node) => {
      const oldNode = oldState.getNodeById(node.id)
      
      if (!oldNode) {
        // 新增
        changes.push({
          type: 'add',
          nodeId: node.id,
          data: node.toJSON(),
        })
      } else if (!node.eq(oldNode)) {
        // 修改
        changes.push({
          type: 'update',
          nodeId: node.id,
          data: node.toJSON(),
        })
      }
    })
    
    // 遍历旧状态
    oldState.descendants((node) => {
      const newNode = newState.getNodeById(node.id)
      
      if (!newNode) {
        // 删除
        changes.push({
          type: 'delete',
          nodeId: node.id,
        })
      }
    })
    
    return changes
  }
}

interface Change {
  type: 'add' | 'update' | 'delete'
  nodeId: string
  data?: any
}
```

---

## 四、数据恢复

### 4.1 崩溃恢复

```typescript
// @y-mindmap/persistence/recovery.ts

class CrashRecovery {
  private storage: StorageProvider
  
  constructor(storage: StorageProvider) {
    this.storage = storage
  }
  
  /**
   * 检查是否有未保存的数据
   */
  async checkForRecovery(documentId: string): Promise<boolean> {
    // 检查是否有恢复点
    const recoveryKey = `${documentId}:recovery`
    return this.storage.exists(recoveryKey)
  }
  
  /**
   * 获取恢复数据
   */
  async getRecoveryData(documentId: string): Promise<any | null> {
    const recoveryKey = `${documentId}:recovery`
    return this.storage.load(recoveryKey)
  }
  
  /**
   * 创建恢复点
   */
  async createRecoveryPoint(documentId: string, data: any): Promise<void> {
    const recoveryKey = `${documentId}:recovery`
    await this.storage.save(recoveryKey, {
      data,
      timestamp: Date.now(),
    })
  }
  
  /**
   * 清除恢复点
   */
  async clearRecoveryPoint(documentId: string): Promise<void> {
    const recoveryKey = `${documentId}:recovery`
    await this.storage.delete(recoveryKey)
  }
  
  /**
   * 恢复数据
   */
  async recover(documentId: string): Promise<any | null> {
    // 1. 检查是否有恢复点
    const hasRecovery = await this.checkForRecovery(documentId)
    
    if (!hasRecovery) {
      return null
    }
    
    // 2. 获取恢复数据
    const recoveryData = await this.getRecoveryData(documentId)
    
    if (!recoveryData) {
      return null
    }
    
    // 3. 获取最后保存的数据
    const lastSaved = await this.storage.load(documentId)
    
    // 4. 比较时间戳
    if (lastSaved && lastSaved.updatedAt > recoveryData.timestamp) {
      // 最后保存的数据更新
      return lastSaved.data
    }
    
    // 5. 返回恢复数据
    return recoveryData.data
  }
}
```

### 4.2 版本历史

```typescript
// @y-mindmap/persistence/version-history.ts

class VersionHistory {
  private storage: StorageProvider
  private maxVersions: number = 50
  
  /**
   * 保存版本
   */
  async saveVersion(
    documentId: string,
    data: any,
    message?: string
  ): Promise<void> {
    const versionKey = `${documentId}:version:${Date.now()}`
    
    await this.storage.save(versionKey, {
      data,
      message,
      timestamp: Date.now(),
    })
    
    // 清理旧版本
    await this.cleanupOldVersions(documentId)
  }
  
  /**
   * 获取版本列表
   */
  async getVersions(documentId: string): Promise<VersionInfo[]> {
    const keys = await this.storage.list()
    const versionKeys = keys.filter(key => 
      key.startsWith(`${documentId}:version:`)
    )
    
    const versions: VersionInfo[] = []
    
    for (const key of versionKeys) {
      const version = await this.storage.load(key)
      versions.push({
        id: key,
        timestamp: version.timestamp,
        message: version.message,
      })
    }
    
    // 按时间排序
    versions.sort((a, b) => b.timestamp - a.timestamp)
    
    return versions
  }
  
  /**
   * 获取指定版本
   */
  async getVersion(versionId: string): Promise<any> {
    return this.storage.load(versionId)
  }
  
  /**
   * 恢复到指定版本
   */
  async restoreVersion(documentId: string, versionId: string): Promise<any> {
    const version = await this.storage.load(versionId)
    
    if (!version) {
      throw new Error(`Version ${versionId} not found`)
    }
    
    // 保存当前版本
    const currentData = await this.storage.load(documentId)
    await this.saveVersion(documentId, currentData, 'Before restore')
    
    // 恢复
    await this.storage.save(documentId, version.data)
    
    return version.data
  }
  
  /**
   * 清理旧版本
   */
  private async cleanupOldVersions(documentId: string): Promise<void> {
    const versions = await this.getVersions(documentId)
    
    if (versions.length > this.maxVersions) {
      // 删除最旧的版本
      const toDelete = versions.slice(this.maxVersions)
      
      for (const version of toDelete) {
        await this.storage.delete(version.id)
      }
    }
  }
}

interface VersionInfo {
  id: string
  timestamp: number
  message?: string
}
```

---

## 五、远程存储

### 5.1 REST API 存储

```typescript
// @y-mindmap/persistence/rest-api.ts

class RestApiStorage implements StorageProvider {
  private baseUrl: string
  private headers: Record<string, string>
  
  constructor(baseUrl: string, headers: Record<string, string> = {}) {
    this.baseUrl = baseUrl
    this.headers = headers
  }
  
  /**
   * 保存数据
   */
  async save(key: string, data: any): Promise<void> {
    const response = await fetch(`${this.baseUrl}/documents/${key}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: JSON.stringify(data),
    })
    
    if (!response.ok) {
      throw new Error(`Failed to save: ${response.statusText}`)
    }
  }
  
  /**
   * 加载数据
   */
  async load(key: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/documents/${key}`, {
      headers: this.headers,
    })
    
    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to load: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  /**
   * 删除数据
   */
  async delete(key: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/documents/${key}`, {
      method: 'DELETE',
      headers: this.headers,
    })
    
    if (!response.ok) {
      throw new Error(`Failed to delete: ${response.statusText}`)
    }
  }
  
  /**
   * 列出所有键
   */
  async list(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/documents`, {
      headers: this.headers,
    })
    
    if (!response.ok) {
      throw new Error(`Failed to list: ${response.statusText}`)
    }
    
    return response.json()
  }
  
  /**
   * 检查是否存在
   */
  async exists(key: string): Promise<boolean> {
    const response = await fetch(`${this.baseUrl}/documents/${key}`, {
      method: 'HEAD',
      headers: this.headers,
    })
    
    return response.ok
  }
}
```

### 5.2 WebSocket 实时同步

```typescript
// @y-mindmap/persistence/websocket-sync.ts

class WebSocketSync {
  private ws: WebSocket | null = null
  private documentId: string
  private editor: EditorView
  
  constructor(url: string, documentId: string, editor: EditorView) {
    this.documentId = documentId
    this.editor = editor
    
    this.connect(url)
  }
  
  private connect(url: string): void {
    this.ws = new WebSocket(url)
    
    this.ws.onopen = () => {
      // 订阅文档
      this.send({
        type: 'subscribe',
        documentId: this.documentId,
      })
    }
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      this.handleMessage(message)
    }
    
    this.ws.onclose = () => {
      // 重连
      setTimeout(() => this.connect(url), 1000)
    }
  }
  
  private handleMessage(message: any): void {
    switch (message.type) {
      case 'update':
        this.handleRemoteUpdate(message.data)
        break
      
      case 'awareness':
        this.handleAwareness(message.data)
        break
    }
  }
  
  private handleRemoteUpdate(data: any): void {
    // 应用远程更新
    const tr = this.editor.state.tr
    // ... 应用变更
    this.editor.dispatch(tr)
  }
  
  private handleAwareness(data: any): void {
    // 更新在线状态
    // ...
  }
  
  /**
   * 发送本地更新
   */
  sendUpdate(changes: any): void {
    this.send({
      type: 'update',
      documentId: this.documentId,
      data: changes,
    })
  }
  
  private send(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }
  
  /**
   * 断开连接
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
```

---

## 六、数据导出

### 6.1 JSON 导出

```typescript
// @y-mindmap/persistence/export/json.ts

class JsonExporter {
  /**
   * 导出为 JSON
   */
  export(doc: MindMapNode): string {
    const data = doc.toJSON()
    return JSON.stringify(data, null, 2)
  }
  
  /**
   * 从 JSON 导入
   */
  import(json: string): MindMapNode {
    const data = JSON.parse(json)
    return MindMapNode.fromJSON(data)
  }
}
```

### 6.2 文件保存

```typescript
// @y-mindmap/persistence/export/file.ts

class FileExporter {
  /**
   * 保存为文件
   */
  async saveToFile(
    data: string,
    filename: string,
    mimeType: string = 'application/json'
  ): Promise<void> {
    const blob = new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    URL.revokeObjectURL(url)
  }
  
  /**
   * 从文件加载
   */
  async loadFromFile(): Promise<string> {
    return new Promise((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.json,.xmind,.md'
      
      input.onchange = (event) => {
        const file = (event.target as HTMLInputElement).files?.[0]
        
        if (!file) {
          reject(new Error('No file selected'))
          return
        }
        
        const reader = new FileReader()
        
        reader.onload = () => {
          resolve(reader.result as string)
        }
        
        reader.onerror = () => {
          reject(reader.error)
        }
        
        reader.readAsText(file)
      }
      
      input.click()
    })
  }
}
```

---

## 七、Snowbrush 持久化参考

### 7.1 数据序列化

```typescript
// 来源: /src/models/base.ts

class BaseModel extends Backbone.Model {
  /**
   * 序列化为 JSON
   */
  toJSON(): any {
    return JSON.parse(JSON.stringify(this.attributes))
  }
}
```

### 7.2 数据恢复

```typescript
// 来源: /src/utils/file.ts

function restoreFile(sheets: any): any {
  const clonedSheets = JSON.parse(JSON.stringify(sheets))
  
  // 恢复矩阵扩展数据
  restoreMatrixExtensionData(clonedSheets)
  
  // 恢复样式和主题数据
  restoreStyleAndThemeData(clonedSheets)
  
  // 恢复用户标记数据
  restoreUserMarkerData(clonedSheets)
  
  return clonedSheets
}
```

### 7.3 Topic 解析

```typescript
// 来源: /src/utils/business/parsetopic.ts

function parseTopic(topicData: any, sheetModel: any): TopicModel {
  // 创建 TopicModel
  const topic = sheetModel.createComponent('topic', topicData)
  
  // 递归解析子节点
  if (topicData.children) {
    Object.entries(topicData.children).forEach(([type, children]) => {
      children.forEach((childData: any) => {
        const child = parseTopic(childData, sheetModel)
        topic.addChildTopic(child, { type }, true)
      })
    })
  }
  
  return topic
}
```

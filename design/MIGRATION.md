# MIGRATION.md - 迁移指南

> 从其他思维导图工具迁移指南

---

## 一、从 Snowbrush 迁移

### 1.1 数据迁移

```typescript
// @y-mindmap/migration/snowbrush.ts

class SnowbrushMigrator {
  /**
   * 迁移 Snowbrush 数据
   */
  migrate(data: any): MindMapNode {
    // 1. 转换节点
    const root = this.convertTopic(data.rootTopic)
    
    // 2. 转换关系线
    const relationships = this.convertRelationships(data.relationships)
    
    // 3. 转换主题
    const theme = this.convertTheme(data.theme)
    
    return root
  }
  
  private convertTopic(topic: any): MindMapNode {
    return new MindMapNode({
      id: topic.id,
      title: topic.title,
      type: this.convertType(topic.class),
      style: this.convertStyle(topic.style),
      children: this.convertChildren(topic.children),
      markers: topic.markers,
      labels: topic.labels,
      notes: topic.notes,
      image: topic.image,
      href: topic.href,
    })
  }
  
  private convertType(type: string): TopicType {
    const typeMap: Record<string, TopicType> = {
      'attached': TopicType.ATTACHED,
      'detached': TopicType.DETACHED,
      'summary': TopicType.SUMMARY,
      'callout': TopicType.CALLOUT,
    }
    return typeMap[type] || TopicType.ATTACHED
  }
}
```

### 1.2 API 映射

| Snowbrush API | Y-MindMap API |
|---------------|---------------|
| `SheetEditor.execAction()` | `editor.executeCommand()` |
| `SelectionManager.selectSingle()` | `editor.selectNode()` |
| `DragManager.prepareStartDrag()` | `editor.startDrag()` |
| `MoveViewPort.tryToMoveViewPort()` | `editor.pan()` |
| `Layout.layout()` | `editor.layout()` |

---

## 二、从 XMind 迁移

### 2.1 文件导入

```typescript
// @y-mindmap/migration/xmind.ts

class XMindMigrator {
  /**
   * 从 XMind 文件迁移
   */
  async migrate(file: File): Promise<MindMapNode> {
    // 1. 解压 ZIP
    const zip = await JSZip.loadAsync(file)
    
    // 2. 读取 content.json
    const content = await zip.file('content.json')?.async('string')
    if (!content) {
      throw new Error('Invalid XMind file')
    }
    
    // 3. 转换数据
    const data = JSON.parse(content)
    return this.convertSheet(data[0])
  }
  
  private convertSheet(sheet: any): MindMapNode {
    return this.convertTopic(sheet.rootTopic)
  }
}
```

---

## 三、从其他格式迁移

### 3.1 通用迁移步骤

1. **导出数据** - 从源工具导出为支持的格式
2. **验证数据** - 检查数据完整性
3. **导入数据** - 使用导入功能
4. **调整布局** - 可能需要重新布局
5. **验证结果** - 检查迁移结果

### 3.2 支持的格式

| 格式 | 导入 | 导出 |
|------|------|------|
| XMind | ✅ | ✅ |
| Markdown | ✅ | ✅ |
| OPML | ✅ | ✅ |
| FreeMind | ✅ | ❌ |
| MindManager | ✅ | ❌ |
| MindNode | ✅ | ❌ |

---

## 四、迁移工具

### 4.1 命令行工具

```bash
# 迁移 XMind 文件
npx y-mindmap migrate --from xmind --to y-mindmap input.xmind output.json

# 批量迁移
npx y-mindmap migrate-batch --from xmind --dir ./files
```

### 4.2 图形界面

```typescript
// @y-mindmap/migration/ui.ts

class MigrationUI {
  /**
   * 显示迁移对话框
   */
  async showMigrationDialog(): Promise<void> {
    const file = await this.selectFile()
    const format = this.detectFormat(file)
    
    const confirmed = await this.confirmMigration(file, format)
    if (!confirmed) return
    
    const result = await this.performMigration(file, format)
    this.showResult(result)
  }
}
```

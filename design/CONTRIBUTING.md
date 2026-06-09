# CONTRIBUTING.md - 贡献指南

> 思维导图编辑器贡献指南

---

## 一、开发环境

### 1.1 环境要求

- Node.js >= 18
- pnpm >= 8
- Git

### 1.2 安装步骤

```bash
# 1. 克隆仓库
git clone https://github.com/your-org/y-mindmap.git

# 2. 安装依赖
pnpm install

# 3. 启动开发服务器
pnpm dev

# 4. 运行测试
pnpm test
```

---

## 二、代码规范

### 2.1 命名规范

- **文件名**: kebab-case (`my-component.ts`)
- **类名**: PascalCase (`MyClass`)
- **函数名**: camelCase (`myFunction`)
- **常量**: UPPER_SNAKE_CASE (`MY_CONSTANT`)
- **接口**: PascalCase，以 `I` 前缀（可选）(`IMyInterface`)

### 2.2 代码风格

```typescript
// ✅ Good
class TopicNode {
  private id: string
  private title: string
  
  constructor(id: string, title: string) {
    this.id = id
    this.title = title
  }
  
  getTitle(): string {
    return this.title
  }
}

// ❌ Bad
class topic_node {
  ID: string
  Title: string
  
  constructor(id, title) {
    this.ID = id
    this.Title = title
  }
}
```

### 2.3 注释规范

```typescript
/**
 * 计算节点布局
 * 
 * @param node - 要布局的节点
 * @param options - 布局选项
 * @returns 布局结果
 */
function calculateLayout(node: MindMapNode, options: LayoutOptions): LayoutResult {
  // 实现...
}
```

---

## 三、Git 规范

### 3.1 分支策略

```
main          - 生产分支
├── develop   - 开发分支
│   ├── feature/*  - 功能分支
│   ├── fix/*      - 修复分支
│   └── refactor/* - 重构分支
└── release/* - 发布分支
```

### 3.2 提交规范

```
<type>(<scope>): <subject>

类型:
- feat: 新功能
- fix: 修复
- docs: 文档
- style: 格式
- refactor: 重构
- test: 测试
- chore: 构建/工具

示例:
feat(topic): 添加节点拖拽功能
fix(layout): 修复布局计算错误
docs(readme): 更新 README
```

### 3.3 PR 规范

1. **标题**: 清晰描述变更
2. **描述**: 说明变更原因和内容
3. **测试**: 说明如何测试
4. **截图**: 如有 UI 变更，提供截图

---

## 四、测试规范

### 4.1 测试要求

- 新功能必须有测试
- 修复必须有回归测试
- 测试覆盖率不低于 80%

### 4.2 测试工具

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm test:unit

# 运行 E2E 测试
pnpm test:e2e

# 生成覆盖率报告
pnpm test:coverage
```

---

## 五、文档规范

### 5.1 文档要求

- 新功能必须有文档
- API 变更必须更新文档
- 复杂功能必须有示例

### 5.2 文档格式

```markdown
# 功能名称

## 概述

简要描述功能

## 使用方法

```typescript
// 代码示例
```

## API

### 方法

| 方法 | 参数 | 返回值 | 说明 |
|------|------|--------|------|
| `method()` | `param: type` | `type` | 说明 |

## 示例

完整示例代码
```

---

## 六、发布流程

### 6.1 版本号规则

- **patch**: 修复 bug
- **minor**: 新功能
- **major**: 破坏性变更

### 6.2 发布步骤

```bash
# 1. 更新版本
npm version patch|minor|major

# 2. 构建
pnpm build

# 3. 测试
pnpm test

# 4. 提交
git add .
git commit -m "release: v1.0.0"

# 5. 打标签
git tag v1.0.0

# 6. 推送
git push && git push --tags

# 7. 发布到 npm
npm publish
```

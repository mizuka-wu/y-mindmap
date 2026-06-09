# DEPLOYMENT.md - 部署设计

> 思维导图编辑器部署和发布设计

---

## 一、构建配置

### 1.1 开发构建

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 1.2 生产构建

```typescript
// vite.config.ts

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'YMindMap',
      formats: ['es', 'cjs', 'umd'],
      fileName: (format) => `y-mindmap.${format}.js`,
    },
    rollupOptions: {
      external: ['vue', 'react'],
      output: {
        globals: {
          vue: 'Vue',
          react: 'React',
        },
      },
    },
    sourcemap: true,
    minify: 'terser',
  },
})
```

---

## 二、包发布

### 2.1 npm 发布

```json
{
  "name": "y-mindmap",
  "version": "1.0.0",
  "main": "dist/y-mindmap.cjs.js",
  "module": "dist/y-mindmap.es.js",
  "types": "dist/index.d.ts",
  "files": ["dist"],
  "exports": {
    ".": {
      "import": "./dist/y-mindmap.es.js",
      "require": "./dist/y-mindmap.cjs.js",
      "types": "./dist/index.d.ts"
    }
  }
}
```

### 2.2 发布流程

```bash
# 1. 更新版本
npm version patch|minor|major

# 2. 构建
pnpm build

# 3. 测试
pnpm test

# 4. 发布
npm publish
```

---

## 三、CDN 部署

### 3.1 CDN 配置

```html
<!-- unpkg -->
<script src="https://unpkg.com/y-mindmap@latest/dist/y-mindmap.umd.js"></script>

<!-- jsdelivr -->
<script src="https://cdn.jsdelivr.net/npm/y-mindmap@latest/dist/y-mindmap.umd.js"></script>
```

### 3.2 版本管理

```
y-mindmap@1.0.0  - 具体版本
y-mindmap@1.0    - 最新 1.0.x
y-mindmap@1      - 最新 1.x.x
y-mindmap@latest - 最新版本
```

---

## 四、文档部署

### 4.1 VitePress 部署

```yaml
# .github/workflows/docs.yml

name: Deploy Docs

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: pnpm install
      
      - name: Build docs
        run: pnpm docs:build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: docs/.vitepress/dist
```

---

## 五、监控

### 5.1 错误监控

```typescript
// @y-mindmap/monitoring/error.ts

class ErrorMonitor {
  constructor(dsn: string) {
    // 初始化 Sentry 或其他错误监控
    Sentry.init({ dsn })
  }
  
  captureError(error: Error, context?: any): void {
    Sentry.captureException(error, { extra: context })
  }
  
  captureMessage(message: string, level: 'info' | 'warning' | 'error'): void {
    Sentry.captureMessage(message, level)
  }
}
```

### 5.2 性能监控

```typescript
// @y-mindmap/monitoring/performance.ts

class PerformanceMonitor {
  /**
   * 记录性能指标
   */
  recordMetric(name: string, value: number): void {
    // 发送到分析服务
    analytics.track('performance', { name, value })
  }
  
  /**
   * 监控渲染性能
   */
  monitorRender(): void {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.recordMetric(entry.name, entry.duration)
      }
    })
    
    observer.observe({ entryTypes: ['measure'] })
  }
}
```

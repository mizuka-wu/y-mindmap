import { defineConfig } from "vitepress";

export default defineConfig({
  base: "/y-mindmap/",
  title: "Y-MindMap",
  description: "基于 Leafer.js 的现代化思维导图编辑器",
  lang: "zh-CN",

  themeConfig: {
    nav: [
      { text: "指南", link: "/guide/" },
      { text: "API", link: "/api/" },
      { text: "示例", link: "/demo/", target: "_blank" },
      { text: "更新日志", link: "/changelog" },
    ],

    sidebar: {
      "/guide/": [
        {
          text: "入门",
          items: [
            { text: "简介", link: "/guide/" },
            { text: "快速开始", link: "/guide/getting-started" },
            { text: "安装", link: "/guide/installation" },
          ],
        },
        {
          text: "核心概念",
          items: [
            { text: "架构设计", link: "/guide/architecture" },
            { text: "数据模型", link: "/guide/data-model" },
            { text: "状态管理", link: "/guide/state" },
            { text: "视图渲染", link: "/guide/view" },
          ],
        },
        {
          text: "功能",
          items: [
            { text: "布局系统", link: "/guide/layouts" },
            { text: "主题系统", link: "/guide/themes" },
            { text: "交互系统", link: "/guide/interactions" },
            { text: "命令系统", link: "/guide/commands" },
            { text: "扩展系统", link: "/guide/extensions" },
            { text: "富文本", link: "/guide/rich-text" },
          ],
        },
        {
          text: "高级",
          items: [
            { text: "协作编辑", link: "/guide/collaboration" },
            { text: "AI 集成", link: "/guide/ai" },
            { text: "性能优化", link: "/guide/performance" },
            { text: "Diff 系统", link: "/guide/diff" },
          ],
        },
      ],
      "/api/": [
        {
          text: "核心",
          items: [
            { text: "MindMapEditor", link: "/api/editor" },
            { text: "MindMapNode", link: "/api/node" },
            { text: "RootTopic", link: "/api/document" },
          ],
        },
        {
          text: "包",
          items: [
            { text: "@y-mindmap/core", link: "/api/core" },
            { text: "@y-mindmap/state", link: "/api/state" },
            { text: "@y-mindmap/view", link: "/api/view" },
            { text: "@y-mindmap/layout", link: "/api/layout" },
            { text: "@y-mindmap/commands", link: "/api/commands" },
            { text: "@y-mindmap/extension", link: "/api/extension" },
            { text: "@y-mindmap/collab", link: "/api/collab" },
            { text: "@y-mindmap/ai", link: "/api/ai" },
            { text: "@y-mindmap/webmcp", link: "/api/webmcp" },
            { text: "@y-mindmap/templates", link: "/api/templates" },
          ],
        },
      ],
      "/examples/": [
        {
          text: "基础",
          items: [
            { text: "创建思维导图", link: "/examples/basic" },
            { text: "自定义主题", link: "/examples/themes" },
            { text: "导入导出", link: "/examples/import-export" },
          ],
        },
        {
          text: "高级",
          items: [
            { text: "协作编辑", link: "/examples/collaboration" },
            { text: "扩展开发", link: "/examples/extensions" },
            { text: "AI 集成", link: "/examples/ai" },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: "github", link: "https://github.com/your-org/y-mindmap" },
    ],

    footer: {
      message: "基于 MIT 许可发布",
      copyright: "Copyright © 2024 Y-MindMap",
    },

    search: {
      provider: "local",
    },

    outline: {
      level: [2, 3],
      label: "页面导航",
    },

    lastUpdated: {
      text: "最后更新于",
    },

    docFooter: {
      prev: "上一页",
      next: "下一页",
    },

    returnToTopLabel: "回到顶部",
    sidebarMenuLabel: "菜单",
    darkModeSwitchLabel: "主题",
  },
});

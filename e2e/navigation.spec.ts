import { test, expect } from '@playwright/test'
import { collectConsoleErrors } from './helpers'

/**
 * demos 应用是多页面 Vite 站点，每个页面演示一类能力。
 * 这些用例确保每个演示页面都能独立加载并渲染出可交互的思维导图编辑器。
 */
const DEMO_PAGES = [
  { path: '/', name: '基础' },
  { path: '/richtext.html', name: '富文本' },
  { path: '/collaboration.html', name: '协作' },
  { path: '/templates.html', name: '模板' },
  { path: '/themes.html', name: '主题' },
  { path: '/layouts.html', name: '布局' },
  { path: '/ai.html', name: 'AI' },
]

test.describe('多页面演示导航', () => {
  for (const demo of DEMO_PAGES) {
    test(`「${demo.name}」页面加载并渲染编辑器`, async ({ page }) => {
      const errors = collectConsoleErrors(page)
      await page.goto(demo.path)

      // 编辑器容器与 canvas 渲染
      await expect(page.locator('.y-mindmap-editor-container')).toBeVisible()
      await expect(page.locator('.y-mindmap-editor-container canvas').first()).toBeVisible()

      const fatal = errors.filter((e) => !/favicon|ws:\/\/|websocket/i.test(e))
      expect(fatal, `「${demo.name}」存在运行时错误:\n${fatal.join('\n')}`).toHaveLength(0)
    })
  }

  test('顶部导航包含全部演示入口', async ({ page }) => {
    await page.goto('/')
    const navLinks = page.locator('.nav a')
    await expect(navLinks).toHaveCount(DEMO_PAGES.length)
  })
})

import { test, expect } from '@playwright/test'
import {
  gotoBaseDemo,
  collectConsoleErrors,
  expectEditorExposed,
  getNodeCount,
  statusBarText,
  DEMO_NODE_COUNT,
} from './helpers'

test.describe('应用加载 / Smoke', () => {
  test('页面成功加载且无致命 console 错误', async ({ page }) => {
    const errors = collectConsoleErrors(page)
    await gotoBaseDemo(page)

    await expect(page).toHaveTitle(/Y-MindMap Demos/)
    await expect(page.locator('.header h1')).toHaveText('Y-MindMap Demos')

    // 允许第三方/网络类噪声，但不应有未捕获的 page error
    const fatal = errors.filter((e) => !/favicon|ws:\/\/|websocket/i.test(e))
    expect(fatal, `意外的运行时错误:\n${fatal.join('\n')}`).toHaveLength(0)
  })

  test('核心 UI 区域均已渲染（工具栏 / 编辑区 / canvas / 状态栏）', async ({ page }) => {
    await gotoBaseDemo(page)

    await expect(page.locator('.y-mindmap-toolbar')).toBeVisible()
    await expect(page.locator('.y-mindmap-editor-container')).toBeVisible()
    await expect(page.locator('.y-mindmap-status-bar')).toBeVisible()

    // Leafer-UI 在编辑区内渲染 canvas
    const canvasCount = await page.locator('.y-mindmap-editor-container canvas').count()
    expect(canvasCount).toBeGreaterThan(0)
  })

  test('editor 测试钩子已暴露', async ({ page }) => {
    await gotoBaseDemo(page)
    await expectEditorExposed(page)
  })

  test('默认演示文档包含 21 个节点，状态栏同步显示', async ({ page }) => {
    await gotoBaseDemo(page)

    expect(await getNodeCount(page)).toBe(DEMO_NODE_COUNT)
    expect(await statusBarText(page)).toContain(`节点数: ${DEMO_NODE_COUNT}`)
  })
})

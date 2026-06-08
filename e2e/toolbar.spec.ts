import { test, expect } from '@playwright/test'
import { gotoBaseDemo, selectNode, getSelection } from './helpers'

test.describe('工具栏渲染与状态', () => {
  test.beforeEach(async ({ page }) => {
    await gotoBaseDemo(page)
  })

  test('渲染所有命令按钮分组', async ({ page }) => {
    const expectedActions = [
      'new', 'open', 'save',
      'undo', 'redo', 'cut', 'copy', 'paste', 'duplicate',
      'addSubTopic', 'addSiblingTopic', 'deleteNode', 'toggleFold',
      'zoomIn', 'zoomOut', 'fitToContent',
    ]
    for (const action of expectedActions) {
      await expect(
        page.locator(`.y-mindmap-toolbar button[data-action="${action}"]`),
        `按钮 ${action} 应存在`,
      ).toHaveCount(1)
    }

    // 布局选择器及其 9 个选项
    const structureSelect = page.locator('.y-mindmap-toolbar select[data-action="select-structure"]')
    await expect(structureSelect).toHaveCount(1)
    await expect(structureSelect.locator('option')).toHaveCount(9)
  })

  test('无选区时，撤销/重做与依赖选区的按钮处于禁用态', async ({ page }) => {
    // 初始无可撤销历史
    await expect(page.locator('button[data-action="undo"]')).toBeDisabled()
    await expect(page.locator('button[data-action="redo"]')).toBeDisabled()

    // 依赖选区的命令在无选区时禁用
    for (const action of ['deleteNode', 'addSubTopic', 'addSiblingTopic', 'copy', 'cut']) {
      await expect(
        page.locator(`button[data-action="${action}"]`),
        `${action} 无选区时应禁用`,
      ).toBeDisabled()
    }
  })

  test('选中单个节点后，相关按钮启用且状态栏显示选区', async ({ page }) => {
    await selectNode(page, 'features')
    expect(await getSelection(page)).toEqual(['features'])

    await expect(page.locator('button[data-action="addSubTopic"]')).toBeEnabled()
    await expect(page.locator('button[data-action="deleteNode"]')).toBeEnabled()
    await expect(page.locator('.y-mindmap-status-bar')).toContainText('已选择: 核心功能')
  })
})

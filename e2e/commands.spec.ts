import { test, expect } from '@playwright/test'
import {
  gotoBaseDemo,
  getNodeCount,
  getSelection,
  selectNode,
  executeCommand,
  canUndo,
  canRedo,
  statusBarText,
  DEMO_NODE_COUNT,
} from './helpers'

test.describe('命令系统：增删 / 撤销重做 / 选择', () => {
  test.beforeEach(async ({ page }) => {
    await gotoBaseDemo(page)
  })

  test('addSubTopic：在选中节点下新增子节点并选中新节点', async ({ page }) => {
    await selectNode(page, 'root')

    const ok = await executeCommand(page, 'addSubTopic')
    expect(ok).toBe(true)

    expect(await getNodeCount(page)).toBe(DEMO_NODE_COUNT + 1)

    // 新节点应被单选
    const selection = await getSelection(page)
    expect(selection).toHaveLength(1)
    expect(selection[0]).not.toBe('root')

    await expect(page.locator('.y-mindmap-status-bar')).toContainText(
      `节点数: ${DEMO_NODE_COUNT + 1}`,
    )
  })

  test('addSubTopic 无选区时不生效', async ({ page }) => {
    await executeCommand(page, 'deselectAll')
    const ok = await executeCommand(page, 'addSubTopic')
    expect(ok).toBe(false)
    expect(await getNodeCount(page)).toBe(DEMO_NODE_COUNT)
  })

  test('deleteNode：删除子树并将选区移动到父节点', async ({ page }) => {
    // 'features' 含 4 个子节点，删除后应减少 5（自身 + 4 子）
    await selectNode(page, 'features')
    const ok = await executeCommand(page, 'deleteNode')
    expect(ok).toBe(true)

    expect(await getNodeCount(page)).toBe(DEMO_NODE_COUNT - 5)
    expect(await getSelection(page)).toEqual(['root'])
  })

  test('undo / redo：可逆地恢复与重做编辑', async ({ page }) => {
    await selectNode(page, 'root')
    await executeCommand(page, 'addSubTopic')
    expect(await getNodeCount(page)).toBe(DEMO_NODE_COUNT + 1)
    expect(await canUndo(page)).toBe(true)

    // 撤销
    await executeCommand(page, 'undo')
    expect(await getNodeCount(page)).toBe(DEMO_NODE_COUNT)
    expect(await canRedo(page)).toBe(true)

    // 重做
    await executeCommand(page, 'redo')
    expect(await getNodeCount(page)).toBe(DEMO_NODE_COUNT + 1)
  })

  test('selectAll / deselectAll：批量选择与清空', async ({ page }) => {
    await executeCommand(page, 'selectAll')
    const all = await getSelection(page)
    expect(all.length).toBeGreaterThan(1)
    await expect(page.locator('.y-mindmap-status-bar')).toContainText('已选择')

    await executeCommand(page, 'deselectAll')
    expect(await getSelection(page)).toHaveLength(0)
    expect(await statusBarText(page)).toContain('未选择')
  })

  test('duplicate：复制选中节点后节点数增加', async ({ page }) => {
    await selectNode(page, 'shapes') // 叶子节点
    const before = await getNodeCount(page)
    const ok = await executeCommand(page, 'duplicate')
    expect(ok).toBe(true)
    expect(await getNodeCount(page)).toBeGreaterThan(before)
  })
})

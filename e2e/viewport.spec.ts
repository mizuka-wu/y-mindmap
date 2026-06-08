import { test, expect } from '@playwright/test'
import { gotoBaseDemo, getZoom } from './helpers'

test.describe('视口：缩放与适应', () => {
  test.beforeEach(async ({ page }) => {
    await gotoBaseDemo(page)
  })

  test('zoomIn 放大、zoomOut 缩小', async ({ page }) => {
    const initial = await getZoom(page)

    await page.evaluate(() => (window as any).__ymindmap.editor.zoomIn())
    const zoomedIn = await getZoom(page)
    expect(zoomedIn).toBeGreaterThan(initial)

    await page.evaluate(() => (window as any).__ymindmap.editor.zoomOut())
    await page.evaluate(() => (window as any).__ymindmap.editor.zoomOut())
    const zoomedOut = await getZoom(page)
    expect(zoomedOut).toBeLessThan(zoomedIn)
  })

  test('fitToContent 返回有效的缩放比例', async ({ page }) => {
    await page.evaluate(() => (window as any).__ymindmap.editor.zoomIn())
    await page.evaluate(() => (window as any).__ymindmap.editor.fitToContent())

    const zoom = await getZoom(page)
    expect(zoom).toBeGreaterThan(0)
    expect(Number.isFinite(zoom)).toBe(true)
  })
})

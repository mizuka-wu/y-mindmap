import { Page, expect } from "@playwright/test";

/**
 * E2E 测试辅助函数。
 *
 * 思维导图节点渲染在 canvas（Leafer-UI）上，无法用 DOM 选择器直接点击节点，
 * 因此通过 demos 应用挂在 window 上的 `__ymindmap` 钩子来驱动真实 editor 实例并读取状态。
 */

export const DEMO_NODE_COUNT = 21; // root(1) + 4 个一级 + 16 个二级

/** 打开基础 demo 页面并等待 editor 钩子就绪。 */
export async function gotoBaseDemo(page: Page): Promise<void> {
  await page.goto("/");
  await waitForEditorReady(page);
}

/** 等待 window.__ymindmap.editor 注入完成。 */
export async function waitForEditorReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const w = window as any;
    return !!w.__ymindmap && !!w.__ymindmap.editor;
  });
}

/** 当前文档的节点总数（含根节点）。 */
export function getNodeCount(page: Page): Promise<number> {
  return page.evaluate(
    () => (window as any).__ymindmap.editor.getDocument().root.descendantCount,
  );
}

/** 当前选区的节点 id 列表。 */
export function getSelection(page: Page): Promise<string[]> {
  return page.evaluate(() => (window as any).__ymindmap.editor.getSelection());
}

/**
 * 选中指定 id 的节点。
 *
 * 注意：不能用 `editor.selectNode(id)`，因为 `executeCommand(name)` 会忽略参数，
 * 内置 selectNode 命令的 nodeId 被固定为空串。这里直接派发一个设置选区的事务，
 * 这是更新 editor 真实状态的可靠方式。
 */
export function selectNode(page: Page, nodeId: string): Promise<void> {
  return page.evaluate((id) => {
    const { editor, Selection } = (window as any).__ymindmap;
    const tr = editor.getState().tr;
    tr.setSelection(Selection.single(id));
    editor.dispatch(tr);
  }, nodeId);
}

/** 执行一个命令，返回命令是否生效。 */
export function executeCommand(page: Page, name: string): Promise<boolean> {
  return page.evaluate(
    (n) => (window as any).__ymindmap.editor.executeCommand(n),
    name,
  );
}

/** 当前视图缩放比例。 */
export function getZoom(page: Page): Promise<number> {
  return page.evaluate(() =>
    (window as any).__ymindmap.editor.getView().getZoom(),
  );
}

export function canUndo(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as any).__ymindmap.editor.canUndo());
}

export function canRedo(page: Page): Promise<boolean> {
  return page.evaluate(() => (window as any).__ymindmap.editor.canRedo());
}

/** 状态栏文本（节点数 / 选区 / 缩放）。 */
export async function statusBarText(page: Page): Promise<string> {
  return (await page.locator(".y-mindmap-status-bar").innerText())
    .replace(/\s+/g, " ")
    .trim();
}

/** 收集页面运行期间的 console error，便于 smoke 断言。 */
export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
  return errors;
}

/** 断言 editor 钩子可用。 */
export async function expectEditorExposed(page: Page): Promise<void> {
  const hasEditor = await page.evaluate(() => {
    const w = window as any;
    return !!(w.__ymindmap && w.__ymindmap.editor);
  });
  expect(hasEditor).toBe(true);
}

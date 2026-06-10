import { MindMapEditor } from "@y-mindmap/editor";
import { StarterKit } from "@y-mindmap/vanilla";

const container = document.getElementById("app")!;

const editor = new MindMapEditor({
  container,
  extensions: [...StarterKit()],
  showToolbar: false,
  showPropertyPanel: false,
  showStatusBar: false,
  showMiniMap: false,
});
(window as any).editor = editor;

// ── Floating Toolbar ──
container.insertAdjacentHTML(
  "beforebegin",
  `
  <div class="floating-bar">
    <button id="btn-open" title="打开 XMind">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M12 18v-6M9 15l3-3 3 3"/></svg>
    </button>
    <input type="file" id="file-input" accept=".xmind" style="display:none" />
  </div>
`,
);

document.getElementById("btn-open")!.onclick = () =>
  document.getElementById("file-input")!.click();

document.getElementById("file-input")!.addEventListener("change", (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) {
    editor
      .loadXMindFile(file)
      .catch((err: any) => alert("导入失败: " + err.message));
  }
  (e.target as HTMLInputElement).value = "";
});

// ── Styles ──
document.head.insertAdjacentHTML(
  "beforeend",
  `<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; }
  .floating-bar {
    position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
    display: flex; gap: 4px; padding: 6px;
    background: rgba(255,255,255,0.92); backdrop-filter: blur(12px);
    border: 1px solid rgba(0,0,0,0.08); border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08); z-index: 1000;
    align-items: center;
  }
  .floating-bar button {
    display: flex; align-items: center; justify-content: center;
    width: 32px; height: 32px; padding: 0;
    border: none; border-radius: 8px;
    background: transparent; cursor: pointer;
    color: #555; transition: all 0.15s;
  }
  .floating-bar button:hover { background: #f0f0f0; color: #222; }
  .floating-bar .sep { width: 1px; height: 20px; background: #e0e0e0; margin: 0 2px; }
  #app { width: 100vw; height: 100vh; }
</style>`,
);

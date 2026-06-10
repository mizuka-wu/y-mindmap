import { RootTopic } from '@y-mindmap/state'
import { MindMapEditor } from '@y-mindmap/editor'
import type { ExtensionDefinition } from '@y-mindmap/extension'
import { StarterKit } from '@y-mindmap/vanilla'
import { Collab, Debug } from '@y-mindmap/extensions'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

// ── State ──
let editor: MindMapEditor | null = null
let ydoc: Y.Doc | null = null
let wsProvider: WebsocketProvider | null = null

const user = {
  id: crypto.randomUUID(),
  name: 'User-' + Math.floor(Math.random() * 1000),
  account: 'local',
  color: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'][Math.floor(Math.random() * 6)]!,
}

// ── Init ──
const container = document.getElementById('app')!
createEditor()

function createEditor(collabYdoc?: Y.Doc) {
  editor?.destroy()

  const extensions: ExtensionDefinition<any>[] = [
    ...StarterKit(),
    Debug.configure({ showPanel: true }),
  ]
  if (collabYdoc) {
    extensions.push(Collab.configure({ ydoc: collabYdoc }))
  }

  editor = new MindMapEditor({
    container,
    extensions,
    user,
  })
}

// ── UI ──
container.insertAdjacentHTML('beforebegin', `
  <div class="toolbar">
    <button onclick="editor?.executeCommand('addSubTopic')">+ 子节点</button>
    <button onclick="editor?.executeCommand('addSiblingTopic')">+ 同级</button>
    <button onclick="editor?.executeCommand('deleteNode')">删除</button>
    <span class="sep"></span>
    <button onclick="editor?.executeCommand('undo')">撤销</button>
    <button onclick="editor?.executeCommand('redo')">重做</button>
    <span class="sep"></span>
    <button onclick="editor?.zoomIn()">放大</button>
    <button onclick="editor?.zoomOut()">缩小</button>
    <button onclick="editor?.fitToContent()">适应</button>
    <span class="sep"></span>
    <button id="btn-collab" class="collab-btn">协作</button>
  </div>
  <div id="collab-panel" class="collab-panel hidden">
    <div class="row">
      <label>房间</label>
      <input id="room-id" value="demo-room" />
    </div>
    <div class="row">
      <label>服务器</label>
      <input id="server-url" value="ws://localhost:1234" />
    </div>
    <div class="row">
      <button id="btn-connect">连接</button>
      <button id="btn-disconnect" disabled>断开</button>
      <span id="status" class="status">未连接</span>
    </div>
    <div id="peers"></div>
  </div>
`)

// ── Collab ──
document.getElementById('btn-collab')!.onclick = () => {
  document.getElementById('collab-panel')!.classList.toggle('hidden')
}

document.getElementById('btn-connect')!.onclick = () => {
  const roomId = (document.getElementById('room-id') as HTMLInputElement).value || 'demo-room'
  const serverUrl = (document.getElementById('server-url') as HTMLInputElement).value || 'ws://localhost:1234'

  ydoc = new Y.Doc()
  wsProvider = new WebsocketProvider(serverUrl, roomId, ydoc)

  wsProvider.on('status', (e: { status: string }) => {
    document.getElementById('status')!.textContent = e.status === 'connected' ? '已连接' : '连接中...'
  })

  wsProvider.awareness.setLocalStateField('user', {
    name: user.name,
    color: user.color,
  })

  wsProvider.on('sync', (synced: boolean) => {
    if (synced) {
      // Recreate editor with collab
      createEditor(ydoc!)
      document.getElementById('btn-connect')!.setAttribute('disabled', 'true')
      document.getElementById('btn-disconnect')!.removeAttribute('disabled')
    }
  })
}

document.getElementById('btn-disconnect')!.onclick = () => {
  wsProvider?.destroy()
  ydoc?.destroy()
  wsProvider = null
  ydoc = null

  // Recreate editor without collab
  createEditor()

  document.getElementById('btn-connect')!.removeAttribute('disabled')
  document.getElementById('btn-disconnect')!.setAttribute('disabled', 'true')
  document.getElementById('status')!.textContent = '未连接'
  document.getElementById('peers')!.innerHTML = ''
}

// ── Styles ──
document.head.insertAdjacentHTML('beforeend', `<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  .toolbar {
    display: flex; gap: 6px; padding: 10px 16px;
    background: #f8f8f8; border-bottom: 1px solid #e0e0e0;
    align-items: center; flex-wrap: wrap;
  }
  .toolbar button {
    padding: 6px 14px; border: 1px solid #d0d0d0; border-radius: 6px;
    background: #fff; cursor: pointer; font-size: 13px; transition: all 0.15s;
  }
  .toolbar button:hover { background: #f0f0f0; border-color: #bbb; }
  .sep { width: 1px; height: 20px; background: #ddd; margin: 0 4px; }
  .collab-btn { background: #4A90D9 !important; color: #fff; border-color: #3a7bc8 !important; }
  .collab-btn:hover { background: #3a7bc8 !important; }
  .collab-panel {
    position: fixed; top: 56px; right: 16px; width: 280px;
    background: #fff; border-radius: 10px; box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    padding: 16px; z-index: 100; font-size: 13px;
  }
  .collab-panel.hidden { display: none; }
  .row { display: flex; gap: 8px; align-items: center; margin-bottom: 10px; }
  .row label { width: 40px; font-size: 12px; color: #888; }
  .row input {
    flex: 1; padding: 6px 10px; border: 1px solid #ddd; border-radius: 6px; font-size: 13px;
  }
  .row button {
    padding: 6px 14px; border: none; border-radius: 6px;
    cursor: pointer; font-size: 13px;
  }
  #btn-connect { background: #4A90D9; color: #fff; }
  #btn-connect:disabled { background: #ccc; cursor: not-allowed; }
  #btn-disconnect { background: #f5f5f5; color: #666; border: 1px solid #ddd; }
  #btn-disconnect:disabled { background: #f5f5f5; color: #ccc; cursor: not-allowed; }
  .status { font-size: 12px; color: #999; }
  #app { width: 100vw; height: calc(100vh - 56px); }
</style>`)

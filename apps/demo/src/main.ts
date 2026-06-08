import { createMindMap, MindMapDocument, MindMapNode, TopicType } from '@y-mindmap/vanilla'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const container = document.getElementById('app')
if (!container) {
  throw new Error('Container not found')
}

let ydoc: Y.Doc | null = null
let wsProvider: WebsocketProvider | null = null
let currentUser = { name: 'User ' + Math.floor(Math.random() * 1000), color: getRandomColor() }

const editor = createMindMap(container, {
  user: currentUser,
})

setupUI()

function getRandomColor(): string {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
  return colors[Math.floor(Math.random() * colors.length)]!
}

function setupUI() {
  const toolbar = document.createElement('div')
  toolbar.className = 'toolbar'
  toolbar.innerHTML = `
    <button id="btn-open">打开 XMind</button>
    <button id="btn-new">新建</button>
    <button id="btn-add">添加节点</button>
    <button id="btn-delete">删除节点</button>
    <button id="btn-undo">撤销</button>
    <button id="btn-redo">重做</button>
    <button id="btn-zoom-in">放大</button>
    <button id="btn-zoom-out">缩小</button>
    <button id="btn-fit">适应</button>
    <select id="layout-select">
      <option value="org.xmind.ui.map">思维导图</option>
      <option value="org.xmind.ui.logic.right">逻辑图</option>
      <option value="org.xmind.ui.tree.right">树形图</option>
      <option value="org.xmind.ui.org-chart.down">组织图</option>
      <option value="org.xmind.ui.fishbone.leftHeaded">鱼骨图</option>
      <option value="org.xmind.ui.timeline.horizontal">时间线</option>
      <option value="org.xmind.ui.spreadsheet">表格</option>
      <option value="org.xmind.ui.brace.right">括号</option>
      <option value="org.xmind.ui.treetable">树表</option>
    </select>
    <select id="shape-select">
      <option value="roundedRect">圆角矩形</option>
      <option value="rect">矩形</option>
      <option value="ellipse">椭圆</option>
      <option value="diamond">菱形</option>
      <option value="hexagon">六边形</option>
      <option value="cloud">云朵</option>
      <option value="callout">标注</option>
    </select>
    <input type="file" id="file-input" accept=".xmind" style="display:none">
    <button id="btn-collab">协作</button>
  `
  document.body.insertBefore(toolbar, container)

  const collabPanel = document.createElement('div')
  collabPanel.id = 'collab-panel'
  collabPanel.className = 'collab-panel hidden'
  collabPanel.innerHTML = `
    <div class="collab-header">
      <h3>协作</h3>
      <button id="btn-collab-close">×</button>
    </div>
    <div class="collab-content">
      <div class="user-info">
        <label>用户名:</label>
        <input type="text" id="user-name" value="${currentUser.name}">
        <div class="user-color" style="background-color: ${currentUser.color}"></div>
      </div>
      <div class="room-info">
        <label>房间号:</label>
        <input type="text" id="room-id" value="default-room">
      </div>
      <div class="server-info">
        <label>服务器:</label>
        <input type="text" id="server-url" value="ws://localhost:1234">
      </div>
      <button id="btn-collab-connect">连接</button>
      <button id="btn-collab-disconnect" disabled>断开</button>
      <div class="collab-status">
        <span id="collab-status">未连接</span>
      </div>
      <div class="user-list">
        <h4>在线用户</h4>
        <div id="user-list-container"></div>
      </div>
    </div>
  `
  document.body.appendChild(collabPanel)

  const userListPanel = document.createElement('div')
  userListPanel.id = 'user-list-panel'
  userListPanel.className = 'user-list-panel hidden'
  userListPanel.innerHTML = `
    <div class="user-list-header">
      <span>在线用户</span>
      <span id="user-count">0</span>
    </div>
    <div id="user-list-items"></div>
  `
  document.body.appendChild(userListPanel)

  setupEventListeners()
  setupCollabUI()
}

function setupEventListeners() {
  document.getElementById('btn-open')?.addEventListener('click', () => {
    document.getElementById('file-input')?.click()
  })

  document.getElementById('file-input')?.addEventListener('change', async (e) => {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (file) {
      try {
        await editor.loadXMindFile(file)
        editor.fitToContent()
      } catch (err) {
        console.error('Failed to load XMind file:', err)
        alert('加载失败: ' + (err as Error).message)
      }
    }
  })

  document.getElementById('btn-new')?.addEventListener('click', () => {
    const doc = MindMapDocument.createEmpty()
    editor.loadDocument(doc)
  })

  document.getElementById('btn-add')?.addEventListener('click', () => {
    editor.executeCommand('addSubTopic')
  })

  document.getElementById('btn-delete')?.addEventListener('click', () => {
    editor.executeCommand('deleteNode')
  })

  document.getElementById('btn-undo')?.addEventListener('click', () => {
    editor.executeCommand('undo')
  })

  document.getElementById('btn-redo')?.addEventListener('click', () => {
    editor.executeCommand('redo')
  })

  document.getElementById('btn-zoom-in')?.addEventListener('click', () => {
    editor.zoomIn()
  })

  document.getElementById('btn-zoom-out')?.addEventListener('click', () => {
    editor.zoomOut()
  })

  document.getElementById('btn-fit')?.addEventListener('click', () => {
    editor.fitToContent()
  })

  document.getElementById('layout-select')?.addEventListener('change', (e) => {
    const select = e.target as HTMLSelectElement
    const selectedIds = editor.getSelection()
    if (selectedIds.length > 0) {
      editor.executeCommand('setStructureClass')
    }
  })

  document.getElementById('shape-select')?.addEventListener('change', (e) => {
    const select = e.target as HTMLSelectElement
    const selectedIds = editor.getSelection()
    if (selectedIds.length > 0) {
      editor.executeCommand('updateStyle')
    }
  })

  document.getElementById('btn-collab')?.addEventListener('click', () => {
    const panel = document.getElementById('collab-panel')
    panel?.classList.toggle('hidden')
  })
}

function setupCollabUI() {
  document.getElementById('btn-collab-close')?.addEventListener('click', () => {
    document.getElementById('collab-panel')?.classList.add('hidden')
  })

  document.getElementById('btn-collab-connect')?.addEventListener('click', () => {
    const userName = (document.getElementById('user-name') as HTMLInputElement)?.value || currentUser.name
    const roomId = (document.getElementById('room-id') as HTMLInputElement)?.value || 'default-room'
    const serverUrl = (document.getElementById('server-url') as HTMLInputElement)?.value || 'ws://localhost:1234'

    currentUser.name = userName

    ydoc = new Y.Doc()
    wsProvider = new WebsocketProvider(serverUrl, roomId, ydoc)

    wsProvider.on('status', (event: any) => {
      updateCollabStatus(event.status === 'connected' ? '已连接' : '未连接')
    })

    wsProvider.on('sync', (synced: boolean) => {
      if (synced) {
        console.log('Synced with server')
      }
    })

    console.log('Connecting to collaboration server:', { serverUrl, roomId, user: currentUser })

    document.getElementById('btn-collab-connect')?.setAttribute('disabled', 'true')
    document.getElementById('btn-collab-disconnect')?.removeAttribute('disabled')
    document.getElementById('user-list-panel')?.classList.remove('hidden')

    updateUserList([{ name: currentUser.name, color: currentUser.color, isLocal: true }])
  })

  document.getElementById('btn-collab-disconnect')?.addEventListener('click', () => {
    wsProvider?.destroy()
    ydoc?.destroy()
    wsProvider = null
    ydoc = null

    updateCollabStatus('未连接')
    document.getElementById('btn-collab-connect')?.removeAttribute('disabled')
    document.getElementById('btn-collab-disconnect')?.setAttribute('disabled', 'true')
    document.getElementById('user-list-panel')?.classList.add('hidden')
    document.getElementById('user-list-items')!.innerHTML = ''
    document.getElementById('user-count')!.textContent = '0'
  })
}

function updateCollabStatus(status: string) {
  const statusEl = document.getElementById('collab-status')
  if (statusEl) {
    statusEl.textContent = status
  }
}

function updateUserList(users: { name: string; color: string; isLocal: boolean }[]) {
  const container = document.getElementById('user-list-items')
  const countEl = document.getElementById('user-count')

  if (container) {
    container.innerHTML = users.map(user => `
      <div class="user-item ${user.isLocal ? 'local' : ''}">
        <div class="user-avatar" style="background-color: ${user.color}"></div>
        <span class="user-name">${user.name}</span>
        ${user.isLocal ? '<span class="user-badge">你</span>' : ''}
      </div>
    `).join('')
  }

  if (countEl) {
    countEl.textContent = users.length.toString()
  }
}

const style = document.createElement('style')
style.textContent = `
  .toolbar {
    display: flex;
    gap: 8px;
    padding: 12px;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
    flex-wrap: wrap;
    align-items: center;
  }

  .toolbar button, .toolbar select {
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    background: white;
    cursor: pointer;
    font-size: 14px;
  }

  .toolbar button:hover {
    background: #e9e9e9;
  }

  .collab-panel {
    position: fixed;
    top: 60px;
    right: 20px;
    width: 320px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
  }

  .collab-panel.hidden {
    display: none;
  }

  .collab-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
  }

  .collab-header h3 {
    margin: 0;
    font-size: 16px;
  }

  .collab-header button {
    background: none;
    border: none;
    font-size: 20px;
    cursor: pointer;
    color: #666;
  }

  .collab-content {
    padding: 16px;
  }

  .collab-content label {
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    color: #666;
  }

  .collab-content input {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    margin-bottom: 12px;
    box-sizing: border-box;
  }

  .collab-content button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    background: #4A90D9;
    color: white;
    cursor: pointer;
    margin-right: 8px;
    margin-bottom: 12px;
  }

  .collab-content button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }

  .collab-status {
    margin-bottom: 12px;
    font-size: 14px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .user-info input {
    flex: 1;
    margin-bottom: 0;
  }

  .user-color {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px #ddd;
  }

  .user-list h4, .conflict-list h4 {
    margin: 0 0 8px 0;
    font-size: 14px;
    color: #333;
  }

  .user-list-panel {
    position: fixed;
    top: 60px;
    left: 20px;
    width: 200px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 1000;
  }

  .user-list-panel.hidden {
    display: none;
  }

  .user-list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #eee;
    font-weight: bold;
  }

  .user-list-header #user-count {
    background: #4A90D9;
    color: white;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
  }

  #user-list-items {
    padding: 8px;
  }

  .user-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 4px;
  }

  .user-item.local {
    background: #f0f8ff;
  }

  .user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: 2px solid #fff;
    box-shadow: 0 0 0 1px #ddd;
  }

  .user-name {
    flex: 1;
    font-size: 14px;
  }

  .user-badge {
    font-size: 10px;
    background: #4A90D9;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
  }

  .conflict-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    background: #fff3cd;
    border-radius: 4px;
    margin-bottom: 8px;
    font-size: 12px;
  }

  .conflict-icon {
    font-size: 16px;
  }
`
document.head.appendChild(style)

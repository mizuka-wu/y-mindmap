import { createMindMap, RootTopic, MindMapNode, TopicType } from '@y-mindmap/vanilla'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

const container = document.getElementById('app')
if (!container) {
  throw new Error('Container not found')
}

const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
const userColor = colors[Math.floor(Math.random() * colors.length)]!
const userName = 'User ' + Math.floor(Math.random() * 1000)

const userInput = document.getElementById('user-name') as HTMLInputElement
userInput.value = userName

let ydoc: Y.Doc | null = null
let wsProvider: WebsocketProvider | null = null

const editor = createMindMap(container, {
  showToolbar: true,
  showPropertyPanel: true,
  showStatusBar: true,
})

setupDemo()
setupCollabUI()

function setupDemo() {
  const doc = createDemoDocument()
  editor.loadDocument(doc)
  editor.fitToContent()
}

function createDemoDocument(): RootTopic {
  const root = new MindMapNode({
    id: 'root',
    title: '协作编辑演示',
    type: TopicType.ROOT,
    children: {
      attached: [
        {
          id: 'node-1',
          title: '节点 1',
          type: TopicType.ATTACHED,
        },
        {
          id: 'node-2',
          title: '节点 2',
          type: TopicType.ATTACHED,
        },
        {
          id: 'node-3',
          title: '节点 3',
          type: TopicType.ATTACHED,
        },
      ],
    },
  })

  return new RootTopic(root)
}

function setupCollabUI() {
  const connectBtn = document.getElementById('btn-connect')!
  const disconnectBtn = document.getElementById('btn-disconnect')!
  const statusEl = document.getElementById('status')!
  const userListEl = document.getElementById('user-list')!

  connectBtn.addEventListener('click', () => {
    const name = userInput.value || userName
    const roomId = (document.getElementById('room-id') as HTMLInputElement).value || 'demo-room'
    const serverUrl = (document.getElementById('server-url') as HTMLInputElement).value || 'ws://localhost:1234'

    ydoc = new Y.Doc()
    wsProvider = new WebsocketProvider(serverUrl, roomId, ydoc)

    wsProvider.on('status', (event: any) => {
      statusEl.textContent = event.status === 'connected' ? '已连接' : '未连接'
    })

    connectBtn.setAttribute('disabled', 'true')
    disconnectBtn.removeAttribute('disabled')

    updateUserList([{ name, color: userColor, isLocal: true }])
  })

  disconnectBtn.addEventListener('click', () => {
    wsProvider?.destroy()
    ydoc?.destroy()
    wsProvider = null
    ydoc = null

    statusEl.textContent = '未连接'
    connectBtn.removeAttribute('disabled')
    disconnectBtn.setAttribute('disabled', 'true')
    userListEl.innerHTML = ''
  })
}

function updateUserList(users: { name: string; color: string; isLocal: boolean }[]) {
  const userListEl = document.getElementById('user-list')!
  userListEl.innerHTML = users.map(user => `
    <div class="user-item">
      <div class="user-avatar" style="background-color: ${user.color}"></div>
      <span>${user.name}</span>
      ${user.isLocal ? '<span>(你)</span>' : ''}
    </div>
  `).join('')
}

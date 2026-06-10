import { createExtension } from '@y-mindmap/extension'
import type { Transaction } from '@y-mindmap/state'

export interface DebugOptions {
  /** 显示 debug 面板 */
  showPanel?: boolean
  /** 日志级别 */
  logLevel?: 'debug' | 'info' | 'warn' | 'error'
  /** 最大日志条数 */
  maxEntries?: number
  /** 是否在 console 输出 */
  consoleOutput?: boolean
  /** 是否捕获全局错误 */
  catchErrors?: boolean
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  time: number
  level: LogLevel
  category: string
  message: string
  data?: unknown
}

const LEVEL_ORDER: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

export const Debug = createExtension<DebugOptions>({
  name: 'extension-debug',
  type: 'behavior',

  defaultOptions: {
    showPanel: true,
    logLevel: 'debug',
    maxEntries: 500,
    consoleOutput: true,
    catchErrors: true,
    enabled: true,
  },

  setup(ctx, options) {
    const entries: LogEntry[] = []
    let panelEl: HTMLDivElement | null = null
    let listEl: HTMLDivElement | null = null
    let filterLevel: LogLevel = options.logLevel ?? 'debug'
    let collapsed = false
    const startTime = Date.now()

    // ── Logger ──

    function log(level: LogLevel, category: string, message: string, data?: unknown) {
      if (LEVEL_ORDER[level] < LEVEL_ORDER[filterLevel]) return

      const entry: LogEntry = { time: Date.now() - startTime, level, category, message, data }
      entries.push(entry)
      if (entries.length > (options.maxEntries ?? 500)) entries.shift()

      if (options.consoleOutput !== false) {
        const prefix = `[Y-MindMap][${category}]`
        const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log
        data !== undefined ? fn(prefix, message, data) : fn(prefix, message)
      }

      if (panelEl) renderEntry(entry)
    }

    // ── Transaction Logging ──

    ctx.on('transaction', (tr: Transaction) => {
      for (const step of tr.steps) {
        switch (step.type) {
          case 'addNode':
            log('info', 'transaction', `addNode: ${step.node?.title ?? step.node?.id}`, { parentId: step.parentId, type: step.nodeType })
            break
          case 'removeNode':
            log('info', 'transaction', `removeNode: ${step.id}`)
            break
          case 'updateNode':
            log('debug', 'transaction', `updateNode: ${step.id}`)
            break
          case 'moveNode':
            log('info', 'transaction', `moveNode: ${step.nodeId}`, { newParent: step.newParentId })
            break
          case 'setSelection':
            log('debug', 'transaction', `selection: ${step.selectedIds?.length ?? 0} nodes`)
            break
          default:
            log('debug', 'transaction', `step: ${(step as any).type}`)
        }
      }
    })

    // ── Command Logging ──

    const originalExecute = ctx.executeCommand
    ctx.executeCommand = (name: string, args?: any) => {
      const t0 = performance.now()
      const result = originalExecute(name, args)
      const dt = (performance.now() - t0).toFixed(1)
      log(result ? 'debug' : 'warn', 'command', `${name} (${dt}ms)${result ? '' : ' → FAILED'}`, args)
      return result
    }

    // ── Error Catching ──

    let errorHandler: ((e: ErrorEvent) => void) | null = null
    let rejectionHandler: ((e: PromiseRejectionEvent) => void) | null = null

    if (options.catchErrors !== false) {
      errorHandler = (e: ErrorEvent) => {
        log('error', 'error', `${e.message}`, { file: e.filename, line: e.lineno, col: e.colno, stack: e.error?.stack })
      }
      rejectionHandler = (e: PromiseRejectionEvent) => {
        const reason = e.reason instanceof Error ? e.reason.message : String(e.reason)
        log('error', 'promise', reason, { stack: e.reason?.stack })
      }
      window.addEventListener('error', errorHandler)
      window.addEventListener('unhandledrejection', rejectionHandler)
    }

    // ── Extension Lifecycle ──

    ctx.on('extension:setup', (name: string) => log('info', 'lifecycle', `extension setup: ${name}`))
    ctx.on('extension:destroy', (name: string) => log('info', 'lifecycle', `extension destroy: ${name}`))

    // ── Document Events ──

    ctx.on('document:load', () => log('info', 'document', 'document loaded'))
    ctx.on('document:change', () => log('debug', 'document', 'document changed'))

    // ── Debug Panel UI ──

    function createPanel(): HTMLDivElement {
      const panel = document.createElement('div')
      panel.id = 'y-mindmap-debug-panel'
      panel.innerHTML = `
        <style>
          #y-mindmap-debug-panel {
            position: fixed; bottom: 8px; left: 8px; width: 420px; max-height: 360px;
            background: #1e1e1e; color: #d4d4d4; border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4); z-index: 99999;
            font-family: 'SF Mono', 'Fira Code', 'Cascadia Code', monospace;
            font-size: 11px; display: flex; flex-direction: column; overflow: hidden;
            resize: both; min-width: 280px; min-height: 120px;
          }
          #y-mindmap-debug-panel .debug-header {
            display: flex; align-items: center; gap: 6px;
            padding: 6px 10px; background: #252526; cursor: move;
            border-bottom: 1px solid #333; user-select: none; flex-shrink: 0;
          }
          #y-mindmap-debug-panel .debug-header span { font-weight: 600; color: #569cd6; }
          #y-mindmap-debug-panel .debug-header .debug-btn {
            background: none; border: none; color: #888; cursor: pointer;
            font-size: 12px; padding: 2px 4px; line-height: 1;
          }
          #y-mindmap-debug-panel .debug-header .debug-btn:hover { color: #fff; }
          #y-mindmap-debug-panel .debug-header .spacer { flex: 1; }
          #y-mindmap-debug-panel .debug-filter {
            display: flex; gap: 4px; padding: 4px 10px; background: #252526;
            border-bottom: 1px solid #333; flex-shrink: 0;
          }
          #y-mindmap-debug-panel .debug-filter button {
            padding: 2px 8px; border: 1px solid #555; border-radius: 3px;
            background: #333; color: #aaa; cursor: pointer; font-size: 10px;
          }
          #y-mindmap-debug-panel .debug-filter button.active { background: #0e639c; color: #fff; border-color: #0e639c; }
          #y-mindmap-debug-panel .debug-list {
            flex: 1; overflow-y: auto; padding: 4px 0; min-height: 0;
          }
          #y-mindmap-debug-panel .debug-entry {
            padding: 2px 10px; display: flex; gap: 8px; line-height: 1.5;
            border-bottom: 1px solid #1a1a1a;
          }
          #y-mindmap-debug-panel .debug-entry:hover { background: #2a2a2a; }
          #y-mindmap-debug-panel .debug-time { color: #666; min-width: 50px; text-align: right; }
          #y-mindmap-debug-panel .debug-level { min-width: 36px; font-weight: 600; }
          #y-mindmap-debug-panel .debug-level.debug { color: #6a9955; }
          #y-mindmap-debug-panel .debug-level.info { color: #569cd6; }
          #y-mindmap-debug-panel .debug-level.warn { color: #dcdcaa; }
          #y-mindmap-debug-panel .debug-level.error { color: #f44747; }
          #y-mindmap-debug-panel .debug-cat { color: #c586c0; min-width: 70px; }
          #y-mindmap-debug-panel .debug-msg { flex: 1; word-break: break-all; }
          #y-mindmap-debug-panel.collapsed .debug-filter,
          #y-mindmap-debug-panel.collapsed .debug-list { display: none; }
          #y-mindmap-debug-panel.collapsed { max-height: none; resize: none; }
        </style>
        <div class="debug-header">
          <span>🐛 Debug</span>
          <span class="debug-count" style="color:#888;font-weight:400;font-size:10px;"></span>
          <span class="spacer"></span>
          <button class="debug-btn" data-action="filter" title="筛选">⚙</button>
          <button class="debug-btn" data-action="clear" title="清空">🗑</button>
          <button class="debug-btn" data-action="collapse" title="折叠">−</button>
        </div>
        <div class="debug-filter">
          <button data-level="debug" class="active">DBG</button>
          <button data-level="info" class="active">INF</button>
          <button data-level="warn" class="active">WRN</button>
          <button data-level="error" class="active">ERR</button>
        </div>
        <div class="debug-list"></div>
      `

      // Drag
      const header = panel.querySelector('.debug-header') as HTMLDivElement
      let dragX = 0, dragY = 0, dragging = false
      header.addEventListener('mousedown', (e) => {
        if ((e.target as HTMLElement).tagName === 'BUTTON') return
        dragging = true
        dragX = e.clientX - panel.offsetLeft
        dragY = e.clientY - panel.offsetTop
      })
      document.addEventListener('mousemove', (e) => {
        if (!dragging) return
        panel.style.left = (e.clientX - dragX) + 'px'
        panel.style.top = (e.clientY - dragY) + 'px'
        panel.style.bottom = 'auto'
        panel.style.right = 'auto'
      })
      document.addEventListener('mouseup', () => { dragging = false })

      // Buttons
      panel.addEventListener('click', (e) => {
        const btn = (e.target as HTMLElement).closest('button') as HTMLButtonElement | null
        if (!btn) return
        const action = btn.dataset.action

        if (action === 'clear') {
          entries.length = 0
          if (listEl) listEl.innerHTML = ''
          updateCount()
        } else if (action === 'collapse') {
          collapsed = !collapsed
          panel.classList.toggle('collapsed', collapsed)
          btn.textContent = collapsed ? '+' : '−'
        }

        // Level filter buttons
        const level = btn.dataset.level as LogLevel | undefined
        if (level) {
          btn.classList.toggle('active')
          const activeLevels = new Set<LogLevel>()
          panel.querySelectorAll('.debug-filter button.active').forEach(b => {
            activeLevels.add((b as HTMLButtonElement).dataset.level as LogLevel)
          })
          // Rebuild filter: show entries at the lowest active level
          const minLevel = (['debug', 'info', 'warn', 'error'] as LogLevel[])
            .find(l => activeLevels.has(l)) ?? 'error'
          filterLevel = minLevel
          rerenderAll()
        }
      })

      return panel
    }

    function formatTime(ms: number): string {
      const s = ms / 1000
      return s < 60 ? `${s.toFixed(1)}s` : `${Math.floor(s / 60)}m${(s % 60).toFixed(0)}s`
    }

    function renderEntry(entry: LogEntry) {
      if (!listEl) return
      if (LEVEL_ORDER[entry.level] < LEVEL_ORDER[filterLevel]) return

      const row = document.createElement('div')
      row.className = 'debug-entry'
      row.innerHTML = `
        <span class="debug-time">${formatTime(entry.time)}</span>
        <span class="debug-level ${entry.level}">${entry.level.toUpperCase().slice(0, 3)}</span>
        <span class="debug-cat">${entry.category}</span>
        <span class="debug-msg">${escapeHtml(entry.message)}</span>
      `
      listEl.appendChild(row)

      // Auto scroll
      if (listEl.scrollHeight - listEl.scrollTop - listEl.clientHeight < 40) {
        listEl.scrollTop = listEl.scrollHeight
      }
      updateCount()
    }

    function rerenderAll() {
      if (!listEl) return
      listEl.innerHTML = ''
      for (const entry of entries) renderEntry(entry)
    }

    function updateCount() {
      const countEl = panelEl?.querySelector('.debug-count')
      if (countEl) countEl.textContent = `(${entries.length})`
    }

    function escapeHtml(s: string): string {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    }

    // ── Mount ──

    if (options.showPanel !== false && typeof document !== 'undefined') {
      panelEl = createPanel()
      document.body.appendChild(panelEl)
      listEl = panelEl.querySelector('.debug-list') as HTMLDivElement

      // Render existing entries
      for (const entry of entries) renderEntry(entry)
    }

    log('info', 'debug', 'Debug extension initialized')

    // ── Public API on window ──

    const api = {
      log: (level: LogLevel, cat: string, msg: string, data?: unknown) => log(level, cat, msg, data),
      getEntries: () => [...entries],
      clear: () => { entries.length = 0; if (listEl) listEl.innerHTML = ''; updateCount() },
      setLevel: (l: LogLevel) => { filterLevel = l; rerenderAll() },
      togglePanel: () => { if (panelEl) panelEl.style.display = panelEl.style.display === 'none' ? '' : 'none' },
    }
    ;(window as any).__y_mindmap_debug = api

    // ── Cleanup ──

    return () => {
      if (errorHandler) window.removeEventListener('error', errorHandler)
      if (rejectionHandler) window.removeEventListener('unhandledrejection', rejectionHandler)
      panelEl?.remove()
      delete (window as any).__y_mindmap_debug
    }
  },
})

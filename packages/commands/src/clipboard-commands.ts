import { EditorState, Transaction, Selection, MindMapNode } from '@y-mindmap/state'

export type Command = (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean

interface ClipboardData {
  nodes: any[]
  format: 'y-mindmap'
}

let clipboardData: ClipboardData | null = null

export function copy(): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const selectedIds = state.selection.all
    if (selectedIds.length === 0) return false

    const nodes: any[] = []
    for (const id of selectedIds) {
      const node = state.doc.getNodeById(id)
      if (node) {
        nodes.push(node.toJSON())
      }
    }

    clipboardData = {
      nodes,
      format: 'y-mindmap',
    }

    try {
      const text = JSON.stringify(clipboardData)
      navigator.clipboard.writeText(text)
    } catch (e) {
      // Clipboard API not available
    }

    return true
  }
}

export function cut(): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const selectedIds = state.selection.all
    if (selectedIds.length === 0) return false

    // First copy
    const nodes: any[] = []
    for (const id of selectedIds) {
      const node = state.doc.getNodeById(id)
      if (node) {
        nodes.push(node.toJSON())
      }
    }

    clipboardData = {
      nodes,
      format: 'y-mindmap',
    }

    try {
      const text = JSON.stringify(clipboardData)
      navigator.clipboard.writeText(text)
    } catch (e) {
      // Clipboard API not available
    }

    // Then delete
    const tr = state.tr
    for (const id of selectedIds) {
      const node = state.doc.getNodeById(id)
      if (node && !node.isRoot) {
        tr.removeNode(id)
      }
    }
    tr.setSelection(Selection.empty())

    if (dispatch) dispatch(tr)
    return true
  }
}

export function paste(): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const targetId = state.selection.first
    if (!targetId) return false

    const targetNode = state.doc.getNodeById(targetId)
    if (!targetNode) return false

    // Try to get from internal clipboard
    if (clipboardData && clipboardData.format === 'y-mindmap') {
      const tr = state.tr

      for (const nodeData of clipboardData.nodes) {
        const newNode = MindMapNode.fromJSON(nodeData)
        tr.addNode(targetId, newNode)
      }

      if (dispatch) dispatch(tr)
      return true
    }

    // Try to get from system clipboard
    try {
      navigator.clipboard.readText().then(text => {
        try {
          const data = JSON.parse(text)
          if (data.format === 'y-mindmap') {
            const tr = state.tr

            for (const nodeData of data.nodes) {
              const newNode = MindMapNode.fromJSON(nodeData)
              tr.addNode(targetId, newNode)
            }

            if (dispatch) dispatch(tr)
          }
        } catch (e) {
          // Not valid JSON, try to create a node with the text
          const tr = state.tr
          const newNode = MindMapNode.createEmpty().withTitle(text)
          tr.addNode(targetId, newNode)
          if (dispatch) dispatch(tr)
        }
      })
    } catch (e) {
      // Clipboard API not available
    }

    return true
  }
}

export function duplicate(): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const selectedIds = state.selection.all
    if (selectedIds.length === 0) return false

    const tr = state.tr

    for (const id of selectedIds) {
      const node = state.doc.getNodeById(id)
      if (!node) continue

      const parent = findParent(state.doc.root, id)
      if (!parent) continue

      const newNode = MindMapNode.fromJSON({
        ...node.toJSON(),
        id: crypto.randomUUID(),
      })

      tr.addNode(parent.id, newNode)
    }

    if (dispatch) dispatch(tr)
    return true
  }
}

function findParent(root: MindMapNode, childId: string): MindMapNode | null {
  for (const children of Object.values(root.children)) {
    for (const child of children) {
      if (child.id === childId) return root
      const found = findParent(child, childId)
      if (found) return found
    }
  }
  return null
}

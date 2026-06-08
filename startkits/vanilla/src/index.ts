import { MindMapDocument } from '@y-mindmap/state'
import { MindMapEditor, MindMapEditorOptions } from '@y-mindmap/editor'

export function createMindMap(container: HTMLElement, options?: Partial<MindMapEditorOptions>): MindMapEditor {
  return new MindMapEditor({
    container,
    ...options,
  })
}

export { MindMapEditor } from '@y-mindmap/editor'
export type { MindMapEditorOptions } from '@y-mindmap/editor'
export { MindMapDocument, MindMapNode, EditorState, Selection } from '@y-mindmap/state'
export * from '@y-mindmap/core'

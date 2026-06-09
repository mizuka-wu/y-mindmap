import { RootTopic } from '@y-mindmap/state'
import { MindMapEditor, MindMapEditorOptions } from '@y-mindmap/editor'
import { StarterKit } from './starter-kit'

export function createMindMap(container: HTMLElement, options?: Partial<MindMapEditorOptions>): MindMapEditor {
  return new MindMapEditor({
    container,
    extensions: StarterKit(),
    ...options,
  })
}

export { StarterKit } from './starter-kit'
export type { StarterKitOptions } from './starter-kit'
export { MindMapEditor } from '@y-mindmap/editor'
export type { MindMapEditorOptions } from '@y-mindmap/editor'
export { RootTopic, MindMapNode, EditorState, Selection } from '@y-mindmap/state'
export * from '@y-mindmap/core'

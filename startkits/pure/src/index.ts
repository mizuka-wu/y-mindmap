import { RootTopic } from '@y-mindmap/state'
import { MindMapEditor, MindMapEditorOptions } from '@y-mindmap/editor'
import { ExtensionDefinition } from '@y-mindmap/extension'

export function PureStarterKit(): ExtensionDefinition[] {
  return []
}

export function createMindMap(container: HTMLElement, options?: Partial<MindMapEditorOptions>): MindMapEditor {
  return new MindMapEditor({
    container,
    extensions: PureStarterKit(),
    ...options,
  })
}

export { MindMapEditor } from '@y-mindmap/editor'
export type { MindMapEditorOptions } from '@y-mindmap/editor'
export { RootTopic, MindMapNode, EditorState, Selection } from '@y-mindmap/state'
export * from '@y-mindmap/core'

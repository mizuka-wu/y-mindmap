import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'

export interface UserState {
  user: {
    name: string
    color: string
    clientId: number
  }
  cursor: CursorState | null
  selection: string[]
  timestamp: number
}

export interface CursorState {
  nodeId: string
  offset: number
  position: { x: number; y: number }
}

export class CollabAwareness {
  readonly awareness: Awareness
  private localUser: UserState['user']

  constructor(doc: Y.Doc, user: { name: string; color: string }) {
    this.awareness = new Awareness(doc)
    this.localUser = {
      name: user.name,
      color: user.color,
      clientId: doc.clientID,
    }

    this.awareness.setLocalStateField('user', this.localUser)
    this.awareness.setLocalStateField('cursor', null)
    this.awareness.setLocalStateField('selection', [])
    this.awareness.setLocalStateField('timestamp', Date.now())
  }

  updateCursor(cursor: CursorState | null): void {
    this.awareness.setLocalStateField('cursor', cursor)
    this.awareness.setLocalStateField('timestamp', Date.now())
  }

  updateSelection(nodeIds: string[]): void {
    this.awareness.setLocalStateField('selection', nodeIds)
    this.awareness.setLocalStateField('timestamp', Date.now())
  }

  getLocalState(): UserState | null {
    return this.awareness.getLocalState() as UserState | null
  }

  getStates(): Map<number, UserState> {
    return this.awareness.getStates() as Map<number, UserState>
  }

  getRemoteStates(): Map<number, UserState> {
    const states = new Map<number, UserState>()
    this.awareness.getStates().forEach((state, clientId) => {
      if (clientId !== this.localUser.clientId) {
        states.set(clientId, state as UserState)
      }
    })
    return states
  }

  getUser(clientId: number): UserState | null {
    return (this.awareness.getStates().get(clientId) as UserState) || null
  }

  getRemoteCursors(): Map<number, CursorState> {
    const cursors = new Map<number, CursorState>()
    this.getRemoteStates().forEach((state, clientId) => {
      if (state.cursor) {
        cursors.set(clientId, state.cursor)
      }
    })
    return cursors
  }

  getRemoteSelections(): Map<number, string[]> {
    const selections = new Map<number, string[]>()
    this.getRemoteStates().forEach((state, clientId) => {
      if (state.selection && state.selection.length > 0) {
        selections.set(clientId, state.selection)
      }
    })
    return selections
  }

  onStateChange(callback: (changes: { added: number[]; updated: number[]; removed: number[] }) => void): void {
    this.awareness.on('change', (changes: any) => {
      callback({
        added: changes.added || [],
        updated: changes.updated || [],
        removed: changes.removed || [],
      })
    })
  }

  destroy(): void {
    this.awareness.destroy()
  }
}

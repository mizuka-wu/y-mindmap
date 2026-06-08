import { CollabAwareness, UserState, CursorState } from './awareness'

export interface ConflictInfo {
  nodeId: string
  users: { clientId: number; user: UserState['user'] }[]
  type: 'editing' | 'selecting'
}

export interface ConflictEvent {
  type: 'conflict-start' | 'conflict-end'
  conflict: ConflictInfo
}

export class ConflictDetector {
  private awareness: CollabAwareness
  private localClientId: number
  private activeConflicts: Map<string, ConflictInfo> = new Map()
  private onConflictCallback: ((event: ConflictEvent) => void) | null = null

  constructor(awareness: CollabAwareness, localClientId: number) {
    this.awareness = awareness
    this.localClientId = localClientId

    this.awareness.onStateChange(() => {
      this.detectConflicts()
    })
  }

  private detectConflicts(): void {
    const remoteStates = this.awareness.getRemoteStates()
    const localState = this.awareness.getLocalState()

    const editingNodes = new Map<string, { clientId: number; user: UserState['user'] }[]>()
    const selectingNodes = new Map<string, { clientId: number; user: UserState['user'] }[]>()

    if (localState?.cursor?.nodeId) {
      const nodeId = localState.cursor.nodeId
      if (!editingNodes.has(nodeId)) {
        editingNodes.set(nodeId, [])
      }
      editingNodes.get(nodeId)!.push({
        clientId: this.localClientId,
        user: localState.user,
      })
    }

    if (localState?.selection) {
      for (const nodeId of localState.selection) {
        if (!selectingNodes.has(nodeId)) {
          selectingNodes.set(nodeId, [])
        }
        selectingNodes.get(nodeId)!.push({
          clientId: this.localClientId,
          user: localState.user,
        })
      }
    }

    remoteStates.forEach((state, clientId) => {
      if (state.cursor?.nodeId) {
        const nodeId = state.cursor.nodeId
        if (!editingNodes.has(nodeId)) {
          editingNodes.set(nodeId, [])
        }
        editingNodes.get(nodeId)!.push({
          clientId,
          user: state.user,
        })
      }

      if (state.selection) {
        for (const nodeId of state.selection) {
          if (!selectingNodes.has(nodeId)) {
            selectingNodes.set(nodeId, [])
          }
          selectingNodes.get(nodeId)!.push({
            clientId,
            user: state.user,
          })
        }
      }
    })

    const newConflicts = new Map<string, ConflictInfo>()

    for (const [nodeId, users] of editingNodes) {
      if (users.length > 1) {
        newConflicts.set(`editing-${nodeId}`, {
          nodeId,
          users,
          type: 'editing',
        })
      }
    }

    for (const [nodeId, users] of selectingNodes) {
      if (users.length > 1) {
        newConflicts.set(`selecting-${nodeId}`, {
          nodeId,
          users,
          type: 'selecting',
        })
      }
    }

    for (const [key, conflict] of this.activeConflicts) {
      if (!newConflicts.has(key)) {
        this.onConflictCallback?.({
          type: 'conflict-end',
          conflict,
        })
      }
    }

    for (const [key, conflict] of newConflicts) {
      if (!this.activeConflicts.has(key)) {
        this.onConflictCallback?.({
          type: 'conflict-start',
          conflict,
        })
      }
    }

    this.activeConflicts = newConflicts
  }

  getActiveConflicts(): ConflictInfo[] {
    return Array.from(this.activeConflicts.values())
  }

  getConflictsForNode(nodeId: string): ConflictInfo[] {
    return Array.from(this.activeConflicts.values()).filter(
      (c) => c.nodeId === nodeId
    )
  }

  hasConflict(nodeId: string): boolean {
    return this.getConflictsForNode(nodeId).length > 0
  }

  onConflict(callback: (event: ConflictEvent) => void): void {
    this.onConflictCallback = callback
  }

  destroy(): void {
    this.activeConflicts.clear()
    this.onConflictCallback = null
  }
}

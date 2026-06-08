import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'

export type ActivityType = 
  | 'idle'
  | 'viewing'
  | 'selecting'
  | 'editing-title'
  | 'dragging'
  | 'resizing'
  | 'adding-node'
  | 'deleting-node'

export interface CollaboratorLock {
  nodeId: string
  field?: string
  acquiredAt: number
  expiresAt?: number
}

export interface CollaboratorUser {
  id: string
  name: string
  account: string
  color: string
}

export interface CollaboratorState {
  user: CollaboratorUser
  activity: ActivityType
  targetNodeId: string | null
  lock: CollaboratorLock | null
  cursor: { x: number; y: number } | null
  selection: string[]
  timestamp: number
}

export interface LockConflict {
  nodeId: string
  field?: string
  holder: CollaboratorUser
  requestedBy: CollaboratorUser
}

export class CollaboratorManager {
  private awareness: Awareness
  private localUserId: string
  private collaborators: Map<number, CollaboratorState> = new Map()
  private onConflictCallback: ((conflict: LockConflict) => void) | null = null
  private onStateChangeCallback: (() => void) | null = null

  constructor(awareness: Awareness, localUserId: string) {
    this.awareness = awareness
    this.localUserId = localUserId

    this.awareness.on('change', () => {
      this.syncCollaborators()
      this.onStateChangeCallback?.()
    })

    this.syncCollaborators()
  }

  private syncCollaborators(): void {
    this.collaborators.clear()
    this.awareness.getStates().forEach((state: any, clientId: number) => {
      if (state.user && state.user.id !== this.localUserId) {
        this.collaborators.set(clientId, state as CollaboratorState)
      }
    })
  }

  getLocalState(): CollaboratorState | null {
    return this.awareness.getLocalState() as CollaboratorState | null
  }

  getCollaborators(): Map<number, CollaboratorState> {
    return this.collaborators
  }

  getCollaborator(clientId: number): CollaboratorState | null {
    return this.collaborators.get(clientId) || null
  }

  getActivity(nodeId: string): { clientId: number; state: CollaboratorState }[] {
    const activities: { clientId: number; state: CollaboratorState }[] = []
    this.collaborators.forEach((state, clientId) => {
      if (state.targetNodeId === nodeId) {
        activities.push({ clientId, state })
      }
    })
    return activities
  }

  getLockHolders(nodeId: string): { clientId: number; state: CollaboratorState }[] {
    const holders: { clientId: number; state: CollaboratorState }[] = []
    this.collaborators.forEach((state, clientId) => {
      if (state.lock?.nodeId === nodeId) {
        holders.push({ clientId, state })
      }
    })
    return holders
  }

  isLocked(nodeId: string, field?: string): boolean {
    for (const state of this.collaborators.values()) {
      if (state.lock?.nodeId === nodeId) {
        if (!field || !state.lock.field || state.lock.field === field) {
          return true
        }
      }
    }
    return false
  }

  getLockHolder(nodeId: string, field?: string): CollaboratorState | null {
    for (const state of this.collaborators.values()) {
      if (state.lock?.nodeId === nodeId) {
        if (!field || !state.lock.field || state.lock.field === field) {
          return state
        }
      }
    }
    return null
  }

  acquireLock(nodeId: string, field?: string): boolean {
    if (this.isLocked(nodeId, field)) {
      const holder = this.getLockHolder(nodeId, field)
      if (holder) {
        this.onConflictCallback?.({
          nodeId,
          field,
          holder: holder.user,
          requestedBy: this.getLocalState()?.user || { id: '', name: '', account: '', color: '' },
        })
      }
      return false
    }

    const currentState = this.getLocalState()
    if (currentState) {
      this.awareness.setLocalStateField('lock', {
        nodeId,
        field,
        acquiredAt: Date.now(),
      })
    }
    return true
  }

  releaseLock(): void {
    this.awareness.setLocalStateField('lock', null)
  }

  setActivity(activity: ActivityType, targetNodeId?: string): void {
    this.awareness.setLocalStateField('activity', activity)
    this.awareness.setLocalStateField('targetNodeId', targetNodeId || null)
    this.awareness.setLocalStateField('timestamp', Date.now())
  }

  setCursor(position: { x: number; y: number } | null): void {
    this.awareness.setLocalStateField('cursor', position)
    this.awareness.setLocalStateField('timestamp', Date.now())
  }

  setSelection(nodeIds: string[]): void {
    this.awareness.setLocalStateField('selection', nodeIds)
    this.awareness.setLocalStateField('timestamp', Date.now())
  }

  startEditingTitle(nodeId: string): boolean {
    if (!this.acquireLock(nodeId, 'title')) {
      return false
    }
    this.setActivity('editing-title', nodeId)
    return true
  }

  stopEditingTitle(): void {
    this.releaseLock()
    this.setActivity('idle')
  }

  startDragging(nodeId: string): boolean {
    if (!this.acquireLock(nodeId, 'drag')) {
      return false
    }
    this.setActivity('dragging', nodeId)
    return true
  }

  stopDragging(): void {
    this.releaseLock()
    this.setActivity('idle')
  }

  startAddingNode(parentId: string): boolean {
    if (!this.acquireLock(parentId, 'structure')) {
      return false
    }
    this.setActivity('adding-node', parentId)
    return true
  }

  stopAddingNode(): void {
    this.releaseLock()
    this.setActivity('idle')
  }

  startDeletingNode(nodeId: string): boolean {
    if (!this.acquireLock(nodeId, 'structure')) {
      return false
    }
    this.setActivity('deleting-node', nodeId)
    return true
  }

  stopDeletingNode(): void {
    this.releaseLock()
    this.setActivity('idle')
  }

  canEditTitle(nodeId: string): boolean {
    return !this.isLocked(nodeId, 'title')
  }

  canDrag(nodeId: string): boolean {
    return !this.isLocked(nodeId, 'drag')
  }

  canModifyStructure(nodeId: string): boolean {
    return !this.isLocked(nodeId, 'structure')
  }

  getEditingUsers(nodeId: string): CollaboratorUser[] {
    const users: CollaboratorUser[] = []
    this.collaborators.forEach((state) => {
      if (state.lock?.nodeId === nodeId && state.lock.field === 'title') {
        users.push(state.user)
      }
    })
    return users
  }

  getDraggingUsers(nodeId: string): CollaboratorUser[] {
    const users: CollaboratorUser[] = []
    this.collaborators.forEach((state) => {
      if (state.lock?.nodeId === nodeId && state.lock.field === 'drag') {
        users.push(state.user)
      }
    })
    return users
  }

  onConflict(callback: (conflict: LockConflict) => void): void {
    this.onConflictCallback = callback
  }

  onStateChange(callback: () => void): void {
    this.onStateChangeCallback = callback
  }

  destroy(): void {
    this.collaborators.clear()
    this.onConflictCallback = null
    this.onStateChangeCallback = null
  }
}

export function createCollaboratorState(
  user: CollaboratorUser
): CollaboratorState {
  return {
    user,
    activity: 'idle',
    targetNodeId: null,
    lock: null,
    cursor: null,
    selection: [],
    timestamp: Date.now(),
  }
}

export function getActiveCollaborators(
  awareness: Awareness,
  localUserId: string
): Map<number, CollaboratorState> {
  const collaborators = new Map<number, CollaboratorState>()
  awareness.getStates().forEach((state: any, clientId: number) => {
    if (state.user && state.user.id !== localUserId) {
      collaborators.set(clientId, state as CollaboratorState)
    }
  })
  return collaborators
}

export function getNodeLockHolder(
  awareness: Awareness,
  nodeId: string,
  field?: string,
  excludeUserId?: string
): CollaboratorState | null {
  for (const [clientId, state] of awareness.getStates()) {
    const collabState = state as CollaboratorState
    if (collabState.user.id === excludeUserId) continue
    if (collabState.lock?.nodeId === nodeId) {
      if (!field || !collabState.lock.field || collabState.lock.field === field) {
        return collabState
      }
    }
  }
  return null
}

export function isNodeLocked(
  awareness: Awareness,
  nodeId: string,
  field?: string,
  excludeUserId?: string
): boolean {
  return getNodeLockHolder(awareness, nodeId, field, excludeUserId) !== null
}

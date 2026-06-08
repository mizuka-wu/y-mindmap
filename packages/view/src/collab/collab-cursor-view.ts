import { Group, Rect, Text, Path } from 'leafer-ui'
import { Point } from '@y-mindmap/core'

export interface RemoteCursor {
  clientId: number
  user: { name: string; color: string }
  position: Point
  nodeId: string | null
}

export interface RemoteSelection {
  clientId: number
  user: { name: string; color: string }
  nodeIds: string[]
}

export class CollabCursorView {
  private cursors: Map<number, Group> = new Map()
  private container: Group

  constructor(container: Group) {
    this.container = container
  }

  updateCursors(cursors: Map<number, RemoteCursor>): void {
    const existingIds = new Set(this.cursors.keys())
    const newIds = new Set(cursors.keys())

    for (const id of existingIds) {
      if (!newIds.has(id)) {
        this.removeCursor(id)
      }
    }

    for (const [clientId, cursor] of cursors) {
      this.updateCursor(clientId, cursor)
    }
  }

  private updateCursor(clientId: number, cursor: RemoteCursor): void {
    let cursorGroup = this.cursors.get(clientId)

    if (!cursorGroup) {
      cursorGroup = this.createCursorView(cursor.user.name, cursor.user.color)
      this.container.add(cursorGroup)
      this.cursors.set(clientId, cursorGroup)
    }

    cursorGroup.x = cursor.position.x
    cursorGroup.y = cursor.position.y
  }

  private createCursorView(name: string, color: string): Group {
    const group = new Group()

    const pointer = new Path({
      d: 'M0,0 L0,16 L4,12 L8,18 L10,17 L6,11 L12,11 Z',
      fill: color,
      stroke: '#ffffff',
      strokeWidth: 1,
    })

    const label = new Text({
      x: 12,
      y: 16,
      text: name,
      fontSize: 10,
      fill: '#ffffff',
      padding: { left: 4, right: 4, top: 2, bottom: 2 },
    })

    const labelWidth = label.width || 30
    const labelBg = new Rect({
      x: 12,
      y: 16,
      width: labelWidth + 8,
      height: 16,
      fill: color,
      cornerRadius: 3,
    })

    group.add(labelBg)
    group.add(label)
    group.add(pointer)

    return group
  }

  private removeCursor(clientId: number): void {
    const cursorGroup = this.cursors.get(clientId)
    if (cursorGroup) {
      cursorGroup.remove()
      this.cursors.delete(clientId)
    }
  }

  destroy(): void {
    for (const [clientId] of this.cursors) {
      this.removeCursor(clientId)
    }
  }
}

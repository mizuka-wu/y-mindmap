import { StyleData, Point } from '@y-mindmap/core'

export interface RelationshipData {
  id: string
  title?: string
  style?: StyleData
  end1Id: string
  end2Id: string
  controlPoints: { 1: Point; 2: Point }
  lineEndPoints?: { 1: Point; 2: Point }
  titleUnedited?: boolean
}

export class Relationship {
  readonly id: string
  readonly title: string
  readonly style: StyleData | undefined
  readonly end1Id: string
  readonly end2Id: string
  readonly controlPoints: { 1: Point; 2: Point }

  constructor(data: RelationshipData) {
    this.id = data.id
    this.title = data.title || ''
    this.style = data.style
    this.end1Id = data.end1Id
    this.end2Id = data.end2Id
    this.controlPoints = data.controlPoints
  }

  withTitle(title: string): Relationship {
    return new Relationship({
      ...this.toData(),
      title,
    })
  }

  withStyle(style: StyleData): Relationship {
    return new Relationship({
      ...this.toData(),
      style,
    })
  }

  withControlPoints(controlPoints: { 1: Point; 2: Point }): Relationship {
    return new Relationship({
      ...this.toData(),
      controlPoints,
    })
  }

  toJSON(): RelationshipData {
    return this.toData()
  }

  private toData(): RelationshipData {
    return {
      id: this.id,
      title: this.title,
      style: this.style,
      end1Id: this.end1Id,
      end2Id: this.end2Id,
      controlPoints: this.controlPoints,
    }
  }

  static fromJSON(data: RelationshipData): Relationship {
    return new Relationship(data)
  }

  static create(end1Id: string, end2Id: string): Relationship {
    return new Relationship({
      id: crypto.randomUUID(),
      end1Id,
      end2Id,
      controlPoints: {
        1: { x: 0, y: 0 },
        2: { x: 0, y: 0 },
      },
    })
  }
}

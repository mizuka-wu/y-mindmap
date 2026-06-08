import { Point } from '@y-mindmap/core'

export type ConnectionStyleType =
  | 'curve'
  | 'straight'
  | 'elbow'
  | 'roundedElbow'
  | 'taperedCurve'
  | 'taperedStraight'
  | 'taperedElbow'
  | 'taperedRoundedElbow'
  | 'bight'
  | 'fold'
  | 'fold2'
  | 'roundedFold'
  | 'horn'
  | 'sinus'
  | 'brace'
  | 'brace2'
  | 'brace3'
  | 'brace4'
  | 'brace5'
  | 'horizontal'
  | 'callout'
  | 'none'

export interface ConnectionPathGenerator {
  generatePath(start: Point, ctrl: Point, end: Point): string
}

class CurveConnection implements ConnectionPathGenerator {
  generatePath(start: Point, ctrl: Point, end: Point): string {
    const dx = end.x - ctrl.x
    const ctrlX = dx / 5 + ctrl.x
    return `M ${start.x} ${start.y} L ${ctrl.x} ${ctrl.y} Q ${ctrlX} ${end.y} ${end.x} ${end.y}`
  }
}

class StraightConnection implements ConnectionPathGenerator {
  generatePath(start: Point, _ctrl: Point, end: Point): string {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  }
}

class ElbowConnection implements ConnectionPathGenerator {
  generatePath(start: Point, ctrl: Point, end: Point): string {
    return `M ${start.x} ${start.y} L ${ctrl.x} ${ctrl.y} L ${ctrl.x} ${end.y} L ${end.x} ${end.y}`
  }
}

class RoundedElbowConnection implements ConnectionPathGenerator {
  private corner: number = 10

  generatePath(start: Point, ctrl: Point, end: Point): string {
    const flexPt = { x: ctrl.x, y: end.y }
    const ver = end.y > ctrl.y ? 1 : -1
    const hor = end.x > ctrl.x ? 1 : -1

    const corner = Math.min(this.corner, Math.abs(end.x - ctrl.x))
    const bflexPt = { x: flexPt.x, y: flexPt.y - ver * corner }
    const aflexPt = { x: flexPt.x + hor * corner, y: flexPt.y }

    return `M ${start.x} ${start.y} L ${ctrl.x} ${ctrl.y} L ${bflexPt.x} ${bflexPt.y} Q ${flexPt.x} ${flexPt.y} ${aflexPt.x} ${aflexPt.y} L ${end.x} ${end.y}`
  }
}

class TaperedCurveConnection implements ConnectionPathGenerator {
  generatePath(start: Point, ctrl: Point, end: Point): string {
    const dx = end.x - ctrl.x
    const ctrlX = dx / 3 + ctrl.x
    const lineWidth = 2
    const openGap = lineWidth * 3
    const closeGap = lineWidth

    const p1 = this.calcUnderline(start, ctrl, openGap / 2)
    const p2 = this.calcUnderline(ctrl, end, openGap / 2)
    const p4 = this.calcUnderline(end, ctrl, closeGap / 2)
    const p3 = this.pivot(end, p4)
    const p5 = this.pivot(ctrl, p2)
    const p6 = this.pivot(start, p1)

    const corX = (p2.x - p5.x) / 2
    const corY = (p3.y - p4.y) / 2

    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} Q ${ctrlX + corX} ${end.y + corY} ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Q ${ctrlX - corX} ${end.y - corY} ${p5.x} ${p5.y} L ${p6.x} ${p6.y} Z`
  }

  private calcUnderline(p1: Point, p2: Point, gap: number): Point {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len === 0) return { ...p1 }
    return {
      x: p1.x + (-dy / len) * gap,
      y: p1.y + (dx / len) * gap,
    }
  }

  private pivot(center: Point, point: Point): Point {
    return {
      x: 2 * center.x - point.x,
      y: 2 * center.y - point.y,
    }
  }
}

class TaperedStraightConnection implements ConnectionPathGenerator {
  generatePath(start: Point, _ctrl: Point, end: Point): string {
    const lineWidth = 2
    const openGap = lineWidth * 2
    const closeGap = lineWidth

    const p1 = this.calcUnderline(start, end, openGap / 2)
    const p2 = this.calcUnderline(end, start, closeGap / 2)
    const p3 = this.pivot(end, p2)
    const p4 = this.pivot(start, p1)

    return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} L ${p4.x} ${p4.y} Z`
  }

  private calcUnderline(p1: Point, p2: Point, gap: number): Point {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    const len = Math.sqrt(dx * dx + dy * dy)
    if (len === 0) return { ...p1 }
    return {
      x: p1.x + (-dy / len) * gap,
      y: p1.y + (dx / len) * gap,
    }
  }

  private pivot(center: Point, point: Point): Point {
    return {
      x: 2 * center.x - point.x,
      y: 2 * center.y - point.y,
    }
  }
}

class BightConnection implements ConnectionPathGenerator {
  generatePath(start: Point, ctrl: Point, end: Point): string {
    const midX = (start.x + end.x) / 2
    const midY = (start.y + end.y) / 2
    const ctrlX = midX + (ctrl.x - midX) * 0.5
    const ctrlY = midY + (ctrl.y - midY) * 0.5

    return `M ${start.x} ${start.y} Q ${ctrlX} ${ctrlY} ${end.x} ${end.y}`
  }
}

class FoldConnection implements ConnectionPathGenerator {
  generatePath(start: Point, ctrl: Point, end: Point): string {
    const midX = (start.x + end.x) / 2
    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${end.y} L ${end.x} ${end.y}`
  }
}

class RoundedFoldConnection implements ConnectionPathGenerator {
  private corner: number = 8

  generatePath(start: Point, _ctrl: Point, end: Point): string {
    const midX = (start.x + end.x) / 2
    const ver = end.y > start.y ? 1 : -1
    const corner = Math.min(this.corner, Math.abs(end.y - start.y) / 2)

    return `M ${start.x} ${start.y} L ${midX - corner} ${start.y} Q ${midX} ${start.y} ${midX} ${start.y + ver * corner} L ${midX} ${end.y - ver * corner} Q ${midX} ${end.y} ${midX + corner} ${end.y} L ${end.x} ${end.y}`
  }
}

class HornConnection implements ConnectionPathGenerator {
  generatePath(start: Point, ctrl: Point, end: Point): string {
    const midX = (start.x + end.x) / 2
    const midY = (start.y + end.y) / 2
    const hornSize = 20

    return `M ${start.x} ${start.y} Q ${ctrl.x} ${ctrl.y} ${midX} ${midY} Q ${midX + hornSize} ${midY} ${end.x} ${end.y}`
  }
}

class SinusConnection implements ConnectionPathGenerator {
  generatePath(start: Point, _ctrl: Point, end: Point): string {
    const midX = (start.x + end.x) / 2
    const amplitude = Math.abs(end.y - start.y) * 0.3

    return `M ${start.x} ${start.y} C ${start.x + amplitude} ${start.y} ${midX - amplitude} ${end.y} ${midX} ${end.y} S ${end.x - amplitude} ${end.y} ${end.x} ${end.y}`
  }
}

class BraceConnection implements ConnectionPathGenerator {
  generatePath(start: Point, _ctrl: Point, end: Point): string {
    const midY = (start.y + end.y) / 2
    const braceWidth = 20

    return `M ${start.x} ${start.y} Q ${start.x + braceWidth} ${start.y} ${start.x + braceWidth} ${midY} Q ${start.x + braceWidth} ${end.y} ${start.x} ${end.y} L ${end.x} ${end.y}`
  }
}

class TaperedElbowConnection implements ConnectionPathGenerator {
  generatePath(start: Point, ctrl: Point, end: Point): string {
    const lineWidth = 2
    const openGap = lineWidth * 2.4
    const closeGap = lineWidth
    const hop = openGap / 2
    const hcp = closeGap / 2

    const hor = end.x > ctrl.x ? 1 : -1
    const ver = end.y > ctrl.y ? 1 : -1
    const chor = ctrl.x !== start.x ? 1 : 0
    const cver = ctrl.y !== start.y ? 1 : 0

    const flexPt = { x: ctrl.x, y: end.y }

    return `M ${start.x + cver * hop} ${start.y - ver * chor * hop} L ${ctrl.x + hor * hop} ${start.y - ver * chor * hop} L ${flexPt.x + hor * hop} ${flexPt.y - ver * hcp} L ${end.x} ${end.y - ver * hcp} L ${end.x} ${end.y + ver * hcp} L ${flexPt.x - hor * hop} ${flexPt.y + ver * hcp} L ${ctrl.x - hor * hop} ${start.y + ver * chor * hop} L ${start.x - cver * hop} ${start.y + ver * chor * hop}`
  }
}

class TaperedRoundedElbowConnection implements ConnectionPathGenerator {
  generatePath(start: Point, ctrl: Point, end: Point): string {
    const lineWidth = 2
    const corner = 10
    const openGap = lineWidth * 2.5
    const closeGap = lineWidth
    const hop = openGap / 2
    const hcp = closeGap / 2

    const hor = end.x > ctrl.x ? 1 : -1
    const ver = end.y > ctrl.y ? 1 : -1
    const chor = ctrl.x !== start.x ? 1 : 0
    const cver = ctrl.y !== start.y ? 1 : 0

    const flexPt = { x: ctrl.x, y: end.y }
    const outerCorner = corner + lineWidth / 2
    const innerCorner = corner - lineWidth / 2

    return `M ${start.x + cver * hop} ${start.y - ver * chor * hop} L ${ctrl.x + hor * hop} ${start.y - ver * chor * hop} L ${flexPt.x + hor * hop} ${flexPt.y - ver * hcp - ver * innerCorner} Q ${flexPt.x + hor * hop} ${flexPt.y - ver * hcp} ${flexPt.x + hor * hop + hor * innerCorner} ${flexPt.y - ver * hcp} L ${end.x} ${end.y - ver * hcp} L ${end.x} ${end.y + ver * hcp} L ${flexPt.x - hor * hop + hor * outerCorner} ${flexPt.y + ver * hcp} Q ${flexPt.x - hor * hop} ${flexPt.y + ver * hcp} ${flexPt.x - hor * hop} ${flexPt.y + ver * hcp - ver * outerCorner} L ${ctrl.x - hor * hop} ${start.y + ver * chor * hop} L ${start.x - cver * hop} ${start.y + ver * chor * hop}`
  }
}

class Fold2Connection implements ConnectionPathGenerator {
  generatePath(start: Point, ctrl: Point, end: Point): string {
    const midX = start.x + (end.x - start.x) * 0.3
    const midY = end.y

    return `M ${start.x} ${start.y} L ${midX} ${start.y} L ${midX} ${midY} L ${end.x} ${end.y}`
  }
}

class HorizontalConnection implements ConnectionPathGenerator {
  generatePath(start: Point, _ctrl: Point, end: Point): string {
    const midY = (start.y + end.y) / 2

    return `M ${start.x} ${start.y} L ${start.x} ${midY} L ${end.x} ${midY} L ${end.x} ${end.y}`
  }
}

class Brace2Connection implements ConnectionPathGenerator {
  generatePath(start: Point, _ctrl: Point, end: Point): string {
    const midY = (start.y + end.y) / 2
    const braceWidth = 15

    return `M ${start.x} ${start.y} L ${start.x + braceWidth} ${start.y} Q ${start.x + braceWidth * 2} ${start.y} ${start.x + braceWidth * 2} ${midY} Q ${start.x + braceWidth * 2} ${end.y} ${start.x + braceWidth} ${end.y} L ${start.x} ${end.y} L ${end.x} ${end.y}`
  }
}

class Brace3Connection implements ConnectionPathGenerator {
  generatePath(start: Point, _ctrl: Point, end: Point): string {
    const midY = (start.y + end.y) / 2
    const braceWidth = 10

    return `M ${start.x} ${start.y} L ${start.x + braceWidth} ${start.y} L ${start.x + braceWidth} ${midY - braceWidth} Q ${start.x + braceWidth} ${midY} ${start.x + braceWidth * 2} ${midY} Q ${start.x + braceWidth} ${midY} ${start.x + braceWidth} ${midY + braceWidth} L ${start.x + braceWidth} ${end.y} L ${start.x} ${end.y} L ${end.x} ${end.y}`
  }
}

class Brace4Connection implements ConnectionPathGenerator {
  generatePath(start: Point, _ctrl: Point, end: Point): string {
    const midY = (start.y + end.y) / 2
    const braceWidth = 12

    return `M ${start.x} ${start.y} Q ${start.x + braceWidth} ${start.y} ${start.x + braceWidth} ${midY - braceWidth / 2} L ${start.x + braceWidth} ${midY + braceWidth / 2} Q ${start.x + braceWidth} ${end.y} ${start.x} ${end.y} L ${end.x} ${end.y}`
  }
}

class Brace5Connection implements ConnectionPathGenerator {
  generatePath(start: Point, _ctrl: Point, end: Point): string {
    const midY = (start.y + end.y) / 2
    const braceWidth = 25

    return `M ${start.x} ${start.y} Q ${start.x + braceWidth * 0.3} ${start.y} ${start.x + braceWidth * 0.3} ${midY} Q ${start.x + braceWidth * 0.3} ${end.y} ${start.x} ${end.y} L ${end.x} ${end.y}`
  }
}

class CalloutConnection implements ConnectionPathGenerator {
  generatePath(start: Point, _ctrl: Point, end: Point): string {
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
  }
}

class NoneConnection implements ConnectionPathGenerator {
  generatePath(): string {
    return ''
  }
}

export class ConnectionStyleFactory {
  private static styles: Map<string, ConnectionPathGenerator> = new Map([
    ['curve', new CurveConnection()],
    ['straight', new StraightConnection()],
    ['elbow', new ElbowConnection()],
    ['roundedElbow', new RoundedElbowConnection()],
    ['taperedCurve', new TaperedCurveConnection()],
    ['taperedStraight', new TaperedStraightConnection()],
    ['taperedElbow', new TaperedElbowConnection()],
    ['taperedRoundedElbow', new TaperedRoundedElbowConnection()],
    ['bight', new BightConnection()],
    ['fold', new FoldConnection()],
    ['fold2', new Fold2Connection()],
    ['roundedFold', new RoundedFoldConnection()],
    ['horn', new HornConnection()],
    ['sinus', new SinusConnection()],
    ['brace', new BraceConnection()],
    ['brace2', new Brace2Connection()],
    ['brace3', new Brace3Connection()],
    ['brace4', new Brace4Connection()],
    ['brace5', new Brace5Connection()],
    ['horizontal', new HorizontalConnection()],
    ['callout', new CalloutConnection()],
    ['none', new NoneConnection()],
  ])

  static generatePath(style: string, start: Point, ctrl: Point, end: Point): string {
    const generator = this.styles.get(style) || this.styles.get('curve')!
    return generator.generatePath(start, ctrl, end)
  }

  static getAvailableStyles(): string[] {
    return Array.from(this.styles.keys())
  }

  static register(name: string, generator: ConnectionPathGenerator): void {
    this.styles.set(name, generator)
  }
}

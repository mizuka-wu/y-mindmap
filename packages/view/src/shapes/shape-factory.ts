import { Rect, Ellipse, Path } from 'leafer-ui'

export interface ShapeBounds {
  x: number
  y: number
  width: number
  height: number
}

export class ShapeFactory {
  static create(shapeType: string, bounds: ShapeBounds): Rect | Ellipse | Path {
    switch (shapeType) {
      case 'roundedRect':
        return ShapeFactory.createRoundedRect(bounds)
      case 'ellipse':
        return ShapeFactory.createEllipse(bounds)
      case 'cloud':
        return ShapeFactory.createCloud(bounds)
      case 'hexagon':
        return ShapeFactory.createHexagon(bounds)
      case 'diamond':
        return ShapeFactory.createDiamond(bounds)
      case 'parallelogram':
        return ShapeFactory.createParallelogram(bounds)
      case 'rectangle':
        return ShapeFactory.createRectangle(bounds)
      case 'capsule':
        return ShapeFactory.createCapsule(bounds)
      case 'barrel':
        return ShapeFactory.createBarrel(bounds)
      case 'paranCallout':
        return ShapeFactory.createParanCallout(bounds)
      case 'triangle':
        return ShapeFactory.createTriangle(bounds)
      case 'star':
        return ShapeFactory.createStar(bounds)
      case 'circle':
        return ShapeFactory.createCircle(bounds)
      default:
        return ShapeFactory.createRoundedRect(bounds)
    }
  }
  
  private static createRoundedRect(bounds: ShapeBounds): Rect {
    return new Rect({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      cornerRadius: 8,
    })
  }
  
  private static createEllipse(bounds: ShapeBounds): Ellipse {
    return new Ellipse({
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      radiusX: bounds.width / 2,
      radiusY: bounds.height / 2,
    })
  }
  
  private static createCloud(bounds: ShapeBounds): Path {
    const w = bounds.width
    const h = bounds.height
    const path = `
      M ${w * 0.25} ${h * 0.2}
      C ${w * 0.1} ${h * 0.2} ${w * 0.1} ${h * 0.5} ${w * 0.25} ${h * 0.5}
      C ${w * 0.1} ${h * 0.5} ${w * 0.1} ${h * 0.8} ${w * 0.25} ${h * 0.8}
      C ${w * 0.25} ${h * 0.95} ${w * 0.5} ${h * 0.95} ${w * 0.5} ${h * 0.8}
      C ${w * 0.5} ${h * 0.95} ${w * 0.75} ${h * 0.95} ${w * 0.75} ${h * 0.8}
      C ${w * 0.9} ${h * 0.8} ${w * 0.9} ${h * 0.5} ${w * 0.75} ${h * 0.5}
      C ${w * 0.9} ${h * 0.5} ${w * 0.9} ${h * 0.2} ${w * 0.75} ${h * 0.2}
      C ${w * 0.75} ${h * 0.05} ${w * 0.5} ${h * 0.05} ${w * 0.5} ${h * 0.2}
      C ${w * 0.5} ${h * 0.05} ${w * 0.25} ${h * 0.05} ${w * 0.25} ${h * 0.2}
      Z
    `
    return new Path({
      x: bounds.x,
      y: bounds.y,
      path,
    })
  }
  
  private static createHexagon(bounds: ShapeBounds): Path {
    const w = bounds.width
    const h = bounds.height
    const path = `
      M ${w * 0.25} 0
      L ${w * 0.75} 0
      L ${w} ${h * 0.5}
      L ${w * 0.75} ${h}
      L ${w * 0.25} ${h}
      L 0 ${h * 0.5}
      Z
    `
    return new Path({
      x: bounds.x,
      y: bounds.y,
      path,
    })
  }
  
  private static createDiamond(bounds: ShapeBounds): Path {
    const w = bounds.width
    const h = bounds.height
    const path = `
      M ${w * 0.5} 0
      L ${w} ${h * 0.5}
      L ${w * 0.5} ${h}
      L 0 ${h * 0.5}
      Z
    `
    return new Path({
      x: bounds.x,
      y: bounds.y,
      path,
    })
  }
  
  private static createParallelogram(bounds: ShapeBounds): Path {
    const w = bounds.width
    const h = bounds.height
    const offset = w * 0.15
    const path = `
      M ${offset} 0
      L ${w} 0
      L ${w - offset} ${h}
      L 0 ${h}
      Z
    `
    return new Path({
      x: bounds.x,
      y: bounds.y,
      path,
    })
  }

  private static createRectangle(bounds: ShapeBounds): Rect {
    return new Rect({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      cornerRadius: 0,
    })
  }

  private static createCapsule(bounds: ShapeBounds): Rect {
    return new Rect({
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      cornerRadius: Math.min(bounds.width, bounds.height) / 2,
    })
  }

  private static createBarrel(bounds: ShapeBounds): Path {
    const w = bounds.width
    const h = bounds.height
    const rx = w * 0.1
    const ry = h * 0.12
    const path = `
      M ${rx} 0
      C ${w * 0.25} ${-ry}, ${w * 0.75} ${-ry}, ${w - rx} 0
      L ${w} ${ry}
      C ${w + rx * 0.25} ${h * 0.4}, ${w + rx * 0.25} ${h * 0.6}, ${w} ${h - ry}
      L ${w - rx} ${h}
      C ${w * 0.75} ${h + ry}, ${w * 0.25} ${h + ry}, ${rx} ${h}
      L 0 ${h - ry}
      C ${-rx * 0.25} ${h * 0.6}, ${-rx * 0.25} ${h * 0.4}, 0 ${ry}
      Z
    `
    return new Path({
      x: bounds.x,
      y: bounds.y,
      path,
    })
  }

  private static createParanCallout(bounds: ShapeBounds): Path {
    const w = bounds.width
    const h = bounds.height
    const r = 10
    const arrowW = Math.max(18, w * 0.14)
    const arrowH = Math.max(14, h * 0.24)
    const ax = w * 0.25
    const path = `
      M ${r} 0
      L ${w - r} 0
      Q ${w} 0 ${w} ${r}
      L ${w} ${h - r}
      Q ${w} ${h} ${w - r} ${h}
      L ${ax + arrowW} ${h}
      L ${ax} ${h + arrowH}
      L ${ax} ${h}
      L ${r} ${h}
      Q 0 ${h} 0 ${h - r}
      L 0 ${r}
      Q 0 0 ${r} 0
      Z
    `
    return new Path({
      x: bounds.x,
      y: bounds.y,
      path,
    })
  }

  private static createTriangle(bounds: ShapeBounds): Path {
    const w = bounds.width
    const h = bounds.height
    const path = `
      M ${w * 0.5} 0
      L ${w} ${h}
      L 0 ${h}
      Z
    `
    return new Path({
      x: bounds.x,
      y: bounds.y,
      path,
    })
  }

  private static createStar(bounds: ShapeBounds): Path {
    const w = bounds.width
    const h = bounds.height
    const cx = w * 0.5
    const cy = h * 0.45
    const outerRx = w * 0.48
    const outerRy = h * 0.48
    const innerRx = outerRx * 0.45
    const innerRy = outerRy * 0.45
    const points = 5
    const parts: string[] = []
    for (let i = 0; i < points; i++) {
      const outerAngle = (Math.PI * 2 * i) / points - Math.PI / 2
      const innerAngle = outerAngle + Math.PI / points
      const ox = cx + outerRx * Math.cos(outerAngle)
      const oy = cy + outerRy * Math.sin(outerAngle)
      const ix = cx + innerRx * Math.cos(innerAngle)
      const iy = cy + innerRy * Math.sin(innerAngle)
      if (i === 0) {
        parts.push(`M ${ox} ${oy}`)
      } else {
        parts.push(`L ${ox} ${oy}`)
      }
      parts.push(`L ${ix} ${iy}`)
    }
    parts.push('Z')
    return new Path({
      x: bounds.x,
      y: bounds.y,
      path: parts.join(' '),
    })
  }

  private static createCircle(bounds: ShapeBounds): Ellipse {
    const size = Math.min(bounds.width, bounds.height)
    return new Ellipse({
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      radiusX: size / 2,
      radiusY: size / 2,
    })
  }
}

export default ShapeFactory

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
}

export default ShapeFactory

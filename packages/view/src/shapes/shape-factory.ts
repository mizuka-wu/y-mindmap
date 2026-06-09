import { Rect, Ellipse, Path } from 'leafer-ui'

export interface ShapeBounds {
  x: number
  y: number
  width: number
  height: number
}

export interface ShapeDescriptor {
  name: string
  create: (bounds: ShapeBounds) => Rect | Ellipse | Path
  getPadding: () => { top: number; right: number; bottom: number; left: number }
}

export class ShapeFactory {
  private static registry = new Map<string, ShapeDescriptor>()

  static register(descriptor: ShapeDescriptor): void {
    ShapeFactory.registry.set(descriptor.name, descriptor)
  }

  static create(type: string, bounds: ShapeBounds): Rect | Ellipse | Path {
    const descriptor = ShapeFactory.registry.get(type)
    if (descriptor) {
      return descriptor.create(bounds)
    }
    return ShapeFactory.registry.get('roundedRect')!.create(bounds)
  }

  static getPadding(type: string): { top: number; right: number; bottom: number; left: number } {
    const descriptor = ShapeFactory.registry.get(type)
    if (descriptor) {
      return descriptor.getPadding()
    }
    return ShapeFactory.registry.get('roundedRect')!.getPadding()
  }

  static has(type: string): boolean {
    return ShapeFactory.registry.has(type)
  }

  static getRegisteredTypes(): string[] {
    return Array.from(ShapeFactory.registry.keys())
  }
}

ShapeFactory.register({
  name: 'roundedRect',
  create: (bounds: ShapeBounds) => new Rect({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    cornerRadius: 8,
  }),
  getPadding: () => ({ top: 12, right: 16, bottom: 12, left: 16 }),
})

ShapeFactory.register({
  name: 'rectangle',
  create: (bounds: ShapeBounds) => new Rect({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    cornerRadius: 0,
  }),
  getPadding: () => ({ top: 12, right: 16, bottom: 12, left: 16 }),
})

ShapeFactory.register({
  name: 'capsule',
  create: (bounds: ShapeBounds) => new Rect({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    cornerRadius: Math.min(bounds.width, bounds.height) / 2,
  }),
  getPadding: () => ({ top: 14, right: 18, bottom: 14, left: 18 }),
})

ShapeFactory.register({
  name: 'ellipse',
  create: (bounds: ShapeBounds) => new Ellipse({
    x: bounds.x + bounds.width / 2,
    y: bounds.y + bounds.height / 2,
    radiusX: bounds.width / 2,
    radiusY: bounds.height / 2,
  }),
  getPadding: () => ({ top: 20, right: 24, bottom: 20, left: 24 }),
})

ShapeFactory.register({
  name: 'circle',
  create: (bounds: ShapeBounds) => {
    const size = Math.min(bounds.width, bounds.height)
    return new Ellipse({
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
      radiusX: size / 2,
      radiusY: size / 2,
    })
  },
  getPadding: () => ({ top: 20, right: 24, bottom: 20, left: 24 }),
})

ShapeFactory.register({
  name: 'cloud',
  create: (bounds: ShapeBounds) => {
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
  },
  getPadding: () => ({ top: 24, right: 28, bottom: 24, left: 28 }),
})

ShapeFactory.register({
  name: 'hexagon',
  create: (bounds: ShapeBounds) => {
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
  },
  getPadding: () => ({ top: 18, right: 22, bottom: 18, left: 22 }),
})

ShapeFactory.register({
  name: 'diamond',
  create: (bounds: ShapeBounds) => {
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
  },
  getPadding: () => ({ top: 18, right: 22, bottom: 18, left: 22 }),
})

ShapeFactory.register({
  name: 'parallelogram',
  create: (bounds: ShapeBounds) => {
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
  },
  getPadding: () => ({ top: 18, right: 22, bottom: 18, left: 22 }),
})

ShapeFactory.register({
  name: 'triangle',
  create: (bounds: ShapeBounds) => {
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
  },
  getPadding: () => ({ top: 18, right: 22, bottom: 18, left: 22 }),
})

ShapeFactory.register({
  name: 'star',
  create: (bounds: ShapeBounds) => {
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
  },
  getPadding: () => ({ top: 18, right: 22, bottom: 18, left: 22 }),
})

ShapeFactory.register({
  name: 'barrel',
  create: (bounds: ShapeBounds) => {
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
  },
  getPadding: () => ({ top: 14, right: 18, bottom: 14, left: 18 }),
})

ShapeFactory.register({
  name: 'paranCallout',
  create: (bounds: ShapeBounds) => {
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
  },
  getPadding: () => ({ top: 14, right: 18, bottom: 14, left: 18 }),
})

export default ShapeFactory

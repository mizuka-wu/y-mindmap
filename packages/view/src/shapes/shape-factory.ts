import { Rect, Ellipse, Path, Polygon } from 'leafer-ui'
import { Bounds } from '@y-mindmap/core'

export type ShapeType = 
  | 'rect'
  | 'roundedRect'
  | 'ellipse'
  | 'diamond'
  | 'hexagon'
  | 'parallelogram'
  | 'cloud'
  | 'callout'
  | 'roundedHexagon'
  | 'shield'
  | 'heart'
  | 'star'
  | 'arrow'
  | 'fatArrowRight'
  | 'fatArrowLeft'
  | 'notched'
  | 'chevron'
  | 'cross'
  | 'cylinder'
  | 'cone'
  | 'sphere'
  | 'torus'
  | 'underline'
  | 'doubleUnderline'
  | 'noBorder'
  | 'bracket'
  | 'curlyBracket'
  | 'bookmark'
  | 'flag'
  | 'wave'
  | 'pill'
  | 'trapezoid'
  | 'octagon'
  | 'pentagon'
  | 'triangle'
  | 'rightTriangle'
  | 'sector'
  | 'ring'
  | 'arc'

export interface ShapeCreator {
  create(bounds: Bounds, options?: any): Rect | Ellipse | Path | Polygon
  getSelectionPath(bounds: Bounds): string
}

const shapes = new Map<string, ShapeCreator>()

shapes.set('rect', {
  create(bounds: Bounds) {
    return new Rect({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('roundedRect', {
  create(bounds: Bounds) {
    return new Rect({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, cornerRadius: 8 })
  },
  getSelectionPath(b) {
    const r = 8
    return `M ${b.x + r} ${b.y} L ${b.x + b.width - r} ${b.y} Q ${b.x + b.width} ${b.y} ${b.x + b.width} ${b.y + r} L ${b.x + b.width} ${b.y + b.height - r} Q ${b.x + b.width} ${b.y + b.height} ${b.x + b.width - r} ${b.y + b.height} L ${b.x + r} ${b.y + b.height} Q ${b.x} ${b.y + b.height} ${b.x} ${b.y + b.height - r} L ${b.x} ${b.y + r} Q ${b.x} ${b.y} ${b.x + r} ${b.y} Z`
  },
})

shapes.set('ellipse', {
  create(bounds: Bounds) {
    return new Ellipse({ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2, radiusX: bounds.width / 2, radiusY: bounds.height / 2 })
  },
  getSelectionPath(b) {
    const cx = b.x + b.width / 2
    const cy = b.y + b.height / 2
    const rx = b.width / 2
    const ry = b.height / 2
    return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`
  },
})

shapes.set('diamond', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({ path: `M ${x + width / 2} ${y} L ${x + width} ${y + height / 2} L ${x + width / 2} ${y + height} L ${x} ${y + height / 2} Z` })
  },
  getSelectionPath(b) {
    return `M ${b.x + b.width / 2} ${b.y} L ${b.x + b.width} ${b.y + b.height / 2} L ${b.x + b.width / 2} ${b.y + b.height} L ${b.x} ${b.y + b.height / 2} Z`
  },
})

shapes.set('hexagon', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const offset = width / 4
    return new Path({ path: `M ${x + offset} ${y} L ${x + width - offset} ${y} L ${x + width} ${y + height / 2} L ${x + width - offset} ${y + height} L ${x + offset} ${y + height} L ${x} ${y + height / 2} Z` })
  },
  getSelectionPath(b) {
    const offset = b.width / 4
    return `M ${b.x + offset} ${b.y} L ${b.x + b.width - offset} ${b.y} L ${b.x + b.width} ${b.y + b.height / 2} L ${b.x + b.width - offset} ${b.y + b.height} L ${b.x + offset} ${b.y + b.height} L ${b.x} ${b.y + b.height / 2} Z`
  },
})

shapes.set('roundedHexagon', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const offset = width / 4
    const r = 8
    return new Path({ path: `M ${x + offset + r} ${y} L ${x + width - offset - r} ${y} Q ${x + width - offset} ${y} ${x + width - offset + r * 0.7} ${y + r * 0.7} L ${x + width - r * 0.7} ${y + height / 2 - r * 0.7} Q ${x + width} ${y + height / 2} ${x + width - r * 0.7} ${y + height / 2 + r * 0.7} L ${x + width - offset + r * 0.7} ${y + height - r * 0.7} Q ${x + width - offset} ${y + height} ${x + width - offset - r} ${y + height} L ${x + offset + r} ${y + height} Q ${x + offset} ${y + height} ${x + offset - r * 0.7} ${y + height - r * 0.7} L ${x + r * 0.7} ${y + height / 2 + r * 0.7} Q ${x} ${y + height / 2} ${x + r * 0.7} ${y + height / 2 - r * 0.7} L ${x + offset - r * 0.7} ${y + r * 0.7} Q ${x + offset} ${y} ${x + offset + r} ${y} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('hexagon')!.getSelectionPath(b)
  },
})

shapes.set('parallelogram', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const s = 20
    return new Path({ path: `M ${x + s} ${y} L ${x + width} ${y} L ${x + width - s} ${y + height} L ${x} ${y + height} Z` })
  },
  getSelectionPath(b) {
    const s = 20
    return `M ${b.x + s} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width - s} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('cloud', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const path = `M ${x + width * 0.2} ${y + height * 0.2} Q ${x} ${y} ${x + width * 0.2} ${y} Q ${x + width * 0.4} ${y - height * 0.1} ${x + width * 0.5} ${y} Q ${x + width * 0.7} ${y - height * 0.1} ${x + width * 0.8} ${y} Q ${x + width} ${y} ${x + width} ${y + height * 0.3} Q ${x + width * 1.1} ${y + height * 0.5} ${x + width} ${y + height * 0.7} Q ${x + width} ${y + height} ${x + width * 0.8} ${y + height} Q ${x + width * 0.6} ${y + height * 1.1} ${x + width * 0.5} ${y + height} Q ${x + width * 0.3} ${y + height * 1.1} ${x + width * 0.2} ${y + height} Q ${x} ${y + height} ${x} ${y + height * 0.7} Q ${x - width * 0.1} ${y + height * 0.5} ${x} ${y + height * 0.3} Q ${x} ${y} ${x + width * 0.2} ${y} Z`
    return new Path({ path })
  },
  getSelectionPath(b) {
    return shapes.get('cloud')!.create(b).path as string
  },
})

shapes.set('callout', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const tailX = x + width * 0.3
    const tailY = y + height + 15
    return new Path({ path: `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${tailX + 10} ${y + height} L ${tailX} ${tailY} L ${tailX - 5} ${y + height} L ${x} ${y + height} Z` })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('shield', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({ path: `M ${x + width / 2} ${y} L ${x + width} ${y + height * 0.3} L ${x + width} ${y + height * 0.7} Q ${x + width} ${y + height} ${x + width / 2} ${y + height} Q ${x} ${y + height} ${x} ${y + height * 0.7} L ${x} ${y + height * 0.3} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('shield')!.create(b).path as string
  },
})

shapes.set('heart', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({ path: `M ${x + width / 2} ${y + height} Q ${x} ${y + height * 0.6} ${x} ${y + height * 0.3} Q ${x} ${y} ${x + width / 2} ${y + height * 0.2} Q ${x + width} ${y} ${x + width} ${y + height * 0.3} Q ${x + width} ${y + height * 0.6} ${x + width / 2} ${y + height} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('heart')!.create(b).path as string
  },
})

shapes.set('star', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const cx = x + width / 2
    const cy = y + height / 2
    const outerR = Math.min(width, height) / 2
    const innerR = outerR * 0.4
    let path = ''
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i * 72 - 90) * Math.PI / 180
      const innerAngle = ((i * 72 + 36) - 90) * Math.PI / 180
      const ox = cx + outerR * Math.cos(outerAngle)
      const oy = cy + outerR * Math.sin(outerAngle)
      const ix = cx + innerR * Math.cos(innerAngle)
      const iy = cy + innerR * Math.sin(innerAngle)
      path += i === 0 ? `M ${ox} ${oy}` : ` L ${ox} ${oy}`
      path += ` L ${ix} ${iy}`
    }
    path += ' Z'
    return new Path({ path })
  },
  getSelectionPath(b) {
    return shapes.get('star')!.create(b).path as string
  },
})

shapes.set('arrow', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const arrowWidth = width * 0.3
    return new Path({ path: `M ${x} ${y + height * 0.3} L ${x + width - arrowWidth} ${y + height * 0.3} L ${x + width - arrowWidth} ${y} L ${x + width} ${y + height / 2} L ${x + width - arrowWidth} ${y + height} L ${x + width - arrowWidth} ${y + height * 0.7} L ${x} ${y + height * 0.7} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('arrow')!.create(b).path as string
  },
})

shapes.set('fatArrowRight', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({ path: `M ${x} ${y} L ${x + width * 0.7} ${y} L ${x + width} ${y + height / 2} L ${x + width * 0.7} ${y + height} L ${x} ${y + height} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('fatArrowRight')!.create(b).path as string
  },
})

shapes.set('fatArrowLeft', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({ path: `M ${x + width} ${y} L ${x + width * 0.3} ${y} L ${x} ${y + height / 2} L ${x + width * 0.3} ${y + height} L ${x + width} ${y + height} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('fatArrowLeft')!.create(b).path as string
  },
})

shapes.set('notched', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const notch = 15
    return new Path({ path: `M ${x + notch} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x + notch} ${y + height} L ${x} ${y + height / 2} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('notched')!.create(b).path as string
  },
})

shapes.set('chevron', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({ path: `M ${x} ${y} L ${x + width * 0.7} ${y} L ${x + width} ${y + height / 2} L ${x + width * 0.7} ${y + height} L ${x} ${y + height} L ${x + width * 0.3} ${y + height / 2} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('chevron')!.create(b).path as string
  },
})

shapes.set('pill', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const r = height / 2
    return new Path({ path: `M ${x + r} ${y} L ${x + width - r} ${y} A ${r} ${r} 0 0 1 ${x + width - r} ${y + height} L ${x + r} ${y + height} A ${r} ${r} 0 0 1 ${x + r} ${y} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('pill')!.create(b).path as string
  },
})

shapes.set('trapezoid', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const offset = width * 0.15
    return new Path({ path: `M ${x + offset} ${y} L ${x + width - offset} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('trapezoid')!.create(b).path as string
  },
})

shapes.set('octagon', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const offset = Math.min(width, height) * 0.2
    return new Path({ path: `M ${x + offset} ${y} L ${x + width - offset} ${y} L ${x + width} ${y + offset} L ${x + width} ${y + height - offset} L ${x + width - offset} ${y + height} L ${x + offset} ${y + height} L ${x} ${y + height - offset} L ${x} ${y + offset} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('octagon')!.create(b).path as string
  },
})

shapes.set('pentagon', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({ path: `M ${x + width / 2} ${y} L ${x + width} ${y + height * 0.38} L ${x + width * 0.81} ${y + height} L ${x + width * 0.19} ${y + height} L ${x} ${y + height * 0.38} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('pentagon')!.create(b).path as string
  },
})

shapes.set('triangle', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({ path: `M ${x + width / 2} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('triangle')!.create(b).path as string
  },
})

shapes.set('rightTriangle', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({ path: `M ${x} ${y} L ${x + width} ${y + height} L ${x} ${y + height} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('rightTriangle')!.create(b).path as string
  },
})

shapes.set('underline', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({ path: `M ${x} ${y + height} L ${x + width} ${y + height}` })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('doubleUnderline', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({ path: `M ${x} ${y + height - 3} L ${x + width} ${y + height - 3} M ${x} ${y + height} L ${x + width} ${y + height}` })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('noBorder', {
  create(bounds: Bounds) {
    return new Rect({ x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height, fill: 'transparent', stroke: 'transparent' })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('bookmark', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({ path: `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${x + width / 2} ${y + height * 0.7} L ${x} ${y + height} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('bookmark')!.create(b).path as string
  },
})

shapes.set('flag', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({ path: `M ${x} ${y} L ${x + width} ${y + height * 0.15} L ${x + width * 0.8} ${y + height * 0.5} L ${x + width} ${y + height * 0.85} L ${x} ${y + height} Z` })
  },
  getSelectionPath(b) {
    return shapes.get('flag')!.create(b).path as string
  },
})

shapes.set('wave', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({ path: `M ${x} ${y + height / 2} Q ${x + width * 0.25} ${y} ${x + width * 0.5} ${y + height / 2} Q ${x + width * 0.75} ${y + height} ${x + width} ${y + height / 2}` })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('waterDrop', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({
      path: `M ${x + width / 2} ${y}
             Q ${x + width} ${y + height * 0.3} ${x + width * 0.7} ${y + height * 0.5}
             Q ${x + width * 0.5} ${y + height} ${x + width * 0.5} ${y + height}
             Q ${x + width * 0.5} ${y + height} ${x + width * 0.3} ${y + height * 0.5}
             Q ${x} ${y + height * 0.3} ${x + width / 2} ${y} Z`
    })
  },
  getSelectionPath(b) {
    return shapes.get('waterDrop')!.create(b).path as string
  },
})

shapes.set('simpleCloud', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({
      path: `M ${x + width * 0.2} ${y + height * 0.8}
             Q ${x} ${y + height * 0.8} ${x} ${y + height * 0.5}
             Q ${x} ${y + height * 0.2} ${x + width * 0.2} ${y + height * 0.2}
             Q ${x + width * 0.2} ${y} ${x + width * 0.4} ${y}
             Q ${x + width * 0.6} ${y} ${x + width * 0.7} ${y + height * 0.15}
             Q ${x + width} ${y + height * 0.15} ${x + width} ${y + height * 0.4}
             Q ${x + width} ${y + height * 0.7} ${x + width * 0.8} ${y + height * 0.8} Z`
    })
  },
  getSelectionPath(b) {
    return shapes.get('simpleCloud')!.create(b).path as string
  },
})

shapes.set('roundBracket', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({
      path: `M ${x + width} ${y}
             Q ${x + width * 0.3} ${y} ${x + width * 0.3} ${y + height / 2}
             Q ${x + width * 0.3} ${y + height} ${x + width} ${y + height}`
    })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('squareBracket', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({
      path: `M ${x + width} ${y}
             L ${x + width * 0.2} ${y}
             L ${x + width * 0.2} ${y + height}
             L ${x + width} ${y + height}`
    })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('singleBookQuote', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({
      path: `M ${x + width} ${y}
             L ${x + width * 0.15} ${y}
             L ${x} ${y + height * 0.15}
             L ${x + width * 0.15} ${y + height * 0.3}
             L ${x + width * 0.15} ${y + height}
             L ${x + width} ${y + height}`
    })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('doubleBookQuote', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({
      path: `M ${x + width} ${y}
             L ${x + width * 0.2} ${y}
             L ${x + width * 0.05} ${y + height * 0.15}
             L ${x + width * 0.2} ${y + height * 0.3}
             L ${x + width * 0.05} ${y + height * 0.45}
             L ${x + width * 0.2} ${y + height * 0.6}
             L ${x + width * 0.2} ${y + height}
             L ${x + width} ${y + height}`
    })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('doubleQuote', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({
      path: `M ${x + width * 0.8} ${y}
             L ${x + width * 0.2} ${y}
             L ${x + width * 0.1} ${y + height * 0.2}
             L ${x + width * 0.2} ${y + height * 0.4}
             L ${x + width * 0.8} ${y + height * 0.4}
             L ${x + width * 0.9} ${y + height * 0.2}
             L ${x + width * 0.8} ${y}
             M ${x + width} ${y}
             L ${x + width * 0.6} ${y}
             L ${x + width * 0.5} ${y + height * 0.2}
             L ${x + width * 0.6} ${y + height * 0.4}
             L ${x + width} ${y + height * 0.4}
             L ${x + width} ${y}`
    })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('squareQuote', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({
      path: `M ${x + width * 0.8} ${y}
             L ${x + width * 0.2} ${y}
             L ${x + width * 0.2} ${y + height * 0.4}
             L ${x + width * 0.8} ${y + height * 0.4}
             L ${x + width * 0.8} ${y}`
    })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('label', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Path({
      path: `M ${x} ${y}
             L ${x + width * 0.8} ${y}
             L ${x + width} ${y + height / 2}
             L ${x + width * 0.8} ${y + height}
             L ${x} ${y + height} Z`
    })
  },
  getSelectionPath(b) {
    return shapes.get('label')!.create(b).path as string
  },
})

shapes.set('matrixMain', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Rect({
      x,
      y,
      width,
      height,
      fill: '#4A90D9',
      stroke: '#2E6DB4',
      strokeWidth: 2,
    })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('treeTableMain', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    return new Rect({
      x,
      y,
      width,
      height,
      fill: '#E8F0FE',
      stroke: '#B8D4F0',
      strokeWidth: 1,
      cornerRadius: 0,
    })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('cutDiamond', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const cut = Math.min(width, height) * 0.15
    return new Path({
      path: `M ${x + width / 2} ${y}
             L ${x + width} ${y + height / 2}
             L ${x + width / 2} ${y + height}
             L ${x} ${y + height / 2} Z
             M ${x + width / 2} ${y + cut}
             L ${x + width - cut} ${y + height / 2}
             L ${x + width / 2} ${y + height - cut}
             L ${x + cut} ${y + height / 2} Z`
    })
  },
  getSelectionPath(b) {
    return shapes.get('cutDiamond')!.create(b).path as string
  },
})

shapes.set('ellipticRectangle', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const rx = width * 0.15
    const ry = height * 0.15
    return new Path({
      path: `M ${x + rx} ${y}
             L ${x + width - rx} ${y}
             Q ${x + width} ${y} ${x + width} ${y + ry}
             L ${x + width} ${y + height - ry}
             Q ${x + width} ${y + height} ${x + width - rx} ${y + height}
             L ${x + rx} ${y + height}
             Q ${x} ${y + height} ${x} ${y + height - ry}
             L ${x} ${y + ry}
             Q ${x} ${y} ${x + rx} ${y} Z`
    })
  },
  getSelectionPath(b) {
    return shapes.get('ellipticRectangle')!.create(b).path as string
  },
})

shapes.set('handDrawnEllipse', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const cx = x + width / 2
    const cy = y + height / 2
    const rx = width / 2
    const ry = height / 2
    const wobble = Math.min(rx, ry) * 0.1
    return new Path({
      path: `M ${cx - rx} ${cy}
             C ${cx - rx} ${cy - ry - wobble} ${cx + rx} ${cy - ry + wobble} ${cx + rx} ${cy}
             C ${cx + rx} ${cy + ry + wobble} ${cx - rx} ${cy + ry - wobble} ${cx - rx} ${cy} Z`
    })
  },
  getSelectionPath(b) {
    return shapes.get('handDrawnEllipse')!.create(b).path as string
  },
})

shapes.set('ellipseRect', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const rx = Math.min(width / 2, height / 2)
    return new Path({
      path: `M ${x + rx} ${y}
             L ${x + width - rx} ${y}
             A ${rx} ${rx} 0 0 1 ${x + width} ${y + rx}
             L ${x + width} ${y + height - rx}
             A ${rx} ${rx} 0 0 1 ${x + width - rx} ${y + height}
             L ${x + rx} ${y + height}
             A ${rx} ${rx} 0 0 1 ${x} ${y + height - rx}
             L ${x} ${y + rx}
             A ${rx} ${rx} 0 0 1 ${x + rx} ${y} Z`
    })
  },
  getSelectionPath(b) {
    return shapes.get('ellipseRect')!.create(b).path as string
  },
})

shapes.set('circle', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const r = Math.min(width, height) / 2
    return new Ellipse({
      x: x + width / 2,
      y: y + height / 2,
      radiusX: r,
      radiusY: r,
    })
  },
  getSelectionPath(b) {
    const r = Math.min(b.width, b.height) / 2
    const cx = b.x + b.width / 2
    const cy = b.y + b.height / 2
    return `M ${cx - r} ${cy} A ${r} ${r} 0 1 0 ${cx + r} ${cy} A ${r} ${r} 0 1 0 ${cx - r} ${cy} Z`
  },
})

shapes.set('leaf', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const h = height / 2
    return new Path({
      path: `M ${x} ${y + height / 2}
             Q ${x + width / 2} ${y - h} ${x + width} ${y + height / 2}
             Q ${x + width / 2} ${y + height + h} ${x} ${y + height / 2} Z`
    })
  },
  getSelectionPath(b) {
    return shapes.get('leaf')!.create(b).path as string
  },
})

shapes.set('stack', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const gap = 4
    return new Path({
      path: `M ${x} ${y} L ${x + width - gap} ${y} L ${x + width - gap} ${y + height - gap} L ${x} ${y + height - gap} Z
             M ${x + width - gap} ${y + gap} L ${x + width} ${y + gap} L ${x + width} ${y + height} L ${x + gap} ${y + height} L ${x + gap} ${y + height - gap}`
    })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('singleBreakAngle', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const length = Math.min(20, Math.min(height / 5, width / 5))
    return new Path({
      path: `M ${x} ${y} L ${x + width - length} ${y} L ${x + width} ${y + length} L ${x + width} ${y + height} L ${x} ${y + height} Z`
    })
  },
  getSelectionPath(b) {
    return shapes.get('singleBreakAngle')!.create(b).path as string
  },
})

shapes.set('doubleRoundedAngle', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const corner = 15
    return new Path({
      path: `M ${x + corner} ${y}
             L ${x + width} ${y}
             L ${x + width} ${y + height - corner}
             Q ${x + width} ${y + height} ${x + width - corner} ${y + height}
             L ${x} ${y + height}
             L ${x} ${y + corner}
             Q ${x} ${y} ${x + corner} ${y} Z`
    })
  },
  getSelectionPath(b) {
    return shapes.get('doubleRoundedAngle')!.create(b).path as string
  },
})

shapes.set('calloutRect', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const tailX = x + width * 0.3
    const tailY = y + height + 15
    return new Path({
      path: `M ${x} ${y} L ${x + width} ${y} L ${x + width} ${y + height} L ${tailX + 10} ${y + height} L ${tailX} ${tailY} L ${tailX - 5} ${y + height} L ${x} ${y + height} Z`
    })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('calloutRoundedRect', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const r = 8
    const tailX = x + width * 0.3
    const tailY = y + height + 15
    return new Path({
      path: `M ${x + r} ${y}
             L ${x + width - r} ${y}
             Q ${x + width} ${y} ${x + width} ${y + r}
             L ${x + width} ${y + height - r}
             Q ${x + width} ${y + height} ${x + width - r} ${y + height}
             L ${tailX + 10} ${y + height}
             L ${tailX} ${tailY}
             L ${tailX - 5} ${y + height}
             L ${x + r} ${y + height}
             Q ${x} ${y + height} ${x} ${y + height - r}
             L ${x} ${y + r}
             Q ${x} ${y} ${x + r} ${y} Z`
    })
  },
  getSelectionPath(b) {
    return `M ${b.x} ${b.y} L ${b.x + b.width} ${b.y} L ${b.x + b.width} ${b.y + b.height} L ${b.x} ${b.y + b.height} Z`
  },
})

shapes.set('calloutEllipse', {
  create(bounds: Bounds) {
    const { x, y, width, height } = bounds
    const cx = x + width / 2
    const cy = y + height / 2
    const rx = width / 2
    const ry = height / 2
    const tailX = x + width * 0.3
    const tailY = y + height + 15
    return new Path({
      path: `M ${cx - rx} ${cy}
             A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy}
             A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy}
             M ${tailX} ${y + height}
             L ${tailX - 5} ${tailY}
             L ${tailX + 10} ${y + height}`
    })
  },
  getSelectionPath(b) {
    const cx = b.x + b.width / 2
    const cy = b.y + b.height / 2
    const rx = b.width / 2
    const ry = b.height / 2
    return `M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 0 ${cx - rx} ${cy} Z`
  },
})

export class ShapeFactory {
  static create(shapeType: string, bounds: Bounds, options?: any): Rect | Ellipse | Path | Polygon {
    const creator = shapes.get(shapeType) || shapes.get('roundedRect')!
    return creator.create(bounds, options)
  }

  static getSelectionPath(shapeType: string, bounds: Bounds): string {
    const creator = shapes.get(shapeType) || shapes.get('roundedRect')!
    return creator.getSelectionPath(bounds)
  }

  static register(name: string, creator: ShapeCreator): void {
    shapes.set(name, creator)
  }

  static getAvailableShapes(): string[] {
    return Array.from(shapes.keys())
  }
}

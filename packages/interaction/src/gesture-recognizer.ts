import { Point } from '@y-mindmap/core'

export interface GestureEvent {
  type: 'pinch' | 'pan' | 'rotate' | 'tap' | 'doubletap' | 'press'
  center?: Point
  scale?: number
  rotation?: number
  deltaX?: number
  deltaY?: number
  pointerCount?: number
}

export interface GestureConfig {
  pinchThreshold: number
  rotateThreshold: number
  tapTimeout: number
  doubleTapTimeout: number
  pressTimeout: number
}

const DEFAULT_CONFIG: GestureConfig = {
  pinchThreshold: 0.01,
  rotateThreshold: 5,
  tapTimeout: 300,
  doubleTapTimeout: 300,
  pressTimeout: 500,
}

interface Pointer {
  id: number
  x: number
  y: number
}

export class GestureRecognizer {
  private config: GestureConfig
  private pointers: Map<number, Pointer> = new Map()
  private initialDistance: number = 0
  private initialAngle: number = 0
  private initialScale: number = 1
  private lastTapTime: number = 0
  private lastTapPosition: Point | null = null
  private pressTimer: ReturnType<typeof setTimeout> | null = null
  private isPressed: boolean = false

  private onGesture: (event: GestureEvent) => void

  constructor(
    onGesture: (event: GestureEvent) => void,
    config?: Partial<GestureConfig>
  ) {
    this.onGesture = onGesture
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  handlePointerDown(id: number, x: number, y: number): void {
    this.pointers.set(id, { id, x, y })

    if (this.pointers.size === 1) {
      this.pressTimer = setTimeout(() => {
        this.isPressed = true
        this.onGesture({
          type: 'press',
          center: { x, y },
          pointerCount: 1,
        })
      }, this.config.pressTimeout)
    }

    if (this.pointers.size === 2) {
      const points = Array.from(this.pointers.values())
      if (points[0] && points[1]) {
        this.initialDistance = this.getDistance(points[0], points[1])
        this.initialAngle = this.getAngle(points[0], points[1])
        this.initialScale = 1
      }
    }
  }

  handlePointerMove(id: number, x: number, y: number): void {
    const pointer = this.pointers.get(id)
    if (!pointer) return

    pointer.x = x
    pointer.y = y

    if (this.pressTimer) {
      clearTimeout(this.pressTimer)
      this.pressTimer = null
    }

    if (this.pointers.size === 2) {
      const points = Array.from(this.pointers.values())
      if (!points[0] || !points[1]) return
      
      const center = this.getCenter(points[0], points[1])

      const distance = this.getDistance(points[0], points[1])
      const scale = distance / this.initialDistance

      if (Math.abs(scale - this.initialScale) > this.config.pinchThreshold) {
        this.onGesture({
          type: 'pinch',
          center,
          scale,
          pointerCount: 2,
        })
        this.initialScale = scale
      }

      const angle = this.getAngle(points[0], points[1])
      const rotation = angle - this.initialAngle

      if (Math.abs(rotation) > this.config.rotateThreshold) {
        this.onGesture({
          type: 'rotate',
          center,
          rotation,
          pointerCount: 2,
        })
        this.initialAngle = angle
      }
    }

    if (this.pointers.size === 1 && !this.isPressed) {
      const currentPointer = this.pointers.get(id)
      if (currentPointer) {
        this.onGesture({
          type: 'pan',
          deltaX: x - currentPointer.x,
          deltaY: y - currentPointer.y,
          pointerCount: 1,
        })
      }
    }
  }

  handlePointerUp(id: number, x: number, y: number): void {
    this.pointers.delete(id)

    if (this.pressTimer) {
      clearTimeout(this.pressTimer)
      this.pressTimer = null
    }

    if (this.isPressed) {
      this.isPressed = false
      return
    }

    if (this.pointers.size === 0) {
      const now = Date.now()
      const timeSinceLastTap = now - this.lastTapTime

      if (timeSinceLastTap < this.config.doubleTapTimeout && this.lastTapPosition) {
        const distance = this.getDistance(
          { x, y, id: 0 },
          { ...this.lastTapPosition, id: 0 }
        )

        if (distance < 20) {
          this.onGesture({
            type: 'doubletap',
            center: { x, y },
            pointerCount: 1,
          })
          this.lastTapTime = 0
          this.lastTapPosition = null
          return
        }
      }

      this.onGesture({
        type: 'tap',
        center: { x, y },
        pointerCount: 1,
      })

      this.lastTapTime = now
      this.lastTapPosition = { x, y }
    }
  }

  handlePointerCancel(id: number): void {
    this.pointers.delete(id)

    if (this.pressTimer) {
      clearTimeout(this.pressTimer)
      this.pressTimer = null
    }

    this.isPressed = false
  }

  private getDistance(p1: Pointer, p2: Pointer): number {
    const dx = p2.x - p1.x
    const dy = p2.y - p1.y
    return Math.sqrt(dx * dx + dy * dy)
  }

  private getAngle(p1: Pointer, p2: Pointer): number {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI
  }

  private getCenter(p1: Pointer, p2: Pointer): Point {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    }
  }

  reset(): void {
    this.pointers.clear()
    this.initialDistance = 0
    this.initialAngle = 0
    this.initialScale = 1
    this.lastTapTime = 0
    this.lastTapPosition = null

    if (this.pressTimer) {
      clearTimeout(this.pressTimer)
      this.pressTimer = null
    }

    this.isPressed = false
  }
}

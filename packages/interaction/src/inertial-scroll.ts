import { Point } from '@y-mindmap/core'

interface PositionRecord {
  x: number
  y: number
  time: number
}

export interface InertialScrollConfig {
  friction: number
  minVelocity: number
  maxVelocity: number
  recordSize: number
}

const DEFAULT_CONFIG: InertialScrollConfig = {
  friction: 0.95,
  minVelocity: 0.5,
  maxVelocity: 50,
  recordSize: 5,
}

export class InertialScroll {
  private config: InertialScrollConfig
  private records: PositionRecord[] = []
  private animationFrame: number | null = null
  private isAnimating: boolean = false
  private onScroll: (dx: number, dy: number) => void

  constructor(
    onScroll: (dx: number, dy: number) => void,
    config?: Partial<InertialScrollConfig>
  ) {
    this.onScroll = onScroll
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  record(x: number, y: number): void {
    this.records.push({ x, y, time: Date.now() })

    if (this.records.length > this.config.recordSize) {
      this.records.shift()
    }
  }

  start(): void {
    if (this.isAnimating) {
      this.stop()
    }

    if (this.records.length < 2) return

    const velocity = this.calculateVelocity()
    if (!velocity) return

    this.isAnimating = true
    this.animate(velocity.x, velocity.y)
  }

  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
    this.isAnimating = false
    this.records = []
  }

  isActive(): boolean {
    return this.isAnimating
  }

  private calculateVelocity(): Point | null {
    if (this.records.length < 2) return null

    const now = Date.now()
    const recentRecords = this.records.filter(r => now - r.time < 100)

    if (recentRecords.length < 2) return null

    const first = recentRecords[0]
    const last = recentRecords[recentRecords.length - 1]

    if (!first || !last) return null

    const dt = (last.time - first.time) / 1000

    if (dt === 0) return null

    let vx = (last.x - first.x) / dt
    let vy = (last.y - first.y) / dt

    const speed = Math.sqrt(vx * vx + vy * vy)
    if (speed > this.config.maxVelocity) {
      const ratio = this.config.maxVelocity / speed
      vx *= ratio
      vy *= ratio
    }

    return { x: vx, y: vy }
  }

  private animate(vx: number, vy: number): void {
    let lastTime = Date.now()

    const frame = () => {
      const now = Date.now()
      const dt = (now - lastTime) / 1000
      lastTime = now

      vx *= Math.pow(this.config.friction, dt * 60)
      vy *= Math.pow(this.config.friction, dt * 60)

      const speed = Math.sqrt(vx * vx + vy * vy)

      if (speed < this.config.minVelocity) {
        this.isAnimating = false
        this.animationFrame = null
        return
      }

      const dx = vx * dt
      const dy = vy * dt

      this.onScroll(dx, dy)

      this.animationFrame = requestAnimationFrame(frame)
    }

    this.animationFrame = requestAnimationFrame(frame)
  }
}

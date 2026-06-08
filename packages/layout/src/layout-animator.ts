import { Point, Bounds } from '@y-mindmap/core'

export interface AnimationConfig {
  duration: number
  easing: string
  delay: number
}

export const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  duration: 300,
  easing: 'ease-out',
  delay: 0,
}

export interface AnimationTarget {
  x: number
  y: number
  width: number
  height: number
  opacity?: number
}

export class LayoutAnimator {
  private animations: Map<string, Animation> = new Map()
  private frameId: number | null = null

  animate(
    nodeId: string,
    from: AnimationTarget,
    to: AnimationTarget,
    config: Partial<AnimationConfig> = {},
    onUpdate: (target: AnimationTarget) => void,
    onComplete?: () => void
  ): void {
    const fullConfig = { ...DEFAULT_ANIMATION_CONFIG, ...config }

    const animation: Animation = {
      nodeId,
      from,
      to,
      config: fullConfig,
      startTime: Date.now(),
      onUpdate,
      onComplete,
    }

    this.animations.set(nodeId, animation)

    if (!this.frameId) {
      this.startFrameLoop()
    }
  }

  private startFrameLoop(): void {
    const frame = () => {
      const now = Date.now()
      const completed: string[] = []

      for (const [nodeId, animation] of this.animations) {
        const elapsed = now - animation.startTime - animation.config.delay

        if (elapsed < 0) continue

        const progress = Math.min(1, elapsed / animation.config.duration)
        const easedProgress = this.ease(progress, animation.config.easing)

        const current: AnimationTarget = {
          x: this.lerp(animation.from.x, animation.to.x, easedProgress),
          y: this.lerp(animation.from.y, animation.to.y, easedProgress),
          width: this.lerp(animation.from.width, animation.to.width, easedProgress),
          height: this.lerp(animation.from.height, animation.to.height, easedProgress),
          opacity: animation.from.opacity !== undefined && animation.to.opacity !== undefined
            ? this.lerp(animation.from.opacity, animation.to.opacity, easedProgress)
            : undefined,
        }

        animation.onUpdate(current)

        if (progress >= 1) {
          completed.push(nodeId)
          animation.onComplete?.()
        }
      }

      for (const nodeId of completed) {
        this.animations.delete(nodeId)
      }

      if (this.animations.size > 0) {
        this.frameId = requestAnimationFrame(frame)
      } else {
        this.frameId = null
      }
    }

    this.frameId = requestAnimationFrame(frame)
  }

  private lerp(from: number, to: number, t: number): number {
    return from + (to - from) * t
  }

  private ease(t: number, easing: string): number {
    switch (easing) {
      case 'linear':
        return t
      case 'ease-in':
        return t * t
      case 'ease-out':
        return 1 - (1 - t) * (1 - t)
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
      default:
        return 1 - Math.pow(1 - t, 3)
    }
  }

  cancel(nodeId: string): void {
    this.animations.delete(nodeId)
  }

  cancelAll(): void {
    this.animations.clear()
    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
  }

  isAnimating(nodeId: string): boolean {
    return this.animations.has(nodeId)
  }

  getAnimatingNodes(): string[] {
    return Array.from(this.animations.keys())
  }
}

interface Animation {
  nodeId: string
  from: AnimationTarget
  to: AnimationTarget
  config: AnimationConfig
  startTime: number
  onUpdate: (target: AnimationTarget) => void
  onComplete?: () => void
}

export interface AnimationState {
  x: number
  y: number
  width: number
  height: number
  opacity: number
  scaleX: number
  scaleY: number
}

export interface AnimationConfig {
  duration: number
  easing: EasingFunction
  delay: number
  onUpdate: (state: AnimationState) => void
  onComplete?: () => void
}

export type EasingFunction = (t: number) => number

export const Easing = {
  linear: (t: number): number => t,
  
  easeIn: (t: number): number => t * t,
  
  easeOut: (t: number): number => 1 - (1 - t) * (1 - t),
  
  easeInOut: (t: number): number => 
    t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  
  easeOutCubic: (t: number): number => 1 - Math.pow(1 - t, 3),
  
  easeInCubic: (t: number): number => t * t * t,
  
  easeOutBack: (t: number): number => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  },
  
  easeInBack: (t: number): number => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return c3 * t * t * t - c1 * t * t
  },
} as const

export const DEFAULT_ANIMATION_CONFIG: Omit<AnimationConfig, 'onUpdate'> = {
  duration: 300,
  easing: Easing.easeOut,
  delay: 0,
}

interface Animation {
  id: string
  from: AnimationState
  to: AnimationState
  config: AnimationConfig
  startTime: number
}

export class AnimationScheduler {
  private animations: Map<string, Animation> = new Map()
  private frameId: number | null = null
  private _isRunning: boolean = false

  get isRunning(): boolean {
    return this._isRunning
  }

  startAnimation(
    id: string,
    from: Partial<AnimationState>,
    to: Partial<AnimationState>,
    config: Partial<AnimationConfig> = {}
  ): void {
    const fullFrom: AnimationState = {
      x: from.x ?? 0,
      y: from.y ?? 0,
      width: from.width ?? 0,
      height: from.height ?? 0,
      opacity: from.opacity ?? 1,
      scaleX: from.scaleX ?? 1,
      scaleY: from.scaleY ?? 1,
    }

    const fullTo: AnimationState = {
      x: to.x ?? 0,
      y: to.y ?? 0,
      width: to.width ?? 0,
      height: to.height ?? 0,
      opacity: to.opacity ?? 1,
      scaleX: to.scaleX ?? 1,
      scaleY: to.scaleY ?? 1,
    }

    const fullConfig: AnimationConfig = {
      ...DEFAULT_ANIMATION_CONFIG,
      ...config,
      onUpdate: config.onUpdate ?? (() => {}),
      onComplete: config.onComplete,
    }

    const animation: Animation = {
      id,
      from: fullFrom,
      to: fullTo,
      config: fullConfig,
      startTime: Date.now(),
    }

    this.animations.set(id, animation)

    if (!this.frameId) {
      this.startFrameLoop()
    }
  }

  cancelAnimation(id: string): void {
    this.animations.delete(id)
    
    if (this.animations.size === 0 && this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
      this._isRunning = false
    }
  }

  cancelAll(): void {
    this.animations.clear()
    if (this.frameId) {
      cancelAnimationFrame(this.frameId)
      this.frameId = null
    }
    this._isRunning = false
  }

  isAnimating(id: string): boolean {
    return this.animations.has(id)
  }

  getAnimatingIds(): string[] {
    return Array.from(this.animations.keys())
  }

  private startFrameLoop(): void {
    this._isRunning = true
    
    const frame = (): void => {
      const now = Date.now()
      const completed: string[] = []

      for (const [id, animation] of Array.from(this.animations.entries())) {
        const elapsed = now - animation.startTime - animation.config.delay

        if (elapsed < 0) continue

        const progress = Math.min(1, elapsed / animation.config.duration)
        const easedProgress = animation.config.easing(progress)

        const currentState: AnimationState = {
          x: this.lerp(animation.from.x, animation.to.x, easedProgress),
          y: this.lerp(animation.from.y, animation.to.y, easedProgress),
          width: this.lerp(animation.from.width, animation.to.width, easedProgress),
          height: this.lerp(animation.from.height, animation.to.height, easedProgress),
          opacity: this.lerp(animation.from.opacity, animation.to.opacity, easedProgress),
          scaleX: this.lerp(animation.from.scaleX, animation.to.scaleX, easedProgress),
          scaleY: this.lerp(animation.from.scaleY, animation.to.scaleY, easedProgress),
        }

        animation.config.onUpdate(currentState)

        if (progress >= 1) {
          completed.push(id)
          animation.config.onComplete?.()
        }
      }

      for (const id of completed) {
        this.animations.delete(id)
      }

      if (this.animations.size > 0) {
        this.frameId = requestAnimationFrame(frame)
      } else {
        this.frameId = null
        this._isRunning = false
      }
    }

    this.frameId = requestAnimationFrame(frame)
  }

  private lerp(from: number, to: number, t: number): number {
    return from + (to - from) * t
  }
}

export const animationScheduler = new AnimationScheduler()

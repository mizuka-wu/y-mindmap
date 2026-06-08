import { MindMapNode } from '@y-mindmap/state'
import { LayoutEngine, LayoutResult, NodeLayout } from './types'
import { Bounds, Point } from '@y-mindmap/core'

export interface LayoutTransitionConfig {
  duration: number
  easing: string
  stagger: number
}

const DEFAULT_CONFIG: LayoutTransitionConfig = {
  duration: 300,
  easing: 'ease-out',
  stagger: 30,
}

export interface NodeAnimation {
  nodeId: string
  from: Point
  to: Point
  delay: number
  duration: number
}

export class LayoutTransition {
  private config: LayoutTransitionConfig
  private animations: NodeAnimation[] = []
  private animationFrame: number | null = null

  constructor(config?: Partial<LayoutTransitionConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  calculateTransition(
    oldLayout: LayoutResult,
    newLayout: LayoutResult
  ): NodeAnimation[] {
    const animations: NodeAnimation[] = []
    const allNodeIds = new Set([
      ...oldLayout.nodes.keys(),
      ...newLayout.nodes.keys(),
    ])

    let delay = 0

    for (const nodeId of allNodeIds) {
      const oldNode = oldLayout.nodes.get(nodeId)
      const newNode = newLayout.nodes.get(nodeId)

      if (oldNode && newNode) {
        if (oldNode.x !== newNode.x || oldNode.y !== newNode.y) {
          animations.push({
            nodeId,
            from: { x: oldNode.x, y: oldNode.y },
            to: { x: newNode.x, y: newNode.y },
            delay,
            duration: this.config.duration,
          })
          delay += this.config.stagger
        }
      } else if (newNode) {
        animations.push({
          nodeId,
          from: { x: newNode.x, y: newNode.y - 20 },
          to: { x: newNode.x, y: newNode.y },
          delay,
          duration: this.config.duration,
        })
        delay += this.config.stagger
      } else if (oldNode) {
        animations.push({
          nodeId,
          from: { x: oldNode.x, y: oldNode.y },
          to: { x: oldNode.x, y: oldNode.y - 20 },
          delay,
          duration: this.config.duration,
        })
        delay += this.config.stagger
      }
    }

    this.animations = animations
    return animations
  }

  animate(
    onUpdate: (nodeId: string, position: Point) => void,
    onComplete?: () => void
  ): void {
    if (this.animations.length === 0) {
      onComplete?.()
      return
    }

    const startTime = Date.now()
    const maxDelay = Math.max(...this.animations.map(a => a.delay))
    const totalDuration = maxDelay + this.config.duration

    const frame = () => {
      const elapsed = Date.now() - startTime
      let allComplete = true

      for (const animation of this.animations) {
        const animElapsed = elapsed - animation.delay

        if (animElapsed < 0) {
          allComplete = false
          continue
        }

        const progress = Math.min(1, animElapsed / animation.duration)
        const easedProgress = this.ease(progress, this.config.easing)

        const x = animation.from.x + (animation.to.x - animation.from.x) * easedProgress
        const y = animation.from.y + (animation.to.y - animation.from.y) * easedProgress

        onUpdate(animation.nodeId, { x, y })

        if (progress < 1) {
          allComplete = false
        }
      }

      if (!allComplete) {
        this.animationFrame = requestAnimationFrame(frame)
      } else {
        this.animationFrame = null
        onComplete?.()
      }
    }

    this.animationFrame = requestAnimationFrame(frame)
  }

  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
    this.animations = []
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
}

export class AnimatedLayoutEngine {
  private baseEngine: LayoutEngine
  private transition: LayoutTransition
  private lastLayout: LayoutResult | null = null

  constructor(baseEngine: LayoutEngine, config?: Partial<LayoutTransitionConfig>) {
    this.baseEngine = baseEngine
    this.transition = new LayoutTransition(config)
  }

  calculate(root: MindMapNode): LayoutResult {
    return this.baseEngine.calculate(root)
  }

  calculateAnimated(
    root: MindMapNode,
    onUpdate: (nodeId: string, position: Point) => void,
    onComplete?: () => void
  ): LayoutResult {
    const newLayout = this.baseEngine.calculate(root)

    if (this.lastLayout) {
      const animations = this.transition.calculateTransition(this.lastLayout, newLayout)
      
      if (animations.length > 0) {
        this.transition.animate(onUpdate, onComplete)
      }
    }

    this.lastLayout = newLayout
    return newLayout
  }

  stopAnimation(): void {
    this.transition.stop()
  }

  getLastLayout(): LayoutResult | null {
    return this.lastLayout
  }
}

import { createExtension } from '@y-mindmap/extension'
import { InertialScroll as InertialScrollHandler } from '@y-mindmap/interaction'

export interface InertialScrollOptions {
  /**
   * 摩擦系数，控制减速速度 (0-1)
   * @default 0.95
   */
  friction?: number

  /**
   * 触发惯性滚动的速度阈值
   * @default 0.5
   */
  threshold?: number
}

export const InertialScroll = createExtension<InertialScrollOptions>({
  name: 'inertial-scroll',
  type: 'behavior',

  defaultOptions: {
    friction: 0.95,
    threshold: 0.5,
    enabled: true,
  },

  setup(ctx, options) {
    if (!ctx.view) return

    
    const container = ctx.view!.getDom()
    if (!container) return

    const inertialScroll = new InertialScrollHandler(
      (dx, dy) => {
        ctx.view!.panBy(dx, dy)
      },
      {
        friction: options.friction,
        minVelocity: options.threshold,
      }
    )

    const onDown = (e: PointerEvent) => {
      inertialScroll.stop()
      inertialScroll.record(e.clientX, e.clientY)
    }

    const onMove = (e: PointerEvent) => {
      inertialScroll.record(e.clientX, e.clientY)
    }

    const onUp = () => {
      inertialScroll.start()
    }

    container.addEventListener('pointerdown', onDown)
    container.addEventListener('pointermove', onMove)
    container.addEventListener('pointerup', onUp)

    return () => {
      inertialScroll.stop()
      container.removeEventListener('pointerdown', onDown)
      container.removeEventListener('pointermove', onMove)
      container.removeEventListener('pointerup', onUp)
    }
  },
})

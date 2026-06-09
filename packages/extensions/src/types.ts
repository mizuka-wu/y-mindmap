import { EditorState, Transaction } from '@y-mindmap/state'
import { EditorView } from '@y-mindmap/view'

// Extension 上下文 — 提供给扩展的编辑器能力
export interface ExtensionContext {
  state: EditorState
  dispatch: (tr: Transaction) => void
  view: EditorView | null
  executeCommand: (name: string, args?: any) => boolean

  // 事件系统
  on: (event: string, handler: (...args: any[]) => void) => void
  off: (event: string, handler: (...args: any[]) => void) => void
  emit: (event: string, ...args: any[]) => void
}

// Extension 选项类型
export type ExtensionOptions<T extends Record<string, any> = {}> = T & {
  enabled?: boolean
}

// Extension 定义
export interface ExtensionDefinition<T extends Record<string, any> = {}> {
  name: string
  type: 'block' | 'mark' | 'node' | 'behavior' | 'collaboration'

  // 默认选项
  defaultOptions: ExtensionOptions<T>

  // 配置选项，返回新的扩展定义（immutable）
  configure: (options: Partial<ExtensionOptions<T>>) => ExtensionDefinition<T>

  // 生命周期
  setup?: (ctx: ExtensionContext, options: ExtensionOptions<T>) => void | (() => void)
  destroy?: () => void

  // 可扩展点
  commands?: Record<string, (args?: any) => (state: EditorState, dispatch: (tr: Transaction) => void) => boolean>
  shortcuts?: Record<string, string>  // key → command name
  menuItems?: Array<{ id: string; label: string; icon?: string; shortcut?: string; action: () => void }>
}

// 创建 Extension 的工厂函数
export function createExtension<T extends Record<string, any> = {}>(
  definition: Omit<ExtensionDefinition<T>, 'configure'> & { defaultOptions: ExtensionOptions<T> }
): ExtensionDefinition<T> {
  const {
    name,
    type,
    defaultOptions,
    setup: userSetup,
    destroy: userDestroy,
    commands,
    shortcuts,
    menuItems,
  } = definition

  const extension: ExtensionDefinition<T> = {
    name,
    type,
    defaultOptions,
    commands,
    shortcuts,
    menuItems,

    configure(options: Partial<ExtensionOptions<T>>): ExtensionDefinition<T> {
      const mergedOptions = { ...defaultOptions, ...options } as ExtensionOptions<T>
      const isDisabled = mergedOptions.enabled === false

      return {
        name,
        type,
        defaultOptions: mergedOptions,
        commands: isDisabled ? undefined : commands,
        shortcuts: isDisabled ? undefined : shortcuts,
        menuItems: isDisabled ? undefined : menuItems,

        // Disabled extensions have no-op lifecycle
        setup: isDisabled
          ? undefined
          : (ctx: ExtensionContext, opts: ExtensionOptions<T>) => {
              const finalOpts = { ...mergedOptions, ...opts }
              return userSetup?.(ctx, finalOpts) ?? undefined
            },

        destroy: isDisabled ? undefined : userDestroy,

        // Recursively allow re-configure
        configure(nextOptions: Partial<ExtensionOptions<T>>): ExtensionDefinition<T> {
          return extension.configure({ ...options, ...nextOptions })
        },
      }
    },

    // Default setup/destroy delegate to user implementations
    setup: userSetup
      ? (ctx: ExtensionContext, options: ExtensionOptions<T>) => userSetup(ctx, options)
      : undefined,

    destroy: userDestroy,
  }

  return extension
}

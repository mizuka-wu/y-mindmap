import { EditorState, Transaction } from '@y-mindmap/state'
import { z } from 'zod'

export interface CommandDefinition<TInput = any, TOutput = any> {
  name: string
  description: string
  category?: string
  inputSchema?: z.ZodType<TInput>
  outputSchema?: z.ZodType<TOutput>
  execute: (state: EditorState, input: TInput, dispatch?: (tr: Transaction) => void) => TOutput
}

export type Command<TInput = any, TOutput = any> = 
  | ((state: EditorState, dispatch?: (tr: Transaction) => void) => boolean)
  | CommandDefinition<TInput, TOutput>

export function defineCommand<TInput = any, TOutput = any>(
  definition: CommandDefinition<TInput, TOutput>
): CommandDefinition<TInput, TOutput> {
  return definition
}

export function isCommandDefinition(command: Command): command is CommandDefinition {
  return typeof command === 'object' && 'execute' in command && 'name' in command
}

export function validateCommandInput<T>(command: CommandDefinition<T>, input: unknown): T {
  if (!command.inputSchema) {
    return input as T
  }
  return command.inputSchema.parse(input)
}

export function validateCommandOutput<T>(command: CommandDefinition<any, T>, output: unknown): T {
  if (!command.outputSchema) {
    return output as T
  }
  return command.outputSchema.parse(output)
}

export function chainCommands(...commands: Command[]): Command {
  return {
    name: 'chain',
    description: 'Chain multiple commands',
    execute: (state, _input, dispatch) => {
      for (const cmd of commands) {
        if (isCommandDefinition(cmd)) {
          const result = cmd.execute(state, undefined, dispatch)
          if (result) return true
        } else {
          if (cmd(state, dispatch)) return true
        }
      }
      return false
    },
  }
}

export const CommonSchemas = {
  nodeId: z.string().min(1),
  nodeIds: z.array(z.string().min(1)),
  title: z.string(),
  parentId: z.string().min(1),
  index: z.number().int().min(0).optional(),
  style: z.record(z.any()),
  position: z.object({ x: z.number(), y: z.number() }),
  bounds: z.object({
    x: z.number(),
    y: z.number(),
    width: z.number().positive(),
    height: z.number().positive(),
  }),
}

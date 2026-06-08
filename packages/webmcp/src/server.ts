import { z } from 'zod'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { CommandDefinition, isCommandDefinition } from '@y-mindmap/commands'
import { EditorState, Transaction } from '@y-mindmap/state'

export interface MCPTool {
  name: string
  description: string
  inputSchema: Record<string, any>
  outputSchema?: Record<string, any>
}

export interface MCPToolCall {
  name: string
  arguments: Record<string, any>
}

export interface MCPToolResult {
  content: MCPContent[]
  isError?: boolean
}

export type MCPContent = 
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }
  | { type: 'resource'; uri: string; text?: string }

export interface MCPServerInfo {
  name: string
  version: string
  description?: string
}

export interface MCPCapabilities {
  tools?: { listChanged?: boolean }
  resources?: { subscribe?: boolean }
  prompts?: { listChanged?: boolean }
}

export interface MCPInitializeRequest {
  protocolVersion: string
  capabilities: MCPCapabilities
  clientInfo: { name: string; version: string }
}

export interface MCPInitializeResult {
  protocolVersion: string
  capabilities: MCPCapabilities
  serverInfo: MCPServerInfo
}

export interface MCPListToolsResult {
  tools: MCPTool[]
}

export interface MCPCallToolRequest {
  name: string
  arguments?: Record<string, any>
}

export class WebMCPServer {
  private tools: Map<string, MCPTool & { execute: Function }> = new Map()
  private serverInfo: MCPServerInfo
  private state: EditorState | null = null
  private dispatch: ((tr: Transaction) => void) | null = null

  constructor(serverInfo: MCPServerInfo) {
    this.serverInfo = serverInfo
  }

  setEditorContext(state: EditorState, dispatch: (tr: Transaction) => void): void {
    this.state = state
    this.dispatch = dispatch
  }

  registerCommand<TInput = any, TOutput = any>(command: CommandDefinition<TInput, TOutput>): void {
    const tool: MCPTool & { execute: Function } = {
      name: command.name,
      description: command.description,
      inputSchema: command.inputSchema 
        ? zodToJsonSchema(command.inputSchema) 
        : { type: 'object', properties: {} },
      outputSchema: command.outputSchema 
        ? zodToJsonSchema(command.outputSchema) 
        : undefined,
      execute: command.execute,
    }

    this.tools.set(command.name, tool)
  }

  unregisterCommand(name: string): void {
    this.tools.delete(name)
  }

  registerTool(tool: MCPTool & { execute: (args: any) => any }): void {
    this.tools.set(tool.name, tool)
  }

  getTools(): MCPTool[] {
    return Array.from(this.tools.values()).map(({ execute, ...tool }) => tool)
  }

  getTool(name: string): MCPTool | undefined {
    const tool = this.tools.get(name)
    if (!tool) return undefined
    const { execute, ...rest } = tool
    return rest
  }

  async handleRequest(request: any): Promise<any> {
    const { method, params, id } = request

    switch (method) {
      case 'initialize':
        return this.handleInitialize(params, id)
      case 'tools/list':
        return this.handleListTools(id)
      case 'tools/call':
        return this.handleCallTool(params, id)
      default:
        return this.createErrorResponse(id, -32601, `Method not found: ${method}`)
    }
  }

  private handleInitialize(params: MCPInitializeRequest, id: any): any {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: false },
        },
        serverInfo: this.serverInfo,
      } as MCPInitializeResult,
    }
  }

  private handleListTools(id: any): any {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: this.getTools(),
      } as MCPListToolsResult,
    }
  }

  private async handleCallTool(params: MCPCallToolRequest, id: any): Promise<any> {
    const { name, arguments: args } = params
    const tool = this.tools.get(name)

    if (!tool) {
      return this.createToolResult(id, [
        { type: 'text', text: `Tool not found: ${name}` },
      ], true)
    }

    try {
      if (!this.state || !this.dispatch) {
        throw new Error('Editor context not set')
      }

      const result = await tool.execute(this.state, args, this.dispatch)

      const content: MCPContent[] = []

      if (result === undefined || result === null) {
        content.push({ type: 'text', text: 'Command executed successfully' })
      } else if (typeof result === 'string') {
        content.push({ type: 'text', text: result })
      } else if (typeof result === 'object') {
        content.push({ type: 'text', text: JSON.stringify(result, null, 2) })
      } else {
        content.push({ type: 'text', text: String(result) })
      }

      return this.createToolResult(id, content)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      return this.createToolResult(id, [
        { type: 'text', text: `Error: ${errorMessage}` },
      ], true)
    }
  }

  private createToolResult(id: any, content: MCPContent[], isError = false): any {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        content,
        isError,
      } as MCPToolResult,
    }
  }

  private createErrorResponse(id: any, code: number, message: string): any {
    return {
      jsonrpc: '2.0',
      id,
      error: { code, message },
    }
  }

  toJSON(): Record<string, any> {
    return {
      serverInfo: this.serverInfo,
      tools: this.getTools(),
    }
  }
}

export function createMCPServer(name: string, version: string, description?: string): WebMCPServer {
  return new WebMCPServer({ name, version, description })
}

export function commandToMCPTool(command: CommandDefinition): MCPTool {
  return {
    name: command.name,
    description: command.description,
    inputSchema: command.inputSchema 
      ? zodToJsonSchema(command.inputSchema) 
      : { type: 'object', properties: {} },
    outputSchema: command.outputSchema 
      ? zodToJsonSchema(command.outputSchema) 
      : undefined,
  }
}

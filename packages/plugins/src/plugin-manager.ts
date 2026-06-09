import {
  Plugin,
  PluginAPI,
  PluginMetadata,
  PluginEvent,
  PluginEventHandler,
  MenuItem,
  ToolbarButton,
  PanelOptions,
  DialogOptions,
  NotificationOptions,
} from "./types";
import {
  EditorState,
  Transaction,
  RootTopic,
  MindMapNode,
} from "@y-mindmap/state";

export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private activePlugins: Set<string> = new Set();
  private eventHandlers: Map<PluginEvent, Set<PluginEventHandler>> = new Map();
  private commands: Map<
    string,
    (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean
  > = new Map();
  private menuItems: Map<string, MenuItem> = new Map();
  private toolbarButtons: Map<string, ToolbarButton> = new Map();
  private panels: Map<string, PanelOptions> = new Map();
  private config: Map<string, any> = new Map();

  private editorState: EditorState | null = null;
  private dispatchFn: ((tr: Transaction) => void) | null = null;
  private notificationHandler: ((options: NotificationOptions) => void) | null =
    null;
  private dialogHandler: ((options: DialogOptions) => Promise<void>) | null =
    null;

  constructor() {}

  setEditorContext(
    state: EditorState,
    dispatch: (tr: Transaction) => void,
    notificationHandler?: (options: NotificationOptions) => void,
    dialogHandler?: (options: DialogOptions) => Promise<void>,
  ): void {
    this.editorState = state;
    this.dispatchFn = dispatch;
    this.notificationHandler = notificationHandler || null;
    this.dialogHandler = dialogHandler || null;
  }

  updateState(state: EditorState): void {
    this.editorState = state;
  }

  register(plugin: Plugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(`Plugin ${plugin.id} is already registered`);
    }

    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(
            `Plugin ${plugin.id} depends on ${dep} which is not registered`,
          );
        }
      }
    }

    this.plugins.set(plugin.id, plugin);

    if (plugin.init) {
      const api = this.createAPI(plugin.id);
      plugin.init(api);
    }

    this.emit("plugin:register", plugin);
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    if (this.activePlugins.has(pluginId)) {
      this.deactivate(pluginId);
    }

    this.plugins.delete(pluginId);
  }

  activate(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) throw new Error(`Plugin ${pluginId} not found`);

    if (this.activePlugins.has(pluginId)) return;

    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.activePlugins.has(dep)) {
          this.activate(dep);
        }
      }
    }

    if (plugin.activate) {
      plugin.activate();
    }

    this.activePlugins.add(pluginId);
    this.emit("plugin:activate", pluginId);
  }

  deactivate(pluginId: string): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return;

    if (!this.activePlugins.has(pluginId)) return;

    for (const [id, p] of this.plugins) {
      if (p.dependencies?.includes(pluginId) && this.activePlugins.has(id)) {
        this.deactivate(id);
      }
    }

    if (plugin.deactivate) {
      plugin.deactivate();
    }

    this.activePlugins.delete(pluginId);
    this.emit("plugin:deactivate", pluginId);
  }

  getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId);
  }

  getActivePlugins(): PluginMetadata[] {
    const result: PluginMetadata[] = [];
    for (const [id, plugin] of this.plugins) {
      result.push({
        id: plugin.id,
        name: plugin.name,
        version: plugin.version,
        description: plugin.description,
        author: plugin.author,
        active: this.activePlugins.has(id),
      });
    }
    return result;
  }

  isActive(pluginId: string): boolean {
    return this.activePlugins.has(pluginId);
  }

  emit(event: PluginEvent, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in plugin event handler for ${event}:`, error);
        }
      }
    }
  }

  getCommand(
    name: string,
  ):
    | ((state: EditorState, dispatch?: (tr: Transaction) => void) => boolean)
    | undefined {
    return this.commands.get(name);
  }

  getAllCommands(): Map<
    string,
    (state: EditorState, dispatch?: (tr: Transaction) => void) => boolean
  > {
    return new Map(this.commands);
  }

  getMenuItems(): MenuItem[] {
    return Array.from(this.menuItems.values());
  }

  getToolbarButtons(): ToolbarButton[] {
    return Array.from(this.toolbarButtons.values());
  }

  getPanels(): PanelOptions[] {
    return Array.from(this.panels.values());
  }

  private createAPI(pluginId: string): PluginAPI {
    return {
      registerCommand: (name, command) => {
        this.commands.set(name, command);
      },
      unregisterCommand: (name) => {
        this.commands.delete(name);
      },

      registerMenuItem: (item) => {
        this.menuItems.set(item.id, item);
      },
      unregisterMenuItem: (id) => {
        this.menuItems.delete(id);
      },

      registerToolbarButton: (button) => {
        this.toolbarButtons.set(button.id, button);
      },
      unregisterToolbarButton: (id) => {
        this.toolbarButtons.delete(id);
      },

      registerPanel: (options) => {
        this.panels.set(options.id, options);
      },
      unregisterPanel: (id) => {
        this.panels.delete(id);
      },

      on: (event, handler) => {
        if (!this.eventHandlers.has(event)) {
          this.eventHandlers.set(event, new Set());
        }
        this.eventHandlers.get(event)!.add(handler);
      },
      off: (event, handler) => {
        this.eventHandlers.get(event)?.delete(handler);
      },
      emit: (event, ...args) => {
        this.emit(event, ...args);
      },

      getState: () => {
        if (!this.editorState) throw new Error("Editor state not available");
        return this.editorState;
      },
      dispatch: (tr) => {
        if (!this.dispatchFn) throw new Error("Dispatch not available");
        this.dispatchFn(tr);
      },
      getDocument: () => {
        if (!this.editorState) throw new Error("Editor state not available");
        return this.editorState.doc;
      },
      getSelection: () => {
        if (!this.editorState) throw new Error("Editor state not available");
        return this.editorState.selection.all;
      },
      getSelectedNodes: () => {
        if (!this.editorState) throw new Error("Editor state not available");
        const ids = this.editorState.selection.all;
        return ids
          .map((id) => this.editorState!.doc.getNodeById(id))
          .filter((n): n is MindMapNode => n !== null);
      },

      showNotification: (options) => {
        this.notificationHandler?.(options);
      },
      showDialog: async (options) => {
        if (this.dialogHandler) {
          await this.dialogHandler(options);
        }
      },

      getConfig: (key) => {
        return this.config.get(key);
      },
      setConfig: (key, value) => {
        this.config.set(key, value);
      },
    };
  }

  destroy(): void {
    for (const pluginId of this.activePlugins) {
      this.deactivate(pluginId);
    }

    for (const [, plugin] of this.plugins) {
      if (plugin.destroy) {
        plugin.destroy();
      }
    }

    this.plugins.clear();
    this.activePlugins.clear();
    this.eventHandlers.clear();
    this.commands.clear();
    this.menuItems.clear();
    this.toolbarButtons.clear();
    this.panels.clear();
    this.config.clear();
  }
}

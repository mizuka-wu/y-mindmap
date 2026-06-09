import { TopicData, StructureType, Point } from "@y-mindmap/core";
import {
  EditorState,
  Transaction,
  RootTopic,
  MindMapNode,
} from "@y-mindmap/state";

export type PluginEvent =
  | "document:load"
  | "document:save"
  | "document:change"
  | "node:select"
  | "node:deselect"
  | "node:create"
  | "node:delete"
  | "node:update"
  | "node:move"
  | "node:fold"
  | "node:unfold"
  | "layout:change"
  | "theme:change"
  | "command:before"
  | "command:after"
  | "view:zoom"
  | "view:pan"
  | "collab:join"
  | "collab:leave"
  | "collab:conflict"
  | "collab:state-change"
  | "plugin:register"
  | "plugin:activate"
  | "plugin:deactivate";

export type PluginEventHandler = (...args: any[]) => void;

export interface MenuItem {
  id: string;
  label: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
  submenu?: MenuItem[];
  position?: "before" | "after";
  referenceId?: string;
}

export interface ToolbarButton {
  id: string;
  label: string;
  icon: string;
  tooltip?: string;
  action: () => void;
  position?: "before" | "after";
  referenceId?: string;
  group?: string;
}

export interface PanelOptions {
  id: string;
  title: string;
  position: "left" | "right" | "bottom";
  width?: number;
  height?: number;
  component: () => HTMLElement;
}

export interface DialogOptions {
  title: string;
  content: string | HTMLElement;
  buttons?: { label: string; action: () => void }[];
  onClose?: () => void;
}

export interface NotificationOptions {
  message: string;
  type?: "info" | "success" | "warning" | "error";
  duration?: number;
}

export interface PluginAPI {
  registerCommand(
    name: string,
    command: (
      state: EditorState,
      dispatch?: (tr: Transaction) => void,
    ) => boolean,
  ): void;
  unregisterCommand(name: string): void;

  registerMenuItem(item: MenuItem): void;
  unregisterMenuItem(id: string): void;

  registerToolbarButton(button: ToolbarButton): void;
  unregisterToolbarButton(id: string): void;

  registerPanel(options: PanelOptions): void;
  unregisterPanel(id: string): void;

  on(event: PluginEvent, handler: PluginEventHandler): void;
  off(event: PluginEvent, handler: PluginEventHandler): void;
  emit(event: PluginEvent, ...args: any[]): void;

  getState(): EditorState;
  dispatch(tr: Transaction): void;
  getDocument(): RootTopic;
  getSelection(): string[];
  getSelectedNodes(): MindMapNode[];

  showNotification(options: NotificationOptions): void;
  showDialog(options: DialogOptions): Promise<void>;

  getConfig<T = any>(key: string): T | undefined;
  setConfig(key: string, value: any): void;
}

export interface Plugin {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;

  dependencies?: string[];

  init?: (api: PluginAPI) => void;
  activate?: () => void;
  deactivate?: () => void;
  destroy?: () => void;
}

export interface PluginMetadata {
  id: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  active: boolean;
}

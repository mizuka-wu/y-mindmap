import { z } from "zod";
import {
  EditorState,
  Transaction,
  Selection,
  MindMapNode,
} from "@y-mindmap/state";
import { defineCommand, CommonSchemas } from "./command";

export type Command = (
  state: EditorState,
  dispatch?: (tr: Transaction) => void,
) => boolean;

export function chainCommands(...commands: Command[]): Command {
  return (state, dispatch) => {
    for (const cmd of commands) {
      if (cmd(state, dispatch)) return true;
    }
    return false;
  };
}

export function addSubTopic(parentId?: string): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const targetId = parentId || state.selection.first;
    if (!targetId) return false;

    const node = state.doc.getNodeById(targetId);
    if (!node) return false;

    const newNode = MindMapNode.createEmpty();
    const tr = state.tr;
    tr.addNode(targetId, newNode);
    tr.setSelection(Selection.single(newNode.id));
    if (dispatch) dispatch(tr);
    return true;
  };
}

export function addSiblingTopic(nodeId?: string): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const targetId = nodeId || state.selection.first;
    if (!targetId) return false;

    const node = state.doc.getNodeById(targetId);
    if (!node || node.isRoot) return false;

    const parent = state.doc.findParent(targetId);
    if (!parent) return false;

    const siblings = parent.attachedChildren;
    const index = siblings.findIndex((c) => c.id === targetId);

    const newNode = MindMapNode.createEmpty();
    const tr = state.tr;
    tr.addNode(parent.id, newNode, "attached", index + 1);
    tr.setSelection(Selection.single(newNode.id));
    if (dispatch) dispatch(tr);
    return true;
  };
}

export function deleteNode(nodeId?: string): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const ids = nodeId ? [nodeId] : state.selection.all;
    if (ids.length === 0) return false;

    const tr = state.tr;
    let lastValidId: string | null = null;

    for (const id of ids) {
      const node = state.doc.getNodeById(id);
      if (node && !node.isRoot) {
        tr.removeNode(id);
        lastValidId = id;
      }
    }

    if (lastValidId) {
      const parent = state.doc.findParent(lastValidId);
      if (parent) {
        tr.setSelection(Selection.single(parent.id));
      } else {
        tr.setSelection(Selection.empty());
      }
    }

    if (dispatch) dispatch(tr);
    return true;
  };
}

export function moveNodeUp(nodeId?: string): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const targetId = nodeId || state.selection.first;
    if (!targetId) return false;

    const node = state.doc.getNodeById(targetId);
    if (!node || node.isRoot) return false;

    const parent = state.doc.findParent(targetId);
    if (!parent) return false;

    const siblings = parent.attachedChildren;
    const index = siblings.findIndex((c) => c.id === targetId);
    if (index <= 0) return false;

    const tr = state.tr;
    tr.removeNode(targetId);
    tr.addNode(parent.id, node, "attached", index - 1);
    tr.setSelection(Selection.single(targetId));
    if (dispatch) dispatch(tr);
    return true;
  };
}

export function moveNodeDown(nodeId?: string): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const targetId = nodeId || state.selection.first;
    if (!targetId) return false;

    const node = state.doc.getNodeById(targetId);
    if (!node || node.isRoot) return false;

    const parent = state.doc.findParent(targetId);
    if (!parent) return false;

    const siblings = parent.attachedChildren;
    const index = siblings.findIndex((c) => c.id === targetId);
    if (index >= siblings.length - 1) return false;

    const tr = state.tr;
    tr.removeNode(targetId);
    tr.addNode(parent.id, node, "attached", index + 1);
    tr.setSelection(Selection.single(targetId));
    if (dispatch) dispatch(tr);
    return true;
  };
}

export const updateTitle = defineCommand({
  name: "updateTitle",
  description: "Update topic title",
  inputSchema: z.object({
    nodeId: CommonSchemas.nodeId,
    title: CommonSchemas.title,
  }),
  execute: (
    state: EditorState,
    input: { nodeId: string; title: string },
    dispatch?: (tr: Transaction) => void,
  ) => {
    const node = state.doc.getNodeById(input.nodeId);
    if (!node) return false;

    const tr = state.tr;
    tr.updateTitle(input.nodeId, input.title);
    if (dispatch) dispatch(tr);
    return true;
  },
});

export function toggleFold(nodeId?: string): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const targetId = nodeId || state.selection.first;
    if (!targetId) return false;

    const node = state.doc.getNodeById(targetId);
    if (!node || !node.hasChildren) return false;

    const tr = state.tr;
    tr.toggleFold(targetId);
    if (dispatch) dispatch(tr);
    return true;
  };
}

export const selectNode = defineCommand({
  name: "selectNode",
  description: "Select a single node",
  inputSchema: z.object({ nodeId: CommonSchemas.nodeId }),
  execute: (
    state: EditorState,
    input: { nodeId: string },
    dispatch?: (tr: Transaction) => void,
  ) => {
    const tr = state.tr;
    tr.setSelection(Selection.single(input.nodeId));
    if (dispatch) dispatch(tr);
    return true;
  },
});

export function selectAll(): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const allIds: string[] = [];
    state.doc.root.descendants((node) => allIds.push(node.id));

    const tr = state.tr;
    tr.setSelection(Selection.multiple(allIds));
    if (dispatch) dispatch(tr);
    return true;
  };
}

export function deselectAll(): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const tr = state.tr;
    tr.setSelection(Selection.empty());
    if (dispatch) dispatch(tr);
    return true;
  };
}

export function undo(): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    if (!state.canUndo()) return false;

    const newState = state.undo();
    if (dispatch) {
      const tr = newState.tr;
      tr.setMeta("source", "undo");
      dispatch(tr);
    }
    return true;
  };
}

export function redo(): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    if (!state.canRedo()) return false;

    const newState = state.redo();
    if (dispatch) {
      const tr = newState.tr;
      tr.setMeta("source", "redo");
      dispatch(tr);
    }
    return true;
  };
}

export function navigateUp(): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const selectedId = state.selection.first;
    if (!selectedId) return false;

    const node = state.doc.getNodeById(selectedId);
    if (!node) return false;

    const parent = state.doc.findParent(node.id);
    if (!parent) return false;

    const siblings = parent.attachedChildren;
    const index = siblings.findIndex((c) => c.id === node.id);
    if (index > 0 && siblings[index - 1]) {
      const tr = state.tr;
      tr.setSelection(Selection.single(siblings[index - 1]!.id));
      if (dispatch) dispatch(tr);
      return true;
    }
    return false;
  };
}

export function navigateDown(): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const selectedId = state.selection.first;
    if (!selectedId) return false;

    const node = state.doc.getNodeById(selectedId);
    if (!node) return false;

    const parent = state.doc.findParent(node.id);
    if (!parent) return false;

    const siblings = parent.attachedChildren;
    const index = siblings.findIndex((c) => c.id === node.id);
    if (index < siblings.length - 1 && siblings[index + 1]) {
      const tr = state.tr;
      tr.setSelection(Selection.single(siblings[index + 1]!.id));
      if (dispatch) dispatch(tr);
      return true;
    }
    return false;
  };
}

export function navigateLeft(): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const selectedId = state.selection.first;
    if (!selectedId) return false;

    const parent = state.doc.findParent(selectedId);
    if (parent && !parent.isRoot) {
      const tr = state.tr;
      tr.setSelection(Selection.single(parent.id));
      if (dispatch) dispatch(tr);
      return true;
    }
    return false;
  };
}

export function navigateRight(): Command {
  return (state: EditorState, dispatch?: (tr: Transaction) => void) => {
    const selectedId = state.selection.first;
    if (!selectedId) return false;

    const node = state.doc.getNodeById(selectedId);
    if (!node) return false;

    const children = node.attachedChildren;
    if (children.length > 0 && children[0]) {
      const tr = state.tr;
      tr.setSelection(Selection.single(children[0]!.id));
      if (dispatch) dispatch(tr);
      return true;
    }
    return false;
  };
}

export const setStructureClass = defineCommand({
  name: "setStructureClass",
  description: "Set structure class for a node",
  execute: (
    state: EditorState,
    input: { nodeId: string; structureClass: any },
    dispatch?: (tr: Transaction) => void,
  ) => {
    const node = state.doc.getNodeById(input.nodeId);
    if (!node) return false;

    const tr = state.tr;
    tr.setStructureClass(input.nodeId, input.structureClass);
    if (dispatch) dispatch(tr);
    return true;
  },
});

export const updateStyle = defineCommand({
  name: "updateStyle",
  description: "Update node style",
  execute: (
    state: EditorState,
    input: { nodeId: string; style: any },
    dispatch?: (tr: Transaction) => void,
  ) => {
    const node = state.doc.getNodeById(input.nodeId);
    if (!node) return false;

    const tr = state.tr;
    tr.updateStyle(input.nodeId, input.style);
    if (dispatch) dispatch(tr);
    return true;
  },
});

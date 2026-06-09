import * as Y from "yjs";
import { createExtension } from "@y-mindmap/extension";
import { syncTopicToY, syncYToTopic, topicDataToYMap } from "@y-mindmap/collab";
import { RootTopic } from "@y-mindmap/state";

export interface CollabOptions {
  ydoc: Y.Doc;
  field?: string;
  fragment?: Y.Map<any>;
}

export const Collab = createExtension<CollabOptions>({
  name: "collab",
  type: "collaboration",

  defaultOptions: {
    ydoc: undefined as unknown as Y.Doc,
    field: "mindmap",
    enabled: true,
  },

  setup(ctx, options) {
    const { ydoc } = options;
    if (!ydoc) {
      console.warn("Collab extension requires ydoc option");
      return;
    }
    const ynodes = ydoc.getMap<Y.Map<any>>("nodes");

    const topic = ctx.state.doc.root.toData();
    syncTopicToY(ydoc, topic);

    const handleRemoteUpdate = (_update: Uint8Array, origin: any) => {
      if (origin === "editor-dispatch") return;

      const remoteTopic = syncYToTopic(ydoc);
      if (remoteTopic) {
        const doc = RootTopic.fromJSON(remoteTopic);
        ctx.emit("document:load", doc);
      }
    };
    ydoc.on("update", handleRemoteUpdate);

    const handleTransaction = (tr: any) => {
      ydoc.transact(() => {
        for (const step of tr.steps) {
          switch (step.type) {
            case "addNode": {
              const node = tr.doc.getNodeById(step.node.id);
              if (node) {
                ynodes.set(node.id, topicDataToYMap(node.toData()));
              }
              break;
            }
            case "removeNode": {
              ynodes.delete(step.id);
              break;
            }
            case "updateNode": {
              const node = tr.doc.getNodeById(step.id);
              if (node) {
                ynodes.set(node.id, topicDataToYMap(node.toData()));
              }
              break;
            }
            case "moveNode": {
              const movedNode = tr.doc.getNodeById(step.nodeId);
              if (movedNode) {
                ynodes.set(step.nodeId, topicDataToYMap(movedNode.toData()));
              }
              const oldParent = tr.beforeDoc.findParent(step.nodeId);
              if (oldParent) {
                ynodes.set(oldParent.id, topicDataToYMap(oldParent.toData()));
              }
              const newParent = tr.doc.findParent(step.nodeId);
              if (newParent && newParent.id !== oldParent?.id) {
                ynodes.set(newParent.id, topicDataToYMap(newParent.toData()));
              }
              break;
            }
          }
        }
      }, "editor-dispatch");
    };
    ctx.on("transaction", handleTransaction);

    return () => {
      ydoc.off("update", handleRemoteUpdate);
      ctx.off("transaction", handleTransaction);
    };
  },
});

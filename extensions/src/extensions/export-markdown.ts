import { createExtension } from "@y-mindmap/extension";
import {
  MarkdownImporter,
  MarkdownExporter,
} from "@y-mindmap/formats/markdown";
import { RootTopic } from "@y-mindmap/state";

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ExportMarkdownOptions {
  // 当前无需配置选项，预留扩展点
}

export const ExportMarkdown = createExtension<ExportMarkdownOptions>({
  name: "export-markdown",
  type: "behavior",

  defaultOptions: {
    enabled: true,
  },

  setup(ctx) {
    const importer = new MarkdownImporter();
    const exporter = new MarkdownExporter();

    ctx.registerCommand("importMarkdown", (state, dispatch, args) => {
      const { text } = args as { text: string };

      importer
        .import(text)
        .then((node) => {
          const tr = state.tr;
          tr.setDoc(RootTopic.fromJSON(node.toJSON()));
          dispatch(tr);
        })
        .catch((error) => {
          console.error("Failed to import Markdown:", error);
        });

      return true;
    });

    ctx.registerCommand("exportMarkdown", (state, dispatch, args) => {
      const doc = state.doc.root;

      exporter
        .export(doc)
        .then((text) => {
          const blob = new Blob([text], { type: "text/markdown" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "mindmap.md";
          a.click();
          URL.revokeObjectURL(url);
        })
        .catch((error) => {
          console.error("Failed to export Markdown:", error);
        });

      return true;
    });

    return () => {
      ctx.unregisterCommand("importMarkdown");
      ctx.unregisterCommand("exportMarkdown");
    };
  },
});

# Y-Mindmap

A modular, high-performance mindmap editor engine for the web.

Inspired by [ProseMirror](https://prosemirror.net/) and [Tiptap](https://tiptap.dev/), Y-Mindmap uses a **Transaction-driven immutable state** architecture with a clean **state/view separation**, rendering on [Leafer.js](https://www.leaferjs.com/) canvas.

## Features

- **Transaction-driven architecture** — immutable state, all changes via Transaction, built-in undo/redo
- **Tiptap-style Extension system** — modular extensions with own options, StarterKit packaging, `configure(false)` to disable
- **Multiple layout engines** — Map (radial), Tree, Fishbone, Timeline with incremental layout and animated transitions
- **Rich interaction** — drag & drop, multi-select, box select, zoom, pan, inertial scroll, gesture recognition
- **Inline text editing** — plain text and rich text (ProseMirror-based) inline editors
- **Collaborative editing** — Yjs-based real-time collaboration with awareness, cursor sync, and conflict detection
- **Multiple import/export formats** — XMind, Markdown, JSON, PNG, SVG, PDF
- **AI integration** — suggestion engine, context provider, query builder
- **Plugin system** — dynamic plugin loading and management
- **Theme system** — 8 built-in presets, 4-layer style inheritance (User > Theme > Parent > Default)
- **Web MCP** — Model Context Protocol interface for AI agent integration

## Architecture

```
User Action → Transaction → State.apply() → View.update()
```

| Layer | Package | Description |
|-------|---------|-------------|
| **State** | `@y-mindmap/state` | Immutable document model, Transaction, Selection |
| **View** | `@y-mindmap/view` | Canvas rendering via Leafer.js |
| **Layout** | `@y-mindmap/layout` | Layout engines, animation, caching |
| **Core** | `@y-mindmap/core` | Types, style system, coordinate utils |
| **Editor** | `@y-mindmap/editor` | High-level `MindMapEditor` orchestrator |
| **Extension** | `@y-mindmap/extension` | Extension definition & manager |
| **Commands** | `@y-mindmap/commands` | Built-in commands & command registry |
| **Interaction** | `@y-mindmap/interaction` | Input handlers, inline editors, gestures |
| **Formats** | `@y-mindmap/formats/*` | XMind / Markdown / JSON / PNG / SVG / PDF |
| **Collab** | `@y-mindmap/collab` | Yjs binding, collaborator management |
| **UI** | `@y-mindmap/ui` | Toolbar, context menu, minimap |
| **AI** | `@y-mindmap/ai` | Suggestions, context, i18n |
| **Plugins** | `@y-mindmap/plugins` | Dynamic plugin system |
| **Templates** | `@y-mindmap/templates` | Built-in mindmap templates |

## Quick Start

```ts
import { createMindMap } from '@y-mindmap/vanilla'

const editor = createMindMap(document.getElementById('app')!, {
  // options
})

// Add a root topic
editor.dispatch(
  editor.state.tr.addSubTopic(editor.state.root, 'Hello World')
)
```

### Starter Kits

| Kit | Package | Description |
|-----|---------|-------------|
| **Vanilla** | `@y-mindmap/vanilla` | Full-featured starter with all default extensions |
| **Pure** | `@y-mindmap/pure` | Minimal starter, bring your own extensions |

## Development

### Prerequisites

- Node.js >= 18
- pnpm 9

### Setup

```bash
git clone https://github.com/mizuka-wu/y-mindmap.git
cd y-mindmap
pnpm install
```

### Commands

```bash
pnpm dev            # Start all dev servers
pnpm build          # Build all packages
pnpm lint           # Lint
pnpm check-types    # Type check
pnpm test           # Unit tests
pnpm test:e2e       # E2E tests (Playwright)
```

### Project Structure

```
y-mindmap/
├── packages/          # Core packages
│   ├── core/          # Types, styles, coordinates
│   ├── state/         # Immutable state, transactions
│   ├── view/          # Leafer.js canvas rendering
│   ├── layout/        # Layout engines & animation
│   ├── editor/        # High-level editor orchestrator
│   ├── extension/     # Extension system
│   ├── commands/      # Command definitions & registry
│   ├── interaction/   # Input, gestures, inline editors
│   ├── collab/        # Yjs collaborative editing
│   ├── formats/       # Import/export (XMind, MD, JSON, PNG, SVG, PDF)
│   ├── ui/            # Toolbar, context menu, minimap
│   ├── ai/            # AI suggestions & context
│   ├── plugins/       # Plugin system
│   ├── templates/     # Built-in templates
│   ├── richtext-editor/ # ProseMirror-based rich text
│   └── webmcp/        # MCP interface for AI agents
├── extensions/        # First-party extensions
├── startkits/         # Starter kits (vanilla, pure)
├── apps/
│   ├── demo/          # Single-file demo
│   ├── demos/         # Multi-demo showcase
│   └── docs/          # Documentation site (VitePress)
├── configs/           # Shared ESLint & TypeScript configs
├── design/            # Architecture & design documents
└── e2e/               # Playwright E2E tests
```

## License

MIT

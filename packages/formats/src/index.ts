import { MindMapNode } from '@y-mindmap/state'

export interface FormatImporter<T = string | ArrayBuffer> {
  readonly name: string
  readonly extensions: string[]
  readonly mimeTypes: string[]
  
  import(data: T): Promise<MindMapNode>
  canHandle(file: File): boolean
}

export interface FormatExporter {
  readonly name: string
  readonly extensions: string[]
  readonly mimeType: string
  
  export(...args: any[]): Promise<any>
}

export interface ExportOptions {
  filename?: string
  [key: string]: any
}

export interface FormatInfo {
  name: string
  extensions: string[]
  canImport: boolean
  canExport: boolean
}

export class FormatRegistry {
  private importers: Map<string, FormatImporter> = new Map()
  private exporters: Map<string, FormatExporter> = new Map()

  registerImporter(importer: FormatImporter): void {
    this.importers.set(importer.name, importer)
  }

  registerExporter(exporter: FormatExporter): void {
    this.exporters.set(exporter.name, exporter)
  }

  getImporter(name: string): FormatImporter | undefined {
    return this.importers.get(name)
  }

  getExporter(name: string): FormatExporter | undefined {
    return this.exporters.get(name)
  }

  getImporterForFile(file: File): FormatImporter | undefined {
    for (const importer of this.importers.values()) {
      if (importer.canHandle(file)) {
        return importer
      }
    }
    return undefined
  }

  getSupportedFormats(): FormatInfo[] {
    const formats: FormatInfo[] = []
    const allNames = new Set([
      ...this.importers.keys(),
      ...this.exporters.keys(),
    ])

    for (const name of allNames) {
      const importer = this.importers.get(name)
      const exporter = this.exporters.get(name)
      
      formats.push({
        name,
        extensions: importer?.extensions || exporter?.extensions || [],
        canImport: !!importer,
        canExport: !!exporter,
      })
    }

    return formats
  }
}

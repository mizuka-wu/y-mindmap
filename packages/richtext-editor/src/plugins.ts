import { RichTextEditor, RichTextEditorPlugin, ToolbarItem, Shortcut } from './editor'

export function createBasicFormatPlugin(): RichTextEditorPlugin {
  return {
    name: 'basic-format',
    toolbar: [
      {
        id: 'bold',
        icon: 'B',
        label: '加粗',
        action: (editor: RichTextEditor) => editor.toggleBold(),
        isActive: (editor: RichTextEditor) => editor.getFormatState().bold,
      },
      {
        id: 'italic',
        icon: 'I',
        label: '斜体',
        action: (editor: RichTextEditor) => editor.toggleItalic(),
        isActive: (editor: RichTextEditor) => editor.getFormatState().italic,
      },
      {
        id: 'underline',
        icon: 'U',
        label: '下划线',
        action: (editor: RichTextEditor) => editor.toggleUnderline(),
        isActive: (editor: RichTextEditor) => editor.getFormatState().underline,
      },
      {
        id: 'strikethrough',
        icon: 'S',
        label: '删除线',
        action: (editor: RichTextEditor) => editor.toggleStrikethrough(),
        isActive: (editor: RichTextEditor) => editor.getFormatState().strikethrough,
      },
    ],
    shortcuts: [
      { key: 'b', ctrl: true, action: (editor: RichTextEditor) => editor.toggleBold() },
      { key: 'i', ctrl: true, action: (editor: RichTextEditor) => editor.toggleItalic() },
      { key: 'u', ctrl: true, action: (editor: RichTextEditor) => editor.toggleUnderline() },
    ],
  }
}

export function createColorPlugin(): RichTextEditorPlugin {
  return {
    name: 'color',
    toolbar: [
      {
        id: 'color',
        icon: 'A',
        label: '文字颜色',
        action: (editor: RichTextEditor) => {
          const color = prompt('输入颜色 (如 #ff0000):')
          if (color) editor.setColor(color)
        },
      },
      {
        id: 'background-color',
        icon: '🎨',
        label: '背景颜色',
        action: (editor: RichTextEditor) => {
          const color = prompt('输入背景颜色 (如 #ffff00):')
          if (color) editor.setBackgroundColor(color)
        },
      },
    ],
  }
}

export function createFontPlugin(): RichTextEditorPlugin {
  const fonts = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Courier New',
    'Georgia',
    'Verdana',
    'Microsoft YaHei',
    'SimSun',
    'SimHei',
  ]

  const sizes = ['12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px']

  return {
    name: 'font',
    toolbar: [
      {
        id: 'font-family',
        icon: '🔤',
        label: '字体',
        action: (editor: RichTextEditor) => {
          const font = prompt(`选择字体:\n${fonts.join(', ')}`)
          if (font && fonts.includes(font)) {
            editor.setFontFamily(font)
          }
        },
      },
      {
        id: 'font-size',
        icon: '📏',
        label: '字号',
        action: (editor: RichTextEditor) => {
          const size = prompt(`选择字号:\n${sizes.join(', ')}`)
          if (size && sizes.includes(size)) {
            editor.setFontSize(size)
          }
        },
      },
    ],
  }
}

export function createLinkPlugin(): RichTextEditorPlugin {
  return {
    name: 'link',
    toolbar: [
      {
        id: 'link',
        icon: '🔗',
        label: '链接',
        action: (editor: RichTextEditor) => {
          const url = prompt('输入链接 URL:')
          if (url !== null) {
            editor.setLink(url)
          }
        },
      },
    ],
    shortcuts: [
      {
        key: 'k',
        ctrl: true,
        action: (editor: RichTextEditor) => {
          const url = prompt('输入链接 URL:')
          if (url !== null) {
            editor.setLink(url)
          }
        },
      },
    ],
  }
}

export function createFormulaPlugin(): RichTextEditorPlugin {
  return {
    name: 'formula',
    toolbar: [
      {
        id: 'formula',
        icon: '∑',
        label: '公式',
        action: (editor: RichTextEditor) => {
          const formula = prompt('输入 LaTeX 公式:')
          if (formula) {
            editor.insertFormula(formula)
          }
        },
      },
    ],
  }
}

export function createDefaultPlugins(): RichTextEditorPlugin[] {
  return [
    createBasicFormatPlugin(),
    createColorPlugin(),
    createFontPlugin(),
    createLinkPlugin(),
    createFormulaPlugin(),
  ]
}

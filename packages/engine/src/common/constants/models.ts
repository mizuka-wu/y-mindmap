export const MODEL_TYPE = {
  BASE_COMPONENT: 'BaseComponent',
  STYLE_COMPONENT: 'StyleComponent',
  STYLE: 'Style',
  BOUNDARY: 'Boundary',
  SUMMARY: 'Summary',
  HREF: 'Href',
  LABEL: 'Label',
  LEGEND: 'Legend',
  MARKER: 'Marker',
  NOTE: 'Note',
  NUMBERING: 'Numbering',
  RELATIONSHIP: 'Relationship',
  SHEET: 'Sheet',
  THEME: 'Theme',
  TOPIC: 'Topic',
  EXTENSION: 'Extension',
  IMAGE: 'Image',
  WORKBOOK: 'workbook',
} as const;

export enum TOPIC_TYPE {
  ATTACHED = 'attached',
  DETACHED = 'detached',
  SUMMARY = 'summary',
  CALLOUT = 'callout',
  ROOT = 'root',
}

export const ALL_TOPIC_TYPES = [
  TOPIC_TYPE.ROOT,
  TOPIC_TYPE.ATTACHED,
  TOPIC_TYPE.DETACHED,
  TOPIC_TYPE.CALLOUT,
  TOPIC_TYPE.SUMMARY,
] as const;

export const NUMBERFORMAT = {
  NONE: 'org.xmind.numbering.none',
  ARABIC: 'org.xmind.numbering.arabic',
  ROMAN: 'org.xmind.numbering.roman',
  LOWERCASE: 'org.xmind.numbering.lowercase',
  UPPERCASE: 'org.xmind.numbering.uppercase',
} as const;

export const NUMBERSEPARATOR = {
  COMMA: 'org.xmind.numbering.separator.comma',
  DOT: 'org.xmind.numbering.separator.dot',
  HYPHEN: 'org.xmind.numbering.separator.hyphen',
  DASH: 'org.xmind.numbering.separator.dash',
  OBLIQUE: 'org.xmind.numbering.separator.oblique',
} as const;

export const INFO_ITEM_DISPLAY_MODE = {
  CARD: 'card',
  ICON: 'icon',
} as const;

export const INFOITEM_TYPE_FULL = {
  LABEL: 'org.xmind.ui.infoItem.label',
  HREF: 'org.xmind.ui.infoItem.hyperlink',
  NOTE: 'org.xmind.ui.infoItem.notes',
  TASK: 'org.xmind.ui.infoItem.taskInfo',
  AUDIO: 'org.xmind.ui.infoItem.AudioNotes',
  COMMENT: 'org.xmind.ui.infoItem.comments',
} as const;

export const INFOITEM_TYPE_SHORT = {
  LABEL: 'label',
  HREF: 'href',
  NOTE: 'note',
  TASK: 'task',
  AUDIO: 'audio',
  COMMENT: 'comments',
} as const;

export const INFO_ITEM_STYLE_TYPE = {
  CLASSIC: 'classic',
  FASHION: 'fashion',
  // 根据json格式
  ACC_TO_JSON: 'accToJSON',
} as const;

export const COMPONENT_TYPE = MODEL_TYPE;

export const ATTACHMENT_PREFIX = 'xap:resources/';
export const TITLE_MAX_WIDTH = 300;
export const TOPIC_TITLE_MAX_WIDTH = 300;
export const TOPIC_MAX_CUSTOM_WIDTH = 1024;
export const TOPIC_DEFAULT_STRUCTURE = 'org.xmind.ui.logic.right';
export enum DIRECTION {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  NONE = 'none',
  UPDOWN = 'UD',
  LEFTRIGHT = 'LR',
}
export enum ALL_DIRECTION {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  LEFT_UP = 'leftUp',
  LEFT_DOWN = 'leftDown',
  RIGHT_UP = 'rightUp',
  RIGHT_DOWN = 'rightDown',
  NONE = 'none',
}

/**
 * @deprecated
 */
export const TOPIC_ATTACHED = 'attached';
/**
 * @deprecated
 */
export const TOPIC_DETACHED = 'detached';
/**
 * @deprecated
 */
export const TOPIC_SUMMARY = 'summary';
/**
 * @deprecated
 */
export const TOPIC_CALLOUT = 'callout';
/**
 * @deprecated
 */
export const TOPIC_ROOT = 'root';
/**
 * @description master range name
 * */
export const MASTER_RANGE = 'master';
export const MANIFEST = {
  FILE_ENTRIES: 'file-entries',
  FILE_ENTRY: 'file-entry',
} as const;
export enum COMPACT_LAYOUT_MODE_LEVEL {
  First = 'First',
  Second = 'Second',
  Third = 'Third',
  Fourth = 'Fourth',
  Fifth = 'Fifth',
}

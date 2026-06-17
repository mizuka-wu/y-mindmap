export const EXTENSION_ELEMENT = {
  CONTENT: 'content',
};
export enum EXTENSION_PROVIDER {
  TASK_INFO = 'org.xmind.ui.taskInfo',
  AUDIO_NOTES = 'org.xmind.ui.audionotes',
  UNBALANCED_MAP = 'org.xmind.ui.map.unbalanced',
  SPREAD_SHEET = 'org.xmind.ui.spreadsheet',
  IOS_DRAWING = 'org.xmind.ui.iOSDrawing',
  MATH_JAX = 'org.xmind.ui.mathJax',
  LINE_CLASS_IN_NORMAIL_STRUCTURE = 'org.xmind.ui.lineClass.in.normalStructure',
  SKELETON_STRUCTURE_STYLE = 'org.xmind.ui.skeleton.structure.style',
  PITCH = 'org.xmind.ui.ice-cream-pancake',
}
export const EXTENSION_EVENT = {
  ADD_RESOURCE_REF: 'addResourceRef',
  REMOVE_RESOURCE_REF: 'removeResourceRef',
} as const;

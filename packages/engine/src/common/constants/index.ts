/**
 * 已完成
 */
export * from './browsers';
export * from './configs';
export * from './events';
export * from './models';

export * from './modules';

export * from './services';

export * from './status';

export * from './styles';

export * from './structures';

export * from './view';

export * from './adapters';

export * from './extensions';

export * from './figures';

export * from './renderengine';

export * from './xaptypes';

export * from './action';

export * from './limited';

export const LANGS = {
  ZH_CN: 'zh-CN',
  EN_US: 'en-US',
  ZH_HK: 'zh-HK',
  ZH_TW: 'zh-TW',
  JA_JP: 'ja-JP',
  DE_DE: 'de-DE',
  FR_FR: 'fr-FR',
  ES_ES: 'es',
  ID_ID: 'id',
  IT_IT: 'it-IT',
  KR_KR: 'ko',
  PT_PT: 'pt-PT',
  RU_RU: 'ru-RU',
  TH_TH: 'th',
} as const;
export const PLATFORMS = {
  VANA: 'vana',
  BROWNIE: 'brownie',
  DOUGHNUT: 'doughnut',
  PUFF: 'puff',
  PUFFMAC: 'puffmac',
} as const;
export const ANIMATION_FLAGS = {
  BRANCH_ZOOM_IN: 'branchZoomIn',
  BRANCH_SHOW_HIGH_LIGHT_SELECT_BOX: 'branchShowHighLightSelectBox',
  BOUNDARY_SHOW_HIGH_LIGHT_SELECT_BOX: 'boundaryShowHighLightSelectBox',
  RELATIONSHIP_SHOW_HIGH_LIGHT_SELECT_BOX: 'relationshipShowHighLightSelectBox',
} as const;
export const SB_DOM_ID_PREFIX = 'sbsvg';

import { COMPONENT_TYPE, STYLE_KEYS } from '../common/constants/index';
import { BaseComponent } from './basecomponent';

import type { StyleData } from './stylecomponent';
import type { SheetModel } from './sheet';

export type ThemeData = {
  id: string;
  title: string;
  colorThemeId?: string;
  skeletonThemeId?: string;
  map?: StyleData;
  centralTopic?: StyleData;
  mainTopic?: StyleData;
  subTopic?: StyleData;
  floatingTopic?: StyleData;
  centralFloatingTopic?: StyleData;
  boundary?: StyleData;
  relationship?: StyleData;
  summaryTopic?: StyleData;
  summary?: StyleData;
};

export class ThemeModel extends BaseComponent<ThemeData> {
  _properties: Partial<Record<string, StyleData>>;
  get componentType() {
    return COMPONENT_TYPE.THEME;
  }
  constructor(attr: ThemeData, options: { sheet: SheetModel }) {
    super(attr, options);
    this._properties = {};
  }
  properties() {
    if (!this._properties) {
      this._properties = {};
    }
    return this._properties;
  }
  addProperties(componentName: string, property: StyleData) {
    const properties = this.properties();
    properties[componentName] = property;
  }
  emptyProperties() {
    this._properties = {};
  }
  hasClass(className: string) {
    const properties = this.properties();
    return Boolean(properties[className]);
  }
  getStyleValue(className: string, styleKey: STYLE_KEYS) {
    const properties = this.properties();
    const style = properties[className];
    return (style && style.properties && style.properties[styleKey]) || null;
  }
  getStyle(className: string) {
    const properties = this.properties();
    const style = properties[className];
    return (style && style.properties && Object.assign({}, style.properties)) || null;
  }
  getColorThemeId() {
    return this.get('colorThemeId');
  }
  getSkeletonThemeId() {
    return this.get('skeletonThemeId');
  }
}

export default ThemeModel;

import backbone from 'backbone';
import underscore from 'underscore';
import { STYLE_KEYS, COMPONENT_TYPE } from '../common/constants/index';
import * as utils from '../common/utils/index';
import { BaseComponent } from './basecomponent';
import UndoManager from '../common/undo';

import type { SheetModel } from '../type.d';
/**
 * @fileOverview abstract style component model
 * */
/**
 * @description summary样式名转换
 * */
const summaryStyleDict = {
  [STYLE_KEYS.SHAPE_CLASS]: 'summaryLineClass',
  [STYLE_KEYS.LINE_WIDTH]: 'summaryLineWidth',
  [STYLE_KEYS.LINE_COLOR]: 'summaryLineColor',
  [STYLE_KEYS.LINE_PATTERN]: 'summaryLinePattern',
} as const;
const CLASS_SEPARATOR = ' ';

export type StyleData = {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  properties: Partial<Record<STYLE_KEYS, any>>;
};

export class StyleModel extends backbone.Model<StyleData> {
  componentType: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(attributes?: StyleData, options?: any) {
    super(attributes, options);
    // super(...arguments);
    this.componentType = COMPONENT_TYPE.STYLE;
  }
  keys(): STYLE_KEYS[] {
    const properties = this.get('properties');
    if (!properties) {
      return [];
    }
    return Object.keys(properties) as STYLE_KEYS[];
  }
  getValue(key: STYLE_KEYS) {
    const properties = this.get('properties');
    if (!properties) {
      return null;
    }
    return properties[key] ?? null;
  }
  toJSON(): StyleData {
    return JSON.parse(JSON.stringify(this.attributes));
  }
}
/**
 * @description 有样式的组件需要继承的二级基本组件，提供与style操作相关的方法
 * @description the abstract class for style model，provide some methods to operate styles
 * @constructor
 * */
export class StyleComponent<T extends { class: string; style?: StyleData }> extends BaseComponent<T> {
  /**
   * @description 获取样式信息的model
   * @description get the model of style
   * @type {StyleModel}
   * @private
   * */
  _style: StyleModel | null;
  _classList: string[];
  /**
   * @description 组件类型
   * @description component type
   * @type {string}
   * @public
   * */
  get componentType(): string {
    return COMPONENT_TYPE.STYLE_COMPONENT;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(attr: T, options: any) {
    super(attr, options);
    this._style = null;
    super.initialize(attr, options);
    this.initStyle(this.get('style'));
  }
  styleChanged() {
    // To be overridden.
  }
  classList() {
    if (this._classList) {
      return this._classList;
    }
    this._classList = [];
    const classString = this.get('class');
    if (classString && typeof classString === 'string') {
      this._classList = classString.split(CLASS_SEPARATOR).filter(className => className !== '');
    }
    return this._classList;
  }
  addClass(className: string, index: number) {
    let _a: UndoManager | null | undefined;
    if (!className || className.includes(CLASS_SEPARATOR)) {
      return;
    }
    const classList = this.classList();
    if (className !== null && !classList.includes(className)) {
      classList.splice(index, 0, className);
      // Modify model
      this.set('class', classList.join(CLASS_SEPARATOR));
      this.trigger('changeClass', className);
      if ((_a = this.getUndo()) === null || _a === undefined) {
        // do anthing;
      } else {
        _a.add({
          undo: () => {
            this.removeClass(className);
          },
          redo: () => {
            this.addClass(className, index);
          },
        });
      }
      this.styleChanged();
    }
  }
  removeClass(className: string) {
    let _a: UndoManager | null | undefined;
    const classList = this.classList();
    if (className !== null && classList.includes(className)) {
      const index = classList.indexOf(className);
      classList.splice(index, 1);
      // Modify model
      if (classList.length > 0) {
        this.set('class', classList.join(CLASS_SEPARATOR));
      } else {
        this.unset('class');
      }
      this.trigger('changeClass', className);
      if ((_a = this.getUndo()) === null || _a === undefined) {
        // do anthing;
      } else {
        _a.add({
          undo: () => {
            this.addClass(className, index);
          },
          redo: () => {
            this.removeClass(className);
          },
        });
      }
      this.styleChanged();
    }
  }
  getUserClassValue(key: STYLE_KEYS) {
    let _a: SheetModel | null | undefined;
    const classList = this.classList();
    const theme = (_a = this.ownerSheet()) === null || _a === undefined ? undefined : _a.theme();
    let value = null;
    if (theme) {
      for (const className of classList) {
        const sv = theme.getStyleValue(className, key);
        if (sv) {
          value = sv;
        }
      }
    }
    return value;
  }
  /**
   * @description 获取样式model
   * @description get the model of style
   * @return {StyleModel}
   * @public
   * */
  style() {
    return this._style;
  }
  /**
   * @description 初始化样式信息
   * @description init style model
   * @param {Object} styleData
   * @return {StyleModel}
   * */
  initStyle(styleData?: StyleData) {
    if (styleData && styleData.properties && !Object(underscore.isEmpty)(styleData)) {
      this._style = new StyleModel(styleData);
    }
  }
  // /**
  //  * @description 添加新的样式
  //  * @description add new style
  //  * @param {string} key 新样式的名称 / new style's name
  //  * @param {string} value 新样式的值 / new style's value
  //  * */
  // private addStyle(key: string, value: string | null): void {
  //   // todo 这里的逻辑怪怪的，为什么要替换styleModel？
  //   const style = new StyleModel({
  //     'id': UUID(),  // eslint-disable-line new-cap
  //     // 'class': 'style',
  //     'properties': {}
  //   })
  //   if (value) {
  //     style.get('properties')[key] = value
  //   }
  //   this._style = style
  // }
  /**
   * @description 改变样式
   * @description change style
   * @param {string} key 需要被改变的样式的名称 / the name of style to changed
   * @param {string} value
   * */
  changeStyle(key: STYLE_KEYS, value?: string | null) {
    let _b: UndoManager | null | undefined;
    let oldValue = this.getStyleValue(key);
    // if oldValue is same as value, just return
    if (oldValue === value) {
      return;
    }
    // special treat for textDecoration
    if (value && key === STYLE_KEYS.TEXT_DECORATION) {
      const [prefix, realValue] = value.split(':');
      // line-through redo的问题
      if (!realValue) {
        value = prefix.trim();
      } else if (prefix === 'add') {
        if (oldValue === 'none' || !oldValue) {
          oldValue = '';
        }
        value = oldValue.includes(realValue) ? oldValue : `${oldValue} ${realValue}`;
      } else if (prefix === 'rm') {
        if (!oldValue) {
          oldValue = '';
        }
        value = oldValue.includes(realValue) ? oldValue.replace(realValue, '').trim() : oldValue;
        if (!value) {
          value = 'none';
        }
      }
    }
    // 执行样式改变
    if (!this._style) {
      this._style = new StyleModel({
        id: Object(utils.UUID)(),
        // 'class': 'style',
        properties: {},
      });
    }
    const properties = Object.assign({}, this._style.get('properties'));
    if (value) {
      properties[key] = value;
    } else {
      delete properties[key];
    }
    this._style.set('properties', properties);
    const triggerKey: string =
      this.componentType === COMPONENT_TYPE.SUMMARY
        ? (summaryStyleDict[key as unknown as keyof typeof summaryStyleDict] ?? key)
        : key;
    this.trigger('changeStyle', triggerKey, value);
    if ((_b = this.getUndo()) === null || _b === undefined) {
      // do anthing;
    } else {
      _b.add({
        undo: () => {
          this.changeStyle(key, oldValue);
        },
        redo: () => {
          this.changeStyle(key, value);
        },
      });
    }
    this.styleChanged();
  }
  /**
   * @description 整体替换样式信息
   * */
  setStyleObj(styleData?: StyleData | null, isSilent = false) {
    let _a: UndoManager | null | undefined;
    const oldStyleData = this.get('style') || null;
    let hasChanged = false;
    if (styleData && styleData.properties && !Object(underscore.isEmpty)(styleData.properties)) {
      styleData.id = styleData.id || Object(utils.UUID)();
      this.set('style', styleData);
      this.initStyle(styleData);
      hasChanged = true;
    } else if (oldStyleData && !Object(underscore.isEmpty)(oldStyleData)) {
      this._style = null;
      this.unset('style');
      hasChanged = true;
    }
    if (hasChanged) {
      // todo maybe setStyleObject event could be removed
      this.trigger('setStyleObject', styleData);
      const props = styleData?.properties;
      const oldProps = oldStyleData?.properties;
      // check for added and changed styles
      if (props) {
        Object.keys(props).forEach(prop => {
          const styleKey = prop as unknown as STYLE_KEYS;
          if (!oldProps || oldProps[styleKey] !== props[styleKey]) {
            this.trigger('changeStyle', prop, props[styleKey]);
          }
        });
      }
      // check for removed styles
      if (oldProps) {
        Object.keys(oldProps).forEach(prop => {
          if (!props || !(prop in props)) {
            this.trigger('changeStyle', prop, null);
          }
        });
      }
      this.styleChanged();
      if ((_a = this.getUndo()) === null || _a === undefined) {
        // do anthing;
      } else {
        _a.add({
          undo: () => {
            this.setStyleObj(oldStyleData, isSilent);
          },
          redo: () => {
            this.setStyleObj(styleData, isSilent);
          },
        });
      }
    }
  }
  /**
   * @param {string} key
   * */
  getStyleValue(key: STYLE_KEYS): string | null {
    const style = this.style();
    return (style === null || style === undefined ? undefined : style.getValue(key)) ?? null;
  }
}

export default StyleComponent;

import {
  STYLE_LAYER,
  MODULE_NAME,
  STYLE_DESCRIPTOR_FOR_DEFAULT_SETTING_ID,
  STYLE_DESCRIPTOR_FOR_STRUCTURE_ID,
  STYLE_DESCRIPTOR_FOR_PRIVATE_STYLE_ID,
  STYLE_DESCRIPTOR_FOR_SMART_COLOR_ID,
  STYLE_KEYS,
} from '../common/constants/index';

import { fixedStyleDescriptor } from './overridedstyle/fixedstyledescriptor';
import { privateStyleDescriptor } from './overridedstyle/privatestyledescriptor';
import { structureDescriptor } from './overridedstyle/structuredescriptor';
import { smartColorDescriptor } from './overridedstyle/smartcolordescriptor';

import type { BranchView, SheetEditor } from '../type.d';
import type { View } from 'backbone';

type ISTYLE_DESCRIPTOR = {
  [key in STYLE_LAYER]?: {
    type: STYLE_KEYS;
    value: any;
    test?: (source: any) => boolean;
  }[];
};

const defaultSettingsStyleDescriptor = {};
class OverrideStyle {
  id: string;
  styleDescriptor: ISTYLE_DESCRIPTOR;
  constructor(id: string, styleDescriptor: ISTYLE_DESCRIPTOR) {
    this.id = id;
    this.styleDescriptor = styleDescriptor;
  }
  getStyleValue(layer: STYLE_LAYER, styleType: STYLE_KEYS, target: View) {
    let styleValue;
    const styles = this.styleDescriptor[layer];
    if (styles) {
      styles.some(style => {
        if (style && style.type === styleType && (!style.test || style.test(target))) {
          if (style.value && typeof style.value === 'function') {
            styleValue = style.value(target);
          } else {
            styleValue = style.value;
          }
          return styleValue;
        }
      });
    }
    return styleValue;
  }
  getStyleKeyList(layer: STYLE_LAYER) {
    const styleKeys = (this.styleDescriptor[layer] ?? []).map(styleMatchUnit => {
      return styleMatchUnit.type;
    });
    return Array.from(new Set(styleKeys));
  }
}
export class OverridedStyle {
  overrideStyleArray: OverrideStyle[];
  context: SheetEditor;
  fixedOverrideStyle: OverrideStyle;
  static identifier: string;
  constructor(context: SheetEditor) {
    this.overrideStyleArray = [];
    this.context = context;
    this.fixedOverrideStyle = new OverrideStyle('fixed', fixedStyleDescriptor);
    this.init();
  }
  init() {
    this.overrideStyleArray.push(
      new OverrideStyle(STYLE_DESCRIPTOR_FOR_DEFAULT_SETTING_ID, defaultSettingsStyleDescriptor)
    );
    this.overrideStyleArray.push(new OverrideStyle(STYLE_DESCRIPTOR_FOR_STRUCTURE_ID, structureDescriptor));
    this.overrideStyleArray.push(new OverrideStyle(STYLE_DESCRIPTOR_FOR_PRIVATE_STYLE_ID, privateStyleDescriptor));
    this.overrideStyleArray.push(new OverrideStyle(STYLE_DESCRIPTOR_FOR_SMART_COLOR_ID, smartColorDescriptor));
  }
  insertOverrideStyle(newOverrideStyleId: string, styleDescriptor: ISTYLE_DESCRIPTOR, existedOverrideStyleId?: string) {
    const newOverrideStyle = new OverrideStyle(newOverrideStyleId, styleDescriptor);
    this.overrideStyleArray.forEach((overrideStyle, index) => {
      if (!existedOverrideStyleId) {
        this.overrideStyleArray.push(newOverrideStyle);
        return;
      } else if (overrideStyle.id === existedOverrideStyleId) {
        this.overrideStyleArray.splice(index, 0, newOverrideStyle);
        return;
      }
    });
    return newOverrideStyle;
  }
  removeOverrideStyle(existedOverrideStyleId: string) {
    this.overrideStyleArray = this.overrideStyleArray.filter(
      overrideStyle => overrideStyle.id !== existedOverrideStyleId
    );
  }
  /**
   * @description valid values of 'layer': 'beforeUser','beforeParent','beforeTheme','beforeDefault'
   * @param {string} layer
   * @param {string} styleType
   * @param {*} target
   */
  getStyleValue(
    layer: STYLE_LAYER,
    styleType: STYLE_KEYS,
    target: BranchView,
    options: Partial<{
      ignoreOverrideStyleIdList: string[];
      ignoreCompatibilityFix: boolean;
      ignoreDynamicPriorityOverridedStyle: boolean;
    }> = {}
  ): any {
    let _a: string[] | undefined;
    let styleValue = null;
    if (this.fixedOverrideStyle) {
      const sv = this.fixedOverrideStyle.getStyleValue(layer, styleType, target);
      if (sv) {
        return sv;
      }
    }
    for (let index = this.overrideStyleArray.length - 1; index >= 0; index--) {
      const overridedStyle = this.overrideStyleArray[index];
      if (
        (_a = options.ignoreOverrideStyleIdList) === null || _a === undefined
          ? undefined
          : _a.includes(overridedStyle.id)
      ) {
        continue;
      }
      const sv = overridedStyle.getStyleValue(layer, styleType, target);
      if (sv) {
        styleValue = sv;
        break;
      }
    }
    return styleValue;
  }
  getDynamicPriorityLayerStyleKeys() {
    const styleKeyCompose: Record<string, STYLE_KEYS[]> = {};
    this.overrideStyleArray.forEach(overrideStyle => {
      styleKeyCompose[overrideStyle.id] = overrideStyle.getStyleKeyList(STYLE_LAYER.DYNAMIC_PRIORITY);
    });
    return styleKeyCompose;
  }
}
OverridedStyle.identifier = MODULE_NAME.OVERRIDE_STYLE;

export default OverridedStyle;

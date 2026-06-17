import {
  ACTION_NAMES,
  STYLE_KEYS,
  STYLE_DESCRIPTOR_FOR_HAND_DRAWN_ID,
} from "../../common/constants/index";
import BaseAction from "../action";
import styleManager from "../../utils/business/stylemanager/index";
import { getAllViewToFixUserStyle } from "../../utils/business/stylemanager/sheetstyleselector";

import * as js_utils from "../../utils/index";
export class ChangeHandDrawnModeActiveAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.CHANGE_HAND_DRAWN_MODE_ACTIVE;
  }
  doExecute({ active }) {
    this._context.model.changeHandDrawnModeActive(active);
    const sheetView = this._context.getSheetView();
    if (active) {
      getAllViewToFixUserStyle(sheetView).forEach((view) => {
        const styleKeysToBeFix = [
          Object(js_utils.isHandDrawnLinePattern)(
            styleManager.getUserStyleValue(view, STYLE_KEYS.LINE_PATTERN),
          )
            ? null
            : STYLE_KEYS.LINE_PATTERN,
          Object(js_utils.isHandDrawnLinePattern)(
            styleManager.getUserStyleValue(
              view,
              STYLE_KEYS.BORDER_LINE_PATTERN,
            ),
          )
            ? null
            : STYLE_KEYS.BORDER_LINE_PATTERN,
          Object(js_utils.isHandDrawnFillPattern)(
            styleManager.getUserStyleValue(view, STYLE_KEYS.FILL_PATTERN),
          )
            ? null
            : STYLE_KEYS.FILL_PATTERN,
          STYLE_KEYS.FONT_FAMILY,
        ].filter(Boolean);
        styleManager.fixUserStyle(view, {
          styleKeysToBeFix: styleKeysToBeFix,
        });
      });
    } else {
      // remove all prefix style value
      const theme = this._context.model.theme().toJSON();
      for (const themeKey in theme) {
        if (!(theme[themeKey] instanceof Object)) {
          continue;
        }
        const { properties } = theme[themeKey];
        const keysToClear = Object.keys(properties ?? {})
          .map((key) => {
            if (key.startsWith(STYLE_DESCRIPTOR_FOR_HAND_DRAWN_ID)) {
              return key;
            } else {
              return null;
            }
          })
          .filter(Boolean);
        if (!keysToClear.length) {
          continue;
        }
        styleManager.removeStyleFromClass(sheetView, themeKey, keysToClear);
      }
    }
  }
}

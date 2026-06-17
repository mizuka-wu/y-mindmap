/**
 * 主入口文件，其实有点大了
 */

// 判断是否可以去掉
// import 'mathjax'

import * as constant from "./common/constants/index";

import mommonFuncs from "./mommonfuncs";
import styleManager from "./utils/business/stylemanager/index";
import WorkbookModel from "./models/workbook";
import SheetModel from "./models/sheet";

import SheetEditor from "./core/sheeteditor";
import WorkbookEditor from "./core/workbookeditor";
import config from "./common/config";
import headStyle from "./cssjs/headstyle";
import allAvailableModules from "./modules/index";
import * as utils from "./utils/index";
import formatconverter from "./formatconverter/index";
import underscore from "underscore";
import jquery from "jquery";

import backbone from "backbone";

import { UndoManager } from "./common/undo";

allAvailableModules.forEach((item) => {
  SheetEditor.registerModule(item);
});

export const Snowbrush = {
  $: jquery,
  _: underscore,
  Backbone: backbone,
  // version: pkg.version,
  formatconverter: formatconverter,
  SheetEditor: SheetEditor,
  WorkbookEditor: WorkbookEditor,
  constant: constant,
  Model: {
    Workbook: WorkbookModel,
    Sheet: SheetModel,
  },
  utils: {
    UUID: mommonFuncs.UUID,
    UndoManager: UndoManager,
    mommonFuncs: mommonFuncs,
    styleManager: styleManager,
    utils: utils,
  },
  config: function (...args: any[]) {
    if (args.length === 1 && typeof args[0] === "string") {
      return config.get(args[0]);
    } else {
      config.set(...args);
    }
  },
};
// TODO: 支持容器注入
headStyle();
Reflect.set(window, "Snowbrush", Snowbrush);
export default Snowbrush;

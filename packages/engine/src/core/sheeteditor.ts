import process from "process";

import imageExporter from "../utils/business/imageexporter";

import ThemeExporter from "../utils/business/themeexporter";

import {
  EVENTS,
  CONFIG,
  COMPACT_LAYOUT_MODE_LEVEL,
  MODULE_NAME,
  STYLE_DESCRIPTOR_FOR_COMPACT_MODE_ID,
  STYLE_DESCRIPTOR_FOR_HAND_DRAWN_ID,
  UI_STATUS,
  VIEW_TYPE,
  ACTION_STATUS,
  INFO_ITEM_STYLE_TYPE,
  PLATFORMS,
  STYLE_KEYS,
  ALIGNMENT_BY_LEVEL_STATUS,
  ACTION_NAMES,
} from "../common/constants/index";

// import { initSheetActions } from '../actions/sheet/index';

import * as lazyRunner from "../figures/lazyrunner/index";
import * as lazyRunnerConstants from "../figures/lazyrunner/constants";

import AbstractEditor from "./abstracteditor";

import SvgView from "../view/svgview";

import SheetView from "../view/sheetview";

import jquery from "jquery";

import underscore from "underscore";
import UiEventsManager from "../uievents/events";

import coreServices from "./services";

import { utils as langsUtils } from "../utils/langs";

import mommonFuncs from "../mommonfuncs";

import {
  combineResourceString,
  mathJaxExporterUtil,
  getInjectModule,
} from "../utils/index";

import compactModeDescriptor from "../modules/overridedstyle/compactmodedescriptor";

import handdrawnmodedescriptor from "../modules/overridedstyle/handdrawnmodedescriptor";
import styleManager from "../utils/business/stylemanager/index";

import type {
  Action,
  SheetModel,
  WorkbookEditor,
  SelectionManager,
  OverridedStyle,
  IExecuteParams,
  Semaphore,
  EditReceiver,
  ModifyCheck,
  MiniMap,
  BranchView,
  ThemeData,
  ThemeModel,
} from "../type.d";
import type { Input } from "hammerjs";

const invertedEvents = underscore.invert(EVENTS);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const moduleMap: Record<string, any> = {};

type ISheetEditorOptions = Partial<{
  el: HTMLElement;
  model: SheetModel;
  scrollContainer: HTMLElement;
  parent: WorkbookEditor;
  eventManager?: UiEventsManager;
  initSheetGeometryStatus?: {
    x: number;
    y: number;
  } & {
    scale: number;
  };
}>;

/**
 * API to manipulate Sheet
 * 1. Execute action
 * 2. Trigger Events, see constant.EVENTS
 * 3. Export PNG
 * 4. Get inner Element
 * @class
 * @extends AbstractEditor
 * @param {Object} args
 * @param {DOM} args.el - root DOM of Editor
 * @param {SheetModel} args.model - SheetModel
 */
export class SheetEditor extends AbstractEditor<SheetModel> {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  events: {
    //"mousewheel": "_preventDefault"
  };
  removableCallback: (() => void)[];
  _option: ISheetEditorOptions;
  _$rootContainer: JQuery<HTMLElement>;
  _$svgContainer: JQuery<HTMLElement>;
  _$appToolsContainer: JQuery<HTMLElement>;
  _scrollContainer: HTMLElement;
  _eventManager: UiEventsManager;
  _onGesture: typeof UiEventsManager.prototype.on;
  _onEvent: typeof UiEventsManager.prototype.on;
  _offGesture: typeof UiEventsManager.prototype.off;
  _offEvent: typeof UiEventsManager.prototype.off;
  _serviceMap: ReturnType<typeof coreServices>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _deferedEventArgsMap: Record<string, any>;
  _isInitRenderingCompleted: boolean;
  _currentTemporaryColorTheme: null | string;
  _actions: Record<string, Action>;
  themeExporter: ThemeExporter;
  _svgView: SvgView;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _moduleMap: Record<string, any>;
  _isHibernating: boolean;
  constructor(
    options: Partial<{
      el: HTMLElement;
      model: SheetModel;
      scrollContainer: HTMLElement;
      parent: WorkbookEditor;
      eventManager?: UiEventsManager;
      initSheetGeometryStatus?: {
        x: number;
        y: number;
      } & {
        scale: number;
      };
    }> = {},
  ) {
    super(options);
    this.removableCallback = [];
    if (!options.el) {
      throw new Error("must indicate el argument in Editor initialization");
    }
    super.initialize.bind(this)(options);
    this._option = Object.assign({}, options);
    /** @public */
    this._$rootContainer = jquery("<div class='sb-container'></div>").css({
      position: "relative", //for editor receiver's position.
    });
    this._$svgContainer = jquery("<div class='mm-editor'></div>")
      .appendTo(this._$rootContainer)
      .css({
        width: "100%",
        height: "100%",
        position: "relative",
      });
    if (process.env.SELECT_BOX === "skip") {
      this._$svgContainer.attr("data-immunity", "ecg");
    }
    this._$appToolsContainer = jquery("<div class='app-tools-container'></div>")
      .appendTo(this._$rootContainer)
      .css({
        position: "absolute",
        // position: 'fixed',
        left: "0px",
        top: "0px",
      });
    if (options.scrollContainer) {
      this._scrollContainer = options.scrollContainer;
    } else {
      this.$el.css({
        overflow: "scroll",
      });
      this._scrollContainer = this.$el[0];
    }
    if (this.config(CONFIG.NO_VIEW_PORT_MOVE)) {
      this.setScrollDisable();
    }
    this.$el.append(this._$rootContainer);
    //important! make editor focusable, can fire keyboard event
    this.$el.attr("tabindex", "-1");
    this.$el.css({
      outline: "none",
    });
    this._eventManager = new UiEventsManager({
      el: this._$rootContainer[0],
      platform: this.config(CONFIG.PLATFORM),
    });
    this._onGesture = this._onEvent = this._eventManager.on;
    this._offGesture = this._offEvent = this._eventManager.off;
    this._serviceMap = coreServices(this);
    this._deferedEventArgsMap = {};
    this._isInitRenderingCompleted = false;
    this._currentTemporaryColorTheme = null;
    initModules.call(this);
    this._actions = initSheetActions(this);
    this.model = this._option.model || this.model;
    this.model.setTextTranslator(this.getTranslatedText.bind(this));
    this.initEventsListener();
    this.themeExporter = new ThemeExporter(this);
    this.initTemporaryColorThemeInOldThemeFiles();
    if (
      this.model.getCompactLayoutModeLevel() ===
      COMPACT_LAYOUT_MODE_LEVEL.Second
    ) {
      this.getModule<OverridedStyle>(
        MODULE_NAME.OVERRIDE_STYLE,
      ).insertOverrideStyle(
        STYLE_DESCRIPTOR_FOR_COMPACT_MODE_ID,
        compactModeDescriptor,
      );
    }
    if (this.model.getHandDrawnModeActive()) {
      this.getModule<OverridedStyle>(
        MODULE_NAME.OVERRIDE_STYLE,
      ).insertOverrideStyle(
        STYLE_DESCRIPTOR_FOR_HAND_DRAWN_ID,
        handdrawnmodedescriptor,
      );
    }
  }
  initEventsListener() {
    this.listenTo(this.model, "all", (...args: [string, ...unknown[]]) => {
      const eventName = args[0];
      if (eventName in invertedEvents) {
        this.trigger(...args);
      }
    });
    this.listenTo(
      this.model,
      EVENTS.AFTER_SHEET_CONTENT_CHANGE,
      underscore.debounce(() => {
        this.trigger(EVENTS.AFTER_MODIFY_STATUS_CHANGE);
      }, 0),
    );
    this.on(EVENTS.AFTER_UI_STATUS_ACTIVATE, (uiStatus) => {
      if (uiStatus === UI_STATUS.DE_FOCUS) {
        this._setAllSelectionFocusStatus(true);
      }
    });
    this.on(EVENTS.AFTER_UI_STATUS_DEACTIVATE, (uiStatus) => {
      if (uiStatus === UI_STATUS.DE_FOCUS) {
        this._setAllSelectionFocusStatus(false);
      }
    });
    this.on(EVENTS.SCALE_CHANGED, () => {
      // 每次缩放的时候，尝试重新定位edit receiver，避免因为位置奇葩导致容器被撑大
      const editReceiverModule = this.getModule<EditReceiver>(
        MODULE_NAME.EDIT_RECEIVER,
      );
      if (editReceiverModule) {
        editReceiverModule.repairPosition();
      }
    });
    this.on(EVENTS.COMPACT_LAYOUT_MODE_LEVEL_CHANGED, () => {
      const currentLevel = this.model.getCompactLayoutModeLevel();
      if (currentLevel === COMPACT_LAYOUT_MODE_LEVEL.Second) {
        this.activateOverridedStyle(
          STYLE_DESCRIPTOR_FOR_COMPACT_MODE_ID,
          compactModeDescriptor,
        );
      } else {
        this.deactivateOverridedStyle(STYLE_DESCRIPTOR_FOR_COMPACT_MODE_ID);
      }
    });
    this.on(EVENTS.HAND_DRAWN_MODE_ACTIVE_CHANGED, () => {
      const currentStatus = this.model.getHandDrawnModeActive();
      if (currentStatus) {
        this.activateOverridedStyle(
          STYLE_DESCRIPTOR_FOR_HAND_DRAWN_ID,
          handdrawnmodedescriptor,
        );
      } else {
        this.deactivateOverridedStyle(STYLE_DESCRIPTOR_FOR_HAND_DRAWN_ID);
      }
    });
    if (this.isDoughnutPlatform()) {
      document.addEventListener("touchmove", () => {}, {
        passive: false,
      });
    }
  }
  _setAllSelectionFocusStatus(isDeFocus: boolean) {
    const selections = this.getModule<SelectionManager>(
      MODULE_NAME.SELECTION,
    ).getSelections();
    const defocusAbleViewTypeList = [
      VIEW_TYPE.BRANCH,
      VIEW_TYPE.BOUNDARY,
      VIEW_TYPE.RELATIONSHIP,
    ];
    selections.forEach((selection) => {
      if (defocusAbleViewTypeList.includes(selection.type)) {
        selection.isDeFocus = isDeFocus;
        const targetSelection = selection.getProxy
          ? selection.getProxy()
          : selection;
        if (isDeFocus) {
          targetSelection.displayDeFocus();
        } else {
          targetSelection.displaySelect();
        }
      }
    });
  }
  /**
   * @return {HTMLElement}
   * @public
   *  */
  getScrollContainer() {
    return this._scrollContainer;
  }
  _preventDefault(e: Event) {
    e.preventDefault();
  }
  // trigger (...args) {
  //   const eventName = args[0];
  //   if (this.config(CONFIG.DEFERED_EVENTS).indexOf(eventName) !== -1) {
  //     const deferedArgs = args.slice();
  //     deferedArgs[0] = eventName + ":sync";
  //     AbstractEditor.prototype.trigger.apply(this, deferedArgs);
  //     if (!this._deferedEventArgsMap[eventName]) {
  //       setTimeout(() => {
  //         let args = this._deferedEventArgsMap[eventName];
  //         AbstractEditor.prototype.trigger.apply(this, args);
  //         delete this._deferedEventArgsMap[eventName];
  //       }, this.config(CONFIG.DEFERED_TIME));
  //     }
  //     this._deferedEventArgsMap[eventName] = args;
  //   } else {
  //     AbstractEditor.prototype.trigger.apply(this, args);
  //   }
  // },
  /**
   * listen gesture event on view of certian type
   * @override
   * @param {string} eventName - gesture event name defeined by Hammer.js
   * @param {string} viewType - view type of constant.VIEW_TYPE
   * @param {function} callback - event handler
   * @param {Hammer.Event} callback.args[0]
   */
  onGesture(
    eventName: string,
    viewType: (typeof VIEW_TYPE)[keyof typeof VIEW_TYPE],
    callback: (event: typeof Input) => void,
  ) {
    this._onGesture(eventName, viewType, callback);
  }
  /**
   * stop listening gesture event
   * @override
   * @param {string} eventName - gesture event name defeined by Hammer.js
   * @param {string} [viewType] - view type of constant.VIEW_TYPE
   * @param {function} [callback] - event handler
   * @param {Hammer.Event} callback.args[0]
   */
  offGesture(
    eventName: string,
    viewType: (typeof VIEW_TYPE)[keyof typeof VIEW_TYPE],
    callback: (e: typeof Input) => void,
  ) {
    this._offGesture(eventName, viewType, callback);
  }
  /**
   * listen jquery event on view of certain type
   * @override
   * @param {string} eventName - event name, e.g click, mouseover ...
   * @param {string} viewType - view type of constant.VIEW_TYPE
   * @param {function} callback - event handler
   * @param {JQuery.Event} callback.args[0]
   */
  onEvent(
    eventName: string,
    viewType: (typeof VIEW_TYPE)[keyof typeof VIEW_TYPE],
    callback: (e: JQuery.Event) => void,
  ) {
    this._onEvent(eventName, viewType, callback);
  }
  /**
   * stop listening JQuery event
   * @override
   * @param {string} eventName - event name, e.g click, mouseover ...
   * @param {string} [viewType] - view type of constant.VIEW_TYPE
   * @param {function} [callback] - event handler
   * @param {JQuery.Event} callback.args[0]
   */
  offEvent(
    eventName: string,
    viewType: (typeof VIEW_TYPE)[keyof typeof VIEW_TYPE],
    callback: (e: JQuery.Event) => void,
  ) {
    this._offEvent(eventName, viewType, callback);
  }
  /**
   * @returns {DOM} the DOM is the argument when new the SheetEditor
   * @deprecated
   */
  getOuterDOM() {
    return this.el;
  }
  /**
   * @returns {DOM} the DOM SheetEditor manipulate
   */
  getRootDOM() {
    return this._$rootContainer[0];
  }
  /**
   * put tool DOM such as text size calculator inside this
   * @return {jqObj}
   */
  getAppToolsContainer() {
    return this._$appToolsContainer;
  }
  /**
   * @returns {jQuery} parent DOM of root svg element
   */
  getSVGContainer() {
    return this._$svgContainer;
  }
  getSheetBoundsInViewport() {
    const sheetViewBounds = (this.getSheetView() as SheetView).bounds;
    const positionTransfer = this.getSVGView().getCoordinateTransfer();
    const topLeft = positionTransfer.mindMapToViewport({
      x: sheetViewBounds.x,
      y: sheetViewBounds.y,
    });
    const bottomRight = positionTransfer.mindMapToViewport({
      x: sheetViewBounds.width + sheetViewBounds.x,
      y: sheetViewBounds.height + sheetViewBounds.y,
    });
    return {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y,
    };
  }
  /**
   * initialize all inner View, layout and render.
   * if sheetEditor's config is necessary, you must define them before call this method
   */
  initInnerView() {
    if (!this.model) {
      return;
    }
    const svgView = new SvgView(this, this._$svgContainer[0]);
    this._svgView = svgView;
    const sheetView = new SheetView(this.model);
    svgView.content(sheetView);
    this.trigger(EVENTS.SHEET_CONTENT_LOADED);
    this.afterRender().then(() => {
      this._isInitRenderingCompleted = true;
    });
  }
  afterRender() {
    return new Promise<void>((resolve) => {
      lazyRunner.lazyRunner.work(lazyRunnerConstants.PRIORITY.AFTER_RENDER, {
        execute() {
          resolve();
        },
      });
    });
  }
  getSVGView() {
    return this._svgView;
  }
  getSheetModel() {
    return this.model;
  }
  getSheetView() {
    return this._svgView.content();
  }
  isSheetModified(): boolean {
    return this.getModule<ModifyCheck>(
      MODULE_NAME.MODIFY_CHECK,
    ).checkIsModified();
  }
  updateBaseUndoIndex() {
    this.getModule<ModifyCheck>(MODULE_NAME.MODIFY_CHECK).updateBaseIndex();
    this.trigger(EVENTS.AFTER_MODIFY_STATUS_CHANGE);
  }
  /**
   * a Module is a Object which is created by SheetEditor, is collection of complex user interaction logic
   * and contains several methods to manipulate content of Sheet
   * @param {string} identifier - name of module, such as "dragmanager" and "selectionmanager" etc.
   * @returns {Object}
   */
  getModule<T = undefined>(identifier: string): T {
    const module = this._moduleMap[identifier.toLowerCase()];
    if (module === undefined) {
      this.config(CONFIG.LOGGER).warn("unknown module: " + identifier);
    }
    return module;
  }
  /**
   * Service is a curring method by input SheetEdito
   * @param {string} funcName
   * @param {...*} args - argument to run service
   */
  callService(funcName: keyof typeof this._serviceMap, ...args: unknown[]) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    return (this._serviceMap[funcName] as Function).apply(this, args);
  }
  execAction(
    actionName: (typeof ACTION_NAMES)[keyof typeof ACTION_NAMES],
    args?: IExecuteParams,
  ) {
    const action = this.findOwnAction(actionName);
    if (action && action.queryStatus(args) === ACTION_STATUS.NORMAL) {
      return action.execute(args);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryActionStatus(
    actionName: (typeof ACTION_NAMES)[keyof typeof ACTION_NAMES],
    args?: any,
  ) {
    const action = this.findOwnAction(actionName);
    if (action) {
      return action.queryStatus(args);
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
  findOwnAction(actionName: (typeof ACTION_NAMES)[keyof typeof ACTION_NAMES]) {
    return this._actions[actionName];
  }
  getChildEditors() {
    return null;
  }
  /**
   * get translated text by LANGUAGE config
   * @param {String} key - see js/utils/langs.js
   */
  getTranslatedText(key: string) {
    const lang = this.config(CONFIG.LANGUAGE);
    return langsUtils.translate(lang, key);
  }
  /**
   * get current active UI status
   * @returns {String[]} - optional value see constant.UI_STATUS
   */
  getActiveUIStatus(): string[] {
    const semaphoreModule = this.getModule<Semaphore>(MODULE_NAME.SEMAPHORE);
    if (semaphoreModule) {
      return semaphoreModule.getActiveUIStatus();
    } else {
      return [];
    }
  }
  _remove() {
    this.removableCallback.forEach((callback) => {
      callback();
    });
  }
  remove() {
    this.getSVGView().remove();
    const miniMapModule = this.getModule<MiniMap>(MODULE_NAME.MINI_MAP);
    if (miniMapModule) {
      miniMapModule.remove();
    }
    this.$el.remove();
    this.stopListening();
    return this;
  }
  /**
   * @return {boolean}
   * @public
   * */
  isShowFashionStyle() {
    const infoItemStyle = this.config(CONFIG.INFO_ITEM_STYLE);
    if (infoItemStyle === INFO_ITEM_STYLE_TYPE.FASHION) {
      return true;
    }
    if (infoItemStyle === INFO_ITEM_STYLE_TYPE.CLASSIC) {
      return false;
    }
    if (infoItemStyle === INFO_ITEM_STYLE_TYPE.ACC_TO_JSON) {
      // todo 根据json中的信息确定显示模式
      return false;
    }
  }
  /**
   * @description 返回画布内容的实际大小，不考虑scale。
   * @return {bounds}
   */
  getContentBound() {
    // return this.getSVGView().container.node.getBBox();
    return (this.getSheetView() as SheetView).bounds;
  }
  /**
   * @typedef {Object} GetImageResult
   * @property {string} data - PNG data in Base64 format or svg xml string
   * @property {Number} height - image's height
   * @property {Number} width - image's width
   * @property {Number} scale - image's scale
   * @property {Number} cx - central topic's center point position relative to image's top-left
   * @property {Number} cy - central topic's center point position relative to image's top-left
   */
  /**
   * exports iamge as PNG Base64 format or SVG
   * @param {Object}  config - specify requirement, 可为空.
   * @param {BranchView} config.targetBranch - 可指定的branchView，默认输出整张图
   * @param {boolean} config.hideCollapseOpen - 是否隐藏展开按钮, 默认否.
   * @param {boolean} config.hideCollapseClose - 是否隐藏收缩按钮, 默认否.
   * @param {string}  config.area - 截图区域： full | inview, 默认为full.
   * @param {number}  config.hidpi - 以96为基准，默认为96。
   * @param {number}  config.scale - 缩放比例，默认为1.
   * @param {number}  config.width -  输出图片宽度, 同height一起用， 将使scale配置无效。
   * @param {number}  config.height - 输出图片高度
   * @param {number}  config.maxScale - 给定输出范围过大时，内容能够放大的最大比例，设置为1将不放大内容。 默认undefined，不作限制。
   * @param {number}  config.padding - area为full时为图片周围留白宽度，默认为10.
   * @param {string}  config.format - 指定输出格式.  1 "PNG“ : 将输出导出图片的base64字符串； 2 "SVG": 将输出svg字符串。默认PNG。
   * @param {boolean}  config.noBackground - 清除背景, 使之透明。
   * @param {boolean}  config.skipFont - 跳过加载字体，默认为true
   * @param {number} config.timeout - default 10000ms
   * @return {Promise<GetImageResult>} a promise wrap the result.
   */
  exportImage(
    config: {
      targetBranch?: BranchView;
      hideCollapseOpen?: boolean;
      hideCollapseClose?: boolean;
      area?: string;
      hidpi?: number;
      scale?: number;
      width?: number;
      height?: number;
      maxScale?: number;
      padding?: number;
      format?: string;
      noBackground?: boolean;
      skipFont?: boolean;
      timeout?: number;
    } = {},
  ) {
    return imageExporter.export(this, config);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exportTheme(options?: any) {
    return this.themeExporter.export(options);
  }
  getThemeDataToCombine() {
    let _a: ThemeModel | null | undefined;
    const oldThemeData: Partial<ThemeData> =
      ((_a = this.model.theme()) === null || _a === undefined
        ? undefined
        : _a.toJSON()) ?? {};
    if (oldThemeData.colorThemeId || oldThemeData.skeletonThemeId) {
      return oldThemeData;
    }
    return this.exportTheme();
  }
  exportMathJaxSVG(mathJaxText: string, options: { fontFamily?: string } = {}) {
    const lang = this.config(CONFIG.LANGUAGE);
    return mathJaxExporterUtil.export(mathJaxText, {
      lang,
      fontFamily: options.fontFamily,
    });
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activateOverridedStyle(
    overrideStyleId: string,
    overridedStyleDescriptor: any,
    existedOverridedStyleId?: string,
  ) {
    this.getModule<OverridedStyle>(
      MODULE_NAME.OVERRIDE_STYLE,
    ).insertOverrideStyle(
      overrideStyleId,
      overridedStyleDescriptor,
      existedOverridedStyleId,
    );
    (this.getSheetView() as SheetView).refreshStyles();
    this.trigger(EVENTS.SE_OVERRIDE_STYLE_CHANGED);
  }
  deactivateOverridedStyle(overrideStyleId: string) {
    this.getModule<OverridedStyle>(
      MODULE_NAME.OVERRIDE_STYLE,
    ).removeOverrideStyle(overrideStyleId);
    (this.getSheetView() as SheetView).refreshStyles();
    this.trigger(EVENTS.SE_OVERRIDE_STYLE_CHANGED);
  }
  /**
   * @override
   */
  getSelections() {
    const module = this.getModule<SelectionManager>("selectionmanager");
    if (module) {
      return (module as SelectionManager).selections.slice();
    } else {
      return [];
    }
  }
  /**
   * get inner view
   * @param {string} id
   * @returns {WorkbookComponentView}
   */
  getComponentViewById(id: string) {
    return this.getSVGView().model2View[id];
  }
  getZoomPencentage() {
    return this.getSVGView().getScale();
  }
  isHibernating() {
    return this._isHibernating;
  }
  hibernate(intoOrOut: boolean) {
    this._isHibernating = intoOrOut;
    lazyRunner.lazyRunner.work();
  }
  /**
   * get translate and scale
   * @returns {x: Number, y: Number, scaleX: Number, scaleY: Number}
   */
  getTransform() {
    return underscore.pick(
      this.getSVGView().container.transform(),
      "x",
      "y",
      "scaleX",
      "scaleY",
    );
  }
  isReadOnly() {
    return this.config(CONFIG.READONLY) === true;
    // return !!window.isSheetReadOnly; //for test
  }
  /**
   * @description 屏蔽scroll container的overflow scroll属性
   * @public
   * */
  setScrollDisable() {
    this.getScrollContainer().style.overflow = "hidden";
  }
  /**
   * @description 恢复scroll container的overflow scroll属性
   * @public
   * */
  setScrollEnable() {
    this.getScrollContainer().style.overflow = "scroll";
  }
  /** @public */
  isDoughnutPlatform() {
    return this.config(CONFIG.PLATFORM) === PLATFORMS.DOUGHNUT;
  }
  isBrowniePlatform() {
    return this.config(CONFIG.PLATFORM) === PLATFORMS.BROWNIE;
  }
  /** @public */
  isVanaPlatform() {
    return this.config(CONFIG.PLATFORM) === PLATFORMS.VANA;
  }
  isPuffPlatform() {
    return this.config(CONFIG.PLATFORM) === PLATFORMS.PUFF;
  }
  isPuffMacPlatform() {
    return this.config(CONFIG.PLATFORM) === PLATFORMS.PUFFMAC;
  }
  isMobileAppPlatform() {
    return (
      this.isPuffPlatform() ||
      this.isBrowniePlatform() ||
      this.isDoughnutPlatform()
    );
  }
  /**
   * @description
   * */
  isMobilePlatform() {
    return (
      this.isPuffPlatform() ||
      this.isBrowniePlatform() ||
      this.isDoughnutPlatform() ||
      mommonFuncs.isMobile
    );
  }
  isAlignmentByLevelMode() {
    return (
      styleManager.getStyleValue(
        (this.getSheetView() as SheetView).getCentralBranchView(),
        STYLE_KEYS.ALIGNMENT_BY_LEVEL,
      ) === ALIGNMENT_BY_LEVEL_STATUS.ACTIVED
    );
  }
  /**
   * @description get the key info that doughnut exported on window
   **/
  getDoughnutExportInfo() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const donutExportInfo = Object.assign(
      {},
      (window as any).DonutExportInfo || {},
    );
    const propToPatch = [
      "footerHeight",
      "headerHeight",
      "softKeyboardHeight",
      "toolbarHeight",
    ];
    const nativeScale = this.getSVGView().getDeviceNativeScale();
    propToPatch.forEach((prop) => {
      donutExportInfo[prop] = donutExportInfo[prop]
        ? donutExportInfo[prop] / nativeScale
        : 0;
    });
    return donutExportInfo;
  }
  /**
   * @description 在android端所需要的client位置，放这里是权宜之计
   * @public
   * */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDragEventClientPosition(e: Event, _isUseTouch?: boolean) {
    let event;
    let isUseTouch;
    if (!isUseTouch) {
      // fix is use touch
      if (this.isMobilePlatform() || e.type.includes("touch")) {
        isUseTouch = true;
      }
    }
    if (
      isUseTouch &&
      ((e as TouchEvent).changedTouches ||
        (e as unknown as HammerInput).changedPointers)
    ) {
      // jQuery Event中是前者，hammer Event中是后者
      const touches =
        (e as TouchEvent).changedTouches ||
        (e as unknown as HammerInput).changedPointers;
      event = touches[0];
    } else {
      event = e as MouseEvent;
    }
    let eventClientPosition = {
      x: event.clientX,
      y: event.clientY,
    };
    if (this.isDoughnutPlatform()) {
      const nativeScale = this.getSVGView().getDeviceNativeScale();
      eventClientPosition = {
        x: event.screenX / nativeScale,
        y:
          event.screenY / nativeScale -
          this.getDoughnutExportInfo().headerHeight,
      };
    }
    return eventClientPosition;
  }
  isInitRenderingCompleted() {
    return this._isInitRenderingCompleted;
  }
  initTemporaryColorThemeInOldThemeFiles() {
    this.afterRender().then(() => {
      if (!this.model.theme().getColorThemeId()) {
        const temporaryColorTheme = this.exportTheme({
          toColorTheme: true,
        });
        getInjectModule(MODULE_NAME.SNOWBALL).addCustomColorThemes([
          temporaryColorTheme,
        ]);
        this._currentTemporaryColorTheme = temporaryColorTheme;
      }
    });
  }
  getCurrentTemporaryColorTheme() {
    return this._currentTemporaryColorTheme;
  }
  getFileRealResource(resource: string) {
    return combineResourceString(this.config(CONFIG.URL_PREFIX), resource);
  }
  getSheetGeometryStatus() {
    return Object.assign(
      Object.assign(
        {},
        this.getSVGView().getCoordinateTransfer().mindMapToVisibleArea({
          x: 0,
          y: 0,
        }),
      ),
      {
        scale: this.getSVGView().getScale(),
      },
    );
  }
  restoreSheetGeometryStatus(status: { x: number; y: number; scale: number }) {
    const currentStatus = this.getSheetGeometryStatus();
    const [deltaX, deltaY] = [
      status.x - currentStatus.x,
      status.y - currentStatus.y,
    ];
    if (currentStatus.scale !== status.scale) {
      this.execAction(ACTION_NAMES.ZOOM, {
        scale: status.scale,
      });
    }
    if (deltaX || deltaY) {
      this.execAction(ACTION_NAMES.MOVE_VIEWPORT, {
        deltaX,
        deltaY,
      });
    }
  }
  /**
   * @param {Module} module
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static registerModule(module: any) {
    if (!module.identifier) {
      throw new Error("a module haven't name");
    }
    moduleMap[module.identifier.toLowerCase()] = module;
  }
}
function initModules(this: SheetEditor) {
  this._moduleMap = {};
  for (const key in moduleMap) {
    const item = moduleMap[key];
    this._moduleMap[item.identifier.toLowerCase()] = new item(this);
  }
}

export default SheetEditor;

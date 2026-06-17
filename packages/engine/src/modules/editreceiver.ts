import jquery from 'jquery';

import mommonFuncs from '../mommonfuncs';
import {
  VIEW_TYPE,
  MODULE_NAME,
  TOPIC_TITLE_MAX_WIDTH,
  CONFIG,
  EVENTS,
  UI_STATUS,
  STYLE_KEYS,
  COMMON_FONT_FAMILY,
  FILTER_MODE_OPACITY,
} from '../common/constants/index';
import backbone from 'backbone';

import * as utils from '../utils/index';
import * as commonUtils from '../common/utils/index';
import * as lazyRunner from '../figures/lazyrunner/index';
import Util from '../util';
import BranchView from '../view/branchview'; // @flow
/**
 * @fileOverview for receive topic edit action
 * editreceiver要一直获得焦点，以让copy&paste事件能触发
 * */
const { isMobile } = mommonFuncs;
/**
 * 综合概述edit receiver的所有逻辑
 * */
const MAX_WIDTH = TOPIC_TITLE_MAX_WIDTH;
const MIN_WIDTH = 80;
const lineHeight = 1.34;
const zIndexHideValue = -1;
const zIndexShowValue = 3;
// legend上marker文本的最大宽度
const legendMarkerDescTextMaxWidth = 200;
const GAP = isMobile ? 7 : 3;
const DEFAULT_FONTSIZE = 12;
const BOUNDARY_HORIZONTAL_PADDING = 26;
const BOUNDARY_EDITOR_VERTICAL_PADDING = 6;
const DB_CLICK = 'dblclick';
const DB_TAP = 'doubletap';
const CLICK = 'click';
const editAbleViewTypeList = [
  VIEW_TYPE.BOUNDARY,
  VIEW_TYPE.BRANCH,
  VIEW_TYPE.LEGEND,
  VIEW_TYPE.MATRIX_LABEL,
  VIEW_TYPE.RELATIONSHIP,
];
class InputAttributeDiffer {
  _style: any;
  _styleKeyToClear: string[];
  _inputElement: any;
  constructor(inputElement) {
    this._style = {};
    this._styleKeyToClear = [
      'color',
      'fontSize',
      'fontFamily',
      'fontStyle',
      'fontWeight',
      'textAlign',
      'textTransform',
      'textDecoration',
      'width',
      'height',
      'lineHeight',
      'backgroundColor',
    ];
    this._inputElement = inputElement;
  }
  css(styleObject) {
    styleObject = Object.assign({}, styleObject);
    if (styleObject.fontSize) {
      styleObject.fontSize = `${styleObject.fontSize}px`;
    }
    const diffMap = this._diffWidthCurrentStyle(styleObject);
    const styleKeyList = Object.keys(diffMap);
    if (styleKeyList.length) {
      styleKeyList.forEach(styleKey => {
        // @ts-ignore
        this._inputElement.style[styleKey] = diffMap[styleKey];
      });
    }
  }
  clearStyle() {
    this._styleKeyToClear.forEach(styleKey => {
      // @ts-ignore
      this._inputElement.style[styleKey] = null;
      delete this._style[styleKey];
    });
  }
  getStyle() {
    return Object.assign({}, this._style);
  }
  _diffWidthCurrentStyle(styleObject) {
    const differentAttrMap = {};
    Object.keys(styleObject).forEach(key => {
      if (styleObject[key] !== this._style[key]) {
        differentAttrMap[key] = styleObject[key];
        this._style[key] = styleObject[key];
      }
    });
    return differentAttrMap;
  }
}
/**
 * @description 计算text area高度的辅助函数
 * @link https://github.com/ElemeFE/element/blob/dev/packages/input/src/calcTextareaHeight.js
 * */
const calcTextAreaHeight = (() => {
  let hiddenTextarea;
  const HIDDEN_STYLE = `
    height:0 !important;
    visibility:hidden !important;
    overflow:hidden !important;
    position:absolute !important;
    z-index:-1000 !important;
    top:0 !important;
    right:0 !important
  `;
  const CONTEXT_STYLE = [
    'letter-spacing',
    'line-height',
    'padding-top',
    'padding-bottom',
    'font-family',
    'font-weight',
    'font-size',
    'text-rendering',
    'text-transform',
    'width',
    'text-indent',
    'padding-left',
    'padding-right',
    'border-width',
    'box-sizing',
  ];
  function calculateNodeStyling(node) {
    const style = window.getComputedStyle(node);
    const boxSizing = style.getPropertyValue('box-sizing');
    const paddingSize =
      parseFloat(style.getPropertyValue('padding-bottom')) + parseFloat(style.getPropertyValue('padding-top'));
    const borderSize =
      parseFloat(style.getPropertyValue('border-bottom-width')) +
      parseFloat(style.getPropertyValue('border-top-width'));
    const contextStyle = CONTEXT_STYLE.map(name => `${name}:${style.getPropertyValue(name)}`).join(';');
    return {
      contextStyle,
      paddingSize,
      borderSize,
      boxSizing,
    };
  }
  return (targetNode, text, minRows = null, maxRows = null) => {
    if (!hiddenTextarea) {
      hiddenTextarea = document.createElement('textarea');
      document.body.appendChild(hiddenTextarea);
    }
    const { paddingSize, borderSize, boxSizing, contextStyle } = calculateNodeStyling(targetNode);
    hiddenTextarea.setAttribute('style', `${contextStyle};${HIDDEN_STYLE}`);
    hiddenTextarea.value = text;
    let height = hiddenTextarea.scrollHeight;
    if (boxSizing === 'border-box') {
      height = height + borderSize;
    } else if (boxSizing === 'content-box') {
      height = height - paddingSize;
    }
    hiddenTextarea.value = '';
    const singleRowHeight = hiddenTextarea.scrollHeight - paddingSize;
    if (minRows !== null) {
      let minHeight = singleRowHeight * minRows;
      if (boxSizing === 'border-box') {
        minHeight = minHeight + paddingSize + borderSize;
      }
      height = Math.max(minHeight, height);
    }
    if (maxRows !== null) {
      let maxHeight = singleRowHeight * maxRows;
      if (boxSizing === 'border-box') {
        maxHeight = maxHeight + paddingSize + borderSize;
      }
      height = Math.min(maxHeight, height);
    }
    return {
      height: height,
    };
  };
})();
// @ts-ignore
export class EditReceiver {
  _inputElement: HTMLTextAreaElement;
  _targetView: any;
  _dummyTargetBranchView: any;
  _inputAttributeDiffer: InputAttributeDiffer;
  _hasEdited: boolean;
  _inComposition: boolean;
  currentTextStyle: any;
  _deFocusTimer: any;
  _context: any;
  semaphoreModule: any;
  selectionManager: any;
  static identifier: string;
  constructor(context) {
    this._inputElement = document.createElement('textarea');
    this._targetView = null;
    this._dummyTargetBranchView = null;
    this._inputAttributeDiffer = new InputAttributeDiffer(this._inputElement);
    this._hasEdited = false;
    this._inComposition = false;
    this.currentTextStyle = null;
    // deFocus触发定时器的清楚器
    this._deFocusTimer = null;
    Object.assign(this, backbone.Events);
    this._context = context;
    if (this._context.config(CONFIG.NO_EDIT_RECEIVER)) {
      return;
    }
    this.semaphoreModule = this._context.getModule(MODULE_NAME.SEMAPHORE);
    this.selectionManager = this._context.getModule(MODULE_NAME.SELECTION);
    this.initInputArea();
    this.initEventListener();
  }
  initInputArea() {
    this._inputElement.setAttribute('class', 'edit-receiver');
    this._inputElement.setAttribute('tabindex', '-1');
    this._inputAttributeDiffer.css({
      position: 'absolute',
      top: '0',
      left: '0',
      zIndex: `${zIndexHideValue}`,
      opacity: '0',
    });
    this.disableInput();
    this._context.getAppToolsContainer().append(this._inputElement);
  }
  initEventListener() {
    const { _context: context } = this;
    // edit receiver should always focus, to enable copy and paste action
    context.$el.on('focus', () => {
      // in no always focus mode, don't auto focus editreceiver
      // therefore, selection's deFocus status was invalid
      if (context.config(CONFIG.NO_ALWAYS_FOCUS_EDITRECEIVER)) {
        return;
      }
      this._prepareSelect();
    });
    const eventMap = {
      keydown: e => this.onKeyDown(e),
      focus: e => this.onFocus(e),
      focusin: e => e.preventDefault(),
      blur: e => this.onBlur(e),
      input: e => this.onInput(e),
      copy: e => this.onCopy(e),
      paste: e => this.onPaste(e),
      cut: e => this.onCut(e),
      compositionstart: () => this.onCompositionEvent(true),
      compositionend: () => this.onCompositionEvent(false),
    };
    Object.keys(eventMap).forEach(eventName => {
      // @ts-ignore
      this._inputElement.addEventListener(eventName, eventMap[eventName]);
    });
    context.onEvent(DB_CLICK, VIEW_TYPE.BRANCH, e => this._onViewDbClick(e));
    context.onGesture(DB_TAP, VIEW_TYPE.BRANCH, e => this._onViewDbTap(e));
    context.onEvent(DB_CLICK, VIEW_TYPE.BOUNDARY, e => this._onViewDbClick(e));
    context.onGesture(DB_TAP, VIEW_TYPE.BOUNDARY, e => this._onViewDbTap(e));
    context.onEvent(DB_CLICK, VIEW_TYPE.RELATIONSHIP, e => this._onViewDbClick(e));
    context.onGesture(DB_TAP, VIEW_TYPE.RELATIONSHIP, e => this._onViewDbTap(e));
    context.onEvent(DB_CLICK, VIEW_TYPE.MATRIX_LABEL, e => this._onViewDbClick(e));
    context.onGesture(DB_TAP, VIEW_TYPE.MATRIX_LABEL, e => this._onViewDbTap(e));
    context.onEvent(DB_CLICK, VIEW_TYPE.LEGENDMARKERLIST, e => this._onViewDbClick(e));
    context.onEvent(CLICK, VIEW_TYPE.INFOITEM, e => {
      e.sbView.showEditor(e);
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context.onGesture('tap', VIEW_TYPE.SVG, e => {
      this._inputElement.blur();
    });
    context.on(EVENTS.SHEET_CONTENT_LOADED, () => {
      context.afterRender().then(() => {
        this._locateInputByCurrentSelection();
      });
    });
    context.on(EVENTS.SELECTION_CHANGED, () => {
      if (!this.getTargetFromSelection()) {
        return this.disableInput();
      } else {
        this.enableInput();
      }
      this._locateInputByCurrentSelection();
    });
    context.on(EVENTS.SCALE_CHANGED, () => {
      this._locateInputByCurrentSelection();
    });
    window.addEventListener('resize', () => {
      const isEditingTitle = context.getActiveUIStatus().includes(UI_STATUS.EDIT_TITLE);
      if (isEditingTitle) {
        setTimeout(() => this.updateInputPosition(), 10);
      }
    });
  }
  updateTargetView(targetView) {
    this._targetView = targetView;
    if (!targetView) {
      return;
    }
    this.currentTextStyle = targetView.getTextClientStyle();
  }
  _onViewDbClick(e /*UiEvent*/) {
    const sbView = e.sbView;
    if (sbView.shouldPreventTitle && sbView.shouldPreventTitle()) {
      return;
    }
    if (sbView.originBranchView) {
      return;
    }
    this.show(sbView.getEditContent(), sbView);
  }
  _onViewDbTap(e /*UiEvent*/) {
    e.stopPropagation();
    if (e.sbView.originBranchView) {
      return;
    }
    this._onViewDbClick(e);
  }
  getOriginalTargetView() {
    return this._targetView;
  }
  _switchInputElementStyles() {
    const DEFAULT_INPUT_STYLE = 'bordered';
    const inputStyles = [DEFAULT_INPUT_STYLE, VIEW_TYPE.MATRIX_LABEL, VIEW_TYPE.BOUNDARY];
    const onInputStyles: any[] = [];
    switch (this._targetView.type) {
      case VIEW_TYPE.MATRIX_LABEL:
        onInputStyles.push(VIEW_TYPE.MATRIX_LABEL);
        break;
      case VIEW_TYPE.BOUNDARY:
        this._targetView.selectBox.stateMachine.transition(this._targetView.selectBox.event_edit);
        onInputStyles.push(VIEW_TYPE.BOUNDARY);
        break;
      default:
        if (!this._dummyTargetBranchView) {
          onInputStyles.push(DEFAULT_INPUT_STYLE);
        }
        break;
    }
    const offInputStyles = inputStyles.filter(style => onInputStyles.indexOf(style) === -1);
    jquery(this._inputElement).toggleClass(offInputStyles, false);
    jquery(this._inputElement).toggleClass(onInputStyles, true);
    switch (this._targetView.type) {
      case VIEW_TYPE.MATRIX_LABEL:
        // eslint-disable-next-line no-case-declarations
        let backgroundColor = this._targetView.getStyleValue(STYLE_KEYS.FILL_COLOR);
        // MatrixCellViews' fill color might be 'none', acquire sheetView's background instead
        if (!backgroundColor || backgroundColor.toLowerCase() === 'none') {
          backgroundColor = this._context.getSheetView().getBlendingBackgroundColor();
        }
        this._inputElement.style.backgroundColor = backgroundColor;
        this._inputElement.style.color = this._targetView.getStyleValue(STYLE_KEYS.TEXT_COLOR);
        break;
      case VIEW_TYPE.BOUNDARY:
        this._inputElement.style.backgroundColor = this._targetView.titleView.figure.bgFillColor;
        this._inputElement.style.color = this._targetView.titleView.figure.textColor;
        break;
      case VIEW_TYPE.LEGENDMARKERLIST:
        this._inputElement.style.fontFamily = COMMON_FONT_FAMILY;
    }
  }
  show(text: string, targetView) {
    let _a;
    // if (this._context.isReadOnly()) {
    //   return false;
    // }
    if (!targetView) {
      return;
    }
    this.updateTargetView(targetView);
    if (this.isAddingRelationship()) {
      return;
    }
    this.semaphoreModule.increase(UI_STATUS.EDIT_TITLE, {
      forceFlush: true,
    });
    this._inputAttributeDiffer.clearStyle();
    if (targetView instanceof BranchView) {
      this._dummyTargetBranchView = Object(utils.standin)(targetView /*View.BranchView*/);
      this._dummyTargetBranchView.topicView.on('change:bounds', () => {
        this.updateTextClientSize();
      });
      if ((_a = this.selectionManager) === null || _a === undefined) {
        // do nothing
      } else {
        _a.selectSingle(this._dummyTargetBranchView);
      }
    }
    this._switchInputElementStyles();
    this.setEditingTargetOpacityInFilterMode(1);
    if (commonUtils.isDefined(text)) {
      this._inputElement.value = text;
    }
    this._inputAttributeDiffer.css(this.currentTextStyle);
    this._inputAttributeDiffer.css({
      position: 'absolute',
      zIndex: `${zIndexShowValue}`,
      opacity: `1`,
    });

    if (this._context.isReadOnly()) {
      this.disableInput();
    } else {
      this.enableInput();
    }

    let titleView;
    if (targetView instanceof BranchView) {
      titleView = targetView.topicView.titleView;
    } else {
      titleView = targetView.titleView;
    }
    const isSelectAll = titleView && titleView.isUnedited();
    lazyRunner.lazyRunner.work(lazyRunner.runnerConstants.PRIORITY.AFTER_EACH, {
      execute: () => {
        this.updateInputPosition();
        this._setInputSize();
        this._inputElement.focus();
        if (text) {
          if (isSelectAll) {
            /**
             * @link https://gitlab.xmind.cn/xmind/snowbrush/issues/340
             * @desc remove the feature that "clear text content in unedited topic"
             * because same map in old version snowbrush, topic with edited content would also
             * has this property
             * */
            this._inputElement.select();
          } else {
            this._inputElement.setSelectionRange(-1, -1);
          }
        }
      },
    });
  }
  setEditingTargetOpacityInFilterMode(opacity) {
    let _b;
    if (!this.semaphoreModule.isStatusActive(UI_STATUS.FILTER_MODE)) {
      return;
    }
    const viewListToBeFiltered = [VIEW_TYPE.BOUNDARY, VIEW_TYPE.RELATIONSHIP];
    if (!viewListToBeFiltered.includes(this._targetView?.type)) {
      return;
    }
    if ((_b = this._targetView) === null || _b === undefined) {
      // do nothing
    } else {
      _b.figure.setOpacity(opacity);
    }
  }
  getTextSize(content, style) {
    return Object(utils.getTextSize)(content, style);
  }
  /**
   * @description Reset TextArea 位置，使得和对应的 text 保持一致
   * */
  updateInputPosition() {
    const svgView = this._context.getSVGView();
    const scale = svgView.currentScale;
    const targetView = this._dummyTargetBranchView || this._targetView;
    if (!(targetView === null || targetView === undefined ? undefined : targetView.getContext())) {
      return;
    }
    let offsetX = 0;
    let offsetY = 0;
    let titleViewRealPosition = {
      x: 0,
      y: 0,
    };
    switch (targetView.type) {
      case VIEW_TYPE.BRANCH:
        {
          const size = this.getBranchViewSize();
          if (size.targetHeight > 0) {
            offsetY -= ((size.height - size.targetHeight) / 2) * scale;
          }
          const topicTitleFigure = targetView.topicView.titleView.figure;
          const offsetWidth = (size.width - topicTitleFigure.size.width) * scale;
          if (topicTitleFigure.textAlign === 'center') {
            offsetX -= offsetWidth / 2;
          }
          if (topicTitleFigure.textAlign === 'right') {
            offsetX -= offsetWidth;
          }
          titleViewRealPosition = targetView.topicView.titleView.getRealPosition();
        }
        break;
      case VIEW_TYPE.BOUNDARY:
        if (targetView.titleView.text) {
          titleViewRealPosition = targetView.titleView.getRealPosition();
        } else {
          const fontOffset = parseInt(this.currentTextStyle?.fontSize || DEFAULT_FONTSIZE) / 2;
          titleViewRealPosition = Object(commonUtils.addPoint)(targetView.getRealPosition(), {
            x: utils.layoutConstant.BOUNDARY_TITLE.CONTENT_PADDING_HORIZON * 2 + fontOffset,
            y: -utils.layoutConstant.BOUNDARY_TITLE.CONTENT_PADDING_VERTICAL * 4,
          });
        }
        break;
      case VIEW_TYPE.RELATIONSHIP:
        titleViewRealPosition = targetView.titleView.getRealPosition();
        break;
      case VIEW_TYPE.MATRIX_LABEL:
        {
          const labelSize = targetView.getProxy().bounds;
          const titleViewSize = targetView.figure.size;
          offsetX = ((labelSize.width - titleViewSize.width) * scale) / 2;
          offsetY = ((labelSize.height - titleViewSize.height) * scale) / 2;
          titleViewRealPosition = targetView.getRealPosition();
        }
        break;
      case VIEW_TYPE.LEGENDMARKERLIST:
        titleViewRealPosition = targetView.getTextRealPosition();
        break;
    }
    const mindmapCenterPositionTrans = svgView.getSheetTranslate();
    const transferPosition = {
      x: titleViewRealPosition.x * scale + mindmapCenterPositionTrans.x,
      y: titleViewRealPosition.y * scale + mindmapCenterPositionTrans.y,
    };
    // Chrome renders Serif font in TextArea with some px off from the top for some certain FontSize.
    // Sans-Serif font doesn't have such kind of problem.
    // There's no easy way to know if the rendered text is using Serif font or not.
    // So we can't apply generic offset to all the text.
    // Issue #716: https://gitlab.xmind.cn/xmind/snowbrush/issues/716
    // `transform: translate()` leads to a text selection range problem
    this._inputAttributeDiffer.css({
      transform: `scale(${scale})`,
      left: `${transferPosition.x + offsetX}px`,
      top: `${transferPosition.y + offsetY}px`,
    });
  }
  _setInputSize() {
    const { currentTextStyle } = this;
    const scale = this._context.getSVGView().currentScale;
    if (!this._targetView) {
      return;
    }
    const type = this._targetView.type;
    const textClientBounds = this._targetView.getTextClientBounds();
    const currentInputValue = this._inputElement.value;
    const originContentValue = this._targetView.getEditContent();
    const titleMaxWidth = this.getTitleMaxWidth();
    // 获取当前输入内容的带换行格式文本
    const currentInputResolveStr = Object(utils.resolveString)(currentInputValue, currentTextStyle, titleMaxWidth).join(
      '\n'
    );
    // 获取带换行文本所会占用的宽度与高度，已计入缩放值影响，currentTextStyle的fontSize会随着缩放值改变
    let {
      // eslint-disable-next-line prefer-const
      width: currentInputWidth,
      height: currentInputHeight,
    } = this.getTextSize(currentInputResolveStr, currentTextStyle);
    // 获取被修改对象的原始文本的带换行格式文本
    const originContentResolveStr = Object(utils.resolveString)(
      originContentValue,
      currentTextStyle,
      titleMaxWidth
    ).join('\n');
    // 获取原始文本的宽度与高度
    let {
      // eslint-disable-next-line prefer-const
      width: originContentWidth,
      height: originContentHeight,
    } = this.getTextSize(originContentResolveStr, currentTextStyle);
    if (Object(utils.isBranch)(this._targetView) && this._dummyTargetBranchView) {
      // If we have a _dummyTargetBranchView. We can size textClient with that dummy.
      const size = this.getBranchViewSize();
      this._inputAttributeDiffer.css({
        width: Math.max(size.width, currentInputWidth) + 'px',
        height: Math.max(size.height, currentInputHeight) + 'px',
      });
      return;
    } else if (type === VIEW_TYPE.LABEL) {
      this._inputAttributeDiffer.css({
        // 输入框的宽度不应该小于原始文本宽度
        // width: Math.max(currentInputWidth, originContentWidth),
        height: Math.max(currentInputHeight, originContentHeight) * 1.25 + 'px',
      });
    } else if (type === VIEW_TYPE.RELATIONSHIP) {
      // 若是relationship
      this._inputAttributeDiffer.css({
        width: Math.max(originContentWidth, currentInputWidth, MIN_WIDTH) + GAP + 'px',
      });
    } else if (type === VIEW_TYPE.BOUNDARY) {
      // 宽度为 boundary title 最大范围的宽度, 计入缩放值影响
      const fontSize = parseInt(this.currentTextStyle.fontSize || DEFAULT_FONTSIZE);
      const inputWidth = Math.max(textClientBounds.width - BOUNDARY_HORIZONTAL_PADDING * 2 - fontSize / 2, fontSize);
      const currentInputResolveStr = Object(utils.resolveString)(currentInputValue, currentTextStyle, inputWidth).join(
        '\n'
      );
      const { height: currentInputHeight } = this.getTextSize(currentInputResolveStr, currentTextStyle);
      // 直接从 boundary title view 里面获取高度
      const originContentHeight = this._targetView.titleView.bounds.height - BOUNDARY_EDITOR_VERTICAL_PADDING * 2;
      this._inputAttributeDiffer.css({
        width: inputWidth / scale + 'px',
        height: Math.max(originContentHeight, currentInputHeight) + 'px',
      });
    } else if (type === VIEW_TYPE.LEGENDMARKERLIST) {
      // 若是marker list todo 还不好
      this._inputAttributeDiffer.css({
        // 输入框的宽度不应该小于原始文本宽度
        width:
          Math.min(Math.max(currentInputWidth, originContentWidth, MIN_WIDTH), legendMarkerDescTextMaxWidth) +
          GAP +
          'px',
        'line-height': '1px',
        'text-align': 'left',
      });
    } else if (type === VIEW_TYPE.MATRIX_LABEL) {
      this._inputAttributeDiffer.css({
        width: Math.max(currentInputWidth, originContentWidth) + GAP + 'px',
        'line-height': `${currentTextStyle.fontSize * 1.25}px`,
      });
    } else {
      this._inputAttributeDiffer.css({
        // 输入框的宽度不应该小于原始文本宽度
        width: Math.max(currentInputWidth, originContentWidth, MIN_WIDTH) + GAP + 'px',
        'line-height': `${currentTextStyle.fontSize * 1.25}px`,
      });
    }
    currentInputHeight = calcTextAreaHeight(this._inputElement, currentInputResolveStr).height;
    originContentHeight = calcTextAreaHeight(this._inputElement, originContentResolveStr).height;
    // boundary 在上面已经有独立的一套 height 计算方式, 这里就不需要执行通用计算了
    if (type !== VIEW_TYPE.BOUNDARY) {
      this._inputAttributeDiffer.css({
        height: (type === VIEW_TYPE.LEGENDMARKERLIST ? 18 : Math.max(currentInputHeight, originContentHeight)) + 'px',
      });
    }
  }
  // todo need to change function name
  getBranchViewSize() {
    const fontSize = parseInt(this.currentTextStyle?.fontSize || DEFAULT_FONTSIZE);
    // Size (Different component might have different path.)
    // We just use the rendered text BBox as the init textarea size.
    const targetBranchView = this._dummyTargetBranchView || this._targetView;
    const titleBounds = targetBranchView.topicView.titleView.bounds;
    const lineCount = Math.max(1, Math.round(titleBounds.height / Math.floor(fontSize * lineHeight))); // Fixed line-height: 1.34em
    const realHeight = lineCount * Math.floor(fontSize * lineHeight); // Fixed line-height: 1.34em
    return {
      width: Math.ceil(Math.max(titleBounds.width, fontSize / 2)),
      height: realHeight,
      lineCount: lineCount,
      targetHeight: titleBounds.height,
    };
  }
  /** @private */
  updateTextClientSize() {
    if (this._dummyTargetBranchView) {
      const transformedText = Util.getTransformedText(this._inputElement.value, this.currentTextStyle.textTransform);
      this._dummyTargetBranchView.noSideEffect(this._dummyTargetBranchView.saveEdit, transformedText, {
        isSilent: true,
      });
      lazyRunner.lazyRunner.work(lazyRunner.runnerConstants.PRIORITY.AFTER_EACH, {
        execute: () => {
          this.updateInputPosition();
          this._setInputSize();
        },
      });
    } else {
      this.updateInputPosition();
      this._setInputSize();
    }
  }
  /**
   * @private
   * */
  _setHideStyle() {
    this._inputAttributeDiffer.css({
      zIndex: zIndexHideValue,
      opacity: 0,
    });
    this._inputElement.value = '';
    // Currently there're two hide method: hide() / onBlur()
    // Not sure which one is real. So it should be safe to remove the dummy component here.
    if (this._dummyTargetBranchView) {
      const selectionManager = this._context.getModule(MODULE_NAME.SELECTION);
      if (selectionManager) {
        if (selectionManager.getSelections().includes(this._dummyTargetBranchView)) {
          if (selectionManager.getSelections().length === 1) {
            selectionManager.removeFromSelection(this._dummyTargetBranchView);
          }
          selectionManager.selectSingle(this._targetView);
        }
      }
      this._dummyTargetBranchView.remove();
      this._dummyTargetBranchView = null;
    }
    switch (this._targetView.type) {
      case VIEW_TYPE.BOUNDARY:
        this._targetView.selectBox.stateMachine.transition(this._targetView.selectBox.event_edit_end);
        break;
    }
    this.setEditingTargetOpacityInFilterMode(FILTER_MODE_OPACITY);
    this.updateTargetView(null);
    this.semaphoreModule.decrease(UI_STATUS.EDIT_TITLE, {
      forceFlush: true,
    });
  }
  /**
   * @description 当输出框将超出view port的时候，移动view port，保证输入框始终在视口内部
   * @private
   * */
  _moveViewPortIfOutOfScreen() {
    const inputBoundingRect = this._inputElement.getBoundingClientRect();
    // 获取输入框在svg container内部的位置
    const svgBoundingRect = this._context.getSVGView().svg.node.getBoundingClientRect();
    /** @type {MoveViewPortModule} */
    const moveViewPortModule = this._context.getModule(MODULE_NAME.MOVE_VIEW_PORT);
    let deltaX = 0;
    let deltaY = 0; // 若左侧超出
    if (inputBoundingRect.left < svgBoundingRect.left) {
      deltaX = svgBoundingRect.left - inputBoundingRect.left;
    }
    // 一般都是右侧会超出，所以这里比较重要
    if (inputBoundingRect.right > svgBoundingRect.right) {
      deltaX = svgBoundingRect.right - inputBoundingRect.right;
    }
    // 若是上侧超出 会上侧超出吗？
    if (inputBoundingRect.top < svgBoundingRect.top) {
      deltaY = svgBoundingRect.top - inputBoundingRect.top;
    }
    // 若是下侧超出，这个也比较常见
    if (inputBoundingRect.bottom > svgBoundingRect.bottom) {
      deltaY = svgBoundingRect.bottom - inputBoundingRect.bottom;
    }
    moveViewPortModule.tryToMoveViewPort(deltaX, deltaY);
  }
  /** @private */
  saveEdit() {
    if (!this._hasEdited) {
      return;
    }
    this._targetView.saveEdit(this._inputElement.value);
    this._hasEdited = false;
  }
  /**
   * @return {boolean}
   * @private
   * */
  isVisible() {
    return Number(this._inputElement.style.zIndex) > 0;
  }
  /** @private */
  onFocus(e) {
    e.preventDefault();
    e.stopPropagation();
    clearTimeout(this._deFocusTimer);
    this.semaphoreModule.decrease(UI_STATUS.DE_FOCUS);
  }
  /**
   * @private
   * */
  onInput(e) {
    if (this.isAddingRelationship()) {
      return;
    }
    if (!this.isVisible()) {
      // in isVisible status, space key shouldn't enter input process
      if (e.inputType === 'insertText' && e.data === ' ') {
        return e.preventDefault();
      }
      this.updateTargetView(this.getTargetFromSelection());
      if (this._targetView) {
        this.show(null, this._targetView);
      } else {
        e.preventDefault();
      }
    }
    if (e.inputType === 'insertText' && !e.data && !this._hasEdited) {
      return;
    }
    this._hasEdited = true;
    if (this._targetView) {
      this.updateTextClientSize();
    }
    const inputHandlerFn = this._context.config(CONFIG.INPUT_HANDLER);
    if (typeof inputHandlerFn === 'function') {
      inputHandlerFn(e).then(() => {});
    }
  }
  /**
   * @private
   */
  getTargetFromSelection() {
    const selections = this._context.getModule(MODULE_NAME.SELECTION).getSelections();
    const selectionsFilterResult = selections.filter(selection => {
      const type = selection.type;
      if ([VIEW_TYPE.BRANCH, VIEW_TYPE.RELATIONSHIP, VIEW_TYPE.MATRIX_LABEL].indexOf(type) !== -1) {
        return true;
      }
      if (VIEW_TYPE.BOUNDARY === type) {
        return !selection.shouldPreventTitle();
      }
    });
    return selectionsFilterResult[0];
  }
  /** @private */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onBlur(e) {
    // 若制定时间之内没有触发focus事件，则更新ui状态为deFocus
    this._deFocusTimer = setTimeout(() => {
      // 更新ui状态
      if (this._context.config(CONFIG.NO_ALWAYS_FOCUS_EDITRECEIVER)) {
        return;
      }
      this.semaphoreModule.increase(UI_STATUS.DE_FOCUS);
    }, 200);
    const isVisible = this.isVisible();
    const noHandleBlurCfgFn = this._context.config(CONFIG.NO_HANDLE_EDIT_RECEIVER_BLUR);
    if (!isVisible || (typeof noHandleBlurCfgFn === 'function' && noHandleBlurCfgFn())) {
      return;
    }
    this.saveEdit();
    this._setHideStyle();
  }
  /**
   * @param {KeyboardEvent} e
   * @private
   * */
  onKeyDown(e) {
    const keyCode = e.keyCode;
    const modifier = {
      hasAlt: e.altKey,
      hasShift: e.shiftKey,
      hasCtrl: e.ctrlKey,
      hasMeta: e.metaKey,
    };
    const KEYS = {
      ENTER: 13,
      TAB: 9,
      Z: 90,
      ESC: 27,
      SPACE: 32,
      KEY_IN_COMPOSING: 229,
    };
    // Snowbrush editreceiver default keyboard events.
    const getDefaultCommand = (keyCode, modifier) => {
      switch (keyCode) {
        case KEYS.ENTER:
          return () => {
            if (!this.isVisible()) {
              return;
            }
            if (modifier.hasShift) {
              return;
            }
            // manually insert a break line
            if (modifier.hasCtrl || (modifier.hasMeta && Object(utils.browserIsMac)())) {
              document.execCommand('insertText', false, '\n');
              this._hasEdited = true;
              this.updateTextClientSize();
              return;
            }
            // end editing
            e.stopPropagation();
            e.preventDefault();
            this.saveEdit();
            this._setHideStyle();
            if (this._context.config(CONFIG.NO_ALWAYS_FOCUS_EDITRECEIVER)) {
              this._inputElement.blur();
            }
          };
        case KEYS.TAB:
          return () => {
            if (this._inComposition) {
              e.preventDefault();
              e.stopPropagation();
            } else if (this.isVisible()) {
              e.preventDefault();
              this.saveEdit();
              this._setHideStyle();
            } else {
              e.preventDefault();
            }
          };
        case KEYS.Z:
          return () => {
            if (modifier.hasMeta || modifier.hasCtrl) {
              if (!this.isVisible()) {
                e.preventDefault();
              }
            }
          };
        case KEYS.ESC:
          return () => {
            if (this.isVisible()) {
              e.stopPropagation();
              e.preventDefault();
              this.saveEdit();
              this._setHideStyle();
            }
          };
        case KEYS.SPACE:
          return () => {
            if (e.key === 'Unidentified') {
              return;
            }
            if (this.isVisible()) {
              return;
            }
            const editableViewType = [
              VIEW_TYPE.BRANCH,
              VIEW_TYPE.BOUNDARY,
              VIEW_TYPE.RELATIONSHIP,
              VIEW_TYPE.MATRIX_LABEL,
            ];
            this.updateTargetView(this.getTargetFromSelection());
            if (this._targetView && editableViewType.includes(this._targetView.type)) {
              e.preventDefault();
              this.show(this._targetView.getEditContent(), this._targetView);
            }
          };
        case KEYS.KEY_IN_COMPOSING: {
          return () => {
            if (this.isVisible()) {
              return;
            }
            if (e.key === 'CapsLock') {
              return;
            }
            const editableViewType = [
              VIEW_TYPE.BRANCH,
              VIEW_TYPE.BOUNDARY,
              VIEW_TYPE.RELATIONSHIP,
              VIEW_TYPE.MATRIX_LABEL,
            ];
            this.updateTargetView(this.getTargetFromSelection());
            if (this._targetView && editableViewType.includes(this._targetView.type)) {
              this.show(null, this._targetView);
            }
          };
        }
        default:
          return null;
      }
    };
    // get command from config or default.
    const getCommand = this._context.config(CONFIG.KEYBINDING_SERVICE);
    const command = getCommand(keyCode, modifier) || getDefaultCommand(keyCode, modifier);
    // execute the command
    if (command) {
      command();
    }
    if (keyCode === KEYS.ENTER) {
      if (!this.isVisible() || (this.isVisible() && !modifier.hasShift)) {
        e.preventDefault();
      }
    }
  }
  /**
   * @param {KeyboardEvent} e
   * @private
   * */
  onCopy(e) {
    if (!this.isVisible()) {
      e.preventDefault();
      this.trigger('copy', e);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  trigger(arg0: string, e: any) {
    throw new Error('Method not implemented.');
  }
  /**
   * @param {KeyboardEvent} e
   * @private
   * */
  onPaste(e) {
    if (!this.isVisible()) {
      e.preventDefault();
      this.trigger('paste', e);
    }
  }
  onCut(e) {
    if (!this.isVisible()) {
      e.preventDefault();
      this.trigger('cut', e);
    }
  }
  onCompositionEvent(isInComposition) {
    this._inComposition = isInComposition;
  }
  _prepareSelect() {
    this._inputElement.value = '';
    this._inputElement.select();
  }
  /**
   * @param {boolean} notSaveEdit
   * @public
   * */
  hide(notSaveEdit) {
    if (!notSaveEdit) {
      this.saveEdit();
    }
    this._setHideStyle();
  }
  /**
   * @public
   * @return {jQuery}
   * */
  getInputDOM() {
    return this._inputElement;
  }
  /**
   * @description 将输入框移动到current component的位置
   * @public
   * */
  _locateInputByCurrentSelection() {
    if (this._context.isHibernating()) {
      return;
    }
    const selectionManager = this._context.getModule(MODULE_NAME.SELECTION);
    if (!selectionManager) {
      return;
    }
    // @ts-ignore
    const targetView = selectionManager.getSelections()[0] || this._context.getSheetView().getCentralBranchView();
    if (!targetView || !editAbleViewTypeList.includes(targetView.type)) {
      return;
    }
    // 设置setTimeout是为了保证因select引发的currentComponent的更新总是发生在上一轮blur之后
    // 确保不会将文本内容存储到错误的组件上去
    // 如果你有更好的方法，可以改
    setTimeout(() => {
      if (!(targetView === null || targetView === undefined ? undefined : targetView.getContext())) {
        return;
      }
      if (this.isVisible()) {
        return;
      }
      this.updateTargetView(targetView);
      this.updateInputPosition();
    }, 0);
  }
  enableInput() {
    this._inputElement.removeAttribute('readonly');
  }
  disableInput() {
    this._inputElement.setAttribute('readonly', 'true');
  }
  isAddingRelationship() {
    return this.semaphoreModule.isStatusActive(UI_STATUS.ADD_RELATIONSHIP);
  }
  getTitleMaxWidth() {
    let _a;
    let titleMaxWidth = MAX_WIDTH;
    if (this._targetView instanceof BranchView) {
      const topicFigure = this._targetView.topicView.figure;
      if (topicFigure.customWidth || topicFigure.forceAlignmentWidth) {
        titleMaxWidth =
          ((_a = this._targetView.topicView.titleView) === null || _a === undefined
            ? undefined
            : _a.figure.size.width) || MAX_WIDTH;
      }
    }
    return titleMaxWidth;
  }
  /** @public */
  repairPosition() {
    let _a;
    if (!((_a = this._targetView) === null || _a === undefined ? undefined : _a.getContext())) {
      return;
    }
    this.updateInputPosition();
  }
}
EditReceiver.identifier = MODULE_NAME.EDIT_RECEIVER;
export default EditReceiver;

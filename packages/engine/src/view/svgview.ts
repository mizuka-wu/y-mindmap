import * as lib from '../lib/index';
import mommonFuncs from '../mommonfuncs';
import { CONFIG, EVENTS, MODULE_NAME, VIEW_TYPE, UI_STATUS } from '../common/constants/index';
import SvgComponentView from './svgcomponentview';
import jquery from 'jquery';
import Inertialpanning from '../utils/interialpanning';
import * as utils from '../utils/index';
import CanvasControl from '../view/helper/canvascontrol';

import backbone from 'backbone';

import SheetView from './sheetview';
import underscore from 'underscore';
import CanvasConstrolNoScrollCache from './helper/canvascontrolnoscrollcache';
import SelectionStatesRestorer from './helper/selectionstatesrestorer';

import type { BranchView, SheetEditor, Position } from '../type.d';

/**
 * @fileOverview SVG paint board's view
 * */
const SCALE_DURATION = 300;
export class SvgView extends SvgComponentView {
  _deviceNativeScale: number;
  _content: SheetView | null;
  _initWheelScaleProcessFlag: boolean;
  _isScaled: boolean;
  currentScale: number;
  clickCount: number;
  model2View: Record<string, SheetView | BranchView>;
  _isScaleMoving: boolean;
  _fingerScaleHandler: FingerScaleHandler;
  _context: SheetEditor;
  _pinchStartScale: any;
  selectionManager: any;
  eventBus: backbone.Events;
  _$scrollContainer: JQuery<any>;
  inertialPanning: Inertialpanning;
  _canvasControl: CanvasControl;
  initGeometryStatus: any;
  container: any;
  svg: typeof lib.SVG.Doc;
  _multiSelectG: typeof lib.SVG.G;
  _scaleClearFn: any;
  constructor(context: SheetEditor, el: HTMLElement) {
    super({
      el,
    });
    this._deviceNativeScale = 1;
    this._content = null;
    this._initWheelScaleProcessFlag = false;
    this._isScaled = false;
    this.currentScale = 1;
    this.clickCount = 0;
    this.model2View = {};
    this._isScaleMoving = false;
    if (!context) {
      throw new Error('must indicate el argument in SVGView initialization');
    }
    this._fingerScaleHandler = new FingerScaleHandler(this);
    this._context = context;
    this._pinchStartScale = null;
    this.selectionManager = this._context.getModule('selectionmanager');
    this.eventBus = Object.assign({}, backbone.Events);
    this._$scrollContainer = jquery(this._context.getScrollContainer());
    // this.container.translate(this.$el.width() / 2, this.$el.height() / 2);
    this.inertialPanning = new Inertialpanning();
    this.initSVGStructure();
    /**
     * @type {CanvasControl}
     * @private
     * */
    this._canvasControl = this._context.isDoughnutPlatform()
      ? new CanvasConstrolNoScrollCache(this)
      : new CanvasControl(this);
    new SelectionStatesRestorer(this._context);
    this.initGeometryStatus = this._context._option?.initSheetGeometryStatus;
    if (this.initGeometryStatus) {
      // restore init scale
      const { scale } = this.initGeometryStatus;
      this.currentScale = scale / 100;
      this.container.scale(this.currentScale);
    }
  }
  get type() {
    return VIEW_TYPE.SVG;
  }
  get lifeCycleEvents() {
    return {
      contentMount: 'contentMount',
      scaleChanged: 'scaleChanged',
    };
  }
  initSVGStructure() {
    this.$el.append('<div class="wallpaper"></div>');
    /** @public @type {SVG.Element} */
    this.svg = lib.SVG(this.el).spof().style({
      display: 'block',
    });
    /** @public */
    this.container = this.svg.group().data('name', 'container');
    const elWidth = this.$el.width();
    const elHeight = this.$el.height();
    if (typeof elWidth !== 'undefined' && typeof elHeight !== 'undefined') {
      this.container.translate(elWidth / 2, elHeight / 2);
    }
    this._multiSelectG = this.svg.group().data('name', 'multi-select-box_container');
  }
  /**
   * @return {SheetEditor}
   * @public
   * */
  getContext() {
    return this._context;
  }
  /**
   * @return {CanvasControl}
   * @public
   * */
  getCanvasControl() {
    return this._canvasControl;
  }
  /**
   * @description 移动视口
   * @param {boolean} options.animate
   * @param {Function} options.finishToRun
   * @public
   * @deprecated
   * */
  move(x: number, y: number, options?: { animate?: boolean; finishToRun?: () => void }) {
    this._canvasControl.move(x, y, options);
  }
  /**
   * @description 获取root branch相对于sheet初始状态的偏移量
   * @description 命名为getSheetTranslate，是因为实质上是sheet在偏移
   * @return {position}
   * @public
   * */
  getSheetTranslate() {
    return this._canvasControl.getSheetContentTranslate();
  }
  /** @description 获取位置转换工具 */
  getCoordinateTransfer() {
    return this._canvasControl.getCoordinateTransfer();
  }
  getMultiSelectG() {
    return this._multiSelectG;
  }
  getSheetView() {
    return this._content;
  }
  content(content?: SheetView): SheetView | null {
    if (typeof content === 'undefined') {
      return this._content || null;
    }
    if (content === this._content) {
      return this as unknown as SheetView;
    }
    content = content || null;
    if (this._content) {
      this._content.remove();
      this._content.parent(null);
    }
    this._content = content;
    if (content) {
      content.parent(this);
      this.container.add(content.svg, 0);
    }
    if (this.el.parentNode) {
      this.initView();
    }
    const initPosition = this.initGeometryStatus
      ? {
          x: this.initGeometryStatus.x,
          y: this.initGeometryStatus.y,
        }
      : null;
    this.trigger(this.lifeCycleEvents.contentMount, {
      initPosition,
    });
    return this as unknown as SheetView;
  }
  initView() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const content = self.content();
    if (content) {
      content.initView();
    }
    this.eventBus.trigger('centralRenderOk');
    return self;
  }
  editDomain() {
    return this;
  }
  remove() {
    let _a;
    if ((_a = this._content) === null || _a === undefined) {
      // do nothing
    } else {
      _a.remove();
    }
    this.stopListening();
    return this;
  }
  createFloatingTopic(clientPosition: Position) {
    if (this.getContext().getActiveUIStatus().indexOf(UI_STATUS.ADD_FLOATINGTOPIC) !== -1) {
      return;
    }
    const content = this.content();
    if (content instanceof SheetView) {
      const rootTopic = (content.model as any).rootTopic();
      const topicModel = rootTopic.createEmptyTopic({
        title: this.getContext().getTranslatedText('DEFAULT_FLOATING_TOPIC_TITLE'),
        titleUnedited: true,
      });
      topicModel.set('position', this.getCoordinateTransfer().viewportToMindMap(clientPosition));
      rootTopic.addChildTopic(topicModel, {
        type: 'detached',
      });
    }
  }
  /**
   * @description 检测当前使用滚轮是否是缩放操作
   * @param {MouseEvent} e
   * */
  isEnableScaleByWheel(e: MouseEvent) {
    return (e.ctrlKey && !mommonFuncs.isMac) || ((e.ctrlKey || e.metaKey) && mommonFuncs.isMac);
  }
  /**
   * @param {WheelEvent} e.originalEvent
   * @private
   * */
  setScaleByWheel(e: { originalEvent: WheelEvent }) {
    const { deltaX } = e.originalEvent;
    // 先只看deltaY的值，双指缩放下deltaX绝对值始终为0
    if (Math.abs(deltaX) === 0) {
      if (!this._initWheelScaleProcessFlag) {
        this._fingerScaleHandler.initProcess(this.currentScale);
        this._initWheelScaleProcessFlag = true;
      }
      clearTimeout(this._endWheelScaleProcessFlag);
      this._fingerScaleHandler.startProcess(e.originalEvent);
      this._endWheelScaleProcessFlag = setTimeout(() => {
        this._endWheelScaleProcessFlag = null;
        this._initWheelScaleProcessFlag = false;
        this._fingerScaleHandler.endProcess();
      }, 500);
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _endWheelScaleProcessFlag: any = (_endWheelScaleProcessFlag: any): any => {
    throw new Error('Method not implemented.');
  };
  /**
   * @description 从外部更新scale值，这里会同时更新translate
   * @param {number} num 比例 * 100的值
   * @param {boolean} [isAnimation]
   * */
  setScale(num: number, isAnimation?: boolean, isScaleByVisiblePosition = false) {
    if (this.config(CONFIG.NO_SCALE)) {
      return;
    }
    num = this._scaleFilter(num);
    if (this.currentScale === num / 100) {
      return;
    }
    const _setScale = (num: number) => {
      this.currentScale = num / 100;
      this.container.scale(this.currentScale);
    };
    const _after = () => {
      this._isScaleMoving = false;
      delete this._scaleClearFn;
      this.getContext().trigger(EVENTS.SCALE_CHANGED, num);
      // 在这里又触发自己的scaleChanged，是为了让canvasControl去监听
      // context的事件监听有个setTimeout, canvasControl不需要这个setTimeout
      this.trigger(this.lifeCycleEvents.scaleChanged, this.currentScale, isScaleByVisiblePosition);
    };
    // clean the previous animation immediately
    if (this._isScaleMoving) {
      if (this._scaleClearFn) {
        this._scaleClearFn();
      }
    }
    if (isAnimation) {
      this._isScaleMoving = true;
      this._scaleClearFn = mommonFuncs.setAnimation({
        start: this.currentScale * 100,
        end: num,
        duration: SCALE_DURATION,
        during: _setScale,
        after: _after,
      });
    } else {
      _setScale(num);
      _after();
    }
  }
  /** @public */
  getScale() {
    return Math.round(this.currentScale * 100);
  }
  _scaleFilter(num: number) {
    const maxScale = parseFloat(this.config(CONFIG.MAX_SCALE));
    const minScale = parseFloat(this.config(CONFIG.MIN_SCALE));
    if (num > maxScale) {
      num = maxScale;
    }
    if (num < minScale) {
      num = minScale;
    }
    return num;
  }
  setDeviceNativeScale(value: number) {
    this._deviceNativeScale = value;
    const visibleAreaBounds = this._canvasControl.getScrollContainerBounds();
    if (this._context.isMobilePlatform()) {
      visibleAreaBounds.x = 0;
      visibleAreaBounds.y = 0;
      visibleAreaBounds.width = visibleAreaBounds.width / value;
      visibleAreaBounds.height = visibleAreaBounds.height / value;
    }
    this._canvasControl.setVisibleAreaBounds(visibleAreaBounds);
  }
  /** @public */
  getDeviceNativeScale() {
    return this._deviceNativeScale;
  }
}

export default SvgView;
/** @description 处理触控板上的双指缩放，也兼顾滚轮缩放 */
class FingerScaleHandler {
  updateScaleValue: any;
  _scaleEvent: WheelEvent | null = null;
  _svgView: any;
  _startScaleValue?: number;
  _movingTempScaleValue: any;
  /** @param {SVGView} svgView */
  constructor(svgView: SvgView) {
    /** @private */
    this.updateScaleValue = Object(underscore.throttle)(() => {
      const deltaY = this._scaleEvent?.deltaY ?? 0;
      /**
       * 缩放因子:
       * @desc 通过倍率方式调节实际缩放比例, 主要用于优化细粒度缩放操作(如触控板手势)时的体验.
       * @reference 过小的值会使缩放产生粘滞感, 过大会使得缩放过程在视觉上不连续.
       * 该值为 3 时基本能够与旧版算法达成体验上的一致.
       */
      const k = 3;
      /**
       * 调节阈值:
       * @desc 基于不同平台和硬件的实现, 快速滚动时会动态调节(增大)滚动行数. 因此引入该值限制单次调节的最大变化比例, 在不同硬件和平台间达成一致的缩放体验.
       * @reference 该值主要用于优化快速缩放时难以控制的情况, 过小的值会使得快速缩放时达不到预期速度, 过大则会放大平台和硬件之间的差异.
       * 50 代表单次最大调节 50% 缩放比例, 如: 100% -> 150%.
       */
      const max = 50;
      let deltaScale = -deltaY * k;
      if (Math.abs(deltaScale) >= max) {
        deltaScale = deltaScale > 0 ? max : -max;
      }
      // #1088 Fix viewport shake when two finger zoom on touch pad
      const newScaleValue = this._svgView.currentScale * 100 + Math.floor(deltaScale);
      window.requestAnimationFrame(() => {
        this._svgView.setScale(newScaleValue, false, true);
      });
    }, 10);
    this._svgView = svgView;
  }
  initProcess(startScaleValue: number) {
    this._startScaleValue = startScaleValue;
    const semaphoreModule = this._svgView.getModule(MODULE_NAME.SEMAPHORE);
    if (semaphoreModule) {
      semaphoreModule.increase(UI_STATUS.PINCH);
    }
  }
  /** @param {HammerEvent | WheelEvent} e */
  startProcess(e: WheelEvent) {
    this._scaleEvent = e;
    this._movingTempScaleValue = this._svgView.currentScale;
    this.updateScaleValue();
  }
  endProcess() {
    this._scaleEvent = null;
    delete this._startScaleValue;
    delete this._movingTempScaleValue;
    this._svgView.getModule(MODULE_NAME.SEMAPHORE).decrease(UI_STATUS.PINCH);
  }
}
Object(utils.wrapReadOnly)(SvgView, ['createFloatingTopic']);

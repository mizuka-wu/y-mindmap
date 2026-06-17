import backbone from 'backbone';

import jquery from 'jquery';

import { MODULE_NAME, EVENTS, SERVICE_NAME } from '../common/constants/index';
import * as lib from '../lib/index';
import { SheetEditor } from '../type';
/**
 * @fileOverview mini map for current sheet view
 * */
/**
 * @description 管理minimap
 * */
export class MiniMap {
  miniMapView: any;
  static identifier: string;
  /** @private */
  constructor() {
    /** @private */
    this.miniMapView = null;
  }
  /**
   * @param {SheetEditor} context
   * @param {Object} options
   * @private
   * */
  initMiniMapView(context: SheetEditor, options?: { wrapperClassName?: string }) {
    this.miniMapView = new MiniMapView(context, options);
  }
  /**
   * @param {SheetEditor} context
   * @param {bool} [show]
   * @param {Object} [options]
   * @param {string} [options.wrapperClassName]
   * @public
   * */
  setMiniMapDisplay(context: SheetEditor, show: boolean, options?: { wrapperClassName?: string }) {
    if (!show && !this.miniMapView) {
      return;
    }
    if (!this.miniMapView) {
      this.initMiniMapView(context, options);
    }
    this.miniMapView.setDisplay(show);
  }
  resetMiniMapUse() {
    this.miniMapView.resetUseTarget();
  }
  remove() {
    if (!this.miniMapView) {
      return;
    }
    this.miniMapView.remove();
  }
}
MiniMap.identifier = MODULE_NAME.MINI_MAP;
const containerWidth = 336;
const containerHeight = 208;
const sheetViewUseMaxWidth = containerWidth * 0.8;
const sheetViewUseMaxHeight = containerHeight * 0.8;
const viewBoxPadding = 8;
const wrapperStyle = {
  width: `${containerWidth}px`,
  height: `${containerHeight}px`,
  position: 'absolute',
  bottom: '28px',
  right: '28px',
  background: '#fff',
  border: 'solid 4px rgba(255, 255, 255, 0.5)',
  'box-shadow': '0 3px 10px 0 rgba(43, 47, 51, 0.25)',
  'border-radius': '6px',
  cursor: 'pointer',
};
const helper = {
  /**
   * @description 转换mini图的delta距离为map图的delta距离
   * @param {number} deltaX
   * @param {number} deltaY
   * @param {number} miniMapScaleValue
   * @param {number} mindMapScaleValue
   * */
  miniDeltaToMindMapDelta({ deltaX, deltaY }, miniMapScaleValue, mindMapScaleValue) {
    return {
      deltaX: (deltaX * mindMapScaleValue) / miniMapScaleValue,
      deltaY: (deltaY * mindMapScaleValue) / miniMapScaleValue,
    };
  },
  /**
   * @description 转换map图的delta距离为mini图的delta距离
   * @param {number} deltaX
   * @param {number} deltaY
   * @param {number} miniMapScaleValue
   * @param {number} mindMapScaleValue
   * */
  mindDeltaToMiniMapDelta({ deltaX, deltaY }, miniMapScaleValue, mindMapScaleValue) {
    return {
      deltaX: (deltaX * miniMapScaleValue) / mindMapScaleValue,
      deltaY: (deltaY * miniMapScaleValue) / mindMapScaleValue,
    };
  },
};
const MiniMapView = backbone.View.extend({
  /**
   * @param {SheetEditor} context
   * @param {Object} options
   * @param {string} options.wrapperClassName
   * @private
   *  */
  initialize(context, options) {
    /** @private */
    this.context = context;
    /** @private */
    this.sheetContainer = context.getSheetView().svg;
    /** @private */
    this.display = false;
    /** @private */
    this.scaleValue = 1;
    /** @private */
    this.mindMapScaleValue = context.getSVGView().currentScale;
    this._sheetView = this.context.getSheetView();
    /** @private */
    this.miniMapUpdateTimeClear = null;
    /** @private */
    this.hasInitViewBox = false;
    this._show = false;
    this.initSVGStructure(options);
    this.initEventsListener();
  },
  /**
   * @param {Object} options
   * @param {string} options.wrapperClassName
   * @private
   * */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  initSVGStructure(options: any = {}) {
    /** @private */
    this.$container = jquery('<div />');
    this.$container.css(wrapperStyle);
    // default status is hidden
    this.$container.hide();
    const svgContainer = lib.SVG(document.createElement('svg'));
    this.$container.append(svgContainer.node);
    /** @private */
    this.sheetViewUse = new lib.SVG.Use();
    this.sheetViewUse.attr({
      href: `#${this.sheetContainer.id()}`,
    });
    this.updateSheetViewUseTransform();
    svgContainer.add(this.sheetViewUse);
    /** @private */
    this.viewBox = new lib.SVG.Rect()
      .attr({
        fill: 'none',
        stroke: '#fb5151',
        'pointer-events': 'visible',
      })
      .radius(4);
    svgContainer.add(this.viewBox);
    this.context.$el.parent().append(this.$container);
    this.updateSheetBackgroundColor();
  },
  /**
   * @private
   * @todo 根据当前minimap显示情况来做性能优化
   * */
  initEventsListener() {
    // 监听sheet内容改变
    this.listenTo(this._sheetView, 'change:bounds', () => {
      if (!this._show || !this._isEnvNormal()) {
        return;
      }
      this.clearMiniMapUpdateTimeOut();
      // 更新背景颜色
      this.updateSheetBackgroundColor();
      // 加延迟是为了保证方法调用的时候sheet dom已完成改变，也是为了性能考虑
      this.miniMapUpdateTimeClear = setTimeout(() => {
        // 更新框的缩放
        this.updateSheetViewUseTransform();
        // 更新框尺寸
        this.updateViewBoxSizeAndTransform();
      }, 500);
    });
    // 监听视口移动事件，移动view box
    this.listenTo(this.context, EVENTS.VIEW_PORT_MOVING, () => {
      if (!this._show || !this._isEnvNormal()) {
        return;
      }
      setTimeout(() => {
        this.mindMapScaleValue = this.context.getSVGView().currentScale;
        this.updateViewBoxSizeAndTransform();
      }, 0);
    });
    // 监听over ride style change事件
    this.listenTo(this.context, EVENTS.SE_OVERRIDE_STYLE_CHANGED, () => {
      if (!this._show || !this._isEnvNormal()) {
        return;
      }
      // 更新背景颜色
      this.updateSheetBackgroundColor();
    });
    this.listenTo(this.context, EVENTS.AFTER_THEME_CHANGED, () => {
      if (!this._show || !this._isEnvNormal()) {
        return;
      }
      this.updateSheetBackgroundColor();
    });
    this.$container.on('click', e => {
      const { offsetX, offsetY } = e;
      /** @type {bbox} */
      const viewBoxBBox = this.viewBox.bbox();
      const { deltaX: mindMapDeltaX, deltaY: mindMapDeltaY } = helper.miniDeltaToMindMapDelta(
        {
          deltaX: offsetX - viewBoxBBox.cx,
          deltaY: offsetY - viewBoxBBox.cy,
        },
        this.scaleValue,
        this.mindMapScaleValue
      );
      /** @type {MoveViewPortModule} */
      const moveViewPortModule = this.context.getModule(MODULE_NAME.MOVE_VIEW_PORT);
      // 移动view port
      moveViewPortModule.tryToMoveViewPort(-mindMapDeltaX, -mindMapDeltaY);
    });
    // 监听viewBox上鼠标落下事件
    this.viewBox.on('mousedown', e => {
      new MiniMapViewBoxDragManager(this.context).onDragViewBox(e, this.scaleValue);
    });
    // 监听mind map scale值改变事件
    this.listenTo(this.context, EVENTS.SCALE_CHANGED, () => {
      if (!this._show || !this._isEnvNormal()) {
        return;
      }
      this.onMindMapScaleValueChanged();
    });
  },
  _isEnvNormal() {
    const { width: svgViewWidth, height: svgViewHeight } = this.context
      .getSVGView()
      .getCanvasControl()
      .getVisibleAreaBounds();
    return svgViewWidth !== 0 && svgViewHeight !== 0;
  },
  /**
   * @private
   * @fixme 当svg本身比较大的时候，应该缩放至契合容器本身
   *  */
  updateSheetViewUseTransform() {
    // const { clientWidth: svgViewWidth, clientHeight: svgViewHeight } = this.context.getSVGView().svg.parent;
    const { width: svgViewWidth, height: svgViewHeight } = this.context
      .getSVGView()
      .getCanvasControl()
      .getVisibleAreaBounds();
    // 通过对比宽高比来确定缩放方式，具体请画图推演
    if (sheetViewUseMaxWidth / sheetViewUseMaxHeight < svgViewWidth / svgViewHeight) {
      this.scaleValue = sheetViewUseMaxWidth / svgViewWidth;
    } else {
      this.scaleValue = sheetViewUseMaxHeight / svgViewHeight;
    }
    this.checkScaledSheetViewForScaleValue();
    const currentTopBranchView = this._sheetView.getActivatedTopBranchView() || this._sheetView.getCentralBranchView();
    const currentTopRealPosition = currentTopBranchView.getRealPosition();
    this.sheetViewUse
      .translate(
        containerWidth / 2 - currentTopRealPosition.x * this.scaleValue,
        containerHeight / 2 - currentTopRealPosition.y * this.scaleValue
      )
      .scale(this.scaleValue);
  },
  /**
   * @private
   * @fixme 当viewbox超出矩形框范围时，应该贴边
   * */
  updateViewBoxSizeAndTransform() {
    const finalScaleValue = this.scaleValue / this.mindMapScaleValue;
    const { width: svgViewWidth, height: svgViewHeight } = this.context
      .getSVGView()
      .getCanvasControl()
      .getVisibleAreaBounds();
    let viewBoxWidth = Math.abs(finalScaleValue * svgViewWidth);
    let viewBoxHeight = Math.abs(finalScaleValue * svgViewHeight);
    // 根据scrollContainer相对于current top branch的位置来确定viewBox应该处于的位置
    const currentTopBranchView = this._sheetView.getActivatedTopBranchView() || this._sheetView.getCentralBranchView();
    const currentTopRealPosition = currentTopBranchView.getRealPosition();
    const { x: currentTopBranchSCPositionX, y: currentTopBranchSCPositionY } = this.context
      .getSVGView()
      .getCoordinateTransfer()
      .mindMapToVisibleArea(currentTopRealPosition);
    let viewBoxX = containerWidth / 2 - finalScaleValue * currentTopBranchSCPositionX;
    let viewBoxY = containerHeight / 2 - finalScaleValue * currentTopBranchSCPositionY;
    // 当viewBox靠近minimap边缘的时候，调整大小，使其距离边缘始终最小有12px的padding，数学不行，硬写
    if (viewBoxX < viewBoxPadding) {
      viewBoxWidth = viewBoxWidth - (viewBoxPadding - viewBoxX);
      viewBoxX = viewBoxPadding;
    }
    if (viewBoxX + viewBoxWidth > containerWidth - viewBoxPadding) {
      viewBoxWidth = viewBoxWidth - (viewBoxX + viewBoxWidth - (containerWidth - viewBoxPadding));
      viewBoxX = containerWidth - viewBoxPadding - viewBoxWidth;
    }
    if (viewBoxY < viewBoxPadding) {
      viewBoxHeight = viewBoxHeight - (viewBoxPadding - viewBoxY);
      viewBoxY = viewBoxPadding;
    }
    if (viewBoxY + viewBoxHeight > containerHeight - viewBoxPadding) {
      viewBoxHeight = viewBoxHeight - (viewBoxY + viewBoxHeight - (containerHeight - viewBoxPadding));
      viewBoxY = containerHeight - viewBoxPadding - viewBoxHeight;
    }
    this.viewBox.x(viewBoxX).y(viewBoxY);
    /**
     * 在快速添加子topic的时候，minimap内部图像的宽高计算会被延迟，
     * 此时快速跟随更新的viewBox尺寸可能会计算出错，宽高会小于0，直接返回就好
     *
     * 当minimap图像宽高被重新计算之后，viewBox的尺寸就会得到正确的最终结果
     * */
    if (viewBoxWidth < 0 || viewBoxHeight < 0) {
      return;
    }
    this.viewBox.width(viewBoxWidth).height(viewBoxHeight);
  },
  /**
   * @description 同步更新background color
   * @private
   * */
  updateSheetBackgroundColor() {
    const sheetView = this.context.getSheetView();
    if (sheetView) {
      let fillColor = sheetView.figure.backgroundColor;
      // 若颜色设置为无色，则背景色改为白色
      if (fillColor === 'none') {
        fillColor = '#ffffff';
      }
      this.$container.css('background-color', fillColor);
    }
  },
  /**
   * @description 判断小图的尺寸是否已经超出应在的范围，若超出，进一步计算scaleValue
   * @private
   * */
  checkScaledSheetViewForScaleValue() {
    /** @type {bbox} */
    const originSheetViewBBox = this.context.getSheetView().svg.bbox();
    const maxX = Math.max(Math.abs(originSheetViewBBox.x), Math.abs(originSheetViewBBox.x2));
    const maxY = Math.max(Math.abs(originSheetViewBBox.y), Math.abs(originSheetViewBBox.y2));
    // 判断小图的尺寸是否已经超出应在的范围
    if (maxX * this.scaleValue > sheetViewUseMaxWidth / 2 || maxY * this.scaleValue > sheetViewUseMaxHeight / 2) {
      // 超出之后根据超出比例计算scaleValue
      if (sheetViewUseMaxWidth / sheetViewUseMaxHeight < maxX / maxY) {
        this.scaleValue = sheetViewUseMaxWidth / 2 / maxX;
      } else {
        this.scaleValue = sheetViewUseMaxHeight / 2 / maxY;
      }
    }
  },
  /**
   * @description 缩放后的sheet view的尺寸是否已超过区域最大尺寸
   * @return {boolean}
   * @private
   * @deprecated ?
   * */
  hasScaledSheetViewOverflow() {
    /** @type {bbox} */
    const originSheetViewBBox = this.context.getSheetView().svg.bbox();
    const maxX = Math.max(Math.abs(originSheetViewBBox.x), Math.abs(originSheetViewBBox.x2)) * this.scaleValue;
    const maxY = Math.max(Math.abs(originSheetViewBBox.y), Math.abs(originSheetViewBBox.y2)) * this.scaleValue;
    return maxX > sheetViewUseMaxWidth / 2 || maxY > sheetViewUseMaxHeight / 2;
  },
  /** @private */
  onMindMapScaleValueChanged() {
    this.clearMiniMapUpdateTimeOut();
    this.miniMapUpdateTimeClear = setTimeout(() => {
      this.mindMapScaleValue = this.context.getSVGView().currentScale;
      this.updateViewBoxSizeAndTransform();
    }, 500);
  },
  /** @public */
  setDisplay(show) {
    if (show) {
      this._show = true;
      this.$container.show();
      this.updateViewBoxSizeAndTransform();
    } else {
      this._show = false;
      this.$container.hide();
    }
  },
  resetUseTarget() {
    this.sheetViewUse
      .attr({
        href: '',
      })
      .attr({
        href: `#${this.sheetContainer.id()}`,
      });
  },
  remove() {
    // remove element
    this.$container.remove();
    // stop listening
    this.stopListening();
  },
  /** @private */
  clearMiniMapUpdateTimeOut() {
    clearTimeout(this.miniMapUpdateTimeClear);
    this.miniMapUpdateTimeClear = null;
  },
});
const dragEvent = '.drag';
const dragMouseMoveEvent = 'mousemove.drag';
const dragMouseUpEvent = 'mouseup.drag';
const dragMouseOutEvent = 'mouseout.drag';
/**
 * @description mini map微型视口拖拽管理模块
 * */
class MiniMapViewBoxDragManager {
  context: any;
  $dragCover: any;
  lastMousePoint: any;
  /**
   * @param {SheetEditor} context
   * @private
   *  */
  constructor(context) {
    /** @private */
    this.context = context;
    /** @private @type {jQuery} */
    this.$dragCover = this.context.callService(SERVICE_NAME.GET_VIEW_PORT_COVER);
    /**
     * @description 鼠标之前所在的点的坐标
     * @type {point}
     * @private
     * */
    this.lastMousePoint = null;
  }
  /**
   * @param {MouseEvent} e
   * @param {number} miniMapScaleValue
   * @public
   * */
  onDragViewBox(e, miniMapScaleValue) {
    const draggingClass = 'draging';
    this.lastMousePoint = {
      x: e.clientX,
      y: e.clientY,
    };
    const mindMapScaleValue = this.context.getSVGView().currentScale;
    let hasMoved = false;
    this.$dragCover.show().addClass(draggingClass);
    this.$dragCover.on(dragMouseMoveEvent, e => {
      hasMoved = true;
      const currentMousePoint = {
        x: e.clientX,
        y: e.clientY,
      };
      const deltaX = currentMousePoint.x - this.lastMousePoint.x;
      const deltaY = currentMousePoint.y - this.lastMousePoint.y;
      const { deltaX: mindMapDeltaX, deltaY: mindMapDeltaY } = helper.miniDeltaToMindMapDelta(
        {
          deltaX,
          deltaY,
        },
        miniMapScaleValue,
        mindMapScaleValue
      );
      /** @type {MoveViewPortModule} */
      const moveViewPortModule = this.context.getModule(MODULE_NAME.MOVE_VIEW_PORT);
      // 移动view port，触发事件来引发view box的移动
      const moveResult = moveViewPortModule.tryToMoveViewPort(-mindMapDeltaX, -mindMapDeltaY);
      if (moveResult) {
        this.lastMousePoint = currentMousePoint;
      }
    });
    // 用来阻止在移动之后触发container的click事件
    this.$dragCover.on('click', e => {
      if (hasMoved) {
        e.stopPropagation();
      }
      this.$dragCover.off('click');
    });
    this.$dragCover.on(dragMouseOutEvent, () => this.cancelDragEvent());
    this.$dragCover.on(dragMouseUpEvent, () => this.cancelDragEvent());
  }
  /** @private */
  cancelDragEvent() {
    this.$dragCover.off(dragEvent).hide().removeClass();
  }
}

export default MiniMap;

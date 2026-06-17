/* eslint-disable @typescript-eslint/no-unused-vars */

import { CONFIG, MODULE_NAME, SERVICE_NAME, EVENTS } from '../common/constants/index';

import * as pointUtils from '../utils/pointutils';

import backbone from 'backbone';

import type { SheetEditor, SvgView, Position, SVG } from '../type.d';

const multiSelectEventsMap = {
  mousemove: 'mousemove.multiSelect',
  mouseup: 'mouseup.multiSelect',
  mouseout: 'mouseout.multiSelect',
  mouseleave: 'mouseleave.multiSelect',
  all: '.multiSelect',
};
export class MouseBoxSelect {
  static identifier: string;
  constructor(context: SheetEditor) {
    return {
      /**
       * @param {position} position
       * @param {boolean} isSegmentMultiSelect
       * */
      start(position: Position, isSegmentMultiSelect: boolean) {
        if (context.config(CONFIG.NO_MOUSE_MULTI_SELECT_BOX)) {
          return;
        }
        new MouseBoxSelectProcess(context).startProcess(position, isSegmentMultiSelect);
      },
    };
  }
}
MouseBoxSelect.identifier = MODULE_NAME.MOUSE_BOX_SELECT;
class MouseBoxSelectProcess {
  _context: SheetEditor;
  _svgView: SvgView;
  _startPosition: { x: number; y: number };
  isSegmentMultiSelect: boolean;
  _viewPortModule: any;
  _selectionModule: any;
  _s$multiSelectG: SVG['G'];
  _s$multiSelectRect: SVG['Rect'];
  _eventsCenter: backbone.Events;
  _$mask: any;
  _isFinish: boolean;
  _hasInitStructure: boolean;
  constructor(context: SheetEditor) {
    this._context = context;
    this._svgView = context.getSVGView();
    this._startPosition = {
      x: 0,
      y: 0,
    };
    this.isSegmentMultiSelect = false;
    this._viewPortModule = context.getModule(MODULE_NAME.MOVE_VIEW_PORT);
    this._selectionModule = context.getModule(MODULE_NAME.SELECTION);
    this._s$multiSelectG = null;
    this._s$multiSelectRect = null;
    this._eventsCenter = Object.assign({}, backbone.Events);
    this._$mask = this._context.callService(SERVICE_NAME.GET_VIEW_PORT_COVER);
    this._isFinish = false;
    this._hasInitStructure = false;
  }
  /** @private */
  _initSVGStructure() {
    this._s$multiSelectG = this._svgView.getMultiSelectG();
    this._s$multiSelectRect = this._s$multiSelectG.rect();
    this._s$multiSelectRect
      .data('name', 'multi-select-box')
      .style({
        fill: '#2ebdff',
        'fill-opacity': '0.1',
        stroke: '#2ebdff',
        'stroke-opacity': '0.5',
        'stroke-width': '1px',
      })
      .width(0)
      .height(0);
  }
  /**
   * @param {position} position 框选起点位置
   * @param {boolean} [isSegmentMultiSelect] 是否分段框选操作
   * @public
   * */
  startProcess(position: Position, isSegmentMultiSelect?: boolean) {
    this._startPosition = position;
    this.isSegmentMultiSelect = isSegmentMultiSelect;
    this._registerEvents();
  }
  /** @private */
  _registerEvents() {
    this._svgView.$el.on({
      // todo set move mini distance detect
      [multiSelectEventsMap.mousemove]: (e: JQuery.MouseMoveEvent) => this._onSVGViewMouseMove(e),
      [multiSelectEventsMap.mouseup]: _ => this._offSVGViewAllMoveEvents(),
      [multiSelectEventsMap.mouseout]: _ => this._offSVGViewAllMoveEvents(),
    });
  }
  /**
   * @param {MouseEvent} e
   * @private
   * */
  _onSVGViewMouseMove(e: JQuery.MouseMoveEvent) {
    if (!this._hasInitStructure) {
      this._initSVGStructure();
      this._hasInitStructure = true;
    }
    const moveDistance = pointUtils.distance(
      {
        x: e.clientX,
        y: e.clientY,
      },
      this._startPosition
    );
    if (moveDistance > 3) {
      this._$mask.show().css('cursor', 'default');
      const containerOffset = this._svgView.$el.offset();

      this._s$multiSelectG.translate(
        this._startPosition.x - containerOffset.left,
        this._startPosition.y - containerOffset.top
      );

      this._viewPortModule.setAbleAutoMove(false);
      this._selectionModule.setIsSilent(true);
      this._$mask.on(multiSelectEventsMap.mousemove, (e: MouseEvent) => {
        this._onMaskMouseMove(e);
      });
      this._$mask.on(multiSelectEventsMap.mouseup, () => this._onMaskMouseMoveFinish());
      this._$mask.on(multiSelectEventsMap.mouseleave, () => this._onMaskMouseMoveFinish());
      this._eventsCenter.listenTo(this._context, EVENTS.VIEW_PORT_MOVING, (deltaX, deltaY) => {
        const { _s$multiSelectRect } = this;
        _s$multiSelectRect
          .width(_s$multiSelectRect.width() + Math.abs(deltaX))
          .height(_s$multiSelectRect.height() + Math.abs(deltaY));
        this._startPosition.x += deltaX;
        this._startPosition.y += deltaY;
        this._svgView.eventBus.trigger(
          'selecting.mouseMultiSelect',
          this._s$multiSelectRect.rbox(),
          this.isSegmentMultiSelect
        );
      });
    }
  }
  /** @private */
  _offSVGViewAllMoveEvents() {
    this._svgView.$el.off(multiSelectEventsMap.all);
  }
  /**
   * @param {MouseEvent} e
   * @private
   * */
  _onMaskMouseMove(e: MouseEvent) {
    // 当off mouse move的时候仍可能在下一帧执行该函数！！！
    // 导致视口不受控制地平移的bug根源
    if (this._isFinish) {
      return;
    }
    const { _startPosition } = this;

    const containerOffset = this._svgView.$el.offset();
    this._s$multiSelectG.transform({
      a: e.clientX - _startPosition.x >= 0 ? 1 : -1,
      b: 0,
      c: 0,
      d: e.clientY - _startPosition.y >= 0 ? 1 : -1,
      e: _startPosition.x - containerOffset.left,
      f: _startPosition.y - containerOffset.top,
    });

    this._s$multiSelectRect
      .width(Math.abs(e.clientX - _startPosition.x))
      .height(Math.abs(e.clientY - _startPosition.y));
    // todo Android平台上是否会支持这一特性？
    this._viewPortModule.showMouseInViewPort({
      x: e.clientX,
      y: e.clientY,
    });
    if (this._s$multiSelectRect.parent) {
      const rbox = this._s$multiSelectRect.rbox();
      this._svgView.eventBus.trigger('selecting.mouseMultiSelect', rbox, this.isSegmentMultiSelect);
    }
  }
  /** @private */
  _onMaskMouseMoveFinish() {
    this._eventsCenter.stopListening();
    this._viewPortModule.stopMove();
    this._isFinish = true;
    this._viewPortModule.setAbleAutoMove(true);
    this._selectionModule.setIsSilent(false);
    this._selectionModule.notify();
    this._s$multiSelectG.clear();
    this._$mask.off(multiSelectEventsMap.all);
    this._$mask.hide().css('cursor', '');
  }
}

export default MouseBoxSelect;

import { MODULE_NAME, SERVICE_NAME, EVENTS, UI_STATUS } from '../common/constants/index';

import * as lib from '../lib/index';
import * as utils from '../utils/index';
import mommonFuncs from '../mommonfuncs';
import backbone from 'backbone';
import type { SheetEditor, SVG } from '../type.d';
/**
 * @fileOverview
 * 本模块管理的拖拽内容包括
 * LegendView
 * Summary 与 Boundary 的 SelectBoxView
 * RelationShip 的端点与控制点
 * */
export class SvgDraggable {
  _context: SheetEditor;
  static identifier: string;
  /** @private */
  constructor(context: SheetEditor) {
    /**
     * @type {SheetEditor}
     * @private
     * */
    this._context = context;
  }
  /**
   * @public
   * */
  draggable(s$element: SVG['Element'], option: DraggableOptions) {
    return new DraggableRegister(this._context, option, s$element);
  }
}
SvgDraggable.identifier = MODULE_NAME.SVG_DRAGGABLE;
function calZoom(instance: SVG['Element']) {
  let zoom = 1;
  const svg = instance.doc();
  let parent = instance.parent();
  while ((parent as unknown) !== svg) {
    zoom *= (parent as unknown as SVG['Element']).transform().scaleX;
    parent = (parent as unknown as SVG['Parent']).parent();
  }
  return zoom;
}

type Constraint =
  | Partial<{
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
      x: number | boolean;
      y: number | boolean;
    }>
  | ((x: number, y: number) => { x: number; y: number });
/**
 * @typedef {Object} draggableOptions
 * @property {number} threshold
 * @property {'touchstart' | 'press'} startType
 * @property {number} pressTime
 * @property {boolean} draggingMask
 * @property {Object} constraint
 * */
type DraggableOptions = Partial<{
  threshold: number;
  startType: 'touchstart' | 'press';
  pressTime: number;
  draggingMask: boolean;
  constraint: Constraint;
  allowMouseDownPropagation: boolean;
}>;

type StartPosition = {
  x: number;
  // real
  y: number;
  width: number;
  height: number;
  zoom: number;
  rotation: number;
  // client
  pageX: number;
  // client
  pageY: number;
  // client
  clientX: number;
  // client
  clientY: number;
};

function isFunc(func: unknown) {
  return typeof func === 'function';
}
const touchDragStartEvent = 'touchstart';
const touchDragMoveEvent = 'touchmove';
const touchDragEndEvent = 'touchend';
const mouseDragStartEvent = 'mousedown';
const mouseDragMoveEvent = 'mousemove';
const mouseDragEndEvent = 'mouseup';
class DraggableRegister {
  _stablizeDragMove: (e?: any) => void;
  _context: SheetEditor;
  _options: DraggableOptions;
  _s$element: SVG['Element'];
  _el: any;
  _$mask: any;
  _moveViewPortModule: any;
  _semaphore: any;
  _backboneEvents: backbone.Events;
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  _callback: Record<string, Function>;
  _constraint: Constraint;
  _isUseTouch: boolean;
  _currentDragMoveEvent: null | MouseEvent;
  _viewportMoveDistance: { x: number; y: number };
  _dragEventHandler: {
    start: { touchstart: (e: any) => void; mousedown: (e: any) => void };
    move: { touchmove: (e: any) => any; mousemove: (e: any) => any };
    end: { touchend: (e: any) => void; mouseup: (e: any) => void };
  };
  /**
   * @param {SheetEditor} context
   * @param {draggableOptions} options
   * @param {SVG.Element} s$element
   * */
  constructor(context: SheetEditor, options: DraggableOptions, s$element: SVG['Element']) {
    this._stablizeDragMove = mommonFuncs.frameStabilize(
      (e: MouseEvent) => this._onDragMove(e),
      (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
      }
    );
    /**
     * @type {SheetEditor}
     * @private
     * */
    this._context = context;
    /**
     * @type {draggableOptions}
     * @private
     * */
    this._options = Object.assign({}, DraggableRegister.defaultOption, options);
    /** @private */
    this._s$element = s$element;
    this._el = this._s$element.node;
    /**
     * @type {jQuery}
     * @private
     * */
    this._$mask = context.callService(SERVICE_NAME.GET_VIEW_PORT_COVER);
    /**
     * @type {MoveViewPortModule}
     * @private
     * */
    this._moveViewPortModule = context.getModule(MODULE_NAME.MOVE_VIEW_PORT);
    /**
     * @type {Semaphore}
     * @private
     * */
    this._semaphore = context.getModule(MODULE_NAME.SEMAPHORE);
    /** @private */
    this._backboneEvents = Object.assign({}, backbone.Events);
    /** @private */
    this._callback = {};
    /** @private */
    this._constraint = this._options.constraint || {};
    /** @private */
    this._isUseTouch = false;
    /**
     * @type {jQuery.Event}
     * @private
     * */
    this._currentDragMoveEvent = null;
    /**
     * @private
     * */
    this._viewportMoveDistance = {
      x: 0,
      y: 0,
    };
    this._dragEventHandler = {
      start: {
        [touchDragStartEvent]: e => this._onDragStart(e),
        [mouseDragStartEvent]: e => this._onMouseDown(e),
      },
      move: {
        [touchDragMoveEvent]: e => this._stablizeDragMove(e),
        [mouseDragMoveEvent]: e => this._stablizeDragMove(e),
      },
      end: {
        [touchDragEndEvent]: e => this._onDragEnd(e),
        [mouseDragEndEvent]: e => this._onDragEnd(e),
      },
    };
    this._clearEventByType(this._el, 'start'); // 如果之前已经在该element上调用过draggable，则取消掉在其上注册的事件
    this._initStartEventListener();
  }

  static defaultOption: DraggableOptions;
  /**
   * @param {Function} [func]
   * @public
   * */
  beforeDrag(func?: unknown) {
    if (isFunc(func)) {
      this._callback.beforeDrag = func;
    }
    return this;
  }
  /**
   * @param {Function} [func]
   * @public
   * */
  dragStart(func?: unknown) {
    if (isFunc(func)) {
      this._callback.dragStart = func;
    }
    return this;
  }
  /**
   * @param {Function} [func]
   * @public
   * */
  dragMove(func?: unknown) {
    if (isFunc(func)) {
      this._callback.dragMove = func;
    }
    return this;
  }
  /**
   * @param {Function} [func]
   * @public
   * */
  dragEnd(func?: unknown) {
    if (isFunc(func)) {
      this._callback.dragEnd = func;
    }
    return this;
  }
  /**
   * @param {Object} constraint
   * @public
   * */
  updateConstraint(constraint: Constraint) {
    this._constraint = constraint;
    return this;
  }
  _registeEventByType(target: HTMLElement | Document, type: 'start' | 'move' | 'end') {
    const hanlderMap = this._dragEventHandler[type];
    Object.entries(hanlderMap).forEach(([eventName, handler]) => {
      target.addEventListener(eventName, handler, {
        passive: false,
      });
    });
  }
  _clearEventByType(target: HTMLElement | Document, type?: 'start' | 'move' | 'end') {
    const hanlderMap = type
      ? this._dragEventHandler[type]
      : Object.values(this._dragEventHandler).reduce((map, cur) => Object.assign(map, cur), {});
    Object.entries(hanlderMap).forEach(([eventName, handler]) => {
      target.removeEventListener(eventName, handler as EventListenerOrEventListenerObject);
    });
  }
  _initStartEventListener() {
    this._registeEventByType(this._el, 'start');
  }
  _onMouseDown(mouseDownEvent: MouseEvent) {
    // 若是由touch触发的mouse事件，返回不予执行
    if (Object(utils.isMouseEventFiredByTouch)(mouseDownEvent)) {
      return;
    }
    // 鼠标拖拽需要判断鼠标移动的距离，距离不够就不触发拖拽
    const threshold = this._options.threshold;
    if (threshold === 0) {
      return this._onDragStart(mouseDownEvent);
    }
    if (!this._options.allowMouseDownPropagation) {
      mouseDownEvent.stopPropagation();
    }
    const thresholdMouseDragMoveHandler = (e: MouseEvent) => {
      const deltaX = mouseDownEvent.clientX - e.clientX;
      const deltaY = mouseDownEvent.clientY - e.clientY;
      if (deltaX * deltaX + deltaY * deltaY >= threshold * threshold) {
        document.removeEventListener(mouseDragMoveEvent, thresholdMouseDragMoveHandler);
        document.removeEventListener(mouseDragEndEvent, thresholdMouseDragEndHandler);
        this._onDragStart(mouseDownEvent);
      }
    };
    const thresholdMouseDragEndHandler = (e: MouseEvent) => {
      const deltaX = mouseDownEvent.clientX - e.clientX;
      const deltaY = mouseDownEvent.clientY - e.clientY;
      document.removeEventListener(mouseDragMoveEvent, thresholdMouseDragMoveHandler);
      document.removeEventListener(mouseDragEndEvent, thresholdMouseDragEndHandler);
      if (deltaX * deltaX + deltaY * deltaY >= threshold * threshold) {
        this._onDragEnd(mouseDownEvent);
      }
    };
    document.addEventListener(mouseDragMoveEvent, thresholdMouseDragMoveHandler, {
      passive: false,
    });
    document.addEventListener(mouseDragEndEvent, thresholdMouseDragEndHandler, {
      passive: false,
    });
  }
  _onDragStart(e: MouseEvent) {
    e.stopPropagation();
    this._setIsDragStartByTouch(e);
    if (this._callback.beforeDrag) {
      this._callback.beforeDrag(e);
    }
    if (this._options.draggingMask) {
      this._$mask.show();
    }
    // 当视口移动的时候，为了保证被拖拽的svg维持相对屏幕位置不动，也应该触发drag移动事件
    // todo 具体是干嘛用的？
    this._backboneEvents.listenTo(this._context, EVENTS.VIEW_PORT_MOVING, (deltaX, deltaY) => {
      if (!this._currentDragMoveEvent) {
        return;
      }
      const currentScale = this._context.getSVGView().getScale() / 100;
      this._viewportMoveDistance.x += deltaX / currentScale;
      this._viewportMoveDistance.y += deltaY / currentScale;
      this._onDragMove(this._currentDragMoveEvent);
    });
    /* get element bounding box */
    const element = this._s$element;
    let box: { x: number; y: number; width: number; height: number } = element.bbox();
    if (element instanceof lib.SVG.G) {
      box.x = element.x();
      box.y = element.y();
    } else if (element instanceof lib.SVG.Nested) {
      box = {
        x: element.x(),
        y: element.y(),
        width: element.width(),
        height: element.height(),
      };
    }
    /* store event */
    Reflect.set(element, 'startEvent', e);
    /* store start position */
    const clientPosition = this._context.getDragEventClientPosition(e);
    Reflect.set(element, 'startPosition', {
      // real
      x: box.x,
      // real
      y: box.y,
      width: box.width,
      height: box.height,
      zoom: calZoom(element),
      rotation: ((element as any).transform('rotation') * Math.PI) / 180,
      // client
      pageX: clientPosition.x,
      // client
      pageY: clientPosition.y,
      // client
      clientX: clientPosition.x,
      // client
      clientY: clientPosition.y,
    });
    if (this._callback.dragStart) {
      this._callback.dragStart(
        {
          x: 0,
          y: 0,
          zoom: (Reflect.get(element, 'startPosition') as StartPosition).zoom,
        },
        e
      );
    }
    this._semaphore.increase(UI_STATUS.DRAG);
    const moveEventType = this._isUseTouch ? touchDragMoveEvent : mouseDragMoveEvent;
    const endEventType = this._isUseTouch ? touchDragEndEvent : mouseDragEndEvent;
    document.addEventListener(moveEventType, this._dragEventHandler.move[moveEventType], {
      passive: false,
    });
    document.addEventListener(endEventType, this._dragEventHandler.end[endEventType], {
      passive: false,
    });
  }
  _onDragMove(e: MouseEvent) {
    e.preventDefault();
    const element = this._s$element;
    if (Reflect.has(element, 'startPosition')) {
      const startPosition = Reflect.get(element, 'startPosition') as StartPosition;
      /* calculate move position */
      let x;
      let y;
      const rotation = startPosition.rotation;
      const width = startPosition.width;
      const height = startPosition.height;
      const clientX = startPosition.clientX;
      const clientY = startPosition.clientY;
      const clientPosition = this._context.getDragEventClientPosition(e);
      const zoom = startPosition.zoom;
      const nativeScale = 1; // this._context.getSVGView().getDeviceNativeScale()
      const delta = {
        // real
        x: (clientPosition.x - clientX) / nativeScale,
        // real
        y: (clientPosition.y - clientY) / nativeScale,
      };
      /* calculate new position [with rotation correction] */
      // real
      x =
        startPosition.x -
        this._viewportMoveDistance.x +
        (delta.x * Math.cos(rotation) + delta.y * Math.sin(rotation)) / startPosition.zoom;
      y =
        startPosition.y -
        this._viewportMoveDistance.y +
        (delta.y * Math.cos(rotation) + delta.x * Math.sin(-rotation)) / startPosition.zoom;
      /* move the element to its new position, if possible by constraint */
      const constraint = this._constraint;
      if (typeof constraint === 'function') {
        const coord = constraint(x, y);
        if (typeof coord === 'object') {
          if (typeof coord.x !== 'boolean' || coord.x) {
            element.x(typeof coord.x === 'number' ? coord.x : x);
          }
          if (typeof coord.y !== 'boolean' || coord.y) {
            element.y(typeof coord.y === 'number' ? coord.y : y);
          }
        } else if (typeof coord === 'boolean' && coord) {
          element.move(x, y);
        }
      } else if (typeof constraint === 'object') {
        /* keep element within constrained box */
        if (constraint.minX !== null && x < constraint.minX) {
          x = constraint.minX;
        } else if (constraint.maxX !== null && x > constraint.maxX - width) {
          x = constraint.maxX - width;
        }
        if (constraint.minY !== null && y < constraint.minY) {
          y = constraint.minY;
        } else if (constraint.maxY !== null && y > constraint.maxY - height) {
          y = constraint.maxY - height;
        }
        if (constraint.x === false) {
          element.y(y);
        } else if (constraint.y === false) {
          element.x(x);
        } else {
          element.move(x, y);
        }
      }
      this._currentDragMoveEvent = e;
      // todo Android兼容
      this._moveViewPortModule.showMouseInViewPort({
        x: clientPosition.x,
        y: clientPosition.y,
      });
      /* invoke any callbacks */
      if (this._callback.dragMove) {
        this._callback.dragMove(
          {
            x: x,
            y: y,
            deltaX: delta.x / zoom - this._viewportMoveDistance.x,
            deltaY: delta.y / zoom - this._viewportMoveDistance.y,
            pageDeltaX: delta.x,
            pageDeltaY: delta.y,
            zoom,
          },
          e
        );
      }
    }
  }
  _onDragEnd(e: MouseEvent | TouchEvent) {
    const element = this._s$element;
    this._moveViewPortModule.stopMove();
    if (this._options.draggingMask) {
      this._$mask.hide();
    }
    /* calculate move position */
    const pagePosition = this._context.getDragEventClientPosition(e, this._isUseTouch);
    const startPosition = Reflect.get(element, 'startPosition') as StartPosition;
    const rotation = startPosition.rotation;
    const zoom = startPosition.zoom;
    const delta = {
      x: pagePosition.x - startPosition.pageX,
      y: pagePosition.y - startPosition.pageY,
      zoom: startPosition.zoom,
    };
    const x = startPosition.x + (delta.x * Math.cos(rotation) + delta.y * Math.sin(rotation)) / startPosition.zoom;
    const y = startPosition.y + (delta.y * Math.cos(rotation) + delta.x * Math.sin(-rotation)) / startPosition.zoom;

    Reflect.deleteProperty(element, 'startEvent');
    Reflect.deleteProperty(element, 'startPosition');

    this._currentDragMoveEvent = null;
    this._viewportMoveDistance = {
      x: 0,
      y: 0,
    };
    this._clearEventByType(document);
    this._backboneEvents.stopListening();
    this._semaphore.decrease(UI_STATUS.DRAG);
    /* invoke any callbacks */
    if (this._callback.dragEnd) {
      this._callback.dragEnd(
        {
          x: x,
          y: y,
          deltaX: delta.x / zoom,
          deltaY: delta.y / zoom,
          pageDeltaX: delta.x,
          pageDeltaY: delta.y,
          zoom: zoom,
        },
        e
      );
    }
  }
  /**
   * @description 记录拖拽操作是否由touch引发
   * */
  _setIsDragStartByTouch(e: Event) {
    const eventType = e.type;
    if (eventType === 'mousedown') {
      this._isUseTouch = false;
    } else if (eventType === 'touchstart') {
      this._isUseTouch = true;
    }
  }
}
DraggableRegister.defaultOption = {
  // 桌面端上，鼠标移动一定距离才开始拖拽
  threshold: 5,
  // 定义移动端上拖拽开始的类型，可选 touchstart or press todo 暂时还没有用到
  startType: 'touchstart',
  // 以 press 开始拖拽时，定义长按时间
  pressTime: 500,
  draggingMask: false,
  allowMouseDownPropagation: false,
};

export default SvgDraggable;

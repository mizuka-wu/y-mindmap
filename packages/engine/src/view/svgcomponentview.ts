import {
  EVENTS,
  MODULE_NAME,
  CONFIG,
  VIEW_TYPE,
} from "../common/constants/index";

import jquery from "jquery";

import underscore from "underscore";

import backbone from "backbone";

import { autorun, reaction } from "mobx";
export class SvgComponentView extends backbone.View {
  reactionDisposers: any[];
  autoRunDisposers: any[];
  _parent: any;
  _typeArr: any;
  isForcedInvisible: boolean;
  isVisible: boolean;
  figure: any;
  constructor(...args) {
    super(...args);
    this.reactionDisposers = [];
    this.autoRunDisposers = [];
    this._parent = null;
    this._typeArr = null;
    this.isForcedInvisible = false;
  }
  get figureType(): null | string {
    return null;
  }

  get type() {
    return "";
  }

  initSVGStructure() {}
  initEventsListener() {}
  parent(parent?) {
    if (typeof parent === "undefined") {
      return this._parent;
    }
    // set new parent, or detach this from it's parent
    const oldParent = this._parent;
    if (oldParent === parent) {
      return this;
    }
    if (oldParent) {
      this.stopListening(oldParent);
    }
    this.beforeAncestorChange();
    this._parent = parent;
    this.afterAncestorChange();
    if (parent) {
      this.listenTo(
        parent,
        EVENTS.BEFORE_ANCESTOR_CHANGE,
        this.beforeAncestorChange,
      );
      this.listenTo(
        parent,
        EVENTS.AFTER_ANCESTOR_CHANGE,
        this.afterAncestorChange,
      );
    }
    return this;
  }
  addAutoRun(func) {
    this.autoRunDisposers.push(autorun(func));
  }
  addReaction(func1, func2) {
    this.reactionDisposers.push(reaction(func1, func2));
  }
  clearReactions() {
    this.reactionDisposers.forEach((disposer) => disposer());
    this.autoRunDisposers.forEach((disposer) => disposer());
  }
  beforeAncestorChange() {
    this.trigger(EVENTS.BEFORE_ANCESTOR_CHANGE);
  }
  afterAncestorChange() {
    this.trigger(EVENTS.AFTER_ANCESTOR_CHANGE);
  }
  updateModel2View() {
    const modelId = this.model?.id;
    if (modelId) {
      const editDomain = this.editDomain();
      if (editDomain) {
        editDomain.model2View[modelId] = this;
      }
    }
  }
  refreshStyles() {}
  setForcedInvisible(forcedInvisible) {
    this.isForcedInvisible = forcedInvisible;
    const visible = this.isVisible && !this.isForcedInvisible;
    this.figure.setVisible(visible, true);
  }
  /**
   * @return {SVGView}
   * */
  editDomain() {
    const parent = this.parent();
    if (parent && parent.editDomain) {
      return parent.editDomain();
    }
    return null;
  }
  getContext() {
    const parent = this.parent();
    if (parent && parent.getContext) {
      return parent.getContext();
    }
    return null;
  }
  getModule(...args) {
    const context = this.getContext();
    return context && context.getModule(...args);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAdapter(adapter) {}
  setElement(newEl) {
    const { type, $el } = this;
    newEl.sbView = this;
    if (type) {
      if ($el) {
        $el.removeClass(type);
      }
      jquery(newEl).addClass(type);
    }
    return super.setElement(newEl);
  }
  // for events.js
  getNextEventTarget(elm) {
    return elm.parentNode;
  }
  /**
   * call Service of context
   * @param {string} name name of Service
   * @param args arguments to call service
   */
  callService(name, ...args) {
    const context = this.getContext();
    return context.callService.apply(context, [name, ...args]);
  }
  /**
   * call context's config
   * @param {string} key - key of config
   * @returns {*} - value of config
   */
  config(key, ...args) {
    const context = this.getContext();
    return context.config(key, ...args);
  }
  /** @public */
  isShowFashionStyle() {
    return this.getContext().isShowFashionStyle();
  }
  refreshColorStyles() {}
  refreshSkeletonStyles() {}
  /** @protected */
  style(el, cls) {
    if (!(cls in this._style)) {
      throw "class name not exist.";
    }
    const preCls = el.__cls;
    if (preCls === cls) {
      return;
    }
    let newStyle = this._style[cls];
    const preStyle = this._style[preCls] || {};
    const [name] = cls.split("__");
    const rawStyle = this._style[name] || {}; //without status.
    newStyle = Object.assign({}, rawStyle, newStyle);
    for (const k in preStyle) {
      if (!(k in newStyle)) {
        newStyle[k] = null;
      }
    }
    el.attr(newStyle);
    el.__cls = cls;
  }
  get _style() {
    return {};
  }
  killAnimationByFlag(animationFlag) {
    const animationManager = this.getModule(MODULE_NAME.ANIMATION);
    if (animationManager) {
      animationManager.killAnimationByFlag(animationFlag);
    }
  }
  /**
   *
   * @param {String} type - VIEW_TYPE, could be parent class's type
   * @example audioNote.isTypeOf(VIEW_TYPE.INFOITEM) === true
   */
  isTypeOf(type) {
    return this.getTypeList().indexOf(type) !== -1;
  }
  /**
   * @returns {String[]} - VIEW_TYPE lists
   */
  getTypeList() {
    if (!this._typeArr) {
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let cur = this;
      const typeArr = [];
      while (cur.type) {
        typeArr.push(cur.type);
        cur = Object.getPrototypeOf(cur);
      }
      this._typeArr = underscore.uniq(typeArr);
    }
    return this._typeArr.slice();
  }
  /**
   * @description 手动触发contextmenu事件
   * @param {jQuery.Event} e 可能是Mouse事件，也可能是TouchEnd事件
   * */
  _dispatchContextMenu(e) {
    let event;
    const commonAttr = {
      bubbles: true,
      detail: 100,
    };
    if (e.type === "mouseup" || e.type === "mousedown") {
      event = createMouseEvent(
        "contextmenu",
        underscore.extend(
          commonAttr,
          underscore.pick(
            e,
            "clientX",
            "clientY",
            "pageX",
            "pageY",
            "screenX",
            "screenY",
            "relatedTarget",
            "region",
            "buttons",
            "button",
            "metaKey",
            "altKey",
            "shiftKey",
            "ctrlKey",
          ),
        ),
      );
    } else if (e.type === "touchend" || e.type === "pressup") {
      let changedTouch;
      if (e.type === "touchend") {
        changedTouch = e.changedTouches[0];
      }
      if (e.type === "pressup") {
        changedTouch = e.changedPointers[0];
      }
      event = createMouseEvent(
        "contextmenu",
        underscore.extend(
          commonAttr,
          underscore.pick(
            changedTouch,
            "clientX",
            "clientY",
            "pageX",
            "pageY",
            "screenX",
            "screenY",
          ),
          underscore.pick(
            e,
            "relatedTarget",
            "region",
            "buttons",
            "button",
            "metaKey",
            "altKey",
            "shiftKey",
            "ctrlKey",
          ),
        ),
      );
    } else {
      this.getContext()
        .config(CONFIG.LOGGER)
        .error("未知事件触发了自定义context menu！", e);
    }
    // 在触发右键菜单之前，应该保证对应View已经被添加如selection
    const shouldSelectViewTypeList = [
      VIEW_TYPE.BRANCH,
      VIEW_TYPE.BOUNDARY,
      VIEW_TYPE.RELATIONSHIP,
      VIEW_TYPE.IMAGE,
    ];
    if (shouldSelectViewTypeList.includes(this.type)) {
      const selectionManager = this.getContext().getModule(
        MODULE_NAME.SELECTION,
      );
      if (!selectionManager.getSelections().includes(this)) {
        selectionManager.selectSingle(this, {
          forceFlush: true,
        });
      }
    }
    this.el.dispatchEvent(event);
  }
  /**
   * @description 在press流程中调用，来check是否press需要触发context menu
   * @protected
   * */
  _pressContextMenuCheckHandle() {
    const isMobilePlatform = this.getContext().isMobilePlatform();
    if (isMobilePlatform) {
      return;
    }
    const $document = jquery(document);
    const menuCheckEvent = ".menu";
    const moveEvent = "touchmove.menu";
    const endEvent = "touchend.menu";
    let hasMove = false;
    $document.on(moveEvent, () => {
      hasMove = true;
    });
    $document.on(endEvent, (e) => {
      if (!hasMove) {
        this._dispatchContextMenu(e);
      }
      $document.off(menuCheckEvent);
    });
  }
}
function createMouseEvent(type, attrs) {
  try {
    return new MouseEvent(
      type,
      Object.assign(Object.assign({}, attrs), {
        cancelable: true,
      }),
    ); // No need to polyfill
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (e) {
    const mouseEvent = document.createEvent("MouseEvent");
    mouseEvent.initMouseEvent(
      type,
      attrs.bubbles,
      attrs.cancelable,
      window,
      attrs.detail,
      attrs.screenX,
      attrs.screenY,
      attrs.clientX,
      attrs.clientY,
      attrs.ctrlKey,
      attrs.altKey,
      attrs.shiftKey,
      attrs.metaKey,
      attrs.button,
      null,
    );
    return mouseEvent;
  }
}

export default SvgComponentView;

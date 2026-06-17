import backbone from 'backbone';

import mommonFuncs from '../mommonfuncs';

import { VIEW_TYPE, MODULE_NAME, UI_STATUS, CONFIG, EVENTS } from '../common/constants/index';

import * as utils from '../utils/index';

import type { BranchView, SheetEditor, SvgView, MarkerView, InformationIconView, LabelUnitView } from '../type.d';
import type { Semphore } from './semaphore';
import { UiStatusManager } from './uistatusmanager';

export class SelectionManager {
  selections: BranchView[];
  _lastSelectedBranch: null | BranchView;
  context: SheetEditor;
  _preBounchSelectInfo: { start: null | BranchView; selections: BranchView[] };
  isActive: boolean;
  _isSilent: boolean = false;
  _multiSelectModeEnabled: boolean = false;
  static identifier: string;
  constructor(context: SheetEditor) {
    /** @private */
    this.selections = [];
    this._lastSelectedBranch = null;
    this.context = context;
    this._preBounchSelectInfo = {
      start: null,
      selections: [],
    };
    this.isActive = true;
    this._initEventListener();
    // if (false) {}
  }
  _initEventListener() {
    const MOUSE_DOWN_EVENT = 'mousedown';
    const MOUSE_UP_EVENT = 'mouseup';
    const TAP_EVENT = 'tap';
    this.context.onEvent(MOUSE_DOWN_EVENT, VIEW_TYPE.BRANCH, e =>
      this._onBranchViewMouseDown(e as unknown as _MouseEvent & { sbView: BranchView })
    );
    this.context.onEvent(MOUSE_UP_EVENT, VIEW_TYPE.BRANCH, e =>
      this._onBranchViewMouseUp(e as unknown as _MouseEvent & { sbView: BranchView })
    );
    this.context.onEvent(MOUSE_DOWN_EVENT, VIEW_TYPE.BOUNDARY, e =>
      this._onNormalViewMouseDown(e as unknown as _MouseEvent & { sbView: BranchView })
    );
    this.context.onEvent(MOUSE_DOWN_EVENT, VIEW_TYPE.RELATIONSHIP, e =>
      this._onNormalViewMouseDown(e as unknown as _MouseEvent & { sbView: BranchView })
    );
    this.context.onEvent(MOUSE_DOWN_EVENT, VIEW_TYPE.IMAGE, e =>
      this._onNormalViewMouseDown(e as unknown as _MouseEvent & { sbView: BranchView })
    );
    this.context.onEvent(MOUSE_DOWN_EVENT, VIEW_TYPE.MATH_JAX, e =>
      this._onNormalViewMouseDown(e as unknown as _MouseEvent & { sbView: BranchView })
    );
    this.context.onEvent(MOUSE_DOWN_EVENT, VIEW_TYPE.AUDIO, e =>
      this._onNormalViewMouseDown(e as unknown as _MouseEvent & { sbView: BranchView })
    );
    this.context.onEvent(MOUSE_DOWN_EVENT, VIEW_TYPE.INFOITEM, e =>
      this._onNormalViewMouseDown(e as unknown as _MouseEvent & { sbView: BranchView })
    );
    this.context.onEvent(MOUSE_DOWN_EVENT, VIEW_TYPE.MATRIX_LABEL, e =>
      this._onNormalViewMouseDown(e as unknown as _MouseEvent & { sbView: BranchView })
    );
    this.context.onEvent(MOUSE_DOWN_EVENT, VIEW_TYPE.MARKER, e =>
      this._onInnerViewMouseDown(e as unknown as _MouseEvent & { sbView: MarkerView })
    );
    this.context.onEvent(MOUSE_DOWN_EVENT, VIEW_TYPE.INFORMATION_ICON, e =>
      this._onInnerViewMouseDown(e as unknown as _MouseEvent & { sbView: InformationIconView })
    );
    this.context.onEvent(MOUSE_DOWN_EVENT, VIEW_TYPE.LABELUNIT, e =>
      this._onLabelUnitViewMouseDown(e as unknown as _MouseEvent & { sbView: LabelUnitView })
    );
    this.context.onEvent(MOUSE_DOWN_EVENT, VIEW_TYPE.SVG, e =>
      this._onSVGViewMouseDown(e as unknown as _MouseEvent & { sbView: SvgView })
    );
    this.context.onGesture(TAP_EVENT, VIEW_TYPE.BRANCH, e =>
      this._onNormalViewTap(e as unknown as _TouchEvent & { sbView: BranchView })
    );
    this.context.onGesture(TAP_EVENT, VIEW_TYPE.BOUNDARY, e =>
      this._onNormalViewTap(e as unknown as _TouchEvent & { sbView: BranchView })
    );
    this.context.onGesture(TAP_EVENT, VIEW_TYPE.RELATIONSHIP, e =>
      this._onNormalViewTap(e as unknown as _TouchEvent & { sbView: BranchView })
    );
    this.context.onGesture(TAP_EVENT, VIEW_TYPE.IMAGE, e =>
      this._onNormalViewTap(e as unknown as _TouchEvent & { sbView: BranchView })
    );
    this.context.onGesture(TAP_EVENT, VIEW_TYPE.MATH_JAX, e =>
      this._onNormalViewTap(e as unknown as _TouchEvent & { sbView: BranchView })
    );
    this.context.onGesture(TAP_EVENT, VIEW_TYPE.AUDIO, e =>
      this._onNormalViewTap(e as unknown as _TouchEvent & { sbView: BranchView })
    );
    this.context.onGesture(TAP_EVENT, VIEW_TYPE.INFOITEM, e =>
      this._onNormalViewTap(e as unknown as _TouchEvent & { sbView: BranchView })
    );
    this.context.onGesture(TAP_EVENT, VIEW_TYPE.MATRIX_LABEL, e =>
      this._onNormalViewTap(e as unknown as _TouchEvent & { sbView: BranchView })
    );
    this.context.onGesture(TAP_EVENT, VIEW_TYPE.MARKER, e =>
      this._onInnerViewTap(e as unknown as _TouchEvent & { sbView: MarkerView })
    );
    this.context.onGesture(TAP_EVENT, VIEW_TYPE.INFORMATION_ICON, e =>
      this._onInnerViewTap(e as unknown as _TouchEvent & { sbView: InformationIconView })
    );
    this.context.onGesture(TAP_EVENT, VIEW_TYPE.SVG, e =>
      this._onSVGViewTap(e as unknown as _TouchEvent & { sbView: SvgView })
    );
  }
  /**
   * @public
   * @return {Array.<BranchView>}
   * */
  getSelections() {
    return [...this.selections];
  }
  getLastSelectedBranch() {
    // _lastSelection: refer to the last selected branchView.
    return this._lastSelectedBranch;
  }
  setLastSelectedBranch(branchView: BranchView | null) {
    if (branchView) {
      this._lastSelectedBranch = branchView;
    } else if (this.selections.length >= 1) {
      this._lastSelectedBranch = this.selections[0] as BranchView; /*View.BranchView*/
    } else {
      this._lastSelectedBranch = null;
    }
  }
  // handle multi branch drag's selection status
  _onBranchViewMouseUp(e: _MouseEvent & { sbView: BranchView }) {
    e.stopPropagation();
    if (e.button === 2) {
      return;
    }
    if (this.isMultiSelect(e)) {
      return;
    }
    if (e.shiftKey) {
      return;
    }
    this.selectSingle(e.sbView, {
      forceFlush: true,
    });
  }
  _onBranchViewMouseDown(e: _MouseEvent & { sbView: BranchView }) {
    e.stopPropagation();
    if (this.context.isMobileAppPlatform()) {
      return;
    }
    if ((e?.target as HTMLElement).getAttribute('data-name') === 'collapse-extend-hover-area') {
      return;
    }
    //Click right mouse button.
    if (e.button === 2) {
      if (this.selections.includes(e.sbView)) {
        return;
      } else {
        return this.selectSingle(e.sbView, {
          forceFlush: true,
        });
      }
    }
    if (this.isMultiSelect(e)) {
      this.toggleSelection(e.sbView);
    } else if (e.shiftKey && this.selections.length === 1 && Object(utils.isBranch)(this.selections[0])) {
      this._addSelectionBetweenBranches(this.selections[0] as BranchView, e.sbView);
    } else {
      this.selectSingle(e.sbView, {
        ignoreIncluded: true,
      });
    }
  }
  _onNormalViewMouseDown(e: _MouseEvent & { sbView: BranchView }) {
    const isRightButton = e.button === 2;
    if (this.isMultiSelect(e)) {
      this.toggleSelection(e.sbView, {
        forceFlush: isRightButton,
      });
    } else {
      this.selectSingle(e.sbView, {
        forceFlush: isRightButton,
      });
    }
    e.stopPropagation();
  }
  _onInnerViewMouseDown(e: _MouseEvent & { sbView: MarkerView | InformationIconView }) {
    if (!e?.sbView?.getBranchView) {
      return;
    }
    const branchView = e.sbView.getBranchView();
    if (branchView) {
      const isRightButton = e.button === 2;
      if (this.isMultiSelect(e)) {
        this.toggleSelection(branchView, {
          forceFlush: isRightButton,
        });
      } else {
        this.selectSingle(branchView, {
          forceFlush: isRightButton,
        });
      }
      e.stopPropagation();
    }
  }
  _onLabelUnitViewMouseDown(e: _MouseEvent & { sbView: LabelUnitView }) {
    const branchView =
      e.sbView && e.sbView.parent() && e.sbView.parent().parent() && e.sbView.parent().parent().parent();
    if (branchView) {
      const isRightButton = e.button === 2;
      if (this.isMultiSelect(e)) {
        this.toggleSelection(branchView, {
          forceFlush: isRightButton,
        });
      } else {
        this.selectSingle(branchView, {
          forceFlush: isRightButton,
        });
      }
      e.stopPropagation();
    }
  }
  _onSVGViewMouseDown(e: _MouseEvent & { sbView: SvgView }) {
    if (e.target !== e.sbView.svg.node) {
      return;
    }
    const isAllShift = e.shiftKey;
    // 多范围框选
    if (this.isMultiSelect(e) || isAllShift) {
      return;
    }
    this.selectNone({
      forceFlush: e.button === 2,
    });
  }
  _onNormalViewTap(e: _TouchEvent & { sbView: BranchView }) {
    if (!this.context.isMobileAppPlatform()) {
      // for XMind.works, return tap event for touch platform
      const semaphore = this.context.getModule<Semphore>(MODULE_NAME.SEMAPHORE);
      if (semaphore === null || semaphore === undefined ? undefined : semaphore.isStatusActive(UI_STATUS.EDIT_TITLE)) {
        return;
      }
    }
    e.stopPropagation();
    if (this.isMultiSelect(e)) {
      this.toggleSelection(e.sbView);
    } else {
      this.selectSingle(e.sbView);
    }
  }
  _onInnerViewTap(e: TouchEvent & { sbView: MarkerView | InformationIconView }) {
    const branchView = e && e.sbView && e.sbView.getBranchView && e.sbView.getBranchView();
    if (branchView) {
      this.selectSingle(branchView);
      e.stopPropagation();
    }
  }
  _onSVGViewTap(e: TouchEvent & { sbView: SvgView }) {
    if (e.target !== e.sbView.svg.node) {
      return;
    }
    const semaphore = this.context.getModule<Semphore>(MODULE_NAME.SEMAPHORE);
    if (semaphore === null || semaphore === undefined ? undefined : semaphore.isStatusActive(UI_STATUS.EDIT_TITLE)) {
      return;
    }
    if (this.isMultiSelect(e)) {
      return;
    }
    this.selectNone();
  }
  _addSelectionBetweenBranches(preBranch: BranchView, curBranch: BranchView) {
    if (preBranch === curBranch) {
      return;
    }
    const parentBranch = curBranch.parent();
    if (preBranch.parent() === parentBranch) {
      //可能是floating topic和main topic
      const siblings = parentBranch.getChildrenBranchesByType();
      const branchesToAdd = this._branchesBetween2(siblings, preBranch, curBranch);
      this._removePreviousBounchSelection(preBranch);
      branchesToAdd.forEach(branch => this._addSel(branch));
      this._preBounchSelectInfo = {
        start: preBranch,
        selections: branchesToAdd,
      };
    }
  }
  _removePreviousBounchSelection(preBranch: BranchView) {
    if (this._preBounchSelectInfo.start === preBranch) {
      const preSelections = this._preBounchSelectInfo.selections;
      if (Array.isArray(preSelections)) {
        preSelections.forEach(branch => this.removeFromSelection(branch));
      }
    }
  }
  _branchesBetween2(branches: BranchView[], branch1: BranchView, branch2: BranchView) {
    let start = branches.indexOf(branch1);
    let end = branches.indexOf(branch2);
    if (end < start) {
      [start, end] = [end, start];
    }
    if (start === -1) {
      return [];
    } // one of the branch is floating.
    return branches.slice(start, end + 1);
  }
  // todo this method shouldn't be here
  isUnselectable(view?: BranchView) {
    if (!view) {
      return true;
    }
    return (
      view.type === VIEW_TYPE.BRANCH &&
      ((view as BranchView).shouldHide() ||
        view.isVisible === undefined ||
        view.isVisible === false ||
        view.isForcedInvisible)
    );
  }
  getFirstChildBranch() {
    let firstChildBranch: BranchView | undefined;
    this.selections.some(item => {
      if (item.type === VIEW_TYPE.BRANCH) {
        firstChildBranch = item;
        return true;
      }
    });
    return firstChildBranch;
  }
  /**
   * @description 单独选择某个组件
   * @public
   * */
  selectSingle(
    view: BranchView,
    {
      forceFlush,
      ignoreIncluded,
    }: {
      forceFlush?: boolean;
      ignoreIncluded?: boolean;
    } = {}
  ) {
    if (!this.isActive || !view) {
      return this;
    }
    if (this.selections.includes(view)) {
      if (ignoreIncluded) {
        return this;
      }
      if (this.selections.length === 1) {
        return this;
      }
    }
    if (this.isUnselectable(view)) {
      return this;
    }
    this._clearSelections();
    if (Reflect.has(view, 'select')) {
      (view as BranchView).select();
    }
    this.selections.push(view);
    this.setLastSelectedBranch(view);
    this.notify({
      forceFlush,
    });
    return this;
  }
  selectNone({ forceFlush }: { forceFlush?: boolean } = {}) {
    if (!this.isActive) {
      return this;
    }
    if (!this.selections.length) {
      return this;
    }
    this._clearSelections();
    this.notify({
      forceFlush,
    });
    return this;
  }
  removeFromSelection(view: BranchView, { forceFlush }: { forceFlush?: boolean } = {}) {
    if (!view) {
      return this;
    }
    const index = this.selections.indexOf(view);
    if (index === -1) {
      return this;
    }
    this.selections.splice(index, 1);
    if (Reflect.has(view, 'deselect')) {
      (view as BranchView).deselect();
    }
    if (this.getLastSelectedBranch() === view) {
      this.setLastSelectedBranch(null);
    }
    this.notify({
      forceFlush,
    });
    return this;
  }
  addSelection(view: BranchView, { forceFlush }: { forceFlush?: boolean } = {}) {
    this._addSel(view, false, {
      forceFlush,
    });
  }
  toggleSelection(view: BranchView, { forceFlush }: { forceFlush?: boolean } = {}) {
    const isFirstTime = this.selections.length === 0;
    if (isFirstTime || view.type === this.selections[0].type) {
      return this._addSel(view, true, {
        forceFlush,
      });
    }
  }
  setIsSilent(bool: boolean) {
    this._isSilent = bool;
  }
  _clearSelections() {
    if (this.selections.length === 0) {
      return;
    }
    this.selections.forEach(selectedView => {
      if (Reflect.has(selectedView, 'deselect')) {
        (selectedView as BranchView).deselect();
      }
    });
    this.selections.length = 0;
  }
  _addSel(view: BranchView, isRmRepeat?: boolean, { forceFlush }: { forceFlush?: boolean } = {}) {
    if (!this.isActive) {
      return this;
    }
    if (!view) {
      return this;
    }
    if (this.isUnselectable(view)) {
      return this;
    }
    const index = this.selections.indexOf(view);
    if (index !== -1) {
      if (isRmRepeat) {
        this.removeFromSelection(view);
        return false;
      }
      // ken: the following 2 lines of code will reorder the selections.
      this.selections.splice(index, 1);
      this.selections.push(view);
      return this;
    }
    if (this.context.config(CONFIG.NO_MULTI_SELECT)) {
      return this.selectSingle(view, {
        forceFlush,
      });
    }
    if (Reflect.has(view, 'select')) {
      (view as BranchView).select();
    }
    this.selections.push(view);
    this.setLastSelectedBranch(view);
    this.notify({
      forceFlush,
    });
    return this;
  }
  setMultiSelectMode(enabled: boolean) {
    let _a;
    let _b;
    this._multiSelectModeEnabled = enabled;
    if (enabled) {
      if ((_a = this.context.getModule<Semphore>(MODULE_NAME.SEMAPHORE)) === null || _a === undefined) {
        // do nothing
      } else {
        _a.increase(UI_STATUS.MULTI_SELECT_MODE);
      }
    } else if ((_b = this.context.getModule<Semphore>(MODULE_NAME.SEMAPHORE)) === null || _b === undefined) {
      // do nothing
    } else {
      _b.decrease(UI_STATUS.MULTI_SELECT_MODE);
    }
  }
  isMultiSelect(e: MouseEvent | TouchEvent) {
    const isPressFunctionKey = e && mommonFuncs.isFunctionEnabled(e);
    return isPressFunctionKey || this._multiSelectModeEnabled;
  }
  notify({ forceFlush }: { forceFlush?: boolean } = {}) {
    if (!this._isSilent) {
      this.context.trigger(EVENTS.SELECTION_CHANGED, this.selections);
    }
    const payload = {
      content: this.getSelections(),
      forceFlush,
    };
    this.context
      .getModule<UiStatusManager>(MODULE_NAME.UI_STATUS)
      .commit(UiStatusManager._mutations.selectionChange, payload);
  }
  enable() {
    this.isActive = true;
  }
  disable() {
    this.isActive = false;
  }
}

export default SelectionManager;
SelectionManager.identifier = MODULE_NAME.SELECTION;
Object.assign(SelectionManager.prototype, backbone.Events);

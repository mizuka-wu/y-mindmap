import * as lazyrunner from "./lazyrunner/index";

import * as common_utils from "../common/utils/index";

import { renderEngine } from "./renderengine/index";

import { layoutEngine } from "./layoutengine/index";

import { BaseFigure } from "./base";

import type { SheetRenderWorker } from "./renderengine/svg/renderworkers/sheetrenderworker";
import type { BranchRenderWorker } from "./renderengine/svg/renderworkers/branchrenderworker";
import type { ConnectionRenderWorker } from "./renderengine/svg/renderworkers/connectionrenderworker";
import type { TopicRenderWorker } from "./renderengine/svg/renderworkers/topicrenderworker";
import type { CollapseExtendRenderWorker } from "./renderengine/svg/renderworkers/collapseextendrenderworker";
import type { TopicTitleRenderWorker } from "./renderengine/svg/renderworkers/topictitlerenderworker";
import type { NumberingRenderWorker } from "./renderengine/svg/renderworkers/numberingrenderworker";
import type { RelationshipTitleRenderWorker } from "./renderengine/svg/renderworkers/relationshiptitlerenderworker";
import type { RelationshipRenderWorker } from "./renderengine/svg/renderworkers/relationshiprenderworker";
import type { ImageRenderWorker } from "./renderengine/svg/renderworkers/imagerenderworker";
import type { MarkersRenderWorker } from "./renderengine/svg/renderworkers/markersrenderworker";
import type { MarkerRenderWorker } from "./renderengine/svg/renderworkers/markerrenderworker";
import type { InformationRenderWorker } from "./renderengine/svg/renderworkers/informationrenderworker";
import type { LabelsRenderWorker } from "./renderengine/svg/renderworkers/labelsrenderworker";
import type { LabelRenderWorker } from "./renderengine/svg/renderworkers/labelrenderworker";
import type { BoundaryRenderWorker } from "./renderengine/svg/renderworkers/boundaryrenderworker";
import type { SelectBoxRenderWorker } from "./renderengine/svg/renderworkers/selectboxrenderworker";
import type { ResizeBoxRenderWorker } from "./renderengine/svg/renderworkers/resizeboxrenderworker";
import type { TopicSelectBoxRenderWorker } from "./renderengine/svg/renderworkers/topicselectboxrenderworker";
import type { MatrixRenderWorker } from "./renderengine/svg/renderworkers/matrixrenderworker";
import type { MatrixLabelRenderWorker } from "./renderengine/svg/renderworkers/matrixlabelrenderworker";
import type { MatrixCellRenderWorker } from "./renderengine/svg/renderworkers/matrixcellrenderworker";
import type { MatrixPlusRenderWorker } from "./renderengine/svg/renderworkers/matrixplusrenderworker";
import type { BoundaryTitleRenderWorker } from "./renderengine/svg/renderworkers/boundarytitlerenderworker";
import type { MathJaxRenderWorker } from "./renderengine/svg/renderworkers/mathjaxrenderworker";
import type { TreeTableCellRenderWorker } from "./renderengine/svg/renderworkers/treetablecellrenderworker";
import type { FishBoneHeadLineRenderWorker } from "./renderengine/svg/renderworkers/fishboneheadlinerenderworker";
import type { FishBoneMainLineRenderWorker } from "./renderengine/svg/renderworkers/fishbonemainlinerenderworker";
import type { IndicatorRenderWorker } from "./renderengine/svg/renderworkers/indicatorrenderworker";
import type { TimelineMainLineRenderWorker } from "./renderengine/svg/renderworkers/timelinemainlinerenderworker";

export class Figure extends BaseFigure {
  _isDisposed: boolean;
  positionDirty: boolean;
  forbidInvalidateLayout: boolean;
  forbidInvalidateLayoutParent: boolean;
  forbidInvalidatePaint: boolean;
  isVisible: boolean;
  _inReprieve: boolean;
  opacity: number;
  opacityDirty: boolean;
  type: any;
  viewController: any;
  layoutWorker: { work(viewController: any, params?: any): any };
  renderWorker:
    | SheetRenderWorker
    | BranchRenderWorker
    | ConnectionRenderWorker
    | TopicRenderWorker
    | TopicTitleRenderWorker
    | NumberingRenderWorker
    | RelationshipTitleRenderWorker
    | RelationshipRenderWorker
    | ImageRenderWorker
    | MarkersRenderWorker
    | MarkerRenderWorker
    | InformationRenderWorker
    | LabelsRenderWorker
    | LabelRenderWorker
    | BoundaryRenderWorker
    | SelectBoxRenderWorker
    | ResizeBoxRenderWorker
    | TopicSelectBoxRenderWorker
    | MatrixRenderWorker
    | MatrixLabelRenderWorker
    | MatrixCellRenderWorker
    | MatrixPlusRenderWorker
    | BoundaryTitleRenderWorker
    | MathJaxRenderWorker
    | TreeTableCellRenderWorker
    | FishBoneHeadLineRenderWorker
    | FishBoneMainLineRenderWorker
    | IndicatorRenderWorker
    | TimelineMainLineRenderWorker
    | CollapseExtendRenderWorker;
  dirtyPaint: any;
  dirtyLayout: any;
  isVisibleDirty: boolean;
  size: any;
  sizeDirty: boolean;
  position: any;
  prefSize: any;
  // paintVisible: boolean = true
  // paintVisibleDirty: boolean
  // layoutVisible: boolean = true
  // layoutVisibleDirty: boolean
  constructor(viewController) {
    super();
    this._isDisposed = false;
    this.positionDirty = false;
    this.forbidInvalidateLayout = false;
    this.forbidInvalidateLayoutParent = false;
    this.forbidInvalidatePaint = false;
    this.isVisible = true;
    this._inReprieve = false;
    this.opacity = 1;
    this.opacityDirty = false;
    this.type = viewController.figureType || viewController.type;
    this.viewController = viewController;
    this.layoutWorker = layoutEngine.createLayoutWorker(this.type);
    this.renderWorker = renderEngine.createRenderWorker(this.type, this);
    this.setSize({
      width: -1,
      height: -1,
    });
    this.setPosition({
      x: 0,
      y: 0,
    });
  }
  validatePaint() {
    if (this.dirtyPaint) {
      this.renderWorker.work();
      this.dirtyPaint = false;
    }
  }
  invalidatePaint() {
    if (this.forbidInvalidatePaint) {
      return;
    }
    this.dirtyPaint = true;
    lazyrunner.lazyRunner.work(
      lazyrunner.runnerConstants.PRIORITY.RENDER,
      this,
    );
  }
  validateLayout() {
    if (this.dirtyLayout) {
      this.forbidInvalidateLayout = true;
      this.layoutWorker.work(this.viewController);
      this.forbidInvalidateLayout = false;
      this.dirtyLayout = false;
    }
  }
  invalidateLayout() {
    if (this.forbidInvalidateLayout) {
      return;
    }
    this.dirtyLayout = true;
    lazyrunner.lazyRunner.work(
      lazyrunner.runnerConstants.PRIORITY.LAYOUT,
      this,
    );
    this.invalidatePaint();
    if (this.forbidInvalidateLayoutParent) {
      return;
    }
    const parent = this.getParent();
    if (parent) {
      parent.invalidateLayout();
    }
  }
  manuallyLayout(params?) {
    this.forbidInvalidateLayout = true;
    this.layoutWorker.work(this.viewController, params);
    this.forbidInvalidateLayout = false;
  }
  manuallyPaint() {
    this.renderWorker.work();
  }
  setPaintable(canInvalidatePaint) {
    if (!canInvalidatePaint) {
      this.dirtyPaint = false;
    }
    this.forbidInvalidatePaint = !canInvalidatePaint;
    this.invalidatePaint();
  }
  setLayoutable(
    canInvalidateLayout,
    canInvalidateLayoutParent,
    preventInvalidateLayout,
  ) {
    if (!canInvalidateLayout) {
      this.dirtyLayout = false;
    }
    this.forbidInvalidateLayout = !canInvalidateLayout;
    this.forbidInvalidateLayoutParent = !canInvalidateLayoutParent;
    if (!preventInvalidateLayout) {
      this.invalidateLayout();
    }
  }
  setVisible(isVisible, paintOrLayout) {
    if (this.isVisible !== isVisible) {
      this.isVisible = isVisible;
      this.isVisibleDirty = true;
      if (paintOrLayout) {
        this.invalidatePaint();
      } else {
        this.invalidateLayout();
      }
    }
  }
  setSize(size, forceUpdate?: boolean) {
    const newSizeDirty =
      !this.size || !Object(common_utils.isSameSize)(this.size, size);
    if (!forceUpdate && !newSizeDirty) {
      return;
    }
    this.sizeDirty = true;
    this.size = Object.assign({}, size);
    this.invalidateLayout();
    this.invalidatePaint();
  }
  setPosition(position) {
    const newPositionDirty =
      !this.position ||
      this.position.x !== position.x ||
      this.position.y !== position.y;
    if (newPositionDirty) {
      this.positionDirty = newPositionDirty;
    }
    this.position = Object.assign({}, position);
    if (this.positionDirty) {
      this.invalidatePaint();
    }
  }
  setOpacity(opacity) {
    if (this.opacity !== opacity) {
      this.opacity = opacity;
      this.opacityDirty = true;
      this.invalidatePaint();
    }
  }
  getContent() {
    return this.renderWorker.getContent();
  }
  layout() {
    this.layoutWorker.work(this.viewController);
  }
  dispose() {
    if (!this._inReprieve) {
      this.renderWorker.dispose();
    }
    this._isDisposed = true;
  }
  reprieve(intoOrOut) {
    this._inReprieve = intoOrOut;
    if (!this._inReprieve) {
      this.renderWorker.dispose();
    } else {
      this.renderWorker.getContent().hide();
    }
  }
  getSize() {
    if (this.prefSize) {
      return this.prefSize;
    } else {
      return this.size;
    }
  }
  /**
   * @description Get real size for layout
   * @param {*boolean} options.refreshCache
   * @param {*boolean} options.forceLayout
   */
  getPreferedSize(options) {
    const defaultOptions = {
      refreshCache: false,
      forceLayout: false,
    };
    options = Object.assign({}, defaultOptions, options);
    let newSize = {
      width: this.size.width,
      height: this.size.height,
    };
    if (options.forceLayout) {
      newSize = this.layoutWorker.work(this.viewController);
    }
    if (options.refreshCache) {
      this.prefSize = newSize;
    }
    if (this.prefSize) {
      return this.prefSize;
    } else {
      return newSize;
    }
  }
  setPreferredSize(preferredSize) {
    if (
      this.prefSize &&
      preferredSize &&
      Object(common_utils.isSameSize)(this.prefSize, preferredSize)
    ) {
      return;
    }
    this.prefSize = preferredSize;
  }
  getParent() {
    const pvc = this.viewController.parent();
    return pvc && pvc.figure;
  }
  getCentralFigure() {
    if (this.viewController.isCentralBranch()) {
      return this.viewController.figure;
    } else {
      const parentFigure = this.getParent();
      return parentFigure && parentFigure.getCentralFigure();
    }
  }
  canExecute() {
    const context = this.viewController.getContext();
    const canExecuteForContext =
      !context ||
      context.isHibernating() === undefined ||
      context.isHibernating() === false;
    return canExecuteForContext && !this.isDisposed();
  }
  isDisposed() {
    return this._isDisposed;
  }
}

export default Figure;

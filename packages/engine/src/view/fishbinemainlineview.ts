import {
  VIEW_TYPE,
  FIGURE_TYPE,
  DIRECTION,
  CLASS_TYPE,
  LINETAPERED,
} from "../common/constants/index";
import figures from "../figures/index";
import SvgComponentView from "./svgcomponentview";

import styleManager from "../utils/business/stylemanager/index";

import { getStructure } from "../structures/helper/allstructures";

import * as utils from "../utils/index";
export class a extends SvgComponentView {
  isVisible: boolean;
  figure: any;
  arrowSelector: utils.ArrowSelector;
  isForcedInvisible: any;
  constructor(parentView) {
    super();
    this.isVisible = true;
    this.parent(parentView);
    this.figure = figures.createFigure(this);
    this.setVisible(!parentView.shouldHide());
    this.arrowSelector = new utils.ArrowSelector(
      this.figure.viewController,
      this.figure.renderWorker.s$fishBoneMarkerLine,
    );
    this._initEventListener();
  }
  get type() {
    return VIEW_TYPE.FISH_BONE_MAIN_LINE;
  }
  get figureType() {
    return FIGURE_TYPE.FISH_BONE_MAIN_LINE;
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  setVisible(isVisible) {
    this.isVisible = isVisible;
    this.figure.setVisible(isVisible && !this.isForcedInvisible);
  }
  _setLinePosition() {
    if (!this.figure.isVisible) {
      return;
    }
    const mainBoneBranchView = this.parent();
    const headBoneBranchView = mainBoneBranchView.parent();
    const parentHeadBranchViewLayoutInfo =
      headBoneBranchView === null || headBoneBranchView === undefined
        ? undefined
        : headBoneBranchView.getLayoutInfo();
    if (!parentHeadBranchViewLayoutInfo) {
      return;
    }
    const parentStructure = mainBoneBranchView.getStructureClass();
    const isGrowToDownMultiplicationParam =
      getStructure(parentStructure).getRangeGrowthDirection() === DIRECTION.DOWN
        ? 1
        : -1;
    const isDirectionToRightMultiplicationParam =
      getStructure(parentStructure).direction === DIRECTION.RIGHT ? 1 : -1;
    const parentBranchViewRealPosition = mainBoneBranchView.getRealPosition();
    const parentTopicHeight = mainBoneBranchView.topicView.bounds.height;
    const lineGap = Object(utils.getLineEndSpacingPatchGap)(headBoneBranchView);
    const endPosition = {
      x:
        parentBranchViewRealPosition.x -
        (lineGap / utils.layoutConstant.FISH_BONE.BONE_CONNECTION_TAN) *
          isDirectionToRightMultiplicationParam,
      y:
        (parentTopicHeight / 2 + lineGap) * isGrowToDownMultiplicationParam +
        parentBranchViewRealPosition.y,
    };
    const parentPosition = Object.assign({}, mainBoneBranchView.position);
    const mainlineHeight =
      Math.abs(
        parentPosition.y -
          parentHeadBranchViewLayoutInfo.externalInfo.startAnchorPositionY,
      ) -
      parentTopicHeight / 2;
    const mainlineWidth =
      mainlineHeight / utils.layoutConstant.FISH_BONE.BONE_CONNECTION_TAN;
    const startPosition = {
      x:
        -mainlineWidth * isDirectionToRightMultiplicationParam +
        parentBranchViewRealPosition.x,
      y:
        (mainlineHeight + parentTopicHeight / 2) *
          isGrowToDownMultiplicationParam +
        parentBranchViewRealPosition.y,
    };
    this.figure.setEndPosition(startPosition);
    this.figure.setStartPosition(endPosition);
  }
  refreshLineTapered() {
    if (styleManager.getClassName(this.parent()) === CLASS_TYPE.MAIN_TOPIC) {
      const lineTapered = this.getContext().getSheetView().figure.lineTapered;
      this.figure.setLineTapered(lineTapered === LINETAPERED.TAPERED);
    } else {
      this.figure.setLineTapered(false);
    }
  }
  _initEventListener() {
    const mainBoneBranchView = this.parent();
    const mainBoneFigure = mainBoneBranchView.figure;
    this.listenTo(mainBoneBranchView, "afterRealPosChange", () => {
      this._setLinePosition();
    });
    this.listenTo(mainBoneBranchView, "refreshView", () => {
      this.setVisible(!mainBoneBranchView.shouldHide());
    });
    const headBoneFigure = mainBoneBranchView.parent().figure;
    this.addAutoRun(() => {
      this.figure.setStyleWidth(headBoneFigure.lineWidth);
      this.figure.setLineColor(mainBoneFigure.lineColor);
      this.figure.setEndArrowClass(headBoneFigure.endArrowClass);
      this.figure.setLinePattern(
        Object(utils.getUnDashableLinePattern)(mainBoneFigure.linePattern),
      );
    });
    this.addAutoRun(() => {
      this.refreshLineTapered();
    });
  }
  remove() {
    this.figure.dispose();
    this.stopListening();
    this.arrowSelector.dispose();
    this.clearReactions();
    this.parent(null);
    return this;
  }
}

export default a;

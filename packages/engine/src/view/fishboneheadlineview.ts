import {
  STRUCTURECLASS,
  DIRECTION,
  VIEW_TYPE,
  FIGURE_TYPE,
  TOPIC_TYPE,
  LINETAPERED,
} from "../common/constants/index";

import figures from "../figures/index";

import SvgComponentView from "./svgcomponentview";

import * as utils from "../utils/index"; // 关于main topic更改line
// head没有连接到main的线，main到sub的线分为两段
function getParentStructureDirection(parentBranchView) {
  const parentStructure = parentBranchView.getStructureClass();
  if (parentStructure === STRUCTURECLASS.FISHBONELEFTHEADED) {
    return DIRECTION.RIGHT;
  } else {
    return DIRECTION.LEFT;
  }
}
export class FishBoneHeadLineView extends SvgComponentView {
  isVisible: boolean;
  figure: any;
  isForcedInvisible: any;
  constructor(parentView) {
    super();
    this.isVisible = true;
    this.parent(parentView);
    this.figure = figures.createFigure(this);
    this.refreshLineDirection();
    this._initEventListener();
    this.isVisible = true;
  }
  get type() {
    return VIEW_TYPE.FISH_BONE_HEAD_LINE;
  }
  get figureType() {
    return FIGURE_TYPE.FISH_BONE_HEAD_LINE;
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
  refreshLineStyleWidth() {
    this.figure.setStyleWidth(parseInt(`${this.parent().figure.lineWidth}`));
  }
  refreshLineColor() {
    const parent = this.parent();
    const multiLineColor =
      this.getContext().getSheetView().figure.multiLineColors;
    if (multiLineColor && multiLineColor !== "none") {
      const children = parent.getChildrenBranchesByType(TOPIC_TYPE.ATTACHED);
      const lineColor = (children[children.length - 1] ?? parent).figure
        .lineColor;
      this.figure.setLineColor(lineColor);
    } else {
      const lineColor = parent.figure.lineColor;
      this.figure.setLineColor(lineColor);
    }
  }
  refreshLineTapered() {
    if (Object(utils.isCentralBranch)(this.parent())) {
      const lineTapered = this.getContext().getSheetView().figure.lineTapered;
      this.figure.setLineTapered(lineTapered === LINETAPERED.TAPERED);
    } else {
      this.figure.setLineTapered(false);
    }
  }
  refreshLinePattern() {
    const parent = this.parent();
    this.figure.setLinePattern(
      Object(utils.getUnDashableLinePattern)(parent.figure.linePattern),
    );
  }
  refreshLineBodyWidth() {
    const layoutInfo = this.parent().getLayoutInfo();
    if (!layoutInfo) {
      return;
    }
    const bodyWidth = layoutInfo.externalInfo.headLineWidth;
    this.figure.setBodyWidth(bodyWidth);
  }
  refreshLinePosition() {
    const layoutInfo = this.parent().getLayoutInfo();
    if (!layoutInfo) {
      return;
    }
    const topicBounds = this.parent().topicView.bounds;
    let x = 0;
    if (getParentStructureDirection(this.parent()) === DIRECTION.RIGHT) {
      x = topicBounds.width + topicBounds.x;
    } else {
      x = topicBounds.x;
    }
    const parentBranchViewRealPosition = this.parent().getRealPosition();
    const startAnchorPositionY = layoutInfo.externalInfo.startAnchorPositionY;
    this.figure.setPosition({
      x: parentBranchViewRealPosition.x + x,
      y: parentBranchViewRealPosition.y + startAnchorPositionY,
    });
  }
  refreshLineDirection() {
    this.figure.setDirection(getParentStructureDirection(this.parent()));
  }
  _initEventListener() {
    const parentBranchView = this.parent();
    const isParentVisible = () => {
      return (
        !parentBranchView.shouldCollapse() && !parentBranchView.shouldHide()
      );
    };
    const updateWidthAndPosition = () => {
      if (!isParentVisible()) {
        return;
      }
      this.refreshLineBodyWidth();
      this.refreshLinePosition();
    };
    this.listenTo(parentBranchView, "afterlayoutInfoUpdate", () => {
      updateWidthAndPosition();
      this.refreshLineColor();
      this.refreshLineDirection();
    });
    this.listenTo(
      parentBranchView,
      "afterRealPosChange",
      updateWidthAndPosition,
    );
    this.listenTo(parentBranchView, "change:bounds", updateWidthAndPosition);
    this.listenTo(parentBranchView, "refreshView", () => {
      this.setVisible(isParentVisible());
    });
    this.addAutoRun(() => {
      this.refreshLinePattern();
      this.refreshLineColor();
      this.refreshLineTapered();
      this.refreshLineStyleWidth();
    });
  }
  remove() {
    this.figure.dispose();
    this.stopListening();
    this.clearReactions();
    this.parent(null);
    return this;
  }
}

export default FishBoneHeadLineView;

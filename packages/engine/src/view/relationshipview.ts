import process from "process";
import styleManager from "../utils/business/stylemanager/index";

import {
  STYLE_KEYS,
  VIEW_TYPE,
  FIGURE_TYPE,
  CONFIG,
  MODULE_NAME,
  UI_STATUS,
  ANIMATION_FLAGS,
} from "../common/constants/index";

import RelationshipTitleView from "./relationshiptitleview";

import figures from "../figures/index";

import * as utils from "../utils/index";

import Util from "../util";

import { layoutConstant } from "../utils/layoutconstant";

import * as pointUtils from "../utils/pointutils";

import SvgDraggableRelationship from "../modules/svgdraggable/relationship";

import { getRelationshipLineType } from "../render/relationshiplinetype";

import TitleableView from "./titleableview";

const HALF_POINT_WIDTH = 4;
const HALF_POINT_HEIGHT = 4;
const FOCUS_POINT_RATIO = 1.5;
const Style = (target) => {
  return class RelationshipView extends target {
    initEventsListener() {
      super.initEventsListener();
      if (process.env.SB_MODE === "readonly") {
        return;
      }
      this.listenTo(this.model, "changeStyle", this.onChangeStyle);
      this.listenTo(this.model, "setStyleObject", this.refreshStyles);
      this.on("afterAncestorChange", () => {
        const sheetView = this.parent();
        if (!sheetView) {
          return;
        }
        this.addReaction(
          () => sheetView.figure.backgroundColor,
          () => this.refreshTextColor(),
        );
      });
    }
    initStyle() {
      this.refreshColorStyles();
      this.refreshSkeletonStyles();
      this.hadInit = true;
    }
    refreshStyles() {
      this.refreshColorStyles();
      this.refreshSkeletonStyles();
    }
    refreshColorStyles() {
      super.refreshColorStyles();
      this.figure.setLineColor(
        styleManager.getStyleValue(this, STYLE_KEYS.LINE_COLOR),
      );
    }
    refreshSkeletonStyles() {
      super.refreshSkeletonStyles();
      this.figure.setLineStyle(
        styleManager.getStyleValue(this, STYLE_KEYS.SHAPE_CLASS),
      );
      this.figure.setLinePattern(
        styleManager.getStyleValue(this, STYLE_KEYS.LINE_PATTERN),
      );
      this.figure.setLineWidth(
        parseInt(styleManager.getStyleValue(this, STYLE_KEYS.LINE_WIDTH)),
      );
      this.figure.setBeginArrowClass(
        styleManager.getStyleValue(this, STYLE_KEYS.ARROW_BEGIN_CLASS),
      );
      this.figure.setEndArrowClass(
        styleManager.getStyleValue(this, STYLE_KEYS.ARROW_END_CLASS),
      );
    }
    onChangeStyle(key) {
      super.onChangeStyle(key);
      const value = styleManager.getStyleValue(this, key);
      if (key === STYLE_KEYS.LINE_COLOR) {
        this.figure.setLineColor(value);
      } else if (key === STYLE_KEYS.SHAPE_CLASS) {
        this.figure.setLineStyle(value);
      } else if (key === STYLE_KEYS.LINE_PATTERN) {
        this.figure.setLinePattern(value);
      } else if (key === STYLE_KEYS.LINE_WIDTH) {
        this.figure.setLineWidth(parseInt(value));
      } else if (key === STYLE_KEYS.ARROW_BEGIN_CLASS) {
        this.figure.setBeginArrowClass(value);
      } else if (key === STYLE_KEYS.ARROW_END_CLASS) {
        this.figure.setEndArrowClass(value);
      }
    }
  } as typeof target;
};

@Style
export class RelationshipView extends TitleableView {
  model: any;
  titleView: any;
  relativeDistance1: { x: number; y: number };
  relativeDistance2: { x: number; y: number };
  bounds: { x: number; y: number; width: number; height: number };
  position: { x: number; y: number };
  hideCount: number;
  isVisible: boolean;
  isSelected: boolean;
  isDeFocus: boolean;
  hadBindDraggable: boolean;
  hadInit: boolean;
  posInfo: any;
  isHovering: boolean;
  isForcedInvisible: boolean;
  end1View: any;
  end2View: any;
  isHoveringStartPoint1: boolean;
  isHoveringStartPoint2: boolean;
  isHoveringControlPoint1: boolean;
  isHoveringControlPoint2: boolean;
  isDraggingStartPoint1: boolean;
  isDraggingStartPoint2: boolean;
  isDraggingControlPoint1: boolean;
  isDraggingControlPoint2: boolean;
  virtual: any;
  startPoint1Package: any;
  controlPoint1Package: any;
  startPoint2Package: any;
  controlPoint2Package: any;
  arrowSelector: any;
  titleText: any;
  constructor(model, virtual) {
    super({
      model,
    });
    this.relativeDistance1 = {
      x: 0,
      y: 0,
    };
    this.relativeDistance2 = {
      x: 0,
      y: 0,
    };
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this.position = {
      x: 0,
      y: 0,
    };
    this.hideCount = 0;
    this.isVisible = true;
    this.isSelected = false;
    this.isDeFocus = false;
    this.hadBindDraggable = false;
    this.hadInit = false;
    this.posInfo = null; //两个控制点，两个交点。
    this.isHovering = false;
    this.isForcedInvisible = false;
    this.end1View = null;
    this.end2View = null;
    this.isHoveringStartPoint1 = false;
    this.isHoveringStartPoint2 = false;
    this.isHoveringControlPoint1 = false;
    this.isHoveringControlPoint2 = false;
    this.isDraggingStartPoint1 = false;
    this.isDraggingStartPoint2 = false;
    this.isDraggingControlPoint1 = false;
    this.isDraggingControlPoint2 = false;
    this.virtual = virtual;
    this.model = model;
    this.figure = figures.createFigure(this);
    const renderWorker = this.figure.renderWorker;
    this.startPoint1Package = renderWorker.startPoint1Package;
    this.controlPoint1Package = renderWorker.controlPoint1Package;
    this.startPoint2Package = renderWorker.startPoint2Package;
    this.controlPoint2Package = renderWorker.controlPoint2Package;
    this.arrowSelector = new utils.ArrowSelector(
      this,
      this.figure.renderWorker.path,
    );
    this.end1View = null;
    this.end2View = null;
    this.titleView = new RelationshipTitleView();
    this.titleText = this.titleView.getTextSvg();
    this.initEventsListener();
  }
  get type() {
    return VIEW_TYPE.RELATIONSHIP;
  }
  get figureType() {
    return FIGURE_TYPE.RELATIONSHIP;
  }
  get _style() {
    return {
      relationship: {
        fill: "none",
      },
      controlPoint: {
        fill: "#FFFFFF",
        stroke: "#2ebdff",
      },
      actionPath: {
        stroke: "#2ebdff",
        fill: "none",
        "stroke-opacity": "0",
      },
      actionPath__hover: {
        "stroke-opacity": "0.5",
      },
      actionPath__selected: {
        "stroke-opacity": "0.75",
      },
      actionPath__defocus: {
        "stroke-opacity": "0.75",
        stroke: "#9f9f9f",
      },
      holder: {
        stroke: "#2ebdff",
      },
      holder__hover: {
        "stroke-opacity": "1",
      },
      holder__selected: {
        "stroke-opacity": "1",
      },
      relationshipShadowAction: {
        "stroke-opacity": "0",
        stroke: "none",
        fill: "none",
      },
    };
  }
  afterAncestorChange() {
    super.afterAncestorChange();
    this.updateModel2View();
  }
  initEventsListener() {
    this.on("afterAncestorChange", () => {
      this.titleView.parent(this);
      // add mask to path to show title clearly
      if (!this.editDomain() || this.virtual === true) {
        return;
      }
      if (!this.hadBindDraggable) {
        this.hadBindDraggable = true;
        new SvgDraggableRelationship().init(this);
      }
      this._updateState();
      this.updateBranchViews();
      this.initEventsListenerWithContext();
    });
    if (process.env.SB_MODE !== "readonly") {
      this.listenTo(this.model, "change:title", this.onChangeTitle);
      this.listenTo(
        this.model,
        "change:end1Id change:end2Id",
        this.updateBranchViews,
      );
      this.listenTo(this.model, "change:endPoint", this.onChangeEndPoint);
    }
    this.listenTo(this.model, "refresh", this.render);
  }
  initStyle() {}
  refreshStyles() {}
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  getTitledStyleView() {
    return this;
  }
  onChangeTitle() {
    this.titleView.setText(this.model.get("title"));
    this._showOrHideTitle();
  }
  render() {
    this.figure.invalidateLayout();
    return this;
  }
  getBranchOffset(whichEnd, branch) {
    let borderLineWidthKey = STYLE_KEYS.LINE_WIDTH;
    if (branch?.type === VIEW_TYPE.BRANCH) {
      borderLineWidthKey = STYLE_KEYS.BORDER_LINE_WIDTH;
    }
    const type =
      whichEnd === "start"
        ? styleManager.getStyleValue(this, STYLE_KEYS.ARROW_BEGIN_CLASS)
        : styleManager.getStyleValue(this, STYLE_KEYS.ARROW_END_CLASS);
    const tip = utils.ArrowSelector.getTip(type);
    const border = parseInt(
      styleManager.getStyleValue(branch, borderLineWidthKey),
    );
    const lineWidth = parseInt(
      styleManager.getStyleValue(this, STYLE_KEYS.LINE_WIDTH),
    );
    const offset =
      lineWidth * tip +
      border / 2 +
      layoutConstant.RELATIONSHIP_TO_TOPIC_PADDING;
    return offset;
  }
  /** 计算控制点和topic边缘的交点，因为需要考虑避免将箭头深入topic中，实际计算出来的点在边缘外围。 */
  intersectPointWithTopic(whichEnd, lineEndPoint, controlPoint) {
    const endView = whichEnd === "start" ? this.end1View : this.end2View;
    const insectPos = this.intersectOriginPointWithTopic(
      whichEnd,
      lineEndPoint,
    );
    // boundary 没有 render 时，xPos 和 point 相同会导致 v 为 0，
    // 直接抛出 xPos，等待之后再次计算
    const v = pointUtils.diff(
      endView === null || endView === undefined
        ? undefined
        : endView.getRealPosition(),
      insectPos,
    );
    if (v.x === 0 && v.y === 0) {
      return insectPos;
    }
    return this.applyIntersectOriginPointOffset(
      whichEnd,
      insectPos,
      controlPoint,
    );
  }
  // 计算控制点和 topic 边缘的交点, 返回原始交点(未加上 offset)
  intersectOriginPointWithTopic(whichEnd, lineEndPoint) {
    const endView = whichEnd === "start" ? this.end1View : this.end2View;
    return Util.topicInsectLine(endView, lineEndPoint);
  }
  // 给原始交点添加上 offset
  applyIntersectOriginPointOffset(
    whichEnd,
    originIntersectPoint,
    controlPoint,
  ) {
    const endView = whichEnd === "start" ? this.end1View : this.end2View;
    const offset = this.getBranchOffset(whichEnd, endView);
    return Util.getRelationshipOffsetPoint(
      endView,
      originIntersectPoint,
      controlPoint,
      offset,
    );
  }
  renderTitleText(posInfo) {
    const { insectPoint1, insectPoint2, controlPoint1, controlPoint2 } =
      posInfo;
    const relationshipPath = Object(getRelationshipLineType)(
      this.figure.lineStyle,
    ).calcPathD(insectPoint1, insectPoint2, controlPoint1, controlPoint2);
    const centerPoint = Object(utils.getPointAtLength)(
      relationshipPath,
      Object(utils.getTotalLength)(relationshipPath) / 2,
    );
    const pos = {
      x: centerPoint.x - this.titleView.bounds.width / 2,
      y: centerPoint.y - this.titleView.bounds.height / 2,
    };
    this.titleView.move(pos.x, pos.y);
    this._renderGlobalMask(pos);
  }
  _renderGlobalMask(pos) {
    const _rectToPath = (bounds) => {
      return `M ${bounds.x} ${bounds.y}
        L${bounds.x + bounds.width} ${bounds.y}
        L${bounds.x + bounds.width} ${bounds.y + bounds.height}
        L${bounds.x} ${bounds.y + bounds.height}`;
    };
    // const svgSize = this.svg.bbox();
    const svgSize = this.bounds;
    //200px to make mark of relationship not hidden
    //assert that size of mark is smaller than 200px
    const attr = {
      width: svgSize.width + 400,
      height: svgSize.height + 400,
      x: svgSize.x - 200,
      y: svgSize.y - 200,
    };
    const titleBounds = Object.assign({}, this.titleView.bounds, pos);
    const innerD = _rectToPath(attr);
    const outerD = _rectToPath(titleBounds);
    this.figure.setRelationshipMaskD(`${innerD} ${outerD}`);
  }
  updateBranchViews() {
    const editDomain = this.editDomain();
    const relationship = this.model;
    let end1View = null;
    let end2View = null;
    if (editDomain) {
      if (editDomain.model2View[relationship.get("end1Id")]) {
        end1View = editDomain.model2View[relationship.get("end1Id")];
      }
      if (editDomain.model2View[relationship.get("end2Id")]) {
        end2View = editDomain.model2View[relationship.get("end2Id")];
      }
    }
    if (end1View !== this.end1View) {
      if (this.end1View) {
        this.stopListening(this.end1View, "afterRealPosChange");
        this.stopListening(this.end1View, "afterSizeChange");
        this.stopListening(this.end1View.topicView, "change:bounds");
      }
      if (end1View) {
        this.listenTo(
          end1View,
          "afterRealPosChange",
          this.onEndViewDimensionChange,
        );
        this.listenTo(
          end1View,
          "afterSizeChange",
          this.onEndViewDimensionChange,
        );
        this.listenTo(
          end1View.topicView,
          "change:bounds",
          this.onEndViewDimensionChange,
        );
      }
      this.end1View = end1View;
    }
    if (end2View !== this.end2View) {
      if (this.end2View) {
        this.stopListening(this.end2View, "afterRealPosChange");
        this.stopListening(this.end2View, "afterSizeChange");
        this.stopListening(this.end2View.topicView, "change:bounds");
      }
      if (end2View) {
        this.listenTo(
          end2View,
          "afterRealPosChange",
          this.onEndViewDimensionChange,
        );
        this.listenTo(
          end2View,
          "afterSizeChange",
          this.onEndViewDimensionChange,
        );
        this.listenTo(
          end2View.topicView,
          "change:bounds",
          this.onEndViewDimensionChange,
        );
      }
      this.end2View = end2View;
    }
    if (!this.end1View || !this.end2View) {
      this.setVisible(false);
    }
  }
  onEndViewDimensionChange() {
    if (!this.hadInit) {
      return;
    }
    this.render();
  }
  select() {
    let _a;
    if (
      this.getContext().isReadOnly() &&
      !this.config(CONFIG.ENABLE_SELECT_IN_READONLY)
    ) {
      return;
    }
    this.isSelected = true;
    this.isDeFocus =
      (_a = this.getModule(MODULE_NAME.SEMAPHORE)) === null || _a === undefined
        ? undefined
        : _a.isStatusActive(UI_STATUS.DE_FOCUS);
    this._updateState();
    this.figure.setControlPointGroupVisible(!this.isDeFocus);
    return this;
  }
  deselect() {
    this.isSelected = false;
    this.isDeFocus = false;
    this._updateState();
    return this;
  }
  displayDeFocus() {
    this.isSelected = true;
    this.isDeFocus = true;
    this._updateState();
    this.figure.setControlPointGroupVisible(false);
  }
  displaySelect() {
    this.select();
  }
  setRelationshipPath(relationshipPath) {
    this.figure.setRelationshipPath(relationshipPath);
  }
  setControlLine1Path(path) {
    this.figure.setControlLine1Path(path);
  }
  setControlLine2Path(path) {
    this.figure.setControlLine2Path(path);
  }
  setControlPoint1Radius(radius) {
    this.figure.setControlPoint1Radius(radius);
  }
  setControlPoint2Radius(radius) {
    this.figure.setControlPoint2Radius(radius);
  }
  setIsDraggingStartPoint1(isDragging) {
    this.isDraggingStartPoint1 = isDragging;
    this.updateAllPointsRadius();
  }
  setIsDraggingStartPoint2(isDragging) {
    this.isDraggingStartPoint2 = isDragging;
    this.updateAllPointsRadius();
  }
  setIsHoveringStartPoint1(isHovering) {
    this.isHoveringStartPoint1 = isHovering;
    this.updateAllPointsRadius();
  }
  setIsHoveringStartPoint2(isHovering) {
    this.isHoveringStartPoint2 = isHovering;
    this.updateAllPointsRadius();
  }
  setIsDraggingControlPoint1(isDragging) {
    this.isDraggingControlPoint1 = isDragging;
    this.updateAllPointsRadius();
  }
  setIsDraggingControlPoint2(isDragging) {
    this.isDraggingControlPoint2 = isDragging;
    this.updateAllPointsRadius();
  }
  setIsHoveringControlPoint1(isHovering) {
    this.isHoveringControlPoint1 = isHovering;
    this.updateAllPointsRadius();
  }
  setIsHoveringControlPoint2(isHovering) {
    this.isHoveringControlPoint2 = isHovering;
    this.updateAllPointsRadius();
  }
  updateAllPointsRadius() {
    const focusRadius = {
      rx: HALF_POINT_WIDTH * FOCUS_POINT_RATIO,
      ry: HALF_POINT_HEIGHT * FOCUS_POINT_RATIO,
    };
    const originRadius = {
      rx: HALF_POINT_WIDTH,
      ry: HALF_POINT_HEIGHT,
    };
    // Start Point 1
    this.figure.setStartPoint1Radius(
      this.isHoveringStartPoint1 || this.isDraggingStartPoint1
        ? focusRadius
        : originRadius,
    );
    // Start Point 2
    this.figure.setStartPoint2Radius(
      this.isHoveringStartPoint2 || this.isDraggingStartPoint2
        ? focusRadius
        : originRadius,
    );
    // Control Point 1
    this.figure.setControlPoint1Radius(
      this.isHoveringControlPoint1 || this.isDraggingControlPoint1
        ? focusRadius
        : originRadius,
    );
    // Control Point 2
    this.figure.setControlPoint2Radius(
      this.isHoveringControlPoint2 || this.isDraggingControlPoint2
        ? focusRadius
        : originRadius,
    );
  }
  setPointerEventsNone(isPointerEventsNone) {
    this.figure.setPointerEventsNone(isPointerEventsNone);
  }
  /**
   * EditArea Event Start
   **/
  /**
   * @param {string} newText
   * @public
   * */
  saveEdit(newText) {
    this.model.changeTitle(newText);
  }
  getTextClientStyle() {
    return {
      fontSize:
        parseInt(styleManager.getStyleValue(this, STYLE_KEYS.FONT_SIZE)) || 12,
      fontFamily: styleManager.getStyleValue(this, STYLE_KEYS.FONT_FAMILY),
      fontStyle: styleManager.getStyleValue(this, STYLE_KEYS.FONT_STYLE),
      fontWeight: styleManager.getStyleValue(this, STYLE_KEYS.FONT_WEIGHT),
      textTransform: styleManager.getStyleValue(
        this,
        STYLE_KEYS.TEXT_TRANSFORM,
      ),
      textDecoration: styleManager.getStyleValue(
        this,
        STYLE_KEYS.TEXT_DECORATION,
      ),
    };
  }
  getTextClientBounds() {
    return this.titleText.node.getBoundingClientRect();
  }
  getEditContent() {
    return this.model.get("title") || "";
  }
  remove() {
    const parent = this.parent();
    if (parent === null || parent === undefined) {
      // do nothing;
    } else {
      parent.relationships.forEach((relationshipView, index) => {
        if (relationshipView === this) {
          parent.relationships.splice(index, 1);
        }
      });
    }
    const editDomain = this.editDomain();
    if (editDomain && editDomain.selectionManager) {
      editDomain.selectionManager.removeFromSelection(this);
    }
    if (editDomain && editDomain.model2View) {
      delete editDomain.model2View[this.model.id];
    }
    if (this.titleView) {
      this.titleView.remove();
    }
    this.stopListening();
    this.clearReactions();
    this.arrowSelector.dispose();
    this.parent(null);
    this.figure.dispose();
    return this;
  }
  _shoudControlPointHide() {
    if (this.isSelected) {
      return false;
    }
    if (this.isHovering) {
      return false;
    } else {
      return true;
    }
  }
  _shouldTitleHide() {
    const title = this.model.get("title");
    if (title) {
      return false;
    }
    if (this.isSelected) {
      return false;
    }
    if (this.isHovering) {
      return false;
    } else {
      return true;
    }
  }
  _showOrHideControlPoint() {
    const shouldHide = this._shoudControlPointHide();
    if (shouldHide) {
      this.hideControlPoint();
    } else if (!this.getContext().isReadOnly()) {
      this.showControlPoint();
    }
  }
  showControlPoint() {
    this.figure.setControlPointGroupVisible(true);
  }
  hideControlPoint() {
    this.figure.setControlPointGroupVisible(false);
  }
  _showOrHideTitle() {
    const shouldHide = this._shouldTitleHide();
    if (shouldHide) {
      this.hideTitle();
      this.figure.setMaskVisible(false);
    } else {
      this.showTitle();
      this.figure.setMaskVisible(true);
    }
  }
  showTitle() {
    if (this.titleView) {
      this.titleView.setVisible(true);
    }
  }
  hideTitle() {
    if (this.titleView) {
      this.titleView.setVisible(false);
    }
  }
  _updateActionStyle() {
    let style = "actionPath";
    if (this.isSelected) {
      style = "actionPath__selected";
      if (this.isDeFocus) {
        style = "actionPath__defocus";
      }
    } else if (this.isHovering) {
      style = "actionPath__hover";
    }
    this.style(this.figure.renderWorker.actionPath, style);
  }
  _updateState() {
    this.killAnimationByFlag(
      ANIMATION_FLAGS.RELATIONSHIP_SHOW_HIGH_LIGHT_SELECT_BOX,
    );
    this._showOrHideControlPoint();
    this._showOrHideTitle();
    this._updateActionStyle();
  }
  setVisible(isVisible) {
    this.isVisible = isVisible;
    this.figure.setVisible(isVisible && !this.isForcedInvisible);
  }
  onChangeEndPoint() {
    this.render();
  }
  getInfoString() {
    return this.model.get("title") || "";
  }
  /**
   * @public
   * @description for selectable view
   */
  getClientRect() {
    const realPos = {
      x: this.titleView.figure.textPosition.x,
      y: this.titleView.figure.textPosition.y,
    };
    const clientPos = this.editDomain()
      .getCoordinateTransfer()
      .mindMapToViewport(realPos);
    return {
      x: clientPos.x,
      y: clientPos.y,
      width: this.titleView.bounds.width,
      height: this.titleView.bounds.height,
    };
  }
  displayHighLightSelect() {
    this.killAnimationByFlag(
      ANIMATION_FLAGS.RELATIONSHIP_SHOW_HIGH_LIGHT_SELECT_BOX,
    );
    const animationManager = this.getModule(MODULE_NAME.ANIMATION);
    if (animationManager) {
      animationManager.startAnimation(
        ANIMATION_FLAGS.RELATIONSHIP_SHOW_HIGH_LIGHT_SELECT_BOX,
        {
          target: this,
        },
      );
    }
  }
}

export default RelationshipView;

import process from "process";
import styleManager from "../utils/business/stylemanager/index";
import {
  BOUNDARYSHAPE,
  TREE_TABLE_GROUP_LIST,
  STYLE_KEYS,
  VIEW_TYPE,
  FIGURE_TYPE,
  CONFIG,
  ANIMATION_FLAGS,
  MODULE_NAME,
  UI_STATUS,
} from "../common/constants/index";

import BoundaryTitleView from "./boundarytitleview";

import TitleableView from "./titleableview";

import SelectBoxView from "../modules/svgdraggable/view/selectbox";

import * as commonUtils from "../common/utils/index";
import figures from "../figures/index";

const shouldPreventTitleList = {
  [BOUNDARYSHAPE.ROUNDEDPOLYGON]: true,
  [BOUNDARYSHAPE.POLYGON]: true,
  [BOUNDARYSHAPE.NEWBOUNDARY1]: true,
};
const structureListToPreventTitle = [...TREE_TABLE_GROUP_LIST];
const Style = (target) => {
  return class BoundaryView extends target {
    initEventsListener() {
      super.initEventsListener();
      if (process.env.SB_MODE === "readonly") {
        return;
      }
      this.listenTo(this.model, "changeStyle", this.onChangeStyle);
      this.listenTo(this.model, "setStyleObject", () => {
        let _a;
        if ((_a = this.parent()) === null || _a === undefined) {
          return undefined;
        } else {
          return _a.refreshStyles();
        }
      });
      this.addReaction(
        () => this.figure.lineColor,
        () => this.refreshTextColor(),
      );
    }
    initStyle() {
      this.refreshColorStyles();
      this.refreshSkeletonStyles();
    }
    refreshStyles() {
      this.refreshColorStyles();
      this.refreshSkeletonStyles();
    }
    refreshColorStyles() {
      super.refreshColorStyles();
      this.refreshFillColor();
      this.refreshLineColor();
      this.refreshFillOpacity();
    }
    refreshSkeletonStyles() {
      super.refreshSkeletonStyles();
      this.refreshShapeClass();
      this.refreshLinePattern();
      this.refreshBorderWidth();
      this.refreshFillPattern();
    }
    onChangeStyle(key) {
      super.onChangeStyle(key);
      if (key === STYLE_KEYS.SHAPE_CLASS) {
        this.refreshShapeClass();
      } else if (key === STYLE_KEYS.FILL_COLOR) {
        this.refreshFillColor();
      } else if (key === STYLE_KEYS.LINE_PATTERN) {
        this.refreshLinePattern();
      } else if (key === STYLE_KEYS.LINE_COLOR) {
        this.refreshLineColor();
      } else if (key === STYLE_KEYS.LINE_WIDTH) {
        this.refreshBorderWidth();
      } else if (key === STYLE_KEYS.OPACITY) {
        this.refreshFillOpacity();
      } else if (key === STYLE_KEYS.FILL_PATTERN) {
        this.refreshFillPattern();
      }
    }
    refreshShapeClass() {
      const shapeClass = styleManager.getStyleValue(
        this,
        STYLE_KEYS.SHAPE_CLASS,
      );
      this.figure.setShapeClass(shapeClass);
      const isVisible = !this.shouldPreventTitle();
      this.titleView.figure.setVisible(isVisible, true);
      if (isVisible && !!this.titleView.text) {
        this.titleView.show();
      } else {
        this.titleView.hide();
      }
    }
    refreshFillColor() {
      this.figure.setFillColor(
        styleManager.getStyleValue(this, STYLE_KEYS.FILL_COLOR),
      );
    }
    refreshLinePattern() {
      const linePattern = styleManager.getStyleValue(
        this,
        STYLE_KEYS.LINE_PATTERN,
      );
      this.linePattern = linePattern;
      this.figure.setLinePattern(linePattern);
    }
    refreshLineColor() {
      const color = styleManager.getStyleValue(this, STYLE_KEYS.LINE_COLOR);
      this.figure.setLineColor(color);
      const figure = this.titleView.figure;
      figure.setBoundaryTitleBGFillColor(color);
    }
    refreshBorderWidth() {
      const width = parseInt(
        `${styleManager.getStyleValue(this, STYLE_KEYS.LINE_WIDTH) || 0}`,
      );
      this.figure.setBorderWidth(width);
    }
    refreshFillOpacity() {
      const opacity = Number(
        `${styleManager.getStyleValue(this, STYLE_KEYS.OPACITY)}`,
      );
      this.figure.setFillOpacity(opacity);
    }
    refreshFillPattern() {
      const fillPattern = styleManager.getStyleValue(
        this,
        STYLE_KEYS.FILL_PATTERN,
      );
      this.figure.setFillPattern(fillPattern);
    }
  } as typeof target;
};
@Style
export class BoundaryView extends TitleableView {
  model: any;
  position: { x: number; y: number };
  realPosition: { x: number; y: number };
  size: { width: number; height: number };
  linePattern: null;
  isSelected: boolean;
  isVisible: boolean;
  isForcedInvisible: boolean;
  context: any;
  figure: any;
  titleView: BoundaryTitleView;
  selectBox: SelectBoxView;
  boundaryGroup: any;
  boundaryPath: any;
  boundaryFillPath: any;
  boundaryActionPath: any;
  // TODO: refactor - don't use 'context' as variable name
  // because has getContext(): SheetView.
  // they have the same name but representative different things.
  constructor(model, context) {
    super({
      model,
    });
    this.position = {
      x: 0,
      y: 0,
    };
    this.realPosition = {
      x: 0,
      y: 0,
    };
    this.size = {
      width: 0,
      height: 0,
    };
    /** @deprecated */
    this.linePattern = null;
    this.isSelected = false;
    this.isVisible = false;
    this.isForcedInvisible = false;
    this.model = model;
    this.context = context;
    this.figure = figures.createFigure(this);
    this.titleView = new BoundaryTitleView();
    this.selectBox = new SelectBoxView({
      refView: this,
    });
    this.initSVGStructure();
    this.initEventsListener();
  }
  get type() {
    return VIEW_TYPE.BOUNDARY;
  }
  get figureType() {
    return FIGURE_TYPE.BOUNDARY;
  }
  get _style() {
    return {
      boundaryActionPath: {
        fill: "none",
        stroke: "#1E80E7",
        "stroke-opacity": "0",
      },
      boundaryActionPath__mouseover: {
        "stroke-opacity": "0.5",
      },
    };
  }
  afterAncestorChange() {
    super.afterAncestorChange();
    this.updateModel2View();
  }
  initSVGStructure() {
    const renderWorker = this.figure.renderWorker;
    this.boundaryGroup = renderWorker.svg;
    this.boundaryPath = renderWorker.boundaryPath;
    this.boundaryFillPath = renderWorker.boundaryFillPath;
    this.boundaryActionPath = renderWorker.boundaryActionPath;
  }
  initEventsListener() {
    if (process.env.SB_MODE !== "readonly") {
      this.listenTo(this.model, "change:range", this.onRangeChange);
      this.listenTo(this.model, "change:title", () => {
        this.titleView.setText(this.model.get("title"));
      });
    }
    this.on("afterAncestorChange", () => {
      if (this.editDomain()) {
        if (this.titleView) {
          this.titleView.parent(this);
        }
        this.initEventsListenerWithContext();
      }
    });
  }
  getTitledStyleView() {
    return this;
  }
  initStyle() {}
  refreshStyles() {}
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  onRangeChange() {
    let _a;
    this._resetBoundaryPosition();
    if ((_a = this.parent()) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.getChildrenBranchesByType().forEach((c) => c.updateStructure());
    }
    this.figure.invalidateLayout();
  }
  _resetBoundaryPosition() {
    const parent = this.parent();
    if (!parent) {
      return;
    }
    const boundaryModel = this.model;
    let currentBoundaryView = null;
    let currentIndex = -1;
    let targetBoundaryView = null;
    let targetIndex = -1; // get current boundaryView
    for (const [index, boundaryView] of parent.boundaries.entries()) {
      if (boundaryView.model.get("id") === boundaryModel.get("id")) {
        currentBoundaryView = boundaryView;
        currentIndex = index;
        break;
      }
    }
    if (currentBoundaryView) {
      // calculate new index
      const { rangeStart: targetRangeStart, rangeEnd: targetRangeEnd } =
        boundaryModel;
      for (const [index, boundaryView] of parent.boundaries.entries()) {
        if (boundaryView.model.get("id") !== boundaryModel.get("id")) {
          const { rangeStart: compareStart, rangeEnd: compareEnd } =
            boundaryView.model;
          if (
            targetRangeStart < compareStart ||
            (targetRangeStart === compareStart && targetRangeEnd >= compareEnd)
          ) {
            targetBoundaryView = boundaryView;
            targetIndex = index;
            // break;
          }
        }
      }
      // move to new index
      if (targetBoundaryView) {
        targetBoundaryView.boundaryGroup.before(
          currentBoundaryView.boundaryGroup,
        );
        parent.boundaries.splice(targetIndex, 0, currentBoundaryView);
        if (currentIndex > targetIndex) {
          parent.boundaries.splice(currentIndex + 1, 1);
        } else {
          parent.boundaries.splice(currentIndex, 1);
        }
      }
    }
  }
  select() {
    if (
      this.getContext().isReadOnly() &&
      !this.config(CONFIG.ENABLE_SELECT_IN_READONLY)
    ) {
      return;
    }
    this.killAnimationByFlag(
      ANIMATION_FLAGS.BOUNDARY_SHOW_HIGH_LIGHT_SELECT_BOX,
    );
    this.isSelected = true;
    this.selectBox.show().transparent(false);
    this.selectBox.stateMachine.transition(this.selectBox.event_select);
    if (
      this.getModule(MODULE_NAME.SEMAPHORE).isStatusActive(UI_STATUS.DE_FOCUS)
    ) {
      this.selectBox.stateMachine.transition(this.selectBox.event_defocus);
    }
    return this;
  }
  deselect() {
    this.killAnimationByFlag(
      ANIMATION_FLAGS.BOUNDARY_SHOW_HIGH_LIGHT_SELECT_BOX,
    );
    this.isSelected = false;
    this.selectBox.hide();
    this.selectBox.stateMachine.transition(this.selectBox.event_deselect);
    return this;
  }
  displaySelect() {
    this.select();
  }
  displayDeFocus() {
    this.killAnimationByFlag(
      ANIMATION_FLAGS.BOUNDARY_SHOW_HIGH_LIGHT_SELECT_BOX,
    );
    this.isSelected = true;
    this.selectBox.show().transparent(false);
    this.selectBox.stateMachine.transition(this.selectBox.event_defocus);
  }
  remove() {
    //清空outsidePadding
    const boundaries = this.parent()?.boundaries ?? [];
    boundaries.forEach((v, index) => {
      if (v === this) {
        boundaries.splice(index, 1);
      }
    });
    const editDomain = this.editDomain();
    if (editDomain?.selectionManager) {
      editDomain.selectionManager.removeFromSelection(this);
    }
    if (editDomain?.model2View) {
      delete editDomain.model2View[this.model.id];
    }
    this.figure.dispose();
    this.selectBox.remove();
    this.titleView.remove();
    this.stopListening();
    this.clearReactions();
    this.parent(null);
    return this;
  }
  getRealPosition() {
    return this.realPosition;
  }
  updateRealPosition() {
    const parent = this.parent();
    if (parent) {
      const parentRealPosition = parent.getRealPosition();
      this.realPosition = {
        x: this.position.x + parentRealPosition.x,
        y: this.position.y + parentRealPosition.y,
      };
      this.figure.setPosition(this.realPosition);
      if (this.figure.positionDirty) {
        this.trigger("afterRealPosChange");
      }
    }
  }
  /** @description for selectable view */
  getClientRect() {
    const realPos = this.getRealPosition();
    const clientPos = this.editDomain()
      .getCoordinateTransfer()
      .mindMapToViewport(realPos);
    return Object.assign(Object.assign({}, clientPos), this.figure.size);
  }
  getTitleSize() {
    return this.titleView.bounds;
  }
  setPosition(position) {
    this.position = Object.assign({}, position);
  }
  setSize(size) {
    let _a;
    if (!Object(commonUtils.isSameSize)(this.figure.size, size)) {
      this.size = Object.assign({}, size);
      this.figure.setSize(size);
      this.trigger("afterSizeChange");
      if ((_a = this.parent()) === null || _a === undefined) {
        // do nothing
      } else {
        _a.figure.invalidateLayout();
      }
    }
  }
  setShapeSize(size) {
    this.figure.setBoundaryShapeSize(size);
  }
  // render(/** position, size */) {
  // this.position = position
  // this.figure.setSize(size)
  // move title's position
  // const titleOverflowDistance = 5
  // this.titleView.move(position.x - titleOverflowDistance, position.y - titleOverflowDistance)
  // this.selectBox.render(parent.getDirection());
  // // for relationview
  // this.trigger('afterRealPosChange')
  //   return this
  // }
  /**
   * EditArea Event Start
   **/
  getEditContent() {
    return this.model.get("title") || "";
  }
  /** @public */
  saveEdit(newText) {
    this.model.changeTitle(newText);
  }
  /**
   * @return {textClientStyle}
   * */
  getTextClientStyle() {
    return {
      //  fix me
      fontSize: parseFloat(this.titleView.figure.fontSize) || 12,
      fontFamily: this.titleView.figure.fontFamily,
      fontWeight: this.titleView.figure.fontWeight,
      textDecoration: this.titleView.figure.textDecoration,
      fontStyle: this.titleView.figure.fontStyle,
    };
  }
  getTextClientBounds() {
    const viewNode = this.boundaryGroup.node;
    return viewNode.getBoundingClientRect();
  }
  hideTitle() {
    this.titleView.hide();
  }
  showTitle() {
    this.titleView.show();
  }
  // tool method
  shouldPreventTitle() {
    return (
      shouldPreventTitleList[this.figure.shapeClass] ||
      structureListToPreventTitle.some((structureClass) => {
        let _a;
        return (
          structureClass ===
          ((_a = this.parent()) === null || _a === undefined
            ? undefined
            : _a.getStructureClass())
        );
      })
    );
  }
  shouldHide() {
    let _a;
    return (
      ((_a = this.parent()) === null || _a === undefined
        ? undefined
        : _a.isBoundariesHide()) ?? false
    );
  }
  setVisible(isVisible) {
    this.isVisible = isVisible;
    this.figure.setVisible(isVisible && !this.isForcedInvisible);
  }
  displayHighLightSelect() {
    this.killAnimationByFlag(
      ANIMATION_FLAGS.BOUNDARY_SHOW_HIGH_LIGHT_SELECT_BOX,
    );
    const animationManager = this.getModule(MODULE_NAME.ANIMATION);
    if (animationManager) {
      animationManager.startAnimation(
        ANIMATION_FLAGS.BOUNDARY_SHOW_HIGH_LIGHT_SELECT_BOX,
        {
          target: this,
        },
      );
    }
  }
}

export default BoundaryView;

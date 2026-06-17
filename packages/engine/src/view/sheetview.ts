import process from "process";

import styleManager from "../utils/business/stylemanager/index";

import figures from "../figures/index";

import {
  STYLE_KEYS,
  VIEW_TYPE,
  FIGURE_TYPE,
  MODULE_NAME,
  CONFIG,
} from "../common/constants/index";

import WorkbookComponentView from "./workbookcomponentview";

import BranchView from "./branchview";
import RelationshipView from "./relationshipview";
import LegendView from "./legendview";
import underscore from "underscore";

import * as pointUtils from "../utils/pointutils";

import * as boundUtils from "../utils/boundutils";

import * as utils from "../utils/index";

const Style = (target) => {
  return class SheetView extends target {
    initEventsListener() {
      super.initEventsListener();
      if (process.env.SB_MODE === "readonly") {
        return;
      }
      const model = this.model;
      this.listenTo(model, "changeStyle", this.onChangeStyle);
      this.listenTo(
        model,
        "changeTheme",
        ({ newColorTheme, newSkeletonTheme, newGlobalStyle }) => {
          // from change color theme or change skeleton
          if (newColorTheme) {
            this.refreshColorStyles();
          } else if (newSkeletonTheme) {
            this.refreshSkeletonStyles();
          }
          // from change global style
          else if (newGlobalStyle) {
            this.refreshGlobalStyles();
          }
          // from change hole old theme
          else {
            this.refreshStyles();
          }
        },
      );
      this.listenTo(model, "addTheme", this.refreshStyles);
      this.listenTo(model, "setStyleObject", this.refreshStyles);
    }
    onChangeStyle(key) {
      if (key === STYLE_KEYS.MULTI_LINE_COLORS) {
        this.refreshMultiBranchLineColor();
      } else if (key === STYLE_KEYS.LINE_TAPERED) {
        this.refreshLineTapered();
      } else if (key === STYLE_KEYS.GRADIENT_COLOR) {
        this.refreshGradientColor();
      } else if (key === STYLE_KEYS.FILL_COLOR) {
        this.refreshBackgroundColor();
      } else if (key === STYLE_KEYS.OPACITY) {
        this.refreshOpacity();
      } else if (key === STYLE_KEYS.CJK_FONT_FAMILY) {
        this.refreshCJKFontFamily();
      } else if (key === STYLE_KEYS.LINE_WIDTH) {
        this.refreshGlobalLineWidth();
      } else if (key === STYLE_KEYS.FONT_FAMILY) {
        this.refreshGlobalFontFamily();
      }
    }
    initStyle() {
      super.initStyle();
      this.refreshColorStyles();
      this.refreshSkeletonStyles();
    }
    refreshStyles() {
      this.refreshColorStyles();
      this.refreshSkeletonStyles();
    }
    refreshColorStyles() {
      let _a;
      super.refreshSkeletonStyles();
      this.refreshBackgroundColor();
      this.refreshGradientColor();
      this.refreshMultiBranchLineColor();
      this.refreshOpacity();
      if ((_a = this.centralBranchView) === null || _a === undefined) {
        // do nothing;
      } else {
        _a.refreshColorStyles();
      }
      this.relationships.forEach((relationshipView) => {
        relationshipView.refreshColorStyles();
      });
    }
    refreshSkeletonStyles() {
      let _a;
      this.refreshLineTapered();
      this.refreshWallPaper();
      this.refreshGlobalFontFamily();
      this.refreshGlobalLineWidth();
      if ((_a = this.centralBranchView) === null || _a === undefined) {
        // do nothing;
      } else {
        _a.refreshSkeletonStyles();
      }
      this.relationships.forEach((relationshipView) => {
        relationshipView.refreshSkeletonStyles();
      });
    }
    refreshGlobalStyles() {
      this.refreshGlobalFontFamily();
      this.refreshGlobalLineWidth();
      this.refreshLineTapered();
    }
    refreshBackgroundColor() {
      this.figure.setBackgroundColor(
        styleManager.getStyleValue(this, STYLE_KEYS.FILL_COLOR),
      );
    }
    refreshGradientColor() {
      this.figure.setGradientColor(
        styleManager.getStyleValue(this, STYLE_KEYS.GRADIENT_COLOR),
      );
    }
    refreshMultiBranchLineColor() {
      this.figure.setMultiLineColors(
        styleManager.getStyleValue(this, STYLE_KEYS.MULTI_LINE_COLORS) || "",
      );
    }
    refreshLineTapered() {
      this.figure.setLineTapered(
        styleManager.getStyleValue(this, STYLE_KEYS.LINE_TAPERED),
      );
    }
    refreshOpacity() {
      this.figure.setOpacity(
        parseFloat(styleManager.getStyleValue(this, STYLE_KEYS.OPACITY)) || 1,
      );
    }
    refreshGlobalLineWidth() {
      const globalLineWidth = styleManager.getGlobalStyleValue(
        this,
        STYLE_KEYS.LINE_WIDTH,
      );
      if (globalLineWidth === null) {
        this.figure.setGlobalLineWidth(globalLineWidth);
      } else {
        this.figure.setGlobalLineWidth(parseInt(globalLineWidth));
      }
    }
    refreshGlobalFontFamily() {
      this.figure.setGlobalFontFamily(
        styleManager.getGlobalStyleValue(this, STYLE_KEYS.FONT_FAMILY),
      );
    }
    // todo
    refreshWallPaper() {}
    refreshCJKFontFamily() {
      this.figure.setCJKFontFamily(
        styleManager.getStyleValue(this, STYLE_KEYS.CJK_FONT_FAMILY),
      );
    }
  } as typeof target;
};

@Style
export class SheetView extends WorkbookComponentView {
  model: any;
  relationships: any[];
  bounds: { x: number; y: number; width: number; height: number };
  legendView: any;
  centralBranchView: any;
  activatedTopBranchView: any;
  figure: any;
  svg: any;
  matrixContainer: any;
  boundaryContainer: any;
  connectionContainer: any;
  branchContainer: any;
  relationshipContainer: any;
  selectBoxContainer: any;
  treeTableContainer: any;
  otherContainer: any;
  _cloneG: any;
  constructor(model) {
    super({
      model,
    });
    this.relationships = [];
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this.legendView = null;
    this.centralBranchView = null;
    this.activatedTopBranchView = null;
    this.model = model;
    this.figure = figures.createFigure(this);
    this.svg = this.figure.getContent();
    const renderWorker = this.figure.renderWorker;
    this.matrixContainer = renderWorker.matrixContainer;
    this.boundaryContainer = renderWorker.boundaryContainer;
    this.connectionContainer = renderWorker.connectionContainer;
    this.branchContainer = renderWorker.branchContainer;
    this.relationshipContainer = renderWorker.relationshipContainer;
    this.selectBoxContainer = renderWorker.selectBoxContainer;
    this.treeTableContainer = renderWorker.treeTableCellContainer;
    this.otherContainer = renderWorker.otherContainer;
    this._cloneG = renderWorker._cloneG;
    this.initEventsListener();
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this.centralBranchView = null;
    this.activatedTopBranchView = null;
  }
  get type() {
    return VIEW_TYPE.SHEET;
  }
  get figureType() {
    return FIGURE_TYPE.SHEET;
  }
  initStyle() {}
  initEventsListener() {
    const sheet = this.model;
    if (process.env.SB_MODE !== "readonly") {
      this.listenTo(sheet, "addRelationship", this._onAddRelationship);
      this.listenTo(sheet, "removeRelationship", this._onRemoveRelationship);
      this.listenTo(
        sheet,
        "change:topicPositioning",
        this._layoutCentralBranch,
      );
      this.listenTo(
        sheet,
        "change:topicOverlapping",
        this._layoutCentralBranch,
      );
    }
  }
  initView() {
    let _a;
    let _b;
    this.initStyle();
    const sheet = this.model;
    const centralBranchView = new BranchView(sheet.rootTopic());
    this.setCurrentCentralBranchView(centralBranchView);
    this.listenTo(this.centralBranchView, "change:bounds", () => {
      this._updateBounds();
    });
    if ((_a = this.centralBranchView) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.parent(this);
    }
    if ((_b = this.centralBranchView) === null || _b === undefined) {
      // do nothing;
    } else {
      _b.initView();
    }
    this.model
      .relationships()
      .forEach((r) => this.addRelationship(new RelationshipView(r, false)));
    const legendModel = this.model.getLegendModel();
    if (legendModel.get("visibility") === "visible") {
      //LegendView's initialization should be after render and change:bounds event.
      //Since we need know the canvas content size before we can set legend's position.
      const legendPos = legendModel.get("position");
      if (pointUtils.isPointLike(legendPos)) {
        this.initLegend();
      } else {
        setTimeout(() => this.initLegend(), 0);
      }
    }
    return this;
  }
  getCentralBranchView() {
    return this.centralBranchView;
  }
  getActivatedTopBranchView() {
    return this.activatedTopBranchView;
  }
  setCurrentCentralBranchView(branchView) {
    this.centralBranchView = branchView;
    this.centralBranchView.tagCentralBranch(true);
  }
  setActivatedTopBranchView(branchView) {
    if (this.activatedTopBranchView !== branchView) {
      if (this.activatedTopBranchView) {
        this.stopListening(
          this.activatedTopBranchView,
          "change:bounds",
          this._updateBounds,
        );
      }
      this.activatedTopBranchView = branchView;
      if (this.activatedTopBranchView) {
        this.listenTo(
          this.activatedTopBranchView,
          "change:bounds",
          this._updateBounds,
        );
      }
      this._updateBounds();
    }
  }
  remove() {
    this.relationships.forEach((relationshipView) => {
      relationshipView.remove();
    });
    if (this.legendView) {
      this.legendView.remove();
    }
    const editDomain = this.editDomain();
    if (editDomain && editDomain.model2View) {
      const sheet = this.model;
      delete editDomain.model2View[sheet.id];
    }
    if (this.centralBranchView) {
      this.centralBranchView.remove();
      this.centralBranchView = null;
    }
    this.stopListening();
    this.figure.dispose();
    return this;
  }
  addRelationship(relationshipView) {
    relationshipView.parent(this);
    relationshipView.initStyle();
    if (relationshipView.end1View && relationshipView.end2View) {
      this.relationships.push(relationshipView);
    } else {
      // treatment for lost endView's relationship
      relationshipView.remove();
    }
    if (process.env.SB_MODE !== "readonly") {
      this.listenTo(relationshipView, "change:bounds", () => {
        this._updateBounds();
      });
    }
  }
  removeRelationship(relationshipView) {
    relationshipView.remove();
    this.stopListening(relationshipView);
    this._updateBounds();
  }
  isLineTapered() {
    const tapered = this.figure.lineTapered;
    return tapered === "tapered";
  }
  isMultiLineColors() {
    const multiLineColors = this.figure.multiLineColors;
    return multiLineColors && multiLineColors !== "none";
  }
  isGradient() {
    const gradient = this.figure.gradientColor;
    return gradient === "gradient";
  }
  /**
   * @description 获取拖拽阴影所在group
   * @deprecated
   * @public
   * */
  getCloneG() {
    return this._cloneG;
  }
  /**
   * @description 获取拖拽阴影所在group
   * @todo 后面的重构思路：不再暴露cloneG出去，所有对它的操作的sheetView的方法里进行
   * */
  getDragViewContainer() {
    return this._cloneG;
  }
  /**
   * @description 重置drag view所在的group
   * */
  clearDragViewContainer() {
    this._cloneG.translate(0, 0).clear();
  }
  /**
   * Sheet background color could be with alpha tunnel, Use this method to get
   * the real background color which blending with the layer below.
   */
  getBlendingBackgroundColor() {
    let _a;
    const { snowballUtil } = Object(utils.getInjectModule)(
      MODULE_NAME.SNOWBALL,
    );
    const sheetBackgroundColorHEX = this.figure.backgroundColor;
    const sheetBackgroundColorRGB = snowballUtil.hexStringToRgbObject(
      sheetBackgroundColorHEX,
    ); // 'none' and 'transparent' will be converted to '#FFFFFFFF'
    const appearanceBackgroundColor = (
      (_a = this.config(CONFIG.APPEARANCE_GETTER)) === null || _a === undefined
        ? undefined
        : _a()
    )?.backgroundColor;
    if (sheetBackgroundColorRGB.a < 1 && appearanceBackgroundColor) {
      const canvasColorRGB = snowballUtil.hexStringToRgbObject(
        appearanceBackgroundColor,
      );
      return snowballUtil.blendingColor(
        sheetBackgroundColorRGB,
        canvasColorRGB,
      );
    }
    return snowballUtil.rgbObjectToHexString(sheetBackgroundColorRGB);
  }
  initLegend() {
    // new legend and set it's position
    if (!this.legendView) {
      this.legendView = new LegendView(this, this.model.getLegendModel());
      this._updateBounds();
      //[WARN]: when i write the code below, remove legendView method isn't implement
      if (process.env.SB_MODE !== "readonly") {
        this.listenTo(this.legendView, "change:bounds", () => {
          this._updateBounds();
        });
      }
    }
  }
  _updateBounds() {
    const topBranchView = this.activatedTopBranchView
      ? this.activatedTopBranchView
      : this.centralBranchView;
    // @ts-ignore
    const newBounds = boundUtils.getUnionBoundingBoxFromAllBounds(
      [topBranchView, ...this.relationships, this.legendView]
        .filter((item) => (item && item.figure ? item.figure.isVisible : item))
        .map((item) => {
          if (item.type === VIEW_TYPE.BRANCH) {
            const realPosition = item.getRealPosition();
            if (topBranchView) {
              return {
                x: realPosition.x + topBranchView.bounds.x,
                y: realPosition.y + topBranchView.bounds.y,
                width: item.bounds.width,
                height: item.bounds.height,
              };
            }
          }
          return item.bounds;
        }),
    );
    if (!underscore.isEqual(newBounds, this.bounds)) {
      this.bounds = newBounds;
      this.trigger("change:bounds", newBounds);
    }
  }
  _onAddRelationship(relationship) {
    this.addRelationship(new RelationshipView(relationship, false));
  }
  _onRemoveRelationship(relationship) {
    const relationshipView = underscore.find(
      this.relationships,
      (relationshipView) => {
        return relationshipView.model === relationship;
      },
    );
    if (!relationshipView) {
      return;
    }
    this.removeRelationship(relationshipView);
  }
  _opChildBranches(branch, types, op) {
    branch.getChildrenBranchesByType(types).forEach((childBranch) => {
      op(childBranch);
      this._opChildBranches(childBranch, types, op);
    });
  }
  _layoutCentralBranch() {
    let _a;
    if ((_a = this.centralBranchView) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.layout();
    }
  }
}

export default SheetView;

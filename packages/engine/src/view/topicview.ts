import process from "process";
import styleManager from "../utils/business/stylemanager/index";

import {
  MODULE_NAME,
  STYLE_KEYS,
  VISUAL_BACK_COLOR,
  VIEW_TYPE,
  FIGURE_TYPE,
  TOPICSHAPE,
  TEXTTRANSFORM,
  STRUCTURECLASS,
} from "../common/constants/index";

import figures from "../figures/index";
import NumberingView from "./numberingview";

import ImageView from "./imageview";

import TitleView from "./titleview";

import MathjaxView from "./mathjaxview";

import MarkersView from "./markerview";

import InformationIconView from "./informationiconview";

import TopicSelectBoxView from "./topicselectboxview";

import LabelsView from "./labelsview";

import TitleableView from "./titleableview";

import * as utils from "../utils/index";

function isOpaqueColor(color: string) {
  if (!color) {
    return false;
  }
  if (color === "none") {
    return false;
  }
  const { snowballUtil } = utils.getInjectModule(MODULE_NAME.SNOWBALL) as any;
  const rgbaObject = snowballUtil.hexStringToRgbObject(color);
  return rgbaObject.a === 1;
}
const Style = (target) => {
  return class StyledTopicView extends target {
    initEventsListener() {
      super.initEventsListener();
      if (process.env.SB_MODE === "readonly") {
        return;
      }
      const topicModel = this.model;
      this.listenTo(topicModel, "changeStyle", this.onChangeStyle);
      this.addReaction(
        () => {
          let _a;
          if ((_a = this.parent()) === null || _a === undefined) {
            return undefined;
          } else {
            return _a.figure.lineColor;
          }
        },
        () => this.refreshBorderLineColor()
      );
      this.addReaction(
        () => {
          let _a;
          if ((_a = this.parent()) === null || _a === undefined) {
            return undefined;
          } else {
            return _a.figure.lineWidth;
          }
        },
        () => this.refreshBorderLineWidth()
      );
      this.addReaction(
        () => {
          let _a;
          if ((_a = this.parent()) === null || _a === undefined) {
            return undefined;
          } else {
            return _a.figure.linePattern;
          }
        },
        () => this.refreshBorderLinePattern()
      );
      this.addReaction(
        () => this.figure.visualFillColor,
        () => this.refreshTextColor()
      );
      this.addReaction(
        () => {
          let _a;
          if ((_a = this.parent()) === null || _a === undefined) {
            return undefined;
          } else {
            return _a.figure.lineColor;
          }
        },
        () => this.refreshFillColor()
      );
    }
    initEventsListenerWithContext() {
      super.initEventsListenerWithContext();
      this.addAutoRun(() => {
        this.refreshVisualFillColor();
      });
    }
    onChangeStyle(key) {
      let _a;
      super.onChangeStyle(key);
      switch (key) {
        case STYLE_KEYS.CALLOUT_SHAPE_CLASS:
        case STYLE_KEYS.SHAPE_CLASS:
          // 切换 TopicShape 时重置用户设定的自定义宽度
          this.model.customWidth(0);
          this.refreshShapeClass();
          break;
        case STYLE_KEYS.FILL_COLOR:
          this.refreshFillColor();
          break;
        case STYLE_KEYS.BORDER_LINE_COLOR:
          this.refreshBorderLineColor();
          break;
        case STYLE_KEYS.BORDER_LINE_WIDTH:
          this.refreshBorderLineWidth();
          break;
        case STYLE_KEYS.BORDER_LINE_PATTERN:
          this.refreshBorderLinePattern();
          break;
        case STYLE_KEYS.FILL_PATTERN:
          this.refreshFillPattern();
          break;
        case STYLE_KEYS.MARGIN_LEFT:
          this.refreshMarginLeft();
          break;
        case STYLE_KEYS.MARGIN_BOTTOM:
          this.refreshMarginBottom();
          break;
        case STYLE_KEYS.MARGIN_RIGHT:
          this.refreshMarginRight();
          break;
        case STYLE_KEYS.MARGIN_TOP:
          this.refreshMarginTop();
          break;
        case STYLE_KEYS.FONT_SIZE:
          if ((_a = this.informationIconView) === null || _a === undefined) {
            // do nothing;
          } else {
            _a.refreshSkeletonStyles();
          }
          break;
        default:
      }
    }
    initStyle() {
      this.refreshStyles();
    }
    refreshStyles() {
      this.refreshColorStyles();
      this.refreshSkeletonStyles();
    }
    refreshSkeletonStyles() {
      let _a;
      let _b;
      super.refreshSkeletonStyles();
      this.refreshMarginsInfo();
      this.refreshShapeClass();
      this.refreshBorderLineWidth();
      this.refreshFillPattern();
      this.refreshBorderLinePattern();
      this.setCustomWidth();
      this.refreshFillColor();
      if ((_a = this.markersView) === null || _a === undefined) {
        // do nothing;
      } else {
        _a.refreshMarkerSize();
      }
      if ((_b = this.informationIconView) === null || _b === undefined) {
        // do nothing;
      } else {
        _b.refreshSkeletonStyles();
      }
      this.figure.setLineCorner(
        parseInt(
          `${styleManager.getStyleValue(this.parent(), STYLE_KEYS.LINE_CORNER) || 0}`
        )
      );
    }
    refreshColorStyles() {
      let _a;
      let _b;
      super.refreshColorStyles();
      this.refreshFillColor();
      this.refreshBorderLineColor();
      if ((_a = this.mathJaxView) === null || _a === undefined) {
        // do nothing;
      } else {
        _a.refreshColor();
      }
      if ((_b = this.informationIconView) === null || _b === undefined) {
        // do nothing;
      } else {
        _b.refreshColorStyles();
      }
    }
    refreshShapeClass() {
      const branchView = this.parent();
      const key = Object(utils.isCalloutBranch)(branchView)
        ? STYLE_KEYS.CALLOUT_SHAPE_CLASS
        : STYLE_KEYS.SHAPE_CLASS;
      const shapeClass = styleManager.getStyleValue(branchView, key);
      this.topicShapeStyle = shapeClass;
      this.figure.setShapeClass(shapeClass);
    }
    refreshFillColor() {
      const parentBranchView = this.parent();
      if (!parentBranchView) {
        return;
      }
      let fillColor = styleManager.getStyleValue(
        parentBranchView,
        STYLE_KEYS.FILL_COLOR
      );
      this.figure.setOriginalFillColor(fillColor);
      // treat for tree table
      if (
        Object(utils.isTreeTableCell)(parentBranchView) &&
        !parentBranchView.shouldCollapse()
      ) {
        fillColor = "none";
      }
      this.figure.setFillColor(fillColor);
      const fillGradient = styleManager.getStyleValue(
        parentBranchView.sheetView,
        STYLE_KEYS.FILL_GRADIENT
      );
      this.figure.setFillGradient(fillGradient);
    }
    refreshFillPattern() {
      this.figure.setFillPattern(
        styleManager.getStyleValue(this.parent(), STYLE_KEYS.FILL_PATTERN)
      );
    }
    refreshBorderLineColor() {
      this.figure.setBorderColor(
        styleManager.getStyleValue(this.parent(), STYLE_KEYS.BORDER_LINE_COLOR)
      );
    }
    refreshBorderLineWidth() {
      const branch = this.parent();
      this.figure.setBorderWidth(
        parseInt(
          styleManager.getStyleValue(branch, STYLE_KEYS.BORDER_LINE_WIDTH)
        )
      );
    }
    refreshBorderLinePattern() {
      const branchView = this.parent();
      if (!branchView) {
        return;
      }
      const borderLinePattern = styleManager.getStyleValue(
        branchView,
        STYLE_KEYS.BORDER_LINE_PATTERN
      );
      this.figure.setBorderLinePattern(borderLinePattern);
    }
    refreshMarginLeft() {
      this.figure.setMarginLeft(
        parseInt(
          `${styleManager.getStyleValue(this.parent(), STYLE_KEYS.MARGIN_LEFT)}`
        )
      );
    }
    refreshMarginRight() {
      this.figure.setMarginRight(
        parseInt(
          `${styleManager.getStyleValue(this.parent(), STYLE_KEYS.MARGIN_RIGHT)}`
        )
      );
    }
    refreshMarginTop() {
      this.figure.setMarginTop(
        parseInt(
          `${styleManager.getStyleValue(this.parent(), STYLE_KEYS.MARGIN_TOP)}`
        )
      );
    }
    refreshMarginBottom() {
      this.figure.setMarginBottom(
        parseInt(
          `${styleManager.getStyleValue(this.parent(), STYLE_KEYS.MARGIN_BOTTOM)}`
        )
      );
    }
    refreshVisualFillColor() {
      let _c;
      const userFillColor = this.figure.originalFillColor;
      let visualFillColor;
      if (isOpaqueColor(userFillColor)) {
        visualFillColor = userFillColor;
      } else {
        const cellBackgroundColor =
          (_c = this.parent()?.backGroundCellBranchView?.topicView) === null ||
          _c === undefined
            ? undefined
            : _c.figure.originalFillColor;
        const backgroundColor =
          this.getContext().getSheetView().figure.backgroundColor;
        const blockColor = VISUAL_BACK_COLOR;
        const { snowballUtil } = Object(utils.getInjectModule)(
          MODULE_NAME.SNOWBALL
        );
        visualFillColor = snowballUtil.blendingColor(
          userFillColor,
          cellBackgroundColor,
          backgroundColor,
          blockColor
        );
      }
      this.figure.setVisualFillColor(visualFillColor);
    }
    refreshMarginsInfo() {
      this.refreshMarginLeft();
      this.refreshMarginRight();
      this.refreshMarginBottom();
      this.refreshMarginTop();
    }
    setTopicShapeClass(shapeClass) {
      this.topicShapeStyle = shapeClass;
      this.figure.setShapeClass(shapeClass);
    }
    setGradientColor(isGradientColor) {
      this.figure.setGradientColor(isGradientColor);
    }
  } as typeof target;
};

@Style
export class TopicView extends TitleableView {
  shapeBounds: { x: number; y: number; width: number; height: number };
  bounds: { x: number; y: number; width: number; height: number };
  isVisible: boolean;
  isForcedInvisible: boolean;
  contentBounds: { x: number; y: number; width: number; height: number };
  figure: any;
  topicShapeStyle: any;
  numberingView: any;
  titleView: any;
  markersView: any;
  labelsView: any;
  mathJaxView: any;
  informationIconView: any;
  topicShapeSelectBox: any;
  image: any;
  topicGroup: any;
  topicShapeGroup: any;
  topicContent: any;
  s$topicInnerElementGroup: any;
  topicShapeFill: any;
  topicShape: any;
  model: any;
  constructor(model, parentBranchView?) {
    super({
      model,
    });
    this.shapeBounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }; /** @description contains border , padding(inset) and innerElement */
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }; /** @description contains shapeBounds and infoCard size */
    this.isVisible = true;
    this.isForcedInvisible = false;
    this.contentBounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this.model = model;
    this.figure = figures.createFigure(this);
    this.topicShapeStyle = null;
    this.numberingView = null;
    this.titleView = null;
    this.markersView = null;
    this.labelsView = null;
    this.mathJaxView = null;
    this.informationIconView = null;
    this.topicShapeSelectBox = null;
    this.image = null;
    this.parent(parentBranchView);
    this.initSVGStructure();
    this.initEventsListener();
  }
  get type() {
    return VIEW_TYPE.TOPIC;
  }
  get figureType() {
    return FIGURE_TYPE.TOPIC;
  }
  get _style() {
    return {
      topicShape: {},
      topicShape__intersected: {
        "stroke-width": "5px",
        stroke: "#2ebdff",
      },
    };
  }
  initSVGStructure() {
    this.topicGroup = this.figure.getContent();
    const renderWorker = this.figure.renderWorker;
    this.topicShapeGroup = renderWorker.topicShapeGroup;
    this.topicContent = renderWorker.topicContent;
    this.s$topicInnerElementGroup = renderWorker.s$topicInnerElementGroup;
    this.topicShapeFill = renderWorker.topicShapeFill;
    this.topicShape = renderWorker.topicShape;
  }
  initEventsListener() {
    const topicModel = this.model as any;
    const modelEvents = topicModel.modelEvents;
    if (process.env.SB_MODE !== "readonly") {
      this.listenTo(topicModel, "addImage", this.onAddImage);
      this.listenTo(topicModel, "removeImage", this.onRemoveImage);
      this.listenTo(
        topicModel,
        modelEvents.MATH_JAX_ADDED,
        this.onAddMathJaxView
      );
      this.listenTo(
        topicModel,
        modelEvents.MATH_JAX_REMOVED,
        this.removeMathJaxView
      );
      this.listenTo(
        topicModel,
        modelEvents.MATH_JAX_WIDTH_CHANGED,
        this.onMathJaxWidthChanged
      );
      this.listenTo(
        topicModel,
        modelEvents.MATH_JAX_ALIGN_CHANGED,
        this.onMathJaxAlignChanged
      );
      this.listenTo(topicModel, "change:title", () => {
        let _a;
        if ((_a = this.titleView) === null || _a === undefined) {
          // do nothing;
        } else {
          _a.setText(topicModel.get("title"));
        }
      });
      this.listenTo(
        topicModel,
        modelEvents.changeCustomWidth,
        this.setCustomWidth
      );
      this.listenTo(
        topicModel,
        modelEvents.labelsChanged,
        this.onLabelsChanged
      );
      this.listenTo(
        topicModel,
        modelEvents.informationChanged,
        this.onInformationChanged
      );
    }
  }
  // branchView.initView once
  initView() {
    let _a;
    this.initStyle();
    this.initEventsListenerWithContext();
    this.addTitleView(new TitleView());
    if (
      (_a = this.parent()) === null || _a === undefined
        ? undefined
        : _a.getNumberingText()
    ) {
      this.addNumberingView(new NumberingView());
    }
    const imageModel = this.model.getImageModel();
    const mathJaxText = this.model.getMathJaxText();
    if (imageModel && !mathJaxText) {
      this.addImageView(new ImageView(imageModel, this));
    }
    if (mathJaxText) {
      const mathJaxInfo = this.model.getMathJaxInfo();
      if (mathJaxInfo) {
        this.addMathJaxView(new MathjaxView(mathJaxInfo));
      }
    }
    this.markersView = new MarkersView(this);
    this._initFashionInformationIcons();
    this._initFashionLabelsUnitCard();
    this._initTopicSelectBoxView();
  }
  getTitledStyleView() {
    return this.parent();
  }
  /**
   * @description 初始化vana版本的 information icons
   * @private
   * */
  _initFashionInformationIcons() {
    this.figure.invalidateLayout();
    const informationData = this.getInformationData();
    if (this.informationIconView) {
      this.informationIconView.remove();
      this.informationIconView = null;
    }
    if (!informationData) {
      return;
    }
    if (Object.keys(informationData).length > 0) {
      this.informationIconView = new InformationIconView(informationData);
      this.informationIconView.parent(this);
    }
  }
  /**
   * @description 初始化vana版本的labels card
   * @private
   * */
  _initFashionLabelsUnitCard() {
    this.figure.invalidateLayout();
    if (this.labelsView) {
      this.labelsView.remove();
      this.labelsView = null;
    }
    if (this._isMatrixItem()) {
      return;
    }
    const labelsString = this.model.getLabel();
    if (labelsString) {
      this.labelsView = new LabelsView(labelsString.split(","), this);
    }
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setTopicShapeClass(shapeClass) {}
  /**
   * @description for matrix
   * @public
   * */
  refreshLabelViewState() {
    if (this.topicShapeStyle === TOPICSHAPE.MATRIXMAIN) {
      if (this.labelsView) {
        this.labelsView.remove();
        this.labelsView = null;
      }
    } else {
      const labelsString = this.model.getLabel();
      if (labelsString) {
        this.labelsView = new LabelsView(labelsString.split(","), this);
      }
    }
    this.figure.invalidateLayout();
  }
  initStyle() {}
  refreshStyles() {}
  refreshTextAlign() {
    super.refreshTextAlign();
  }
  setTopicShapePath(path) {
    this.figure.setTopicShapePath(path);
  }
  setTopicShapeFillPath(path) {
    this.figure.setTopicShapeFillPath(path);
  }
  setTopicShapeSelectBoxPath(path) {
    let _a;
    if ((_a = this.topicShapeSelectBox) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.path(path);
    }
  }
  getTextTransform() {
    return (
      styleManager.getStyleValue(this.parent(), STYLE_KEYS.TEXT_TRANSFORM) ||
      TEXTTRANSFORM.MANUAL
    );
  }
  getTopicMinWidth() {
    return this.figure.minimumWidth;
  }
  setCustomWidth() {
    this.figure.setCustomWidth(this.model.customWidth());
  }
  render() {
    // this.renderAllElemWithGrid()
    // this.trigger("topicviewboundschange", Object.assign({}, this.bounds))
    this.figure.invalidateLayout();
    return this;
  }
  /**
   * @private
   * @return {informationData}
   * */
  getInformationData() {
    const model = this.model;
    const notesInfo = model.getNotes();
    const commentsInfo = model.getComments();
    const hrefInfo = model.getHref();
    const taskInfo = model.getTaskInfo();
    const audioNotesInfo = model.getAudioNotes();
    // check taskInfo content
    const taskInfoHasContent = {};
    if (taskInfo) {
      (taskInfo.content || []).forEach(
        (info) => (taskInfoHasContent[info.name] = true)
      );
    }
    const info = {};
    if (hrefInfo) {
      Object.assign(info, {
        hrefInfo,
      });
    }
    if (audioNotesInfo) {
      Object.assign(info, {
        audioNotesInfo,
      });
    }
    if (notesInfo && notesInfo.plain) {
      Object.assign(info, {
        notesInfo,
      });
    }
    if (commentsInfo && commentsInfo.length) {
      Object.assign(info, {
        commentsInfo,
      });
    }
    if (
      taskInfoHasContent["assigned-to"] ||
      taskInfoHasContent["start-date"] ||
      taskInfoHasContent["end-date"]
    ) {
      Object.assign(info, {
        taskInfo: taskInfo?.content,
      });
    }
    const noInfoItem = Object.keys(info).length === 0;
    if (noInfoItem) {
      return null;
    } else {
      return info;
    }
  }
  getShapeStyle() {
    return styleManager.getStyleValue(this.parent(), STYLE_KEYS.SHAPE_CLASS);
  }
  setTopicShapeMaskAttrD(d) {
    this.figure.setTopicShapeMaskAttrD(d);
  }
  refresh() {
    this.render();
  }
  showSelectBox() {
    let _a;
    if ((_a = this.topicShapeSelectBox) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.hover();
    }
  }
  hideSelectBox() {
    let _a;
    if ((_a = this.topicShapeSelectBox) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.hide();
    }
  }
  activateSelectBox() {
    let _a;
    if ((_a = this.topicShapeSelectBox) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.active();
    }
  }
  deFocusSelectBox() {
    let _a;
    if ((_a = this.topicShapeSelectBox) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.defocus();
    }
  }
  /** @description 图片拖拽进入时候的样式改变 */
  showIntersection() {
    let _a;
    if ((_a = this.topicShapeSelectBox) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.intersect();
    }
  }
  /** @description 图片结束拖拽时候的样式改变 */
  hideIntersection() {
    let _a;
    if ((_a = this.topicShapeSelectBox) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.hide();
    }
  }
  /** @private */
  onLabelsChanged() {
    this._initFashionLabelsUnitCard();
  }
  /** @private */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onInformationChanged(changedViewType) {
    this._initFashionInformationIcons();
  }
  // end : add and remove about information item
  /** some functions about image */
  addImageView(imageView) {
    this.onRemoveImage();
    this.image = imageView;
  }
  onAddImage() {
    const imageModel = this.model.getImageModel();
    if (imageModel) {
      this.addImageView(new ImageView(imageModel, this));
      this.refresh();
    }
  }
  onRemoveImage() {
    if (this.image) {
      this.image.remove();
      this.image = null;
      this.refresh();
    }
  }
  onAddMathJaxView() {
    const mathJaxInfo = this.model.getMathJaxInfo();
    if (mathJaxInfo) {
      this.addMathJaxView(new MathjaxView(mathJaxInfo));
      this.refresh();
    }
  }
  removeMathJaxView() {
    if (!this.mathJaxView) {
      return;
    }
    this.mathJaxView.remove();
    this.mathJaxView = null;
    this.refresh();
  }
  addMathJaxView(mathJaxView) {
    mathJaxView.parent(this);
    if (this.mathJaxView) {
      this.removeMathJaxView();
    }
    this.mathJaxView = mathJaxView;
    this.refresh();
  }
  onMathJaxWidthChanged() {
    if (!this.mathJaxView) {
      return;
    }
    this.mathJaxView.refreshFinalWidth();
    this.refresh();
  }
  onMathJaxAlignChanged() {
    if (!this.mathJaxView) {
      return;
    }
    this.mathJaxView.refreshAlign();
    this.refresh();
  }
  addTitleView(titleView) {
    this.titleView = titleView;
    titleView.parent(this);
  }
  hideTitle() {
    let _a;
    if ((_a = this.titleView) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.hide();
    }
  }
  showTitle() {
    let _a;
    if ((_a = this.titleView) === null || _a === undefined) {
      // do nothing;
    } else {
      _a.show();
    }
  }
  addNumberingView(numberingView) {
    this.numberingView = numberingView;
    numberingView.parent(this);
  }
  getStructureClass() {
    let _a;
    if ((_a = this.parent()) === null || _a === undefined) {
      return undefined;
    } else {
      return _a.getStructureClass();
    }
  }
  /**
   * @description add by Ray, not good enough
   * @private
   * */
  _isMatrixItem() {
    let _a;
    const parent =
      (_a = this.parent()) === null || _a === undefined
        ? undefined
        : _a.parent();
    const structure = parent?.getStructureClass && parent.getStructureClass();
    if (
      structure === STRUCTURECLASS.SPREADSHEETROW ||
      structure === STRUCTURECLASS.SPREADSHEETCOLUMN
    ) {
      return true;
    } else {
      return false;
    }
  }
  _initTopicSelectBoxView() {
    if (this.topicShapeSelectBox) {
      this.topicShapeSelectBox.remove();
      this.topicShapeSelectBox = null;
    }
    this.topicShapeSelectBox = new TopicSelectBoxView(this);
    this.topicShapeSelectBox.parent(this);
  }
  setVisible(isVisible) {
    this.isVisible = isVisible;
    this.figure.setVisible(isVisible && !this.isForcedInvisible);
  }
  remove() {
    this.stopListening();
    this.clearReactions();
    this.figure.dispose();
    if (this.titleView) {
      this.titleView.remove();
      this.titleView = null;
    }
    if (this.markersView) {
      this.markersView.remove();
      this.markersView = null;
    }
    if (this.informationIconView) {
      this.informationIconView.remove();
      this.informationIconView = null;
    }
    if (this.image) {
      this.image.remove();
      this.image = null;
    }
    if (this.mathJaxView) {
      this.mathJaxView.remove();
      this.mathJaxView = null;
    }
    if (this.numberingView) {
      this.numberingView.remove();
      this.numberingView = null;
    }
    if (this.topicShapeSelectBox) {
      this.topicShapeSelectBox.remove();
      this.topicShapeSelectBox = null;
    }
    this.parent(null);
    return this;
  }
}

export default TopicView;

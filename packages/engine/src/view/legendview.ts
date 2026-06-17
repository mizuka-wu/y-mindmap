import process from "process";

import * as utils from "../utils/index";
import * as lib from "../lib/index";
import {
  VIEW_TYPE,
  MODULE_NAME,
  CONFIG,
  COMMON_FONT_FAMILY,
} from "../common/constants/index";
import WorkbookComponentView from "./workbookcomponentview";
import * as sb_utils_pointutils__WEBPACK_IMPORTED_MODULE_4__ from "../utils/pointutils";
import underscore from "underscore";
import SvgDraggableLegend from "../modules/svgdraggable/legend";
const fillColor = "rgba(255, 255, 255, 0.5)";
const borderColor = "#d1d1d1";
const radius = 6;
const borderWidth = 1;
const titleSize = 16;
// legend 最小宽度
const legendMinWidth = 160;
// legend 最小高度
const legendMinHeight = 80;
// title 区域高度
const legendTitleHeight = 30;
// 分割线高度
const legendHrHeight = 2;
// 文本颜色
const textColor = "#2b2f33";
// marker图标尺寸
const markerImageWidth = 20;
const markerImageHeight = 20;
// marker image 与右侧文本之间的间距
const markerImageRightMargin = 14;
const markerDescFontSize = 14;
// marker描述文本最大显示宽度
const markerDescTextMaxWidth = 200;
// marker list 与分割线的距离
const markerListToHrDistance = 9;
// marker list 高度
const markerListHeight = markerImageHeight;
// marker list 之间的垂直间距
const markerListVerticalMargin = 14;
// marker list 距 legend 上边界的距离
const markerListToLegendTopDistance =
  legendTitleHeight + legendHrHeight + markerListToHrDistance;
// marker list 距 legend 下边界的距离
const markerListToLegendBottomDistance = 18;
// marker list 距 legend 边界的水平间距
const markerListHorizonMargin = 15;
const emptyStateSignImageHeight = 42;
const emptyStateSignImageHorizonMargin = 12;
const emptyStateSignImageToHrDistance = 34;
const emptyStateSignToLegendTopDistance =
  legendTitleHeight + legendHrHeight + emptyStateSignImageToHrDistance;
const emptyStateSignTextToImageDistance = 14;
const emptyStateSignTextHeight = 16;
const emptyStateSignToLegendBottomDistance = 16;
const emptyStateSignSVG = `
<g id="empty-state-sign" stroke="none" stroke-width="1" fill="none" fill-rule="evenodd">
  <path d="M135.236666,42 L127.798458,42 C125.338452,33.9764725 115.883824,28 104.595749,28 C100.990268,28 97.5718351,28.6097218 94.5086331,29.7011215" stroke="#E1E3E5" opacity="0.8" stroke-linecap="round"></path>
  <path d="M42.6495622,31.1112073 C38.9149799,29.1470252 34.4119777,28 29.5645937,28 C18.50262,28 9.23410224,33.9734239 6.79845825,42 L1.10134124e-13,42" stroke="#E1E3E5" opacity="0.8" stroke-linecap="round"></path>
  <path d="M100.5,36.6924782 C94.8897955,27.9973909 83.0079757,22 69.2571763,22 C52.8547001,22 39.1115248,30.5334627 35.5,42" stroke="#ADB9B9" stroke-linecap="round" stroke-linejoin="round"></path>
  <path d="M67.7984582,1.70848514 L67.7984582,13.6942564 L67.7984582,21.5 C67.7984582,21.2238576 67.5746006,21 67.2984582,21 C67.0223159,21 66.7984582,21.2238576 66.7984582,21.5 L66.7984582,0.5 C66.7984582,0.776142375 67.0223159,1 67.2984582,1 C67.5746006,1 67.7984582,0.776142375 67.7984582,0.5 L67.7984582,1.70848514 C69.7913973,0.569495047 71.9045455,-3.90798505e-14 74.1379028,-3.90798505e-14 C77.4879388,-3.90798505e-14 80.6474454,1.0481317 82.4108922,1.0481317 C83.5865234,1.0481317 84.7950745,0.869452004 86.0365455,0.512092616 L86.0365455,12.5204627 C84.8150239,12.8627562 83.6064729,13.033903 82.4108922,13.033903 C80.6175213,13.033903 77.3596926,12.0083701 74.1379028,12.0083701 C71.990043,12.0083701 69.8768948,12.5703322 67.7984582,13.6942564 L67.7984582,21.5 C67.7984582,21.7761424 67.5746006,22 67.2984582,22 C67.0223159,22 66.7984582,21.7761424 66.7984582,21.5 L66.7984582,0.5 C66.7984582,0.223857625 67.0223159,0 67.2984582,0 C67.5746006,0 67.7984582,0.223857625 67.7984582,0.5 L67.7984582,1.70848514 Z" fill="#ADB9B9" fill-rule="nonzero"></path>
  <g transform="translate(25.583011, 15.180465) rotate(-27.000000) translate(-25.583011, -15.180465) translate(20.083011, 7.180465)">
      <path d="M5.72647419,15.9740172 C9.05980752,11.4131747 10.7264742,8.16515912 10.7264742,6.22997054 C10.7264742,3.32718768 8.48789794,0.974017226 5.72647419,0.974017226 C2.96505044,0.974017226 0.726474189,3.32718768 0.726474189,6.22997054 C0.726474189,8.16515912 2.39314086,11.4131747 5.72647419,15.9740172 Z" id="椭圆形" stroke="#E1E3E5" opacity="0.8"></path>
      <circle fill="#E1E3E5" opacity="0.800688244" cx="5.97044391" cy="5.79251042" r="2"></circle>
  </g>
  <g transform="translate(111.000000, 17.000000) rotate(20.000000) translate(-111.000000, -17.000000) translate(104.000000, 10.000000)" opacity="0.797409784">
      <circle stroke="#E1E3E5" cx="7" cy="7" r="7"></circle>
      <circle fill="#E1E3E5" cx="4.66666667" cy="6.22222222" r="1"></circle>
      <circle fill="#E1E3E5" cx="9.33333333" cy="6.22222222" r="1"></circle>
      <path d="M3.11111111,9.48189232 C4.14814815,11.0027267 5.44444444,11.763144 7,11.763144 C8.55555556,11.763144 9.85185185,11.0027267 10.8888889,9.48189232 L10.1111111,9.59168186 C8.83553899,9.25593372 7.79850195,9.08805965 7,9.08805965 C6.20149805,9.08805965 5.16446101,9.25593372 3.88888889,9.59168186 L3.11111111,9.48189232 Z" id="路径-3" fill="#E1E3E5"></path>
      <path d="M8.55555556,5.22924478 C8.92084426,4.68416554 9.35130275,4.30090791 9.84693101,4.0794719 C10.5903734,3.74731787 11.4685239,3.89966426 11.704335,4.15396383 C11.8280514,4.28738013 11.9124484,4.70472352 11.4809625,4.72438356 C11.09001,4.74219676 10.6287864,4.55906683 10.0358687,4.59779725 C9.5521046,4.62939756 9.05866689,4.83988007 8.55555556,5.22924478 Z" fill="#E1E3E5" transform="translate(10.179897, 4.559067) scale(-1, 1) translate(-10.179897, -4.559067) "></path>
      <path d="M2.33333333,5.25762849 C2.69862204,4.71254925 3.12908052,4.32929162 3.62470879,4.10785561 C4.36815119,3.77570158 5.24630167,3.92804797 5.48211274,4.18234754 C5.6058292,4.31576384 5.6902262,4.73310723 5.25874023,4.75276727 C4.86778774,4.77058047 4.40656416,4.58745055 3.81364647,4.62618096 C3.32988238,4.65778127 2.83644467,4.86826378 2.33333333,5.25762849 Z" fill="#E1E3E5"></path>
  </g>
</g>
`;
export class LegendView extends WorkbookComponentView {
  bounds: { x: number; y: number; width: number; height: number };
  _cachedBounds: { x: number; y: number; width: number; height: number };
  legendMarkerList: any[];
  legend: any;
  s$svg: any;
  s$rectSVG: any;
  s$titleSVG: any;
  s$hrLine: any;
  s$markerListContainer: any;
  _s$emptyStateSign: any;
  _s$emptyStateSignImage: any;
  _s$emptyStateSignText: any;
  constructor(sheetView, model) {
    super();
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this._cachedBounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this.legendMarkerList =
      []; /** @description 将proxyMarkerList去稀疏化的结果 */
    this.model = model;
    this.parent(sheetView);
    this.legend = sheetView.model.getLegendModel();
    this.initSVGStructure();
    this.initEventsListener();
    this.render();
    new SvgDraggableLegend().init(this);
    this.setLegendPosition();
  }
  get type() {
    return VIEW_TYPE.LEGEND;
  }
  get _style() {
    return {
      legend: {
        cursor: "-webkit-grab",
      },
      legend_dragging: {
        cursor: "-webkit-grabbing",
      },
      rect: {
        stroke: borderColor,
        "stroke-width": borderWidth,
        fill: fillColor,
      },
      title: {
        "font-weight": 500,
        fill: textColor,
        "font-size": titleSize,
      },
      emptyStateSignText: {
        fill: "rgb(173, 185, 185)",
        "font-size": 12,
      },
    };
  }
  initSVGStructure() {
    this.s$svg = new lib.SVG.G().data("name", "legend");
    this.style(this.s$svg, "legend");
    this.s$rectSVG = new lib.SVG.Rect()
      .width(legendMinWidth)
      .height(legendMinHeight)
      .radius(radius);
    this.style(this.s$rectSVG, "rect");
    this.s$svg.add(this.s$rectSVG);
    this.s$titleSVG = new lib.SVG.Text().text(
      this.getContext().getTranslatedText("LEGEND_TITLE"),
    );
    this.style(this.s$titleSVG, "title");
    this.s$svg.add(this.s$titleSVG);
    this.s$hrLine = new lib.SVG.Path().stroke(borderColor);
    this.s$svg.add(this.s$hrLine);
    this.s$markerListContainer = new lib.SVG.G()
      .x(markerListHorizonMargin)
      .y(markerListToLegendTopDistance);
    this.s$svg.add(this.s$markerListContainer);
    this._s$emptyStateSign = new lib.SVG.G();
    this._s$emptyStateSignImage = new lib.SVG.G();
    this._s$emptyStateSignImage.node.innerHTML = emptyStateSignSVG;
    this._s$emptyStateSignText = new lib.SVG.Text().text(
      this.getContext().getTranslatedText("LEGEND_INSERT_MARKER_INTO_TOPIC"),
    );
    this._s$emptyStateSign
      .add(this._s$emptyStateSignImage)
      .add(this._s$emptyStateSignText);
    this.s$svg.add(this._s$emptyStateSign);
    this.style(this._s$emptyStateSignText, "emptyStateSignText");
    this._s$emptyStateSign.hide();
    const currentSVGView = this.editDomain();
    currentSVGView.container.add(this.s$svg);
    currentSVGView.legendView = this;
    // set backbone's el property
    this.setElement(this.s$svg.node);
  }
  initEventsListener() {
    const modelEvents = this.legend.modelEvents;
    if (process.env.SB_MODE !== "readonly") {
      this.listenTo(
        this.legend,
        modelEvents.liveMarkerListChanged,
        this.render,
      );
      this.listenTo(
        this.legend,
        modelEvents.legendMarkerDescChanged,
        this.render,
      );
      this.listenTo(this.legend, "change:visibility", this.onVisibilityChange);
      this.listenTo(this.legend, "change:position", this.setLegendPosition);
    }
  }
  parent(parent) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  _updateLegendMarkerList() {
    const { markerModule } = Object(utils.getInjectModule)(
      MODULE_NAME.SNOWBIRD,
    );
    this.legendMarkerList = Array.from(
      new Set(this.legend.liveMarkerList),
    ).sort((markerId1, markerId2) => {
      return markerModule.indexOf(markerId1) - markerModule.indexOf(markerId2);
    });
  }
  _createMarkerListSVG() {
    // 清空marker list
    this.s$markerListContainer.clear();
    let currentLegendWidth;
    let currentLegendHeight;
    if (this.legendMarkerList.length) {
      this._s$emptyStateSign.hide();
      const markerLiBoundsList: any[] = [];
      // 遍历legendMarkerList
      this.legendMarkerList.forEach((markerId, index) => {
        const legendMarkerListView = new LegendMarkerListView(
          markerId,
          this,
          index,
        );
        markerLiBoundsList.push(legendMarkerListView.bounds);
        legendMarkerListView.move(
          0,
          (markerListHeight + markerListVerticalMargin) * index,
        );
        this.s$markerListContainer.add(legendMarkerListView.getSvg());
      });
      // 使用100%缩放下的list bounds来计算legend高度与宽度，避免缩放后宽高不准
      const listWidth = Math.max(
        ...markerLiBoundsList.map((bounds) => bounds.width),
      );
      const listHeight =
        markerLiBoundsList.reduce((sum, bounds) => sum + bounds.height, 0) -
        markerListVerticalMargin;
      currentLegendWidth = Math.max(
        listWidth + markerListHorizonMargin * 2,
        legendMinWidth,
      );
      currentLegendHeight = Math.max(
        listHeight +
          markerListToLegendTopDistance +
          markerListToLegendBottomDistance,
        legendMinHeight,
      );
    } else {
      this._s$emptyStateSign.show();
      this._s$emptyStateSign.move(
        emptyStateSignImageHorizonMargin,
        emptyStateSignToLegendTopDistance,
      );
      this._s$emptyStateSignText.y(
        emptyStateSignImageHeight + emptyStateSignTextToImageDistance,
      );
      const textLength = this._s$emptyStateSignText.length();
      this._s$emptyStateSignText.x(
        (legendMinWidth - emptyStateSignImageHorizonMargin * 2 - textLength) /
          2,
      );
      currentLegendWidth = legendMinWidth;
      currentLegendHeight =
        emptyStateSignToLegendTopDistance +
        emptyStateSignImageHeight +
        emptyStateSignTextToImageDistance +
        emptyStateSignTextHeight +
        emptyStateSignToLegendBottomDistance;
    }
    this.setLegendWidth(currentLegendWidth);
    this.setLegendHeight(currentLegendHeight);
    this._updateBounds({
      width: currentLegendWidth,
      height: currentLegendHeight,
    });
  }
  _updateBounds(size?) {
    let newBounds;
    if (this.legend.get("visibility") !== "visible") {
      newBounds = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };
    } else {
      newBounds = Object.assign(Object.assign({}, this.bounds), size);
    }
    if (!underscore.isEqual(newBounds, this.bounds)) {
      this.bounds = newBounds;
      this.trigger("change:bounds", this.bounds);
    }
  }
  render() {
    this._updateLegendMarkerList();
    this._createMarkerListSVG();
    if (this.legend.get("visibility") !== "visible") {
      this.$el.css("display", "none");
    }
    return this;
  }
  /** @private */
  setLegendWidth(newWidth = legendMinWidth) {
    this.s$rectSVG.width(newWidth);
    this.s$hrLine.attr("d", `M 0 30 L ${newWidth} 30`);
    const titleLength = this.s$titleSVG.length();
    this.s$titleSVG.x((newWidth - titleLength) / 2);
  }
  /** @private */
  setLegendHeight(newHeight = legendMinHeight) {
    this.s$rectSVG.height(newHeight);
  }
  /**
   * @description 获取legend的默认位置
   * @private
   * */
  getLegendDefaultPosition() {
    const svgView = this.editDomain();
    const visibleAreaBounds = svgView.getCanvasControl().getVisibleAreaBounds();
    const x = visibleAreaBounds.x + 20;
    const y = visibleAreaBounds.y + 20;
    return svgView.getCoordinateTransfer().viewportToMindMap({
      x,
      y,
    });
  }
  /** @private */
  setLegendPosition() {
    let position = this.legend.get("position");
    if (
      !sb_utils_pointutils__WEBPACK_IMPORTED_MODULE_4__.isPointLike(position)
    ) {
      position = this.getLegendDefaultPosition();
    }
    this.s$svg.x(position.x).y(position.y);
    this._updateBounds(position);
  }
  onVisibilityChange() {
    const display = this.legend.get("visibility") === "visible";
    this.$el.css("display", display ? "" : "none");
    if (display) {
      //to recalculate bounds and trigger change:bounds
      this.render();
      this.setLegendPosition();
    } else {
      this._updateBounds();
    }
  }
}
class LegendMarkerListView extends WorkbookComponentView {
  bounds: any;
  markerId: any;
  index: any;
  markerModule: any;
  _userMarkerDescMap: any;
  _markerDesc: any;
  s$container: any;
  s$markerImage: any;
  s$markerDescText: any;
  /**
   * @param {string} markerId
   * @param {LegendView} parentView
   * */
  constructor(markerId, legendView, index) {
    super();
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this.parent(legendView);
    this.markerId = markerId;
    this.index = index;
    this.markerModule = Object(utils.getInjectModule)(
      MODULE_NAME.SNOWBIRD,
    ).markerModule;
    this._userMarkerDescMap = legendView.legend.get("markers") || {};
    this._markerDesc =
      (this._userMarkerDescMap[markerId] &&
        this._userMarkerDescMap[markerId].name) ||
      this.markerModule.getMarkerInfoById(markerId)?.name ||
      markerId;
    this.initSVGStructure();
    this._calcBounds();
  }
  get type() {
    return VIEW_TYPE.LEGENDMARKERLIST;
  }
  async initSVGStructure() {
    const { markerId } = this;
    this.s$container = new lib.SVG.G();
    this.s$markerImage = new lib.SVG.Image()
      .width(markerImageWidth)
      .height(markerImageHeight);
    const markerInfo = this.markerModule.getMarkerInfoById(markerId);
    let resource;
    if (markerInfo?.isUserMarker) {
      resource = await this.config(CONFIG.XAP_LOADER)(markerInfo.resource);
    } else {
      resource = this.getContext().getFileRealResource(markerInfo?.resource);
    }
    this.s$markerImage.load(resource);
    this.s$container.add(this.s$markerImage);
    this.s$markerDescText = new lib.SVG.Text();
    this.s$markerDescText.text(this._wrapTextWithEllipsis(this._markerDesc));
    this.s$markerDescText.attr({
      fill: textColor,
      x: markerImageWidth + markerImageRightMargin,
      y: -(markerListHeight - markerDescFontSize) / 2,
      "font-size": markerDescFontSize,
      "font-family": COMMON_FONT_FAMILY,
    });
    this.s$container.add(this.s$markerDescText);
    this.setElement(this.s$container.node);
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  _calcBounds() {
    const width =
      markerImageWidth +
      markerImageRightMargin +
      Math.min(this._getTextWidth(this._markerDesc), markerDescTextMaxWidth);
    const height = markerImageHeight + markerListVerticalMargin;
    this.bounds = Object.assign(Object.assign({}, this.bounds), {
      width,
      height,
    });
  }
  _wrapTextWithEllipsis(text) {
    return Object(utils.wrapTextWithEllipsis)(
      text,
      {
        fontSize: markerDescFontSize,
        fontFamily: COMMON_FONT_FAMILY,
      },
      markerDescTextMaxWidth,
    );
  }
  _getTextWidth(text) {
    return Object(utils.getTextSize)(text, {
      fontSize: markerDescFontSize,
      fontFamily: COMMON_FONT_FAMILY,
    }).width;
  }
  move(x, y) {
    this.s$container.translate(x, y);
  }
  getSvg() {
    return this.s$container;
  }
  getTextClientStyle() {
    return {
      fontSize: markerDescFontSize,
    };
  }
  getTextClientBounds() {
    // 这个view没有bounds，所以这样搞
    return this.s$markerDescText.node.getBoundingClientRect();
  }
  getTextRealPosition() {
    const parentRealPosition = this.parent()?.bounds ?? {
      x: 0,
      y: 0,
    };
    return {
      x:
        parentRealPosition.x +
        markerListHorizonMargin +
        markerImageWidth +
        markerImageRightMargin,
      y:
        parentRealPosition.y +
        markerListToLegendTopDistance +
        (markerListHeight + markerListVerticalMargin) * this.index,
    };
  }
  saveEdit(newText) {
    let _a;
    if (newText === this._markerDesc) {
      return;
    }
    if ((_a = this.parent()) === null || _a === undefined) {
      // do noting
    } else {
      _a.legend.setUserMarkerDescription(this.markerId, newText);
    }
  }
  getEditContent() {
    return this._markerDesc;
  }
}

export default LegendView;

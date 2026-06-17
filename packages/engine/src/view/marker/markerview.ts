import mommonFuncs from "../../mommonfuncs";
import WorkbookComponentView from "../../view/workbookcomponentview";
import {
  STYLE_KEYS,
  VIEW_TYPE,
  FIGURE_TYPE,
  MODULE_NAME,
  CONFIG,
} from "../../common/constants/index";
import figures from "../../figures/index";
import styleManager from "../../utils/business/stylemanager/index";

import { eventHandlers } from "../../uievents/uieventhandlers/dom/markerhandler";
import * as utils from "../../utils/index";
const SELECTBOX_RADIUS = 2;
const SELECTBOX_CLICK_PADDING = 1;
const SELECTBOX_ATTR = {
  stroke: "rgb(46, 189, 255)",
  "stroke-width": "1px",
  fill: "rgb(46, 189, 255)",
  "fill-opacity": "0.3",
  display: "none",
};
const getTopicFontSize = (topicView) => {
  const branch = topicView.parent();
  const fontSize =
    styleManager.getStyleValue(branch, STYLE_KEYS.FONT_SIZE) || 0;
  return Number.parseInt(fontSize);
};
export class MarkerView extends WorkbookComponentView {
  bounds: { x: number; y: number; width: number; height: number };
  _hovering: boolean;
  _stable: boolean;
  figure: any;
  markerId: any;
  constructor(markerId) {
    super();
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this._hovering = false;
    this._stable = false;
    this.delegateEvents(eventHandlers);
    this.figure = figures.createFigure(this);
    this.markerId = markerId;
  }
  get type() {
    return VIEW_TYPE.MARKER;
  }
  get figureType() {
    return FIGURE_TYPE.MARKER;
  }
  async afterAncestorChange() {
    let _a;
    if (!this.getContext()) {
      return;
    }
    const topicView =
      (_a = this.parent()) === null || _a === undefined
        ? undefined
        : _a.parent();
    if (!topicView) {
      return;
    }
    const iconSize = getTopicFontSize(topicView);
    this.setIconSize({
      width: iconSize,
      height: iconSize,
    });
    const { markerModule } = Object(utils.getInjectModule)(
      MODULE_NAME.SNOWBIRD,
    );
    const markerInfo = markerModule.getMarkerInfoById(this.markerId);
    let resource;
    if (markerInfo?.isUserMarker) {
      resource = await this.config(CONFIG.XAP_LOADER)(markerInfo.resource);
    } else {
      resource = this.getContext().getFileRealResource(markerInfo?.resource);
    }
    this.figure.setIconUrl(resource);
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  setIconSize(size) {
    this.figure.setSize(size);
    this.bounds = {
      x: 0,
      y: 0,
      width: size.width,
      height: size.height,
    };
    const d = mommonFuncs.generateRect(
      this.bounds,
      0,
      SELECTBOX_RADIUS,
      SELECTBOX_CLICK_PADDING,
    );
    this.figure.setSelectionArr(
      Object.assign(
        {
          d,
        },
        SELECTBOX_ATTR,
      ),
    );
  }
  setStable(stable) {
    this._stable = stable;
  }
  getSvg() {
    return this.figure.getContent();
  }
  getMarkerId() {
    return this.markerId;
  }
  getBranchView() {
    const markersView = this.parent();
    const topicView = markersView && markersView.parent();
    const branchView = topicView && topicView.parent();
    return branchView;
  }
  remove() {
    this.stopListening();
    this.figure.dispose();
    this.parent(null);
    return this;
  }
}

export default MarkerView;

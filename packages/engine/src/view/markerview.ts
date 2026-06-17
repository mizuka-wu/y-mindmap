import process from 'process';
import styleManager from '../utils/business/stylemanager/index';

import { STYLE_KEYS, VIEW_TYPE, FIGURE_TYPE, MODULE_NAME } from '../common/constants/index';
import MarkerView from './marker/markerview';
import SvgComponentView from './svgcomponentview';
import figures from '../figures/index';
import * as utils from '../utils/index';

export type { MarkerView } from './marker/markerview';

const getTopicFontSize = topicView => {
  const branch = topicView.parent();
  const fontSize = styleManager.getStyleValue(branch, STYLE_KEYS.FONT_SIZE) || 0;
  return Number.parseInt(fontSize);
};
export class MarkersView extends SvgComponentView {
  figure: any;
  markerViewMap: Map<any, any>;
  markerIdList: any;
  constructor(topicView) {
    super();
    this.parent(topicView);
    this.figure = figures.createFigure(this);
    this.markerViewMap = new Map();
    if (process.env.SB_MODE !== 'readonly') {
      const topicModel = topicView.model;
      this.listenTo(topicModel, topicModel.modelEvents.MARKER_ADDED, this.rebuildMarkers);
      this.listenTo(topicModel, topicModel.modelEvents.MARKER_REMOVED, this.rebuildMarkers);
      this.listenTo(topicModel, topicModel.modelEvents.MARKER_CHANGED, this.rebuildMarkers);
      this.listenTo(topicModel, 'changeStyle', key => {
        if (key === STYLE_KEYS.FONT_SIZE) {
          this.refreshMarkerSize();
        }
      });
    }
    this._initMarkers();
  }
  get type() {
    return VIEW_TYPE.MARKERS;
  }
  get figureType() {
    return FIGURE_TYPE.MARKERS;
  }
  parent(parent?) {
    if (typeof parent === 'undefined') {
      return super.parent();
    }
    return super.parent(parent);
  }
  refreshMarkerSize() {
    if (!this.markerIdList) {
      return;
    }
    const topicView = this.parent();
    if (topicView) {
      const topicFontSize = getTopicFontSize(topicView);
      this.markerIdList.forEach(markerId => {
        let _a;
        if ((_a = this.markerViewMap.get(markerId)) === null || _a === undefined) {
          return undefined;
        } else {
          return _a.setIconSize({
            width: topicFontSize,
            height: topicFontSize,
          });
        }
      });
    }
  }
  rebuildMarkers() {
    let _a;
    if ((_a = this.markerIdList) === null || _a === undefined) {
      // do noting
    } else {
      _a.forEach(markerId => {
        let _a;
        if ((_a = this.markerViewMap.get(markerId)) === null || _a === undefined) {
          return undefined;
        } else {
          return _a.remove();
        }
      });
    }
    this._initMarkers();
  }
  _initMarkers() {
    let _a;
    let _b;
    const markersData = (_a = this.parent()) === null || _a === undefined ? undefined : _a.model.getMarkersData();
    if (!markersData?.length) {
      return this._setMarkerIdList([]);
    }
    const { markerModule } = Object(utils.getInjectModule)(MODULE_NAME.SNOWBIRD);
    const markerIdList = markersData.map(markerInfo => markerInfo.markerId);
    markerIdList.sort((idA, idB) => {
      return markerModule.indexOf(idA) - markerModule.indexOf(idB);
    });
    this._setMarkerIdList(markerIdList);
    // reverse order
    for (let i = markerIdList.length - 1; i >= 0; i--) {
      const markerId = markerIdList[i];
      const view = new MarkerView(markerId);
      view.parent(this);
      this.markerViewMap.set(markerId, view);
    }
    const firstId = markerIdList[0];
    if ((_b = this.markerViewMap.get(firstId)) === null || _b === undefined) {
      // do noting
    } else {
      _b.setStable(true);
    }
  }
  _setMarkerIdList(newMarkerIdList) {
    this.markerIdList = newMarkerIdList;
    this.figure.setMarkerIdList(newMarkerIdList);
  }
  remove() {
    let _a;
    this.stopListening();
    if ((_a = this.markerIdList) === null || _a === undefined) {
      // do noting
    } else {
      _a.forEach(markerId => {
        let _a;
        if ((_a = this.markerViewMap.get(markerId)) === null || _a === undefined) {
          return undefined;
        } else {
          return _a.remove();
        }
      });
    }
    this.figure.dispose();
    this.parent(null);
    return this;
  }
  getSvg() {
    return this.figure.getContent();
  }
  move(x, y) {
    this.figure.setPosition({
      x,
      y,
    });
  }
  getMarkerView(markerId) {
    return this.markerViewMap.get(markerId) ?? null;
  }
}

export default MarkersView;

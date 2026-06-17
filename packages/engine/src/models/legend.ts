import { MODEL_TYPE, EVENTS } from '../common/constants/index';
import { BaseComponent } from './basecomponent';

import type { MarkerData } from './marker';
import type { Point, SheetModel } from '../type.d';

export interface LegendData {
  visibility: 'hidden' | 'visible';
  position: Point;
  markers: {
    [id: string]: {
      name: string;
      resource?: string;
    };
  };
  groups: {
    [id: string]: {
      name: string;
      markers: Array<string>;
    };
  };
}

export class LegendModel extends BaseComponent<LegendData> {
  liveMarkerList: MarkerData[] = [];
  initAttr: LegendData;
  /** @public */
  get componentType() {
    return MODEL_TYPE.LEGEND;
  }
  /** @public */
  get modelEvents() {
    return {
      legendMarkerDescChanged: 'legendMarkerDescChanged',
      liveMarkerListChanged: 'liveMarkerListChanged',
    };
  }
  /**
   * @param attr
   * @param {Object} options
   * @param {SheetModel} options.parentModel
   * @private
   * */
  constructor(attr: LegendData, options: { sheet: SheetModel; parentModel?: SheetModel }) {
    super(attr, options);
    if (options && options.parentModel) {
      this.parent(options.parentModel);
    }
    /** @public */
    this.initAttr = attr;
    this.initEventsListener();
  }
  /** @private */
  initEventsListener() {
    /** @type {SheetModel} */
    const parentSheetModel = this.parent() as SheetModel;
    const sheetModelEvents = parentSheetModel.modelEvents;
    this.listenTo(parentSheetModel, sheetModelEvents.topicAddMarker, this.onTopicAddMarker);
    this.listenTo(parentSheetModel, sheetModelEvents.topicChangeMarker, this.onTopicChangeMarker);
    this.listenTo(parentSheetModel, sheetModelEvents.topicRemoveMarker, this.onTopicRemoveMarker);
    this.on('change', this.onChange);
  }
  onChange() {
    let _a;
    let _b;
    if ((_a = this.parent()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.set('legend', this.toJSON());
    }
    if ((_b = this.ownerSheet()) === null || _b === undefined) {
      // do nothing
    } else {
      _b.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
        target: this.ownerSheet(),
        attr: 'legend',
      });
    }
  }
  /**
   * @param {markerData | MarkerModel} markerData
   * @private
   * */
  onTopicAddMarker(markerId: MarkerData) {
    this.liveMarkerList.push(markerId);
    this.trigger(this.modelEvents.liveMarkerListChanged);
  }
  /**
   * @param {string} oldMarkerId
   * @param {markerData | MarkerModel} newMarkerData
   * @private
   * */
  onTopicChangeMarker(oldMarkerId: MarkerData, newMarkerId: MarkerData) {
    // remove old marker and add new marker
    this.liveMarkerList.splice(this.liveMarkerList.indexOf(oldMarkerId), 1, newMarkerId);
    this.trigger(this.modelEvents.liveMarkerListChanged);
  }
  /**
   * @param {markerData | MarkerModel} markerData
   * @private
   * */
  onTopicRemoveMarker(markerId: MarkerData) {
    this.liveMarkerList.splice(this.liveMarkerList.indexOf(markerId), 1);
    this.trigger(this.modelEvents.liveMarkerListChanged);
  }
  /** @public */
  setLegendDisplay(bool: boolean) {
    let _a;
    this.set('visibility', bool ? 'visible' : 'hidden');
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => {
          this.setLegendDisplay(!bool);
        },
        redo: () => {
          this.setLegendDisplay(bool);
        },
      });
    }
  }
  /** @public */
  setLegendPosition(position: Point) {
    let _a;
    const oldPosition = this.get('position') as Point;
    if (!position) {
      this.unset('position');
    } else {
      this.set('position', position);
    }
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => {
          this.setLegendPosition(oldPosition);
        },
        redo: () => {
          this.setLegendPosition(position);
        },
      });
    }
  }
  /**
   * @param {string} markerId
   * @param {string} userDescription
   * @public
   * */
  setUserMarkerDescription(markerId: string, userDescription: string) {
    let _a;
    let userMarkerDescriptionMap = JSON.parse(JSON.stringify(this.get('markers') || {}));
    // Workaround: Fix possible error content
    if (Array.isArray(userMarkerDescriptionMap)) {
      userMarkerDescriptionMap = {};
    }
    const oldUserDescription = (userMarkerDescriptionMap[markerId] || {}).name;
    if (!userDescription) {
      delete userMarkerDescriptionMap[markerId];
    } else {
      userMarkerDescriptionMap[markerId] = {
        name: userDescription,
      };
    }
    this.set('markers', userMarkerDescriptionMap);
    this.trigger(this.modelEvents.legendMarkerDescChanged);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => {
          this.setUserMarkerDescription(markerId, oldUserDescription);
        },
        redo: () => {
          this.setUserMarkerDescription(markerId, userDescription);
        },
      });
    }
  }
}

export default LegendModel;

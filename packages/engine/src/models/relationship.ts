import { COMPONENT_TYPE, EVENTS } from '../common/constants/index';
import StyleComponent from './stylecomponent';

import { Point, StyleData, SheetModel } from '../type.d';
export interface RelationshipData {
  id: string;
  title: string;
  style: StyleData;
  class: string;
  end1Id: string;
  end2Id: string;
  controlPoints: { 1: Point; 2: Point };
  lineEndPoints?: { 1: Point; 2: Point };
  titleUnedited?: boolean;
}

export class RelationshipModel extends StyleComponent<RelationshipData> {
  _titleUnedited: boolean = false;
  get componentType() {
    return COMPONENT_TYPE.RELATIONSHIP;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(attr: RelationshipData, options: any) {
    super(attr, options);
  }
  changeEndPoint(endIds: { end1Id: string; end2Id: string }) {
    let _a;
    let isUpdated = false;
    const oldEndIds: Partial<{ end1Id: string; end2Id: string }> = {};
    if (endIds.end1Id) {
      oldEndIds.end1Id = this.get('end1Id');
      if (oldEndIds.end1Id !== endIds.end1Id) {
        this.set('end1Id', endIds.end1Id);
        isUpdated = true;
      }
    }
    if (endIds.end2Id) {
      oldEndIds.end2Id = this.get('end2Id');
      if (oldEndIds.end2Id !== endIds.end2Id) {
        this.set('end2Id', endIds.end2Id);
        isUpdated = true;
      }
    }
    if (isUpdated) {
      const parent = this.parent();
      if (!parent) {
        return;
      }
      const relationshipsData = parent.get('relationships');
      const index = parent.relationships().indexOf(this);
      relationshipsData[index] = this.toJSON();
      parent.set('relationships', relationshipsData);
      parent.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
        target: parent,
        attr: 'relationships',
      });
      this.trigger('change:endPoint');
      if ((_a = this.getUndo()) === null || _a === undefined) {
        // do nothing
      } else {
        _a.add(
          {
            undo: () => {
              this.changeEndPoint(oldEndIds as { end1Id: string; end2Id: string });
            },
            redo: () => {
              this.changeEndPoint(endIds);
            },
          },
          'changeEndPoint'
        );
      }
    }
  }
  removeSelf() {
    const parent = this.parent<SheetModel>();
    if (parent) {
      parent.removeRelationship(this);
    }
  }
  /**
   * @param {{1:Object, 2:Object}} points
   */
  changeControlPosition(points?: { 1: Point; 2: Point }) {
    let _a;
    const isEmpty = (obj: object) => Object.keys(obj).length === 0;
    const parent = this.parent();
    const relationshipsData = parent.get('relationships');
    const index = parent.relationships().indexOf(this);
    let controlPoints = this.get('controlPoints');
    let oldPoints;
    if (controlPoints === undefined || isEmpty(controlPoints)) {
      oldPoints = undefined;
    } else {
      oldPoints = Object.assign({}, controlPoints);
    }
    if (points === undefined || isEmpty(points)) {
      controlPoints = undefined;
    } else {
      controlPoints = Object.assign(controlPoints === undefined ? {} : controlPoints, points);
    }
    this.set('controlPoints', controlPoints);
    relationshipsData[index] = this.toJSON();
    parent.set('relationships', relationshipsData);
    parent.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
      target: parent,
      attr: 'relationships',
    });
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.changeControlPosition(oldPoints);
          },
          redo: () => {
            this.changeControlPosition(points);
          },
        },
        'changeControlPosition'
      );
    } // if (this.getUndo().isExecuting()) {
    this.trigger('refresh', true); //so when rendering, no need to initStyle.
    // }
  }
  hasFullLineEndPositionData() {
    const isEmpty = (obj: object) => Object.keys(obj).length === 0;
    const lineEndPoints = this.get('lineEndPoints') as unknown as { 0: Point; 1: Point };
    return lineEndPoints !== undefined && !isEmpty(lineEndPoints) && lineEndPoints[0] && lineEndPoints[1];
  }
  changeLineEndPosition(points: { 1: Point; 2: Point }) {
    let _a;
    const isEmpty = (obj: object) => Object.keys(obj).length === 0;
    const parent = this.parent();
    const relationshipsData = parent.get('relationships');
    const index = parent.relationships().indexOf(this);
    let lineEndPoints = this.get('lineEndPoints');
    let oldPoints;
    if (lineEndPoints === undefined || isEmpty(lineEndPoints)) {
      oldPoints = undefined;
    } else {
      oldPoints = Object.assign({}, lineEndPoints);
    }
    if (points === undefined || isEmpty(points)) {
      lineEndPoints = undefined;
    } else {
      lineEndPoints = Object.assign(lineEndPoints === undefined ? {} : lineEndPoints, points);
    }
    this.set('lineEndPoints', lineEndPoints);
    relationshipsData[index] = this.toJSON();
    parent.set('relationships', relationshipsData);
    parent.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
      target: parent,
      attr: 'relationships',
    });
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.changeLineEndPosition(oldPoints as { 1: Point; 2: Point });
          },
          redo: () => {
            this.changeLineEndPosition(points);
          },
        },
        'changeLineEndPosition'
      );
    }
    this.trigger('refresh', true);
  }
  styleChanged() {
    const style = this.style();
    if (style) {
      this.set('style', style.toJSON());
    } else {
      this.unset('style');
    }
    this._save();
  }
  getTitle() {
    return this.get('title');
  }
  changeTitle(newTitle: string, options?: { titleUnedited?: boolean }) {
    let _a;
    const defaultOptions = {
      titleUnedited: false,
    };
    options = Object.assign({}, defaultOptions, options);
    const oldTitle = this.get('title');
    if (oldTitle === newTitle) {
      return false;
    }
    this.set('title', newTitle);
    const oldTitleUnedited = this._titleUnedited;
    if (!options.titleUnedited && this.has('titleUnedited')) {
      this.unset('titleUnedited');
      this._titleUnedited = false;
    } else if (options.titleUnedited === true) {
      this.set('titleUnedited', true);
      this._titleUnedited = true;
    }
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () =>
            this.changeTitle(oldTitle as string, {
              titleUnedited: oldTitleUnedited,
            }),
          redo: () => this.changeTitle(newTitle),
        },
        'R-changeTitle'
      );
    }
    this._save();
  }
  _save() {
    let _a;
    const parent = this.parent();
    const relationshipsData = parent.get('relationships');
    const index = parent.relationships().indexOf(this);
    relationshipsData[index] = this.toJSON();
    parent.set('relationships', relationshipsData);
    if ((_a = this.parent()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
        target: parent,
        attr: 'relationships',
      });
    }
  }
  isTitleUnedited() {
    if (this.has('titleUnedited') && this.get('titleUnedited') === true) {
      return true;
    } else {
      return false;
    }
  }
}
export default RelationshipModel;

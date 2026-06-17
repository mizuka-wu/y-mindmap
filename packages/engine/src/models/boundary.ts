import { MODEL_TYPE, TOPIC_TYPE, MASTER_RANGE, CONFIG } from '../common/constants/index';
import { TopicModel } from '../type';
import StyleComponent from './stylecomponent';

import type { StyleData } from './stylecomponent';

export interface BoundaryData {
  id: string;
  title: string;
  style: StyleData;
  class: string;
  range: string;
  titleUnedited?: boolean;
}

/**
 * @fileOverview the backbone model of boundary
 * */
/**
 * @description the model of boundary
 * @constructor
 * */
export class BoundaryModel extends StyleComponent<BoundaryData> {
  _titleUnedited: boolean;
  rangeStart: number;
  rangeEnd: number;
  /** @type {string} */
  get componentType() {
    return MODEL_TYPE.BOUNDARY;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(attr: BoundaryData, options: any) {
    super(attr, options);
    this._titleUnedited = false;
    super.initialize(attr, options);
    this.updateRange();
    this.on('change:range', this.updateRange);
  }
  /** @public */
  beforeTopicRemove(topic: TopicModel, index: number) {
    if (topic.type() === TOPIC_TYPE.ATTACHED) {
      const isRemove = true;
      this.changeBoundaryRange(index, isRemove);
    }
  }
  /** @public */
  afterTopicAdd(topic: TopicModel, index: number) {
    if (topic.type() === TOPIC_TYPE.ATTACHED) {
      const isRemove = false;
      this.changeBoundaryRange(index, isRemove);
    }
  }
  /**
   * @public
   * @return {string}
   * */
  getRange() {
    return this.get('range') as string;
  }
  setRange(newRange: string) {
    let _a;
    const oldRange = this.getRange();
    if (newRange === oldRange) {
      return false;
    }
    this.set('range', newRange);
    //parentView && parentView.refresh();
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.setRange(oldRange);
          },
          redo: () => {
            this.setRange(newRange);
          },
        },
        'setRange boundary'
      );
    }
  }
  updateRange(change?: boolean) {
    const range = this.getRange();
    if (!range) {
      this.rangeStart = -1;
      this.rangeEnd = -1;
      return;
    }
    if (range === MASTER_RANGE) {
      this.rangeStart = -1;
      this.rangeEnd = -1;
    } else {
      const rangeNumbers = range.match(/\d+/g);
      if (rangeNumbers) {
        this.rangeStart = parseInt(rangeNumbers[0], 10);
        this.rangeEnd = parseInt(rangeNumbers[1], 10);
        this.checkRange();
      } else {
        this.rangeStart = -1;
        this.rangeEnd = -1;
      }
    }
    if (change && this.parent()) {
      this.boundaryChanged();
    }
  }
  checkRange(_parent?: TopicModel) {
    let _a;
    const parent = _parent || this.parent<TopicModel>();
    if (!parent) {
      return false;
    }
    if (this.getRange() === MASTER_RANGE) {
      return true;
    }
    const attachedArr = parent.children();
    if (this.rangeStart <= this.rangeEnd && attachedArr[this.rangeStart] && attachedArr[this.rangeEnd]) {
      return true;
    }
    if ((_a = this.getConfig()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.get(CONFIG.LOGGER).warn('check boundary range fail', this.get('id'));
    }
    if (attachedArr.length <= this.rangeStart) {
      this.rangeStart = -1;
      this.rangeEnd = -1;
      return false;
    }
    if (attachedArr.length <= this.rangeEnd) {
      this.rangeEnd = attachedArr.length - 1;
      return true;
    }
    return false;
  }
  removeSelf() {
    if (!this.parent()) {
      return;
    }
    (this.parent() as TopicModel).removeBoundary(this);
  }
  /* override */
  styleChanged() {
    const style = this.style();
    if (style) {
      this.set('style', style.toJSON());
    } else {
      this.unset('style');
    }
    this.boundaryChanged();
  }
  boundaryChanged(boundariesData?: BoundaryData[]) {
    const parent = this.parent<TopicModel>() as TopicModel;
    if (!boundariesData) {
      boundariesData = parent.get('boundaries') ?? [];
      const index = parent.boundaries().indexOf(this);
      (boundariesData as BoundaryData[])[index] = this.toJSON();
    }
    parent.set('boundaries', boundariesData);
    parent.topicChanged({
      target: parent,
      attr: 'boundaries',
    });
  }
  // sourceIndex : the operated topic's model index
  changeBoundaryRange(sourceIndex: number, remove: boolean) {
    if (this.getRange() === MASTER_RANGE) {
      return false;
    }
    let rangeStart;
    let rangeEnd;
    let range;
    rangeStart = this.rangeStart;
    rangeEnd = this.rangeEnd;
    if (sourceIndex >= rangeStart && sourceIndex <= rangeEnd) {
      // the operated topic is inside of this boundary
      if (remove) {
        // 若此boundary有且仅有包含当前被删除的topic,则删除此boundary
        if (rangeStart === rangeEnd) {
          return this.removeSelf();
        }
        rangeEnd--;
      } else {
        rangeEnd++;
      }
    } else if (sourceIndex < rangeStart) {
      //topic is on the top of this boundary
      if (remove) {
        rangeStart--;
        rangeEnd--;
      } else {
        rangeStart++;
        rangeEnd++;
      }
    }
    if (rangeStart !== this.rangeStart || rangeEnd !== this.rangeEnd) {
      range = '(' + rangeStart + ',' + rangeEnd + ')';
      this.setRange(range);
    }
  }
  changeTitle(newTitle: string, options: { titleUnedited?: boolean } = {}) {
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
    this.boundaryChanged();
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => {
          this.changeTitle(oldTitle as string, {
            titleUnedited: oldTitleUnedited,
          });
        },
        redo: () => {
          this.changeTitle(newTitle);
        },
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

export default BoundaryModel;

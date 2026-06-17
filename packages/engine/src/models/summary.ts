import underscore from 'underscore';
import { TOPIC_TYPE, CONFIG, COMPONENT_TYPE } from '../common/constants/index';
import StyleComponent, { StyleData } from './stylecomponent';
import type { TopicModel } from '../type.d';

export interface SummaryData {
  id: string;
  style: StyleData;
  class: string;
  range: string;
  topicId: string;
}

export class SummaryModel extends StyleComponent<SummaryData> {
  rangeStart: number;
  rangeEnd: number;
  get componentType() {
    return COMPONENT_TYPE.SUMMARY;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(attr: SummaryData, options: any) {
    super(attr, options);
    this.updateRange();
    this.on('change:range', this.updateRange);
  }
  beforeTopicRemove(topic: TopicModel, index: number) {
    if (topic.type() === TOPIC_TYPE.ATTACHED) {
      const isRemove = true;
      this.changeSummaryRange(index, isRemove);
    }
  }
  afterTopicAdd(topic: TopicModel, index: number) {
    if (topic.type() === TOPIC_TYPE.ATTACHED) {
      const isRemove = false;
      this.changeSummaryRange(index, isRemove);
    }
  }
  getRange() {
    return this.get('range');
  }
  setRange(newRange: string) {
    let _a;
    const oldRange = this.getRange();
    if (newRange === oldRange) {
      return false;
    }
    this.set('range', newRange);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.setRange(oldRange as string);
          },
          redo: () => {
            this.setRange(newRange);
          },
        },
        'setRange summary'
      );
    }
  }
  checkRange(_parent?: TopicModel) {
    let _a;
    const parent = _parent || this.parent<TopicModel>();
    if (!parent) {
      return false;
    }
    const attachedArr = parent.children();
    if (this.rangeStart <= this.rangeEnd && attachedArr[this.rangeStart] && attachedArr[this.rangeEnd]) {
      return true;
    }
    if ((_a = this.getConfig()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.get(CONFIG.LOGGER).warn('check summary range fail', this.get('id'));
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
  updateRange(change?: boolean) {
    const range = this.getRange();
    if (!range) {
      this.rangeStart = -1;
      this.rangeEnd = -1;
      return;
    }
    if (range === 'master') {
      this.rangeStart = -1;
      this.rangeEnd = -1;
    } else {
      this.rangeStart = parseInt((range.match(/\d+/g) || ['0'])[0], 10);
      this.rangeEnd = parseInt((range.match(/\d+/g) || ['0'])[1], 10);
      this.checkRange();
    }
    if (change) {
      this.summaryChanged();
    }
  }
  refreshSelf() {
    // TODO: Remove this method is unnecessary
  }
  styleChanged() {
    const style = this.style();
    if (style) {
      this.set('style', style.toJSON());
    } else {
      this.unset('style');
    }
    this.summaryChanged();
  }
  changeSummaryRange(sourceIndex: number, remove: boolean) {
    let rangeStart = this.rangeStart;
    let rangeEnd = this.rangeEnd;
    if (sourceIndex >= rangeStart && sourceIndex <= rangeEnd) {
      // topic in summary
      if (remove) {
        if (rangeStart === rangeEnd) {
          const topic = this.getSummaryTopic();
          if (topic) {
            topic.removeSelf();
            return;
          }
        }
        rangeEnd--;
      } else {
        rangeEnd++;
      }
    } else if (sourceIndex < rangeStart) {
      //topic not in summary and upon the summary
      if (remove) {
        rangeStart--;
        rangeEnd--;
      } else {
        rangeStart++;
        rangeEnd++;
      }
    }
    const range = '(' + rangeStart + ',' + rangeEnd + ')';
    if (rangeStart !== this.rangeStart || rangeEnd !== this.rangeEnd) {
      this.setRange(range);
    }
  }
  getSummaryTopic() {
    const topicId = this.get('topicId');
    const topic = this.parent<TopicModel>();
    if (!topic) {
      return;
    }
    const summaries = topic.children(TOPIC_TYPE.SUMMARY);
    const summary = underscore.find(summaries, tempSummary => {
      return tempSummary.get('id') === topicId;
    });
    return summary;
  }
  summaryChanged() {
    const parent = this.parent();
    if (!parent) {
      return;
    }
    const summariesData = parent.get('summaries');
    const index = parent.summaries().indexOf(this);
    summariesData[index] = this.toJSON();
    parent.set('summaries', summariesData);
    parent.topicChanged({
      target: parent,
      attr: 'summaries',
    });
  }
}
export default SummaryModel;

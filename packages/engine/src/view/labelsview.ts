import figures from '../figures/index';

import { COMMON_FONT_FAMILY, VIEW_TYPE, FIGURE_TYPE } from '../common/constants/index';

import * as utils from '../utils/index';

import SvgComponentView from './svgcomponentview';
const labelFontSize = 12;
const labelFontFamily = COMMON_FONT_FAMILY;
const labelFontStyleInfo = {
  fontSize: labelFontSize,
  fontFamily: labelFontFamily,
};
const UNIT_MIN_WIDTH = 38;
const UNIT_HEIGHT = 20;
const UNIT_PADDING_HORIZON = 6;
const UNIT_MARGIN_HORIZON = 4;
const UNIT_MARGIN_VERTICAL = 2;
// 特殊label unit的理想推测宽度，保守起见，选得比较宽
const SPECIAL_UNIT_PREFER_WIDTH = 46;
export class LabelsView extends SvgComponentView {
  bounds: { x: number; y: number; width: number; height: number };
  parentWidth: number;
  labelUnitArr: any[];
  _labels: any[];
  figure: any;
  s$labelsCardGroup: any;
  constructor(labels, topicView) {
    super();
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this.parentWidth = 0;
    this.labelUnitArr = [];
    this._labels = Array.from(new Set(labels.map(l => l.trim())));
    this.parent(topicView);
    this.figure = figures.createFigure(this);
    this.s$labelsCardGroup = this.figure.getContent();
  }
  get type() {
    return VIEW_TYPE.LABEL;
  }
  get figureType() {
    return FIGURE_TYPE.LABELS;
  }
  setParentWidth(width) {
    this.parentWidth = width;
    this.render();
  }
  render() {
    this.labelUnitArr.forEach(unit => unit.remove());
    this.labelUnitArr = [];
    // 是否已到第三行最后
    let stopRender = false;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rebuild = true;
    let currentLine = 1;
    let lineRemainWidth = Math.max(this.parentWidth, UNIT_MIN_WIDTH);
    // 还剩下的label unit的数目
    let remainLabelsCount = this._labels.length;
    this._labels.forEach((label, index) => {
      if (stopRender) {
        return false;
      }
      // remove work break in label string
      label = label.replace(/\n|\r/g, '');
      const strWidth = Object(utils.getTextSize)(label, labelFontStyleInfo).width;
      let unitWidth = strWidth + UNIT_PADDING_HORIZON * 2;
      if (unitWidth > this.parentWidth) {
        unitWidth = this.parentWidth;
      }
      if (unitWidth < UNIT_MIN_WIDTH) {
        unitWidth = UNIT_MIN_WIDTH;
      }
      // 根据计算处的unit宽度，对文本进行裁剪
      let unitStr = Object(utils.wrapTextWithEllipsis)(label, labelFontStyleInfo, unitWidth - UNIT_PADDING_HORIZON * 2);
      // 若剩下的宽度不支持再放一个unit进去，换行
      if (
        lineRemainWidth - UNIT_MARGIN_HORIZON < unitWidth &&
        lineRemainWidth !== unitWidth &&
        lineRemainWidth !== this.parentWidth
      ) {
        currentLine = currentLine + 1;
        lineRemainWidth = Math.max(this.parentWidth, UNIT_MIN_WIDTH);
      }
      // 是否是特殊单元，特殊单元就是最后显示还剩几个unit没显示的单元
      let isSpecialUnit = false;
      // 若已经到第三行了，还有剩下到label渲染不了，则显示特殊unit，记录flag，结束渲染
      if (
        currentLine === 3 &&
        remainLabelsCount > 1 &&
        SPECIAL_UNIT_PREFER_WIDTH + UNIT_MARGIN_HORIZON + unitWidth > lineRemainWidth
      ) {
        stopRender = true;
        isSpecialUnit = true;
        unitStr = `${remainLabelsCount}+`;
        // 替换labelString为剩余所有unit string的拼接
        label = [...this._labels].splice(index).join(', ');
        unitWidth = Object(utils.getTextSize)(unitStr, labelFontStyleInfo).width + UNIT_PADDING_HORIZON * 2;
      }
      const labelUnitView = new LabelUnitView(label, unitStr, unitWidth, this, isSpecialUnit);
      this.labelUnitArr.push(labelUnitView);
      labelUnitView.move(
        Math.max(this.parentWidth, UNIT_MIN_WIDTH) - lineRemainWidth,
        (currentLine - 1) * (UNIT_HEIGHT + UNIT_MARGIN_VERTICAL)
      );
      lineRemainWidth = lineRemainWidth - unitWidth - UNIT_MARGIN_HORIZON;
      remainLabelsCount = remainLabelsCount - 1;
    });
    // 若父元素宽度大于label unit最小宽度，则label的bounds宽度是等于父元素的宽度的
    // 否则bounds宽度以label unit最小宽度为准，父topic的bounds也要做对应修改
    const width = (this.bounds.width = Math.max(this.parentWidth, UNIT_MIN_WIDTH));
    const height = (this.bounds.height = currentLine * UNIT_HEIGHT + (currentLine - 1) * UNIT_MARGIN_VERTICAL);
    this.figure.setSize({
      width,
      height,
    });
    return this;
  }
  move(x, y) {
    this.figure.setPosition({
      x,
      y,
    });
  }
  getSvg() {
    return this.s$labelsCardGroup;
  }
  remove() {
    this.stopListening();
    this.labelUnitArr.forEach(unit => unit.remove());
    this.labelUnitArr = [];
    this.figure.dispose();
    this.parent(null);
    return this;
  }
}

export default LabelsView;

export class LabelUnitView extends SvgComponentView {
  figure: any;
  originLabel: any;
  isSpecialUnit: any;
  s$labelUnitGroup: any;
  s$labelUnitbackgound: any;
  s$labelUnitText: any;
  constructor(label, unitStr, unitWidth, labelsView, isSpecialUnit) {
    super();
    this.figure = figures.createFigure(this);
    this.parent(labelsView);
    this.originLabel = label;
    this.isSpecialUnit = isSpecialUnit;
    this.s$labelUnitGroup = this.figure.getContent();
    this.s$labelUnitbackgound = this.figure.renderWorker.s$labelUnitbackgound;
    this.s$labelUnitText = this.figure.renderWorker.s$labelUnitText;
    this.figure.setText(unitStr);
    this.figure.setTooltip(label);
    this.figure.setSize({
      width: unitWidth,
      height: UNIT_HEIGHT,
    });
  }
  get type() {
    return VIEW_TYPE.LABELUNIT;
  }
  get figureType() {
    return FIGURE_TYPE.LABEL;
  }
  move(x, y) {
    this.figure.setPosition({
      x,
      y,
    });
  }
  getSvg() {
    return this.s$labelUnitGroup;
  }
  remove() {
    this.stopListening();
    this.figure.dispose();
    this.parent(null);
    return this;
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
import styleManager from "../utils/business/stylemanager/index";
import WorkbookComponentView from "./workbookcomponentview";
import { VIEW_TYPE, STYLE_KEYS, FIGURE_TYPE } from "../common/constants/index";
import figures from "../figures/index";
const { NOTE, TASK, COMMENT, HREF, ATTACHMENT, AUDIO, JUMP, INFO_MORE, FILE } =
  VIEW_TYPE;
// SVG.Text 不支持 css 插入 content, 以下 content 对应 ./cssjs/headstyle.js
const mapIconToTextContent = {
  [HREF]: "",
  [FILE]: "",
  [JUMP]: "",
  [ATTACHMENT]: "",
  [AUDIO]: "",
  [COMMENT]: "",
  [INFO_MORE]: "",
  [NOTE]: "",
  [TASK]: "",
};
const getIcon = (dataMap) => {
  const keys = Object.keys(dataMap);
  if (keys.length > 1) {
    return INFO_MORE;
  } else {
    const key = keys[0];
    const info = dataMap[key];
    const type = getIconType(info, key);
    return type;
  }
  function getIconType(info, key) {
    const mapTypeToIcon = {
      notesInfo: NOTE,
      taskInfo: TASK,
      commentsInfo: COMMENT,
      audioNotesInfo: AUDIO,
    };
    if (key === "hrefInfo") {
      const srcProtocol = info.split(":")[0];
      if (srcProtocol === "file") {
        return FILE;
      } else if (srcProtocol === "xap") {
        return ATTACHMENT;
      } else if (srcProtocol === "xmind") {
        return JUMP;
      } else {
        return HREF;
      }
    } else {
      return mapTypeToIcon[key];
    }
  }
};
const getTopicFontSize = (topicView) => {
  const branch = topicView.parent();
  const fontSize =
    styleManager.getStyleValue(branch, STYLE_KEYS.FONT_SIZE) || 0;
  return Number.parseInt(fontSize);
};
const getTopicTextColor = (topicView) => {
  const branch = topicView.parent();
  return styleManager.getStyleValue(branch, STYLE_KEYS.TEXT_COLOR);
};
export class InformationIconView extends WorkbookComponentView {
  _hovering: boolean;
  bounds: { x: number; y: number; width: number; height: number };
  iconType: any;
  figure: any;
  s$Group: any;
  s$Text: any;
  s$Select: any;
  iconSize: number;
  /**
   * TODO:
   * refactor
   * (1) need extract InformationData to somewhere
   * may be in topic model
   * for example: topic.getInfomationData(): InformationData
   * (2) may be just pass 'iconType' is enough
   */
  constructor(informationData) {
    super();
    this._hovering = false;
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    };
    this.iconType = getIcon(informationData);
    this.figure = figures.createFigure(this);
    this.s$Group = this.figure.getContent();
    this.s$Text = this.figure.renderWorker.s$Text;
    this.s$Select = this.figure.renderWorker.s$Select;
    this._hovering = false;
  }
  get type() {
    return VIEW_TYPE.INFORMATION_ICON;
  }
  get figureType() {
    return FIGURE_TYPE.INFORMATION;
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  afterAncestorChange() {
    if (!this.getContext()) {
      return;
    }
    const { iconType } = this;
    this.figure.setTextContent(mapIconToTextContent[iconType]);
    this.refreshSkeletonStyles();
    this.refreshColorStyles();
    this.initEventsListener();
  }
  initEventsListener() {
    super.initEventsListener();
    this.addReaction(
      () => {
        let _a;
        if ((_a = this.parent()) === null || _a === undefined) {
          return undefined;
        } else {
          return _a.figure.textColor;
        }
      },
      () => this.refreshColor(),
    );
  }
  refreshColorStyles() {
    this.refreshColor();
  }
  refreshSkeletonStyles() {
    this.refreshSize();
  }
  refreshSize() {
    const parent = this.parent();
    if (!parent) {
      return;
    }
    const iconSize = getTopicFontSize(parent) + 2;
    this.iconSize = iconSize;
    this.figure.setSize({
      width: iconSize,
      height: iconSize,
    });
    this.bounds = {
      x: 0,
      y: 0,
      width: iconSize,
      height: iconSize,
    };
  }
  refreshColor() {
    const parent = this.parent();
    if (!parent) {
      return;
    }
    this.figure.setTextAttr({
      fill: parent.figure.textColor,
    });
  }
  getSvg() {
    return this.s$Group;
  }
  remove() {
    this.stopListening();
    this.figure.dispose();
    this.parent(null);
    this.clearReactions();
    return this;
  }
  move(x, y) {
    this.figure.setPosition({
      x,
      y,
    });
    //  this.getSvg().translate(x, y)
  }
  refreshStyles() {
    this.refreshColorStyles();
    this.refreshSkeletonStyles();
  }
  getBranchView() {
    let _a;
    if ((_a = this.parent()) === null || _a === undefined) {
      return undefined;
    } else {
      return _a.parent();
    }
  }
}

export default InformationIconView;

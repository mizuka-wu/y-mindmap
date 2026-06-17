import styleManager from "../utils/business/stylemanager/index";
import {
  VIEW_TYPE,
  FIGURE_TYPE,
  CLASS_TYPE,
  STYLE_KEYS,
  EVENTS,
} from "../common/constants/index";
import TextView from "./textview";
import * as pointutils from "../utils/pointutils";
import BranchView from "./branchview";

const RefreshTextAlignByAlignmentByLevel = (target) => {
  return class extends target {
    afterAncestorChange() {
      super.afterAncestorChange();
      this.initRefreshTextAlignInfoListener();
    }
    initRefreshTextAlignInfoListener() {
      let _a;
      const parentBranchView =
        (_a = this.parent()) === null || _a === undefined
          ? undefined
          : _a.parent();
      if (!(parentBranchView instanceof BranchView)) {
        return;
      }
      this.listenTo(parentBranchView, "afterRealPosChange", () => {
        const isAlignmentByLevelMode =
          this.getContext().isAlignmentByLevelMode();
        if (!isAlignmentByLevelMode) {
          return;
        }
        this.refreshTextAlignInfo();
      });
      this.listenTo(
        this.getContext(),
        EVENTS.ALIGNMENT_BY_LEVEL_STATUS_CHANGED,
        () => {
          this.refreshTextAlignInfo();
        },
      );
    }
    refreshTextAlignInfo() {
      let _a;
      const parentBranchView =
        (_a = this.parent()) === null || _a === undefined
          ? undefined
          : _a.parent();
      if (parentBranchView instanceof BranchView) {
        this.figure.setTextAlign(
          styleManager.getStyleValue(parentBranchView, STYLE_KEYS.TEXT_ALIGN),
        );
      }
    }
  } as unknown as typeof target;
};

@RefreshTextAlignByAlignmentByLevel
export class TitleView extends TextView {
  fontInfo: any;
  bounds: { x: number; y: number; width: number; height: number };
  figure: any;
  get type() {
    return VIEW_TYPE.TOPIC_TITLE;
  }
  get figureType() {
    return FIGURE_TYPE.TOPIC_TITLE;
  }
  parent(parent?: any) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  afterAncestorChange() {
    const parent = this.parent();
    if (!parent) {
      return;
    }
    const branch = parent.parent();
    this.fontInfo = styleManager.getFontInfo(branch) || {};
    const topicModel = parent.model;
    this.setText(topicModel.get("title") || "");
    super.afterAncestorChange();
    this.initEventsListener();
  }
  protectedHandleText(text) {
    const parent = this.parent();
    if (!parent) {
      return text;
    }
    // hide topic title when topic has image or math jax view
    const hasImageModel = parent.model.getImageModel();
    const hasMathJaxData = parent.model.getMathJaxInfo();
    if (text === "" && (hasImageModel || hasMathJaxData)) {
      // Chrome floor rounds the line-height when rendering text.
      // We do the same to make TextArea look the same as the topic.
      const lineHeight = Math.floor(
        parseInt(this.fontInfo.fontSize || 0) * 1.34,
      );
      // Ray: little trick, 假设了以中心点为基准，
      // 设置 width 为 -10 是为了消除 grid padding 带来的影响
      this.bounds = {
        x: 0,
        y: lineHeight / 2,
        width: -10,
        height: 0,
      };
      return "";
    }
    const branch = parent.parent();
    if (styleManager.getClassName(branch) === CLASS_TYPE.SUB_TOPIC && !text) {
      // 对于无内容的sub topic，添加一个空内容text以设置最小宽度，这个最小宽度具体值比较迷，目前是4个空格宽
      text = "    ";
    }
    return text;
  }
  getSvg() {
    return this.figure.getContent();
  }
  getTextVectorPosition() {
    let _a;
    let _b;
    let _c;
    let _d;
    const parentBranchRealPosition =
      (_b =
        (_a = this.parent()) === null || _a === undefined
          ? undefined
          : _a.parent()) === null || _b === undefined
        ? undefined
        : _b.getRealPosition();
    const textVectorPosition = pointutils.add(
      (_c = this.parent()) === null || _c === undefined
        ? undefined
        : _c.figure.topicContentPosition,
      pointutils.add(
        this.figure.textPosition,
        (_d = this.parent()) === null || _d === undefined
          ? undefined
          : _d.figure.topicInnerElementPosition,
      ),
    );
    return pointutils.add(parentBranchRealPosition, textVectorPosition);
  }
  getClientRect() {
    const clientPosition = this.getContext()
      .getSVGView()
      .getCoordinateTransfer()
      .mindMapToViewport(this.getRealPosition());
    const textSize = this.figure.size;
    return Object.assign(Object.assign({}, clientPosition), textSize);
  }
}

export default TitleView;

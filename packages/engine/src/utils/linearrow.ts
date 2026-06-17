import * as lib from "../lib/index";
import * as constants from "../common/constants/index";
import RelationshipView from "../view/relationshipview";
import ConnectionView from "../view/connectionview";
import BranchView from "../view/branchview";
import { reaction } from "mobx";
import { BaseEvent } from "../common/utils/base-event";
import * as branchUtils from "./branch";

function newArrow(n) {
  return Object.assign({}, BaseArrow, n);
}
const BaseArrow = {
  width: 8,
  height: 8,
  startD: "",
  startRefX: 5,
  startRefY: 4,
  endD: "",
  endRefX: 5,
  endRefY: 4,
  tip: 0,
  needFill: false,
  strokeWidth: 1,
  arrowSizeRatio: 4,
  arrowCenter: 4,
  select(where) {
    if (where === "start") {
      return [this.startD, this.startRefX, this.startRefY];
    } else if (where === "end") {
      return [this.endD, this.endRefX, this.endRefY];
    }
  },
  createMarker(svgDoc, where) {
    const [d, refX, refY] = this.select(where);
    const marker = svgDoc.marker(this.width, this.height).ref(refX, refY);
    const strokeWidth = this.needFill ? 0 : this.strokeWidth;
    const markerPath = new lib.SVG.Path().attr({
      d: d,
      "stroke-width": strokeWidth,
      "stroke-dasharray": "none",
    }); //Fix bug in safari, marker will inherit the stroke-dasharray attribute
    if (!this.needFill) {
      markerPath.attr("stroke", "");
    }
    marker.add(markerPath);
    return marker;
  },
};
const eyeShape =
  "M 4 1.5 a 2.5 2.5 0 1 0 0.01 0ZM 4 2.5a 1.5 1.5 0 1 1 -0.01 0ZM 4 3A 1 1 0 1 1 4 5A 1 1 0 1 1 4 3 Z";
const squareRingShape =
  "M 4 2 L 6 4 L 4 6 L 2 4 L 4 2 Z M 3.65 3.65 L 4.35 4.35";
//箭头在起点时指向左边。
//箭头在末端时指向右边。
//tip在线和箭头的接合处比较好。
const _markerMaps = {
  [constants.ARROW_CLASS.NONE]: BaseArrow,
  /** @deprecated */
  [constants.ARROW_CLASS.NORMAL]: newArrow({
    startD: "M 6 2 L 2 4 L 6 6",
    endD: "M 2 2 L 6 4 L 2 6",
    startRefX: 5,
    endRefX: 3,
    tip: 4,
  }),
  [constants.ARROW_CLASS.TRIANGLE]: newArrow({
    startD: "M 4 0 L 0 2 L 4 4 Z",
    endD: "M 0 0 L 4 2 L 0 4 Z",
    startRefX: 4,
    startRefY: 2,
    endRefX: 0,
    endRefY: 2,
    tip: 4,
    arrowCenter: 2,
    needFill: true,
  }),
  [constants.ARROW_CLASS.SPEARHEAD]: newArrow({
    startD: "M 4 0 L 0 2 L 4 4 L 3 2 L 4 0 Z",
    endD: "M 0 0 L 4 2 L 0 4 L 1 2 L 0 0 Z",
    startRefX: 3,
    startRefY: 2,
    endRefX: 1,
    endRefY: 2,
    tip: 3,
    arrowCenter: 2,
    needFill: true,
  }),
  [constants.ARROW_CLASS.DOT]: newArrow({
    startD: "M 4 2 A 2 2 0 1 1 4 6 A 2 2 0 1 1 4 2 Z",
    endD: "M 4 2 A 2 2 0 1 1 4 6 A 2 2 0 1 1 4 2 Z",
    startRefX: 6,
    endRefX: 2,
    tip: 4,
    needFill: true,
  }),
  [constants.ARROW_CLASS.SQUARE]: newArrow({
    startD: "M 0 0 L 4 0 L 4 4 L 0 4 Z",
    endD: "M 0 0 L 4 0 L 4 4 L 0 4 Z",
    startRefX: 4,
    startRefY: 2,
    endRefX: 0,
    endRefY: 2,
    tip: 4,
    arrowCenter: 2,
    needFill: true,
  }),
  [constants.ARROW_CLASS.DIAMOND]: newArrow({
    startD: "M 1.5 4 L 4 2 L 6.5 4 L 4 6 Z",
    endD: "M 1.5 4 L 4 2 L 6.5 4 L 4 6 Z",
    startRefX: 4.5,
    endRefX: 2.5,
    tip: 3.5,
    needFill: true,
  }),
  [constants.ARROW_CLASS.HERRINGBONE]: newArrow({
    startD: "M 2 2 L 3 4 L 2 6 M 4 2 L 5 4 L 4 6 M 6 2 L 7 4 L 6 6 M 3 4 L 7 4",
    endD: "M 3 2 L 2 4 L 3 6 M 5 2 L 4 4 L 5 6 M 7 2 L 6 4 L 7 6 M 2 4 L 6 4",
    startRefX: 7,
    endRefX: 2,
    tip: 5,
  }),
  [constants.ARROW_CLASS.DOUBLEARROW]: newArrow({
    startD: "M 2 4 L 5 2 L 5 6 Z M 4 4 L 6.5 2.5 L 6.5 5.5 Z",
    endD: "M 6 4 L 3 2 L 3 6 Z M 4 4 L 1.5 2.5 L 1.5 5.5 Z",
    startRefX: 6.5,
    endRefX: 1.5,
    tip: 4.5,
    needFill: true,
  }),
  [constants.ARROW_CLASS.RING]: newArrow({
    startD: "M 4 2 A 2 2 0 1 1 4 6 A 2 2 0 1 1 4 2 Z",
    endD: "M 4 2 A 2 2 0 1 1 4 6 A 2 2 0 1 1 4 2 Z",
    startRefX: 6,
    endRefX: 2,
    tip: 4.5,
    needFill: false,
  }),
  [constants.ARROW_CLASS.EYE]: newArrow({
    startD: eyeShape,
    endD: eyeShape,
    startRefX: 6,
    endRefX: 2,
    tip: 4.5,
    needFill: true,
  }),
  [constants.ARROW_CLASS.SQUARERING]: newArrow({
    startD: squareRingShape,
    endD: squareRingShape,
    startRefX: 6,
    endRefX: 2,
    tip: 4.5,
    needFill: false,
  }),
  [constants.ARROW_CLASS.ANTITRIANGLE]: newArrow({
    startD: "M 2 2 L 6 4 L 2 6 Z",
    endD: "M 6 2 L 2 4 L 6 6 Z",
    startRefX: 5,
    endRefX: 3,
    tip: 5,
    needFill: true,
  }),
  [constants.ARROW_CLASS.ATTACHED]: newArrow({
    startD: "M 3 1 L 4 1 L 4 5 L 3 5 Z",
    endD: "M 3 1 L 4 1 L 4 5 L 3 5 Z",
    startRefX: 4,
    endRefX: 3,
    startRefY: 3,
    endRefY: 3,
    tip: 3,
    needFill: true,
  }),
  [constants.ARROW_CLASS.HOOK]: newArrow({
    startD: "M 0 3 L 6 0 L 5.5 3 Z",
    endD: "M 0 0 L 6 3 L 0.5 3 Z",
    startRefX: 6,
    endRefX: 0,
    startRefY: 2.5,
    endRefY: 2.5,
    tip: 6,
    needFill: true,
  }),
};
const markerMaps = (key) => {
  if (!_markerMaps[key]) {
    return _markerMaps[constants.ARROW_CLASS.TRIANGLE];
  }
  return _markerMaps[key];
};
export class ArrowSelector extends BaseEvent {
  beginArrowClass: string;
  endArrowClass: string;
  reactions: any[];
  targetView: any;
  s$targetPath: any;
  s$beginArrow: any;
  s$endArrow: any;
  constructor(targetView, s$targetPath) {
    super();
    this.beginArrowClass = constants.ARROW_CLASS.NONE;
    this.endArrowClass = constants.ARROW_CLASS.NONE;
    this.reactions = [];
    this.targetView = targetView;
    this.s$targetPath = s$targetPath;
    this.initEventListener();
  }
  static getTip(type) {
    return markerMaps(type).tip;
  }
  static getArrowStaticInfo(type) {
    return markerMaps(type);
  }
  getBeginArrowDomInfo() {
    return {
      s$SVG: this.s$beginArrow,
      arrowClass: this.beginArrowClass,
    };
  }
  getEndArrowDomInfo() {
    return {
      s$SVG: this.s$endArrow,
      arrowClass: this.endArrowClass,
    };
  }
  initEventListener() {
    const targetView = this.targetView;
    this.reactions.push(
      Object(reaction)(
        () => targetView.figure.lineColor,
        () => this.refreshArrowColor(),
      ),
    );
    if (targetView instanceof RelationshipView) {
      this.reactions.push(
        Object(reaction)(
          () => targetView.figure.beginArrowClass,
          () => this.refreshBeginArrowClass(),
        ),
      );
    }
    this.reactions.push(
      Object(reaction)(
        () => targetView.figure.endArrowClass,
        () => this.refreshEndArrowClass(),
      ),
    );
    if (
      targetView instanceof ConnectionView &&
      !Object(branchUtils.isSummaryBranch)(targetView.parent())
    ) {
      const startBranchView = targetView.parent().parent();
      if (!(startBranchView instanceof BranchView)) {
        return;
      }
      const rootBranchView = startBranchView
        .getContext()
        .getSheetView()
        .getCentralBranchView();
      this.refreshBeginArrowClassForBraceLine();
      this.listenTo(
        startBranchView.model,
        "addTopic removeTopic structureClassChanged",
        () => {
          this.refreshBeginArrowClassForBraceLine();
        },
      );
      if (startBranchView !== rootBranchView) {
        this.listenTo(rootBranchView.model, "structureClassChanged", () => {
          this.refreshBeginArrowClassForBraceLine();
        });
      }
      this.reactions.push(
        Object(reaction)(
          () => targetView.figure.endArrowClass,
          () => this.refreshBeginArrowClassForBraceLine(),
        ),
      );
      this.reactions.push(
        Object(reaction)(
          () => targetView.figure.lineShape,
          () => this.refreshBeginArrowClassForBraceLine(),
        ),
      );
    }
  }
  refreshBeginArrowClass() {
    let _a;
    const targetView = this.targetView;
    if (!(targetView instanceof RelationshipView)) {
      return;
    }
    const arrowClass = targetView.figure.beginArrowClass;
    if (this.beginArrowClass === arrowClass) {
      return;
    }
    this.beginArrowClass = arrowClass;
    if ((_a = this.s$beginArrow) === null || _a === undefined) {
      // do nothing
    } else {
      _a.remove();
    }
    this.s$beginArrow = this._createMarker(arrowClass, "start");
    this._refreshArrowColor(this.getBeginArrowDomInfo());
  }
  refreshBeginArrowClassForBraceLine() {
    let _a;
    let _b;
    let _c;
    let _d;
    let _e;
    const lineShape = this.targetView.figure.lineShape;
    if (!Object.values(constants.BRACE_BRANCH_CONNECTION).includes(lineShape)) {
      this.beginArrowClass = constants.ARROW_CLASS.NONE;
      if ((_a = this.s$beginArrow) === null || _a === undefined) {
        // do nothing
      } else {
        _a.remove();
      }
      return;
    }
    if (!(this.targetView.parent() instanceof BranchView)) {
      return;
    }
    const startBranchView = this.targetView.parent().parent();
    const children = startBranchView.model.children();
    if (children.length === 1) {
      const startBranchStructure = startBranchView.getStructureClass();
      const arrowClass = this.targetView.figure.endArrowClass;
      this.beginArrowClass = arrowClass;
      if ((_b = this.s$beginArrow) === null || _b === undefined) {
        // do nothing
      } else {
        _b.remove();
      }
      this.s$beginArrow = this._createMarker(arrowClass, "start");
      if (startBranchStructure === constants.STRUCTURECLASS.BRACERIGHT) {
        if ((_c = this.s$beginArrow) === null || _c === undefined) {
          // do nothing
        } else {
          _c.attr("orient", "180deg");
        }
      } else if ((_d = this.s$beginArrow) === null || _d === undefined) {
        // do nothing
      } else {
        _d.attr("orient", "0deg");
      }
      this._refreshArrowColor(this.getBeginArrowDomInfo());
    } else if ((_e = this.s$beginArrow) === null || _e === undefined) {
      // do nothing
    } else {
      _e.remove();
    }
  }
  refreshEndArrowClass() {
    let _a;
    const arrowClass = this.targetView.figure.endArrowClass;
    if (this.endArrowClass === arrowClass) {
      return;
    }
    this.endArrowClass = arrowClass;
    if ((_a = this.s$endArrow) === null || _a === undefined) {
      // do nothing
    } else {
      _a.remove();
    }
    this.s$endArrow = this._createMarker(arrowClass, "end");
    this._refreshArrowColor(this.getEndArrowDomInfo());
  }
  refreshArrowColor() {
    this._refreshArrowColor(this.getBeginArrowDomInfo());
    this._refreshArrowColor(this.getEndArrowDomInfo());
  }
  _refreshArrowColor(arrowDomInfo) {
    if (
      !arrowDomInfo.s$SVG ||
      arrowDomInfo.arrowClass === constants.ARROW_CLASS.NONE
    ) {
      return;
    }
    const arrowStaticInfo = ArrowSelector.getArrowStaticInfo(
      arrowDomInfo.arrowClass,
    );
    const strokeColor = this.targetView.figure.lineColor;
    const fillColor = arrowStaticInfo.needFill ? strokeColor : "none";
    // arrowDomInfo.s$SVG.node.clientWidth;
    arrowDomInfo.s$SVG.attr({
      stroke: strokeColor,
      fill: fillColor,
    });
  }
  _createMarker(type, where) {
    const chosen = markerMaps(type);
    const marker = chosen.createMarker(this.targetView.editDomain().svg, where);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [d, refX, refY] = chosen.select(where);
    marker.ref(refX, refY);
    this.s$targetPath.marker(where, marker);
    return marker;
  }
  dispose() {
    let _a;
    let _b;
    if ((_a = this.s$beginArrow) === null || _a === undefined) {
      // do nothing
    } else {
      _a.remove();
    }
    if ((_b = this.s$endArrow) === null || _b === undefined) {
      // do nothing
    } else {
      _b.remove();
    }
    this.reactions.forEach((disposer) => disposer());
    this.stopListening();
  }
  // stopListening() {
  //   throw new Error('Method not implemented.');
  // }
}

import {
  TOPIC_TYPE,
  MATRIX_GROUP_LIST,
  STRUCTURECLASS,
  VIEW_TYPE,
  TREE_TABLE_GROUP_LIST,
  HAND_DRAWN_FILL_PATTERN,
  LINE_PATTERN,
  FILL_PATTERN,
  DEFAULT_STRUCTURE,
  DIRECTION,
  STYLE_KEYS,
  TEXTTRANSFORM,
  CONFIG,
  CLASS_TYPE,
  SIMILAR_STRUCTURE_MAP,
  TOPICSHAPE,
  MASTER_RANGE,
} from "../common/constants/index";

import * as syntaxUtils from "../common/utils/syntax";

import * as lib from "../lib/index";

import { getLineEndSpacingPatchGap } from "./line";

import jquery from "jquery";

import mommonFuncs from "../mommonfuncs";

import styleManager from "./business/stylemanager/index";

import * as boundUtils from "./boundutils";

import * as baseUtil from "./baseutil";
import { getTopicShape as originGetTopicShape } from "../figures/renderengine/svg/topicshapes/index";
import BranchView from "../view/branchview";
import AbstractFixedAspectRatioTopicShape from "../figures/renderengine/svg/topicshapes/abstractfixedaspectratiotopicshape";
import { AbstractSymbolLikeTopicShape } from "../figures/renderengine/svg/topicshapes/abstractsymbolliketopicshape";

import Util from "../util";

import * as commonUtils from "../common/utils/index";

import { parseTopic } from "./business/parsetopic";
import TopicView from "../view/topicview";

export function isBranch(branchView) {
  return branchView instanceof BranchView;
}
export function isAttachedBranch(branchView) {
  return (
    isBranch(branchView) &&
    topicTypeOfBranch(branchView) === TOPIC_TYPE.ATTACHED
  );
}
export function isDetachedBranch(branchView) {
  return (
    isBranch(branchView) &&
    topicTypeOfBranch(branchView) === TOPIC_TYPE.DETACHED
  );
}
export function isSummaryBranch(branchView) {
  return (
    isBranch(branchView) && topicTypeOfBranch(branchView) === TOPIC_TYPE.SUMMARY
  );
}
export function isCalloutBranch(branchView) {
  return (
    isBranch(branchView) && topicTypeOfBranch(branchView) === TOPIC_TYPE.CALLOUT
  );
}
export function isRootBranch(branchView) {
  return (
    isBranch(branchView) && topicTypeOfBranch(branchView) === TOPIC_TYPE.ROOT
  );
}
export function isMatrixMainBranch(branchView) {
  if (!isBranch(branchView)) {
    return false;
  }
  const structure = branchView.getStructureClass();
  return MATRIX_GROUP_LIST.includes(structure);
}
export function isMatrixCell(target) {
  const isMatrixBranch = (branchView) => {
    const structure = branchView.getStructureClass();
    return (
      structure === STRUCTURECLASS.COLUMNSPREADSHEET ||
      structure === STRUCTURECLASS.SPREADSHEET
    );
  };
  const isMatrixCellHeadBranch = (branchView) => {
    const structure = branchView.getStructureClass();
    return (
      structure === STRUCTURECLASS.SPREADSHEETROW ||
      structure === STRUCTURECLASS.SPREADSHEETCOLUMN
    );
  };
  const iter = (branchView, n) => {
    if (!branchView) {
      return false;
    }
    if (branchView.type !== VIEW_TYPE.BRANCH) {
      return false;
    }
    if (isMatrixBranch(branchView)) {
      return !branchView.model.isCollapse();
    } else if (n === 1 && isMatrixCellHeadBranch(branchView)) {
      return true;
    }
    if (n === 0 || branchView.model.type() === TOPIC_TYPE.DETACHED) {
      return false;
    } else {
      return iter(branchView.parent(), n - 1);
    }
  };
  return iter(target, 2);
}
export function isInMatrixCell(target) {
  if (isMatrixCell(target)) {
    return true;
  }
  let parent = target.parent();
  while (parent instanceof BranchView) {
    if (isMatrixCell(parent)) {
      return true;
    }
    parent = parent.parent();
  }
  return false;
}
export function getTopicShape(target) {
  const shapeClass = target.topicView.getShapeStyle();
  return originGetTopicShape(shapeClass);
}
export function isTimeline(branchView) {
  return branchView.getStructureClass().includes("timeline");
}
export function isChildOfTimelineBranch(branchView) {
  const parent = branchView.parent();
  return !!parent && parent.type === VIEW_TYPE.BRANCH && isTimeline(parent);
}
export function isFishBoneHead(branchView) {
  const structure = branchView.getStructureClass();
  return (
    structure === STRUCTURECLASS.FISHBONELEFTHEADED ||
    structure === STRUCTURECLASS.FISHBONERIGHTHEADED
  );
}
export function isFishBoneMainBone(branchView) {
  const structure = branchView.getStructureClass();
  return (
    structure === STRUCTURECLASS.LEFTHEADTOPBONE ||
    structure === STRUCTURECLASS.LEFTHEADBOTTOMBONE ||
    structure === STRUCTURECLASS.RIGHTHEADTOPBONE ||
    structure === STRUCTURECLASS.RIGHTHEADBOTTOMBONE
  );
}
export function isFixedAspectShapeBranch(target) {
  return getTopicShape(target) instanceof AbstractFixedAspectRatioTopicShape;
}
export function isSymbolLikeShapeBranch(target) {
  return getTopicShape(target) instanceof AbstractSymbolLikeTopicShape;
}
export function isTimeLineMainBranch(target) {
  const parentBranchView = target.parent();
  if (!(parentBranchView instanceof BranchView)) {
    return false;
  }
  if (!isCentralBranch(parentBranchView)) {
    return false;
  }
  const structrueClass = parentBranchView.getStructureClass();
  return [
    STRUCTURECLASS.TIMELINEHORIZONTAL,
    STRUCTURECLASS.TIMELINETHROUGHVERTICAL,
    STRUCTURECLASS.TIMELINESIDEDHORIZONTAL,
  ].includes(structrueClass);
}
export function isTreeTableCell(target) {
  const iter = (branchView, n) => {
    if (!branchView) {
      return false;
    }
    if (!isBranch(branchView)) {
      return false;
    }
    if (isTreeTableStructure(branchView)) {
      return true;
    }
    if (n === 0 || branchView.model.type() === TOPIC_TYPE.DETACHED) {
      return false;
    }
    return iter(branchView.parent(), n - 1);
  };
  return iter(target, 1);
}
export function isTreeTableStructure(branchView) {
  const structure = branchView.getStructureClass();
  return TREE_TABLE_GROUP_LIST.includes(structure);
}
export function isTreeTableHeadBranch(target) {
  if (!isBranch(target)) {
    return false;
  }
  if (!isTreeTableStructure(target)) {
    return false;
  }
  if (isDetachedBranch(target)) {
    return true;
  }
  const targetParentBranchView = target.parent();
  if (!isBranch(targetParentBranchView)) {
    return true;
  }
  return !isTreeTableStructure(targetParentBranchView);
}
export function isInTreeTableCell(target) {
  if (!isBranch(target)) {
    return false;
  }
  if (isTreeTableStructure(target)) {
    return true;
  }
  if (isDetachedBranch(target)) {
    return false;
  }
  const parentBranchView = target.parent();
  if (!(parentBranchView instanceof BranchView)) {
    return false;
  }
  return isInTreeTableCell(parentBranchView);
}
export function isSingleItemTreeTableCell(target) {
  return (
    isTreeTableCell(target) &&
    (!!isTreeTableStructure(target) || !!target.shouldCollapse())
  );
}
export function getTreeTableHeadBranchView(branchView) {
  if (!isBranch(branchView)) {
    return null;
  }
  if (isTreeTableHeadBranch(branchView)) {
    return branchView;
  } else {
    return getTreeTableHeadBranchView(branchView.parent());
  }
}
export function topicTypeOfBranch(branchView) {
  return branchView.model.type();
}
export function isDescendantOfDetachedBranch(branchView) {
  if (isRootBranch(branchView)) {
    return false;
  }
  const parent = branchView.parent();
  if (!parent) {
    return false;
  }
  if (isDetachedBranch(parent)) {
    return true;
  }
  if (isRootBranch(parent)) {
    return false;
  }
  return isDescendantOfDetachedBranch(parent);
}
export function branchIndex(branchView) {
  const parent = branchView.parent();
  if (isBranch(parent)) {
    const children = parent.getChildrenBranchesByType(
      topicTypeOfBranch(branchView),
    );
    return children.indexOf(branchView);
  }
  return -1;
}
export function isHandDrawnFillPattern(fillPattern) {
  return Object.values(HAND_DRAWN_FILL_PATTERN).includes(fillPattern);
}
export function isDashLinePattern(linePattern) {
  return [
    LINE_PATTERN.DASH,
    LINE_PATTERN.DASHDOT,
    LINE_PATTERN.DASHDOTDOT,
    LINE_PATTERN.DOT,
    LINE_PATTERN.HANDDRAWNDASH,
    LINE_PATTERN.ROUNDDOT,
  ].includes(linePattern);
}
export function isNoneFillPattern(fillPattern, fillColor) {
  return (
    fillPattern === FILL_PATTERN.NONE || fillColor === "none" || !fillColor
  );
}
export function isSolidFillPattern(fillPattern) {
  return [FILL_PATTERN.SOLID_HAND_DRAWN, FILL_PATTERN.SOLID].includes(
    fillPattern,
  );
}
export function isHandDrawnLinePattern(linePattern) {
  return [LINE_PATTERN.HANDDRAWNSOLID, LINE_PATTERN.HANDDRAWNDASH].includes(
    linePattern,
  );
} // TODO
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getStructureClass(branchView, AllStructures?) {
  const structureClass = branchView.model.getStructureClass();
  // Central Branch
  if (branchView.isCentralBranch()) {
    if (syntaxUtils.isDefined(structureClass)) {
      return structureClass;
    } else {
      return DEFAULT_STRUCTURE;
    }
  }
  const parent = branchView.parent();
  const parentStructureClass = getStructureClass(parent);
  const index = branchIndex(branchView);
  // TODO: Detached Branch
  if (isDetachedBranch(branchView)) {
    if (syntaxUtils.isDefined(structureClass)) {
      return structureClass;
    } else if (branchView.getPosition().x < 0) {
      return STRUCTURECLASS.LOGICLEFT;
    } else {
      return STRUCTURECLASS.LOGICRIGHT;
    }
  }
  // Callout Branch
  if (isCalloutBranch(branchView)) {
    if (!parent) {
      return STRUCTURECLASS.LOGICCHARTRIGHT;
    } else {
      return AllStructures(parentStructureClass).getCalloutStructure(
        parent,
        branchView,
      );
    }
  }
  // Summary Branch
  if (isSummaryBranch(branchView) && index !== -1) {
    const rangeStartIndex = parent.summaries[index].model.rangeStart;
    const direction = AllStructures(parentStructureClass).getSummaryDirection(
      parent,
      rangeStartIndex,
    );
    const _getStructByDir = (dir) => {
      switch (dir) {
        case DIRECTION.LEFT:
          return STRUCTURECLASS.LOGICLEFT;
        case DIRECTION.RIGHT:
          return STRUCTURECLASS.LOGICRIGHT;
        case DIRECTION.UP:
          return STRUCTURECLASS.ORGCHARTUP;
        case DIRECTION.DOWN:
          return STRUCTURECLASS.ORGCHARTDOWN;
        default:
          return "";
      }
    };
    return _getStructByDir(direction);
  }
  // Attached Branch
  if (syntaxUtils.isDefined(structureClass)) {
    const avaliableStructureClasses = AllStructures(
      parentStructureClass,
    ).getAvailableChildStructure(parent, branchView);
    if (avaliableStructureClasses.indexOf(structureClass) > -1) {
      return structureClass;
    }
  }
  return AllStructures(parentStructureClass).getChildStructure(
    parentStructureClass,
    index,
    parent,
  );
}
// todo move standin branch view to a new view class
export function standin(branchView, isAnimationStandIn) {
  // model create process can be simple
  const newModelData = syntaxUtils.deepClone(branchView.model.toJSON());
  newModelData.children = {};
  newModelData.summaries = [];
  newModelData.boundaries = [];
  newModelData.id = mommonFuncs.UUID();
  const sheetView = branchView.getContext().getSheetView();
  let standinTopicChanged = false;
  const standinModel = parseTopic(newModelData, sheetView.model);
  standinModel.topicChanged = () => {
    standinTopicChanged = true;
  };
  standinModel.parent(branchView.model.parent());
  standinModel.changeTitle(
    Util.getTransformedText(
      branchView.model.getTitle(),
      branchView.getTextClientStyle().textTransform,
    ),
  );
  standinModel.changeStyle(STYLE_KEYS.TEXT_TRANSFORM, TEXTTRANSFORM.MANUAL);
  standinModel.changeStyle(
    STYLE_KEYS.TEXT_ALIGN,
    styleManager.getStyleValue(branchView, STYLE_KEYS.TEXT_ALIGN),
  );
  if (branchView.model.type() !== TOPIC_TYPE.ROOT) {
    standinModel.setType(branchView.model.type());
  }
  let beforeStandinRemove = false;
  const newModel = new Proxy(standinModel, {
    get: function (target, key) {
      // Hijact topic type.
      if (key === "_type") {
        return branchView.model.type();
      }
      const v = target[key];
      const unsupportedFunctions = ["on", "once", "listenTo", "listenToOnce"];
      if (
        syntaxUtils.isFunction(v) &&
        !unsupportedFunctions.includes(key as any) &&
        !beforeStandinRemove
      ) {
        return function () {
          v.apply(branchView.model, arguments); // eslint-disable-line prefer-rest-params
          return v.apply(standinModel, arguments); // eslint-disable-line prefer-rest-params
        };
      }
      return v;
    },
  });
  const standinBranchView = new BranchView(newModel);
  standinBranchView.figure.setLayoutable(false, false);
  standinBranchView.originBranchView = branchView;
  const old_canInvalidateLayout = !branchView.figure.forbidInvalidateLayout;
  const old_canInvalidateLayoutParent =
    !branchView.figure.forbidInvalidateLayoutParent;
  const old_topic_canInvalidateLayout =
    !branchView.topicView.figure.forbidInvalidateLayout;
  const old_topic_canInvalidateLayoutParent =
    !branchView.topicView.figure.forbidInvalidateLayoutParent;
  const old_connectionForcedInvisible =
    branchView.getConnectionView().isForcedInvisible;
  const old_topicForcedInvisible = branchView.topicView.isForcedInvisible;
  branchView.figure.setLayoutable(false, false);
  branchView.topicView.setForcedInvisible(true);
  branchView.topicView.figure.setLayoutable(false, false);
  standinBranchView.tagCentralBranch(branchView.isCentralBranch());
  standinBranchView.topicView.figure.setForceAlignmentWidth(
    branchView.topicView.figure.forceAlignmentWidth,
  );
  standinBranchView.branchIndex = () => {
    return branchView.branchIndex();
  };
  standinBranchView.summaryIndex = () => {
    return branchView.summaryIndex();
  };
  standinBranchView.floatingIndex = () => {
    return branchView.floatingIndex();
  };
  // for tree table editing preformance
  let s$treeTableCellEditOverlay;
  let s$treeTableCellEditBg;
  let s$treeTableCellEditSelectBox;
  const isSingleItemTreeTableCell =
    isTreeTableCell(branchView) &&
    (isTreeTableStructure(branchView) || branchView.shouldCollapse()) &&
    (!isTreeTableHeadBranch(branchView) || !branchView.shouldCollapse());
  if (isSingleItemTreeTableCell) {
    s$treeTableCellEditOverlay = new lib.SVG.G().data(
      "name",
      "tree-table-editing-overlay",
    );
    s$treeTableCellEditBg = new lib.SVG.Path().data(
      "name",
      "tree-table-editing-bg",
    );
    s$treeTableCellEditSelectBox = new lib.SVG.Path()
      .data("name", "tree-table-editing-select-box")
      .attr({
        fill: "none",
        "stroke-width": "4",
      });
    s$treeTableCellEditOverlay.add(s$treeTableCellEditBg);
    s$treeTableCellEditOverlay.add(s$treeTableCellEditSelectBox);
    standinBranchView.figure.renderWorker.svg.put(s$treeTableCellEditOverlay);
  }
  standinBranchView.remove = () => {
    const shouldReLayoutTopic = branchView.topicView.titleView.figure.textDirty;
    beforeStandinRemove = true;
    branchView.figure.setLayoutable(
      old_canInvalidateLayout,
      old_canInvalidateLayoutParent,
      !shouldReLayoutTopic,
    );
    branchView.topicView.figure.setLayoutable(
      old_topic_canInvalidateLayout,
      old_topic_canInvalidateLayoutParent,
      !shouldReLayoutTopic,
    );
    branchView.remove.call(standinBranchView);
    branchView.topicView.setForcedInvisible(old_topicForcedInvisible);
    branchView
      .getConnectionView()
      .setForcedInvisible(old_connectionForcedInvisible);
    if (isSingleItemTreeTableCell) {
      branchView.getProxy().refreshCellSize();
    }
    if (standinTopicChanged && !isAnimationStandIn) {
      branchView.topicView.figure.invalidateLayout();
    }
    return branchView;
  };
  (standinBranchView as any).noSideEffect = (fn, ...args) => {
    beforeStandinRemove = true;
    fn.apply(standinBranchView, args);
    beforeStandinRemove = false;
  };
  const parent = branchView.parent();
  standinBranchView.parent(parent);
  standinBranchView.initView();
  //for show branch only mode.
  const atb = branchView
    .getContext()
    .getSheetView()
    .getActivatedTopBranchView();
  if (atb && atb === branchView) {
    standinBranchView.getConnectionView().figure.setPaintable(false);
  }
  Object.assign(standinBranchView.position, branchView.position);
  Object.assign(standinBranchView.bounds, branchView.bounds);
  Object.assign(standinBranchView.boundaryBounds, branchView.boundaryBounds);
  Object.assign(standinBranchView.realPosition, branchView.realPosition);
  standinBranchView.topicView._forcedMinTopicTitleBounds = Object.assign(
    {},
    branchView.topicView.titleView.bounds,
  );
  const standinImageView = standinBranchView.topicView.image;
  const imageView = branchView.topicView.image;
  if (standinImageView && imageView) {
    standinImageView.figure.setIgnoreLoading(true);
    standinImageView.setBounds(imageView.bounds);
  }
  standinBranchView.topicView.on("change:bounds", (newBounds) => {
    const oldBounds = branchView.topicView.bounds;
    const oldPosition = branchView.position;
    const p = {
      x: (newBounds.width - oldBounds.width) / 2 + oldPosition.x,
      y: (newBounds.height - oldBounds.height) / 2 + oldPosition.y,
    };
    standinBranchView.setPosition(p);
    standinBranchView.updateRealPosition();
    if (isSingleItemTreeTableCell) {
      if (!commonUtils.isSameSize(newBounds, oldBounds)) {
        standinBranchView.getProxy().updateCellSizeByEditing(newBounds);
      }
      const { size, selectBoxAttr } = standinBranchView.getProxy().figure;
      const d = `M ${0} ${0} l ${size.width} 0 l 0 ${size.height} l ${-size.width} 0 Z`;
      s$treeTableCellEditBg.attr("d", d);
      s$treeTableCellEditSelectBox.attr("d", d);
      const { cellX, cellY } = branchView.getLayoutInfo(
        getTreeTableHeadBranchView(branchView).getStructureClass(),
      ).externalInfo;
      const transX =
        cellX -
        (newBounds.width > oldBounds.width
          ? (newBounds.width - oldBounds.width) / 2
          : 0);
      const transY =
        cellY -
        (newBounds.height > oldBounds.height
          ? (newBounds.height - oldBounds.height) / 2
          : 0);
      s$treeTableCellEditBg.translate(transX, transY);
      s$treeTableCellEditSelectBox.translate(transX, transY).attr(
        Object.assign(Object.assign({}, selectBoxAttr), {
          display: "block",
        }),
      );
    }
  });
  standinBranchView.topicView.titleView.textSvg.node.setAttributeNS(
    null,
    "opacity",
    "0",
  );
  standinBranchView.topicView.titleView.forceCalcSize = true;
  // set background color as origin branch view
  // if origin branch view has no bg color, us sheet view's bg color
  // if sheet view's bg color is transparent too
  // use environment bg color, environment bg color is get from APPEARANCE_GETTER
  const appearanceGetter = branchView.config(CONFIG.APPEARANCE_GETTER);
  let appearanceBgColor;
  if (appearanceGetter) {
    const appearanceInfo = appearanceGetter();
    appearanceBgColor = appearanceInfo.backgroundColor;
  }
  let dummyBGColor = "#fff";
  const userStyle = styleManager.getStyleValue(
    branchView,
    STYLE_KEYS.FILL_COLOR,
  );
  if (branchView.topicView.figure.fillColor !== "none") {
    dummyBGColor = branchView.topicView.figure.fillColor;
  } else if (isSingleItemTreeTableCell && userStyle !== "none") {
    dummyBGColor = userStyle;
  } else if (sheetView.figure.backgroundColor !== "transparent") {
    dummyBGColor = sheetView.figure.backgroundColor;
  } else if (appearanceBgColor) {
    dummyBGColor = appearanceBgColor;
  }
  if (standinBranchView.getMatrixView()) {
    standinBranchView.getMatrixView().matrixGrid =
      branchView.getMatrixView().matrixGrid;
    // To make sure standin branch view has a same shape style with origin branch view.
    // It may not for matrix structure only, move it out from this block if needed.
    standinBranchView.topicView.getShapeStyle =
      branchView.topicView.getShapeStyle.bind(branchView.topicView);
  }
  standinBranchView.topicView.figure.setFillColor(dummyBGColor);
  if (
    s$treeTableCellEditOverlay === null ||
    s$treeTableCellEditOverlay === undefined
  ) {
    // do nothing
  } else {
    s$treeTableCellEditOverlay.attr("fill", dummyBGColor);
  }
  if (isSingleItemTreeTableCell) {
    standinBranchView.setProxy(branchView.getProxy());
  }
  return standinBranchView;
}
export function animationStandin(branchView) {
  const standinBranchView = standin(branchView, true);
  standinBranchView.topicView.titleView.textSvg.node.setAttributeNS(
    null,
    "opacity",
    "1",
  );
  standinBranchView.topicView.titleView.forceCalcSize = false;
  return standinBranchView;
}
export function standinTopicView(branchView) {
  let _a;
  let _c;
  const modelData = branchView.model.toJSON();
  modelData.children = {};
  modelData.summaries = [];
  modelData.boundaries = [];
  modelData.id = commonUtils.UUID();
  const topicView = new TopicView(
    parseTopic(modelData, branchView.getContext().getSheetView().model),
    branchView,
  );
  topicView.getContext = () => {
    return branchView.getContext();
  };
  topicView.initView();
  topicView.setForcedInvisible(true);
  topicView.figure.forbidInvalidateLayoutParent = true;
  // copy children view's size
  if (topicView.mathJaxView) {
    topicView.mathJaxView.figure.size = Object.assign(
      {},
      (_a = branchView.topicView.mathJaxView) === null || _a === undefined
        ? undefined
        : _a.figure.size,
    );
  }
  if (topicView.image) {
    topicView.image.bounds = Object.assign(
      {},
      branchView.topicView.image?.bounds,
    );
  }
  if (topicView.numberingView) {
    topicView.numberingView.figure.textSize = Object.assign(
      {},
      (_c = branchView.topicView.numberingView) === null || _c === undefined
        ? undefined
        : _c.figure.textSize,
    );
    topicView.numberingView.bounds = Object.assign(
      {},
      branchView.topicView.numberingView?.bounds,
    );
  }
  if (topicView.markersView) {
    topicView.markersView.bounds = Object.assign(
      {},
      branchView.topicView.markersView?.bounds,
    );
  }
  if (topicView.informationIconView) {
    topicView.informationIconView.bounds = Object.assign(
      {},
      branchView.topicView.informationIconView?.bounds,
    );
  }
  if (topicView.labelsView) {
    topicView.labelsView.bounds = Object.assign(
      {},
      branchView.topicView.labelsView?.bounds,
    );
  }
  topicView.figure.manuallyLayout();
  return topicView;
}
const BREAK = "BREAK";
const SKIP = "SKIP";
export function preorderIterate(tragetBranchView, childrenType, operate) {
  let result = operate(tragetBranchView);
  if (result === BREAK || result === SKIP) {
    return result;
  }
  const children = tragetBranchView.getChildrenBranchesByType(childrenType);
  for (let i = 0; i < children.length; i++) {
    result = preorderIterate(children[i], childrenType, operate);
    if (result === BREAK) {
      return result;
    }
  }
}
export function filterMultiSelectedBranches(
  viewList /*View.WorkbookComponentView*/,
  excludeBranchTypeList,
) {
  if (!excludeBranchTypeList) {
    excludeBranchTypeList = [
      CLASS_TYPE.CALLOUT_TOPIC,
      CLASS_TYPE.SUMMARY_TOPIC,
      CLASS_TYPE.CENTRAL_TOPIC,
    ];
  }
  const branchViewList = viewList.filter((view) => {
    if (view.type !== VIEW_TYPE.BRANCH) {
      return false;
    }
    return !(excludeBranchTypeList === null ||
    excludeBranchTypeList === undefined
      ? undefined
      : excludeBranchTypeList.includes(styleManager.getClassName(view)));
  });
  // remove central branch view
  branchViewList.some((view, index) => {
    if (isRootBranch(view)) {
      branchViewList.splice(index, 1);
      return true;
    }
  });
  const parseDescInfoInt = (descFragment) => {
    // for floating topic
    if (descFragment[0] !== "F") {
      return parseInt(descFragment);
    }
    return parseInt(descFragment.substr(1));
  };
  const descInfoList = branchViewList
    .map((branch) => ({
      branch: branch,
      path: branch.getBranchPath(),
    }))
    .sort((a, b) => {
      const listA = a.path.split(".").map(parseDescInfoInt);
      const listB = b.path.split(".").map(parseDescInfoInt);
      const len = Math.max(listA.length, listB.length);
      for (let i = 0; i < len; i++) {
        const aIndex = listA[i];
        const bIndex = listB[i];
        if (aIndex === undefined) {
          return -1;
        }
        if (bIndex === undefined) {
          return 1;
        }
        if (aIndex < bIndex) {
          return -1;
        }
        if (aIndex > bIndex) {
          return 1;
        }
      }
      return 0;
    });
  const resultList = [];
  descInfoList.forEach((desc) => {
    const hasParentInResultList = [
      ...resultList,
      {
        path: "never",
      },
    ].some((resultPath) => {
      return desc.path.startsWith(`${resultPath.path}.`);
    });
    if (!hasParentInResultList) {
      resultList.push(desc);
    }
  });
  return resultList.map((desc) => desc.branch);
}
export function showBranchIfHidden(targetBranchView) {
  if (!targetBranchView.figure.isVisible) {
    const parentBranchView = targetBranchView.parent();
    if (parentBranchView.type !== VIEW_TYPE.BRANCH) {
      return;
    }
    const isParentVisible = parentBranchView.figure.isVisible;
    let isParentCollapsed;
    if (!parentBranchView.collapseExtendView) {
      isParentCollapsed = false;
    } else {
      isParentCollapsed =
        parentBranchView.collapseExtendView.figure.isCollapsed;
    }
    if (isParentCollapsed) {
      parentBranchView.model.extendBranch();
    }
    if (!isParentVisible) {
      showBranchIfHidden(parentBranchView);
    }
  }
}
export function getSummaryDirection(targetBranchView, rangeStartIndex) {
  return targetBranchView
    .getStructureObject()
    .getSummaryDirection(targetBranchView, rangeStartIndex);
}
export function getChildTargetOrientation(targetBranchView, rangeStartIndex) {
  return targetBranchView
    .getStructureObject()
    .getChildTargetOrientation(targetBranchView, rangeStartIndex);
}
/**
 * @description 复制并返回branch的SVG结构
 * @param {BranchView} branchView
 * @return {SVG.G}
 * */
export function getTopicSVGStructureCopy(branchView) {
  const s$topicGroupCopy = new lib.SVG.G();
  const $branchClone = jquery(branchView.svg.node).clone();
  // remove select box
  $branchClone.find('[data-name="topic-select-box-group"]').remove();
  // remove collapse button
  $branchClone.find(".collapseextend").remove();
  $branchClone.find('[data-name="topic"]').show();
  if (isTreeTableStructure(branchView)) {
    const fill = styleManager.getStyleValue(branchView, STYLE_KEYS.FILL_COLOR);
    $branchClone.find('[data-name="topic-shape-fill"]').attr({
      fill,
      opacity: 1,
    });
  }
  s$topicGroupCopy.type = "g";
  s$topicGroupCopy.node = $branchClone[0];
  return s$topicGroupCopy;
}
export function getViewStructure(view, modelStructure) {
  const skeletonStructureStyle = view
    .getContext()
    .model.getSkeletonStructureStyle();
  const presetStructure =
    modelStructure ||
    skeletonStructureStyle[styleManager.getActivedClassName(view)];
  if (view.isCentralBranch()) {
    if (Object(baseUtil.isDef)(presetStructure)) {
      return presetStructure;
    } else {
      return STRUCTURECLASS.MAP;
    }
  }
  if (isDetachedBranch(view)) {
    if (Object(baseUtil.isDef)(presetStructure)) {
      return presetStructure;
    } else {
      const position = view.model.getPosition();
      if (position.x < 0) {
        return STRUCTURECLASS.LOGICLEFT;
      } else {
        return STRUCTURECLASS.LOGICRIGHT;
      }
    }
  }
  const parentBranchView = view.parent();
  const parentStructObj = parentBranchView.getStructureObject();
  if (isCalloutBranch(view)) {
    return parentStructObj.getCalloutStructure(parentBranchView, view);
  }
  /*
  对于map图, 要判断summary的方向, 所以家了参数 summaryindex 和 rangeStartIndex;
  map图的getSummaryDirection()方法依赖两个参数,branch 和 childBranch index
  */
  const summaryIndex = view.summaryIndex();
  if (view.isSummaryBranch() && summaryIndex !== -1) {
    const rangeStartIndex =
      parentBranchView.summaries[summaryIndex].model.rangeStart;
    const direction = parentStructObj.getSummaryDirection(
      parentBranchView,
      rangeStartIndex,
    );
    switch (direction) {
      case DIRECTION.LEFT:
        return STRUCTURECLASS.LOGICLEFT;
      case DIRECTION.RIGHT:
        return STRUCTURECLASS.LOGICRIGHT;
      case DIRECTION.UP:
        return STRUCTURECLASS.ORGCHARTUP;
      case DIRECTION.DOWN:
        return STRUCTURECLASS.ORGCHARTDOWN;
    }
  }
  // attached branch
  const parentStructure = parentBranchView.getStructureClass();
  if (Object(baseUtil.isDef)(presetStructure)) {
    const structs = parentStructObj.getAvailableChildStructure(
      parentBranchView,
      view,
    );
    if (structs.includes(presetStructure)) {
      return presetStructure;
    }
    const similarStruct = SIMILAR_STRUCTURE_MAP[presetStructure];
    if (
      Object(baseUtil.isDef)(similarStruct) &&
      structs.includes(similarStruct)
    ) {
      return similarStruct;
    } else {
      const index = view.branchIndex();
      return parentStructObj.getChildStructure(
        parentStructure,
        index,
        parentBranchView,
      );
    }
  } else {
    const index = view.branchIndex();
    return parentStructObj.getChildStructure(
      parentStructure,
      index,
      parentBranchView,
    );
  }
}
export function getMaskAttr(branchView) {
  function getMaskTransform(branch, topic) {
    let scale = "";
    let tx = 0;
    let ty = 0;
    if (topic.topicShapeStyle === TOPICSHAPE.CLOUD) {
      scale = topic.topicShapeFill.attr("transform") || "";
      const { x, y } = topic.topicShapeGroup.transform();
      tx += x;
      ty += y;
    }
    if (isDetachedBranch(branch)) {
      const { x, y } = branch.svg.transform();
      tx += x;
      ty += y;
    }
    return `translate(${tx} ${ty}) ${scale}`;
  }
  const { topicView } = branchView;
  const transform = getMaskTransform(branchView, topicView);
  const innerD = topicView.figure.topicShapeFillPath;
  return {
    d: `${innerD}`,
    transform,
  };
}
/**
 * @description 获取给定所有branchView的子孙branchView列表
 * @param {BranchView} parentBranch
 * @return {Array.<BranchView>}
 * */
export function getAllChildrenBranchViewList(parentBranch) {
  const result = [];
  const children = parentBranch.getChildrenBranchesByType([
    TOPIC_TYPE.DETACHED,
    TOPIC_TYPE.ATTACHED,
    TOPIC_TYPE.CALLOUT,
    TOPIC_TYPE.SUMMARY,
  ]);
  if (!children.length) {
    return result;
  }
  result.push(...children);
  children.forEach((child) => {
    result.push(...getAllChildrenBranchViewList(child));
  });
  return result;
}
export function branchInViewport(branch) {
  if (!branch || branch.type !== VIEW_TYPE.BRANCH) {
    return false;
  }
  const canvasControl = branch.editDomain().getCanvasControl();
  let clientBounds = canvasControl.getVisibleAreaBounds();
  clientBounds = {
    x: clientBounds.left,
    y: clientBounds.top,
    width: clientBounds.width,
    height: clientBounds.height,
  };
  const topicWidth = branch.topicView.bounds.width;
  const topicHeight = branch.topicView.bounds.height;
  const centerPointBasedClient = canvasControl
    .getCoordinateTransfer()
    .mindMapToViewport(branch.getRealPosition());
  const bounds = {
    x: centerPointBasedClient.x - topicWidth / 2,
    y: centerPointBasedClient.y - topicHeight / 2,
    width: topicWidth,
    height: topicHeight,
  };
  return Object(boundUtils.isIntersect)(clientBounds, bounds);
}
export function isCentralBranch(branchView) {
  return (
    branchView &&
    branchView.type === VIEW_TYPE.BRANCH &&
    branchView.isCentralBranch()
  );
}
export function isBraceStructure(branchView) {
  const structureClass = branchView.getStructureClass();
  return (
    structureClass === STRUCTURECLASS.BRACELEFT ||
    structureClass === STRUCTURECLASS.BRACERIGHT
  );
}
export function isTimelineThroughStructure(branchView) {
  const structureClass = branchView.getStructureClass();
  return (
    structureClass === STRUCTURECLASS.TIMELINEHORIZONTAL ||
    structureClass === STRUCTURECLASS.TIMELINETHROUGHVERTICAL
  );
}
function getExternalInfoForStructure(structure, branchView) {
  const result: any = {};
  if (isFishBoneMainBone(branchView)) {
    // add parent spacing major
    const parentBranchView = branchView.parent();
    result.parentClassType = styleManager.getClassName(parentBranchView);
    result.parentSpacingMajor = parseInt(
      styleManager.getStyleValue(parentBranchView, STYLE_KEYS.SPACING_MAJOR),
    );
    result.lineSpacing = getLineEndSpacingPatchGap(parentBranchView);
  }
  if (isFishBoneHead(branchView)) {
    result.lineSpacing = getLineEndSpacingPatchGap(branchView);
  }
  return result;
}
function getLayoutStyleInfo(branchView, targetStructure) {
  let keyList = [
    STYLE_KEYS.SPACING_MAJOR,
    STYLE_KEYS.SPACING_MINOR,
    STYLE_KEYS.MARGIN_TOP,
    STYLE_KEYS.MARGIN_RIGHT,
    STYLE_KEYS.MARGIN_BOTTOM,
    STYLE_KEYS.MARGIN_LEFT,
  ];
  if (TREE_TABLE_GROUP_LIST.includes(targetStructure)) {
    keyList = keyList.concat([
      STYLE_KEYS.BORDER_LINE_WIDTH,
      STYLE_KEYS.TEXT_ALIGN,
      STYLE_KEYS.BORDER_LINE_PATTERN,
    ]);
  }
  if (
    targetStructure === STRUCTURECLASS.FISHBONELEFTHEADED ||
    targetStructure === STRUCTURECLASS.FISHBONERIGHTHEADED
  ) {
    keyList = keyList.concat([
      STYLE_KEYS.BORDER_LINE_WIDTH,
      STYLE_KEYS.SHAPE_CLASS,
    ]);
  }
  const result = {};
  keyList.forEach((key) => {
    let targetBranchView = branchView;
    // special treatment for treetable's border line width
    if (
      TREE_TABLE_GROUP_LIST.includes(targetStructure) &&
      key === STYLE_KEYS.BORDER_LINE_WIDTH
    ) {
      targetBranchView = getTreeTableHeadBranchView(branchView);
    }
    result[key] = styleManager.getStyleValue(targetBranchView, key);
  });
  return result;
}
export function getBranchLayoutTreeInfo(
  branchView,
  { targetStructure, parentBranchLayoutInfo },
) {
  const currentBranchStructure = branchView.getStructureClass();
  const stopFlag =
    currentBranchStructure !== targetStructure || branchView.shouldCollapse();
  const getLayoutInfo = () => {
    return {
      topicBounds: Object.assign({}, branchView.topicView.bounds),
      boundaryBounds: Object.assign({}, branchView.boundaryBounds),
      bounds: Object.assign({}, branchView.bounds),
      id: branchView.model.getId(),
      classType: styleManager.getClassName(branchView),
      layoutStructureClass: targetStructure,
      currentBranchStructure: currentBranchStructure,
      externalInfo: getExternalInfoForStructure(targetStructure, branchView),
      stopFlag,
      children: {},
      position: {
        x: 0,
        y: 0,
      },
      parentBranchLayoutInfo,
      style: getLayoutStyleInfo(branchView, targetStructure),
    };
  };
  const result = getLayoutInfo();
  if (stopFlag) {
    return result;
  }
  [TOPIC_TYPE.ATTACHED].forEach((childType) => {
    if (!result.children[childType]) {
      result.children[childType] = [];
    }
    branchView
      .getChildrenBranchesByType(childType)
      .forEach((childBranchView) => {
        result.children[childType].push(
          getBranchLayoutTreeInfo(childBranchView, {
            targetStructure,
            parentBranchLayoutInfo: result,
          }),
        );
      });
  });
  return result;
} // 返回 view 被哪些 Boundary 直接包含
// 返回顺序距离 view 由近到远
export function getAllContainedBoundaries(view) {
  let result = [];
  let currentView = view;
  if (currentView.boundaries) {
    const masterBoundary = currentView.boundaries.filter((boundaryView) => {
      return boundaryView.model.getRange() === MASTER_RANGE;
    });
    if (masterBoundary.length) {
      result = result.concat(masterBoundary);
    }
  }
  while (
    currentView === null || currentView === undefined
      ? undefined
      : currentView.parent()
  ) {
    const child = currentView;
    const parent = currentView.parent();
    if (parent instanceof BranchView) {
      const boundaries = parent.boundaries || [];
      const children = parent.getChildrenBranchesByType();
      boundaries.forEach((boundary) => {
        const inBoundaryChildren = children.slice(
          boundary.model.rangeStart,
          boundary.model.rangeEnd + 1,
        );
        if (inBoundaryChildren.includes(child)) {
          result.push(boundary);
        }
      });
    }
    currentView = parent;
  }
  return result;
}
export function isInBoundary(branchView) {
  let _a;
  let _b;
  const parent = branchView.parent();
  if (!parent) {
    return false;
  }
  const index = branchView.branchIndex();
  const boundaries =
    (_b = (_a = parent.model).boundaries) === null || _b === undefined
      ? undefined
      : _b.call(_a);
  if (!boundaries) {
    return false;
  }
  for (let i = 0; i < boundaries.length; i++) {
    if (boundaries[i].rangeStart <= index && boundaries[i].rangeEnd >= index) {
      return true;
    }
  }
  return false;
}
export function isPreventCustomWidthBranch(branchView) {
  const preventShapeList = [
    TOPICSHAPE.DIAMOND,
    TOPICSHAPE.ELLIPSE,
    TOPICSHAPE.CLOUD,
  ];
  return preventShapeList.includes(
    styleManager.getStyleValue(branchView, STYLE_KEYS.SHAPE_CLASS),
  );
}
export function getMathJaxSVG(branchView) {
  if (!branchView) {
    return null;
  }
  const { topicView } = branchView;
  if (!topicView.mathJaxView || !topicView.mathJaxView.figure) {
    return null;
  }
  const { SVGOutput, size } = topicView.mathJaxView.figure;
  if (!SVGOutput || !size) {
    return null;
  }
  const { width, height } = size;
  SVGOutput.setAttribute("width", width.toFixed(2));
  SVGOutput.setAttribute("height", height.toFixed(2));
  return SVGOutput;
}
export function isInMultiLineColorsMode(branchView) {
  const sheetView = branchView.getContext().getSheetView();
  const multiLineColors = sheetView.figure.multiLineColors;
  return !!multiLineColors && multiLineColors !== "none";
}
export function isFreePositionBranch(branchView) {
  let _a;
  return (
    (((_a = branchView.model.ownerSheet()) === null || _a === undefined
      ? undefined
      : _a.isFreePositionEnabled()) ??
      false) &&
    styleManager.getClassName(branchView) === CLASS_TYPE.MAIN_TOPIC &&
    branchView.parent().getStructureClass().includes("map")
  );
}

import * as constants from "../common/constants/index";
import { getInjectModule } from "./injectmodule";
import stylemanager from "./business/stylemanager/index";
import * as FileSaver from "file-saver";
import * as branchUtils from "./branch";

function skeletonPreViewExporter(sheetEditor) {
  const { STYLE_KEY_TO_PREVIEW_PARAM_KEY } = getInjectModule(
    constants.MODULE_NAME.SNOWBALL,
  ).snowballConstant;
  const sheetView = sheetEditor.getSheetView();
  const centralBranchView = sheetView.centralBranchView;
  const allChildrenBranchView = centralBranchView.getDescendantBranchesByType(
    ...constants.ALL_TOPIC_TYPES,
  );
  const allBranchView = [centralBranchView, ...allChildrenBranchView];
  allBranchView.forEach((branchView) => {
    let _b;
    let _d;
    const branchViewClassType = stylemanager.getClassName(branchView);
    const lineColorListIndex = getLineColorListIndex(branchView);
    // branch text color
    // add to snowball
    const textColorTemplate = `$\{colorMap.getTextColor(${lineColorListIndex}, '${branchViewClassType}')}`;
    Array.from(
      branchView.topicView.titleView.figure.renderWorker.titleText.node
        .children,
    ).forEach((node: any) => {
      node.setAttribute("fill", textColorTemplate);
    });
    branchView.topicView.titleView.figure.renderWorker.svg.attr(
      "fill",
      textColorTemplate,
    );
    branchView.topicView.titleView.figure.renderWorker.titleText.attr(
      "fill",
      textColorTemplate,
    );
    // branch fill color
    // add to snowball
    const fillColorTemplate = `$\{colorMap.getFillColor(${lineColorListIndex}, '${branchViewClassType}')}`;
    const topicFillAttrKey = Object(branchUtils.isSolidFillPattern)(
      branchView.topicView.figure.fillPattern,
    )
      ? "fill"
      : "stroke";
    branchView.topicView.figure.renderWorker.topicShapeFill.attr(
      topicFillAttrKey,
      fillColorTemplate,
    );
    // branch line color
    // add to snowball
    const lineColorTemplate = `$\{colorMap.getLineColor(${lineColorListIndex})}`;
    const connectionFigure = branchView.getConnectionView().figure;
    const attrKey =
      connectionFigure.lineTapered &&
      ![
        constants.LINE_PATTERN.HANDDRAWNDASH,
        constants.LINE_PATTERN.HANDDRAWNSOLID,
      ].includes(connectionFigure.linePattern)
        ? "fill"
        : "stroke";
    branchView.getConnectionView().figure.renderWorker.s$svg.attr({
      [attrKey]: lineColorTemplate,
    });
    if (
      (_b = branchView
        .getConnectionView()
        .arrowSelector.getEndArrowDomInfo()?.s$SVG) === null ||
      _b === undefined
    ) {
      // do nothing;
    } else {
      _b.attr({
        fill: lineColorTemplate,
        stroke: lineColorTemplate,
      });
    }
    if (
      (_d = branchView
        .getConnectionView()
        .arrowSelector.getBeginArrowDomInfo()?.s$SVG) === null ||
      _d === undefined
    ) {
      // do nothing
    } else {
      _d.attr({
        fill: lineColorTemplate,
        stroke: lineColorTemplate,
      });
    } // branch border color
    // add to snowball
    const borderLineColorTemplate = `$\{colorMap.getBorderLineColor(${lineColorListIndex}, '${branchViewClassType}')}`;
    branchView.topicView.figure.renderWorker.topicShape.attr(
      "stroke",
      borderLineColorTemplate,
    );
    // matrix cell
    const matrixView = branchView.getMatrixView();
    if (matrixView) {
      matrixView._cellViews.forEach((cellView) => {
        let isLabelView = false;
        if (cellView._view) {
          if (cellView._view.type === "matrixlabel") {
            isLabelView = true;
          }
        } else {
          isLabelView = true;
        }
        let classType = branchViewClassType;
        if (!isLabelView) {
          classType = stylemanager.getClassName(cellView._view);
        }
        let fillTemplate;
        if (isLabelView) {
          // add to snowball
          fillTemplate = `$\{colorMap.${classType}_${
            STYLE_KEY_TO_PREVIEW_PARAM_KEY[constants.STYLE_KEYS.FILL_COLOR]
          }_matrixlabel}`;
          if (!cellView.isNull) {
            // label text color
            Array.from(
              cellView._view.figure.renderWorker.titleText.node.children,
            ).forEach((node: any) => {
              node.setAttribute("fill", textColorTemplate);
            });
          }
        } else {
          const index = getLineColorListIndex(cellView._view);
          fillTemplate = `$\{colorMap.getFillColor(${index}, '${classType}')}`;
        }
        cellView.figure.renderWorker._s$fillPath.attr("fill", fillTemplate);
        // add to snowball
        const matrixCellBorderLineColorTemplate = `$\{colorMap.${branchViewClassType}_${
          STYLE_KEY_TO_PREVIEW_PARAM_KEY[constants.STYLE_KEYS.BORDER_LINE_COLOR]
        }}`;
        cellView.figure.renderWorker._s$borderPath.attr(
          "stroke",
          matrixCellBorderLineColorTemplate,
        );
      });
    }
    // tree table cell
    const treeTableCellView = branchView.getTreeTableCellView();
    if (treeTableCellView) {
      treeTableCellView.figure.renderWorker.s$treeTableFill.attr(
        "fill",
        fillColorTemplate,
      );
      const headBranchClass = stylemanager.getClassName(
        Object(branchUtils.getTreeTableHeadBranchView)(branchView),
      );
      const headBranchBorderLineColorTemplate = `$\{colorMap.${headBranchClass}_${
        STYLE_KEY_TO_PREVIEW_PARAM_KEY[constants.STYLE_KEYS.BORDER_LINE_COLOR]
      }}`;
      treeTableCellView.figure.renderWorker.s$treeTableStroke.attr(
        "stroke",
        headBranchBorderLineColorTemplate,
      );
    }
    // fish bone head line
    const fishboneHeadLineView = branchView.getFishboneHeadLineView();
    if (fishboneHeadLineView) {
      // add to snowball
      const fishBoneAndTimelineHeadlineColorTemplate = `$\{colorMap.getLineColor(${getFishboneAndTimeLineHeadLineColorListIndex(
        branchView,
      )})}`;
      fishboneHeadLineView.figure.renderWorker.s$fishBoneLine.attr({
        stroke: fishBoneAndTimelineHeadlineColorTemplate,
        fill: fishBoneAndTimelineHeadlineColorTemplate,
      });
    }
    // fish bone mainbone line
    const fishboneMainLineView = branchView.getFishboneMainLineView();
    if (fishboneMainLineView) {
      fishboneMainLineView.figure.renderWorker.s$fishBoneLine.attr({
        stroke: borderLineColorTemplate,
        fill: borderLineColorTemplate,
      });
    }
    // timeline main line
    const timelineMainLineView = branchView.getTimelineMainLineView();
    if (timelineMainLineView) {
      const fishBoneAndTimelineHeadlineColorTemplate = `$\{colorMap.getLineColor(${getFishboneAndTimeLineHeadLineColorListIndex(
        branchView,
      )})}`;
      timelineMainLineView.figure.renderWorker.s$line.attr({
        stroke: fishBoneAndTimelineHeadlineColorTemplate,
      });
      timelineMainLineView.figure.renderWorker.s$steps
        .children()
        .forEach((step) => {
          step.attr({
            fill: fishBoneAndTimelineHeadlineColorTemplate,
          });
        });
    }
  });
  // map background color
  const backGroundColorTemplate = `$\{colorMap.${constants.CLASS_TYPE.MAP}_${
    STYLE_KEY_TO_PREVIEW_PARAM_KEY[constants.STYLE_KEYS.FILL_COLOR]
  }}`;
  sheetEditor.getSVGView().svg.node.removeAttribute("style");
  const bgRect = document.createElement("rect");
  bgRect.setAttribute("width", "100%");
  bgRect.setAttribute("height", "100%");
  bgRect.setAttribute("fill", backGroundColorTemplate);
  sheetEditor.getSVGView().svg.node.prepend(bgRect);
  return new Promise((resolve) => {
    sheetEditor
      .exportImage({
        format: "SKELETON",
        skipFont: true,
        padding: 50,
        width: 800,
        height: 494,
      })
      .then((result) => {
        resolve({
          id: sheetEditor.model.id,
          result,
        });
      });
  });
}
function getAncestorMainBranchView(branchView) {
  if (Object(branchUtils.isRootBranch)(branchView)) {
    return null;
  }
  let ancestorMainBranchView = branchView;
  while (
    stylemanager.getClassName(ancestorMainBranchView) !==
    constants.CLASS_TYPE.MAIN_TOPIC
  ) {
    ancestorMainBranchView = ancestorMainBranchView.parent();
    if (!ancestorMainBranchView) {
      break;
    }
  }
  return ancestorMainBranchView;
}
function getLineColorListIndex(branchView) {
  const ancestorMainBranchView = getAncestorMainBranchView(branchView);
  if (!ancestorMainBranchView) {
    return 0;
  }
  let indexInParent = ancestorMainBranchView.branchIndex();
  if (indexInParent < 0) {
    indexInParent = 0;
  }
  return indexInParent;
}
function getFishboneAndTimeLineHeadLineColorListIndex(branchView) {
  const childrenList = branchView.getChildrenBranchesByType();
  return childrenList.length - 1;
}
export function saveAllSheetPreviewToJSON(workbookEditor, themeName) {
  workbookEditor.initAllSheetEditor();
  setTimeout(() => {
    Promise.all(
      Object.keys(workbookEditor.sheetEditors).map((id) => {
        return skeletonPreViewExporter(workbookEditor.sheetEditors[id]);
      }),
    ).then((infos) => {
      const skeletonPreviewList = [];
      infos.forEach((info: any) => {
        skeletonPreviewList.push({
          data: info.result.data,
          id: info.id,
        });
      });
      Object(FileSaver.saveAs)(
        new Blob([JSON.stringify(skeletonPreviewList)], {
          type: "application/json",
        }),
        `${themeName}-skeletonthemepreviews.json`,
      );
    });
  });
}
function isHandDrawnTheme(skeletonThemeData) {
  const themeData = skeletonThemeData.theme;
  let isHandDrawn = true;
  [
    constants.CLASS_TYPE.CENTRAL_TOPIC,
    constants.CLASS_TYPE.MAIN_TOPIC,
    constants.CLASS_TYPE.SUB_TOPIC,
  ].forEach((classType) => {
    const properties = themeData[classType].properties;
    // check fill pattern
    const fillColor = properties[constants.STYLE_KEYS.FILL_COLOR];
    const fillPattern = properties[constants.STYLE_KEYS.FILL_PATTERN];
    if (
      fillColor !== "none" &&
      !Object.values(constants.HAND_DRAWN_FILL_PATTERN).includes(fillPattern)
    ) {
      isHandDrawn = false;
    }
    // check line pattern
    const linePattern = properties[constants.STYLE_KEYS.LINE_PATTERN];
    if (
      linePattern &&
      !Object.values(constants.HAND_DRAWN_LINE_PATTERN).includes(linePattern)
    ) {
      isHandDrawn = false;
    }
  });
  return isHandDrawn;
}
function skeletonThemeDataExporter(sheetEditor) {
  const skeletonThemeData = sheetEditor.exportTheme({
    toSkeletonTheme: true,
  });
  const groupData = {
    id: sheetEditor.model.id,
    title: "",
    tags: [],
    isHandDrawn: isHandDrawnTheme(skeletonThemeData),
  };
  return {
    skeletonThemeData,
    groupData,
  };
}
export function saveAllSheetSkeletonDataToJSON(workbookEditor, themeName) {
  workbookEditor.initAllSheetEditor();
  setTimeout(() => {
    const skeletonThemeDataList = [];
    const skeletonThemeGroupDataMap = {
      [themeName]: [],
    };
    Object.keys(workbookEditor.sheetEditors)
      .map((id) => {
        return skeletonThemeDataExporter(workbookEditor.sheetEditors[id]);
      })
      .forEach((info) => {
        skeletonThemeDataList.push(info.skeletonThemeData);
        info.groupData.tags.push(themeName);
        skeletonThemeGroupDataMap[themeName].push(info.groupData);
      });
    Object(FileSaver.saveAs)(
      new Blob([JSON.stringify(skeletonThemeDataList)], {
        type: "application/json",
      }),
      `${themeName}-skeletonthemes.json`,
    );
    Object(FileSaver.saveAs)(
      new Blob([JSON.stringify(skeletonThemeGroupDataMap)], {
        type: "application/json",
      }),
      `${themeName}-skeletonthemegroup.json`,
    );
  });
}

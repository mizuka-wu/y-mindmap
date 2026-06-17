/* eslint-disable @typescript-eslint/no-unused-vars */
import jquery from "jquery";

import {
  STYLE_KEYS,
  CONFIG,
  MODULE_NAME,
  UI_STATUS,
  ALL_TOPIC_TYPES,
  LINE_PATTERN,
  STRUCTURECLASS,
  VIEW_TYPE,
  TOPIC_TYPE,
  CLASS_TYPE,
} from "../../common/constants/index";
import * as lib from "../../lib/index";
import StyleComponent from "../../models/stylecomponent";
import styleManager from "./stylemanager/index";
import * as boundUtils from "../boundutils";
import * as utils from "../index";
import BranchView from "../../view/branchview";

import * as esm from "../../snowball/lib/index";
import { layoutConstant } from "../layoutconstant";
import MatrixLabelView from "../../view/matrixlabelview";
import * as matrixUtils from "../matrixutils";
import {
  relationshipArrowPathExporter,
  connectionArrowPathExporter,
  fishBoneMainLineArrowPathExporter,
} from "./arrowpathexporter";

const CANVAS_LIMITED_SIZE = 32767;
const CANVAS_LIMITED_AREA = 268435456;
const DOWN_RATIO = 0.9;
const areaOptionType = {
  full: "full",
  inview: "inview",
};
const formatOptionType = {
  PNG: "PNG",
  SVG: "SVG",
  PDF: "PDF",
  SKELETON: "SKELETON",
};
const defaultOptions = {
  targetBranch: null,
  targetSVG: null,
  hideCollapseOpen: false,
  hideCollapseClose: true,
  area: areaOptionType.full,
  hidpi: 96,
  scale: 1,
  width: null,
  height: null,
  maxScale: null,
  padding: 10,
  format: formatOptionType.PNG,
  wbPrintMode: false,
  noBackground: null,
  skipFont: true,
  timeout: 10000,
};
class ImageExporter {
  /**
   * @param {SheetEditor} sheetEditor
   * @param {Object} options
   * @return {Promise}
   * @public
   * */
  export(sheetEditor, options: any = {}) {
    // 整合默认选项与用户选项
    options = this._getMergeDefaultOptions(options);
    options.paddingBottom = options.paddingBottom ?? options.padding;
    const logger = sheetEditor.config(CONFIG.LOGGER);
    const semaphoreModule = sheetEditor.getModule(MODULE_NAME.SEMAPHORE);
    let $newSVG;
    let svgWidth;
    let svgHeight;
    let originLeft;
    let originTop;
    let containerScale;
    let scale;
    let hidpi;
    return new Promise((resolve, reject) => {
      let isTimeout = false;
      setTimeout(() => {
        // 这里虽然一定会执行到，但如果promise先一步resolve，则reject不会产生任何副作用
        isTimeout = true;
        reject(
          `Export image:${options.timeout}ms timeout. Current status:${semaphoreModule._log_semaphore()}`,
        );
      }, options.timeout);
      const exportImageStartTime = Date.now();
      semaphoreModule.onceNotInStatus(
        [
          UI_STATUS.ANIMATION,
          UI_STATUS.DRAG,
          UI_STATUS.LAYOUT,
          UI_STATUS.LOADING_IMAGE,
        ],
        () => {
          logger.info(
            `Export image time: from ${exportImageStartTime} to ${Date.now()}.`,
          );
          if (isTimeout) {
            return;
          }
          ({
            $newSVG,
            svgWidth,
            svgHeight,
            originLeft,
            originTop,
            containerScale,
            scale,
            hidpi,
          } = this._getTargetSVGInfo(sheetEditor, options));
          // skipSheet 的 sheet 在 convertSVG2PNG 里指的是 StyleSheet 样式表，
          // 而不是 SB 的 sheet. 在这里主要应用于字体加载
          const skipSheet = null;
          const fonts = this._getFontsInSheet(sheetEditor, options.skipFont);
          const isPureSVG = !!options.targetSVG;
          if (options.format === formatOptionType.PNG) {
            lib.svg2png
              .svgAsPngUri($newSVG[0], {
                scale,
                hidpi,
                skipSheet,
                fonts,
                isPureSVG,
              })
              .then(resolve);
          } else if (
            options.format === formatOptionType.SVG ||
            options.format === formatOptionType.PDF
          ) {
            lib.svg2png
              .newSvg($newSVG[0], {
                skipSheet,
                scale,
                fonts,
                isPureSVG,
              })
              .then(resolve);
          } else if (options.format === formatOptionType.SKELETON) {
            lib.svg2png
              .newSvgWithoutDoctype($newSVG[0], {
                skipSheet,
                scale,
                fonts,
                isPureSVG,
              })
              .then(resolve);
          }
        },
      );
    })
      .then((base64Data) => {
        return {
          height: svgHeight * scale,
          width: svgWidth * scale,
          cx: originLeft * scale * containerScale,
          cy: originTop * scale * containerScale,
          data: base64Data,
          scale,
        };
      })
      .catch((e) => {
        const logger = sheetEditor.config(CONFIG.LOGGER);
        logger.error(e);
        throw e;
      });
  }
  /**
   * @description 整合传入的选项与默认选项
   * @private
   * */
  _getMergeDefaultOptions(userOptions) {
    const options = Object.assign({}, defaultOptions, userOptions);
    if (
      options.format === formatOptionType.SVG ||
      options.format === formatOptionType.PDF
    ) {
      options.area = areaOptionType.full;
    }
    if (options.targetBranch) {
      options.area = areaOptionType.full;
    }
    return options;
  }
  /**
   * @description 获取需要转换的SVG结构休息
   * @param {SheetEditor} sheetEditor
   * @param options
   * @private
   * */
  _getTargetSVGInfo(sheetEditor, options: any = {}) {
    const targetSVGInfo: any = {
      $newSVG: null,
      svgWidth: 0,
      svgHeight: 0,
      originLeft: 0,
      originTop: 0,
      containerScale: 1,
      scale: options.scale,
      hidpi: options.hidpi,
    };
    if (options.targetSVG) {
      targetSVGInfo.$newSVG = jquery(options.targetSVG.outerHTML);
    } else {
      const svgView = sheetEditor.getSVGView();
      if (options.area === areaOptionType.inview) {
        targetSVGInfo.svgWidth = svgView.svg.node.clientWidth;
        targetSVGInfo.svgHeight = svgView.svg.node.clientHeight;
        targetSVGInfo.containerScale = svgView.getScale() / 100;
        const trans = svgView.container.transform();
        targetSVGInfo.originLeft = trans.x / targetSVGInfo.containerScale;
        targetSVGInfo.originTop = trans.y / targetSVGInfo.containerScale;
      } else if (options.area === areaOptionType.full) {
        // todo 这部分的逻辑太绕了
        let targetBounds;
        if (options.targetBranch) {
          const relationshipBoundsList =
            this._getRelationshipViewListInBranchTree(
              options.targetBranch,
              sheetEditor,
            ).map((relationshipView) => {
              const relativePosition = Object(utils.relativePositionFor)(
                relationshipView.bounds,
                options.targetBranch.getRealPosition(),
              );
              return Object.assign(
                Object.assign({}, relationshipView.bounds),
                relativePosition,
              );
            });
          const fullWrappedSummaryBoundsList =
            this._getFullWrappedSummaryBranchViewListInBranchTree(
              options.targetBranch,
            ).map((summaryBranchView) => {
              const relativePosition = Object(utils.relativePositionFor)(
                summaryBranchView.getRealPosition(),
                options.targetBranch.getRealPosition(),
              );
              return Object.assign(
                Object.assign({}, summaryBranchView.bounds),
                relativePosition,
              );
            });
          // todo need to be fixed in layout process
          const targetSizeBounds =
            options.targetBranch.boundaryBounds.width === 0
              ? options.targetBranch.bounds
              : options.targetBranch.boundaryBounds;
          targetBounds = boundUtils.getUnionBoundingBoxFromAllBounds([
            targetSizeBounds,
            ...relationshipBoundsList,
            ...fullWrappedSummaryBoundsList,
          ]);
        } else {
          targetBounds = sheetEditor.getContentBound();
        }
        targetSVGInfo.svgWidth = Math.ceil(targetBounds.width);
        targetSVGInfo.svgHeight = Math.ceil(targetBounds.height);
        targetSVGInfo.originLeft = -targetBounds.x;
        targetSVGInfo.originTop = -targetBounds.y;
        // 若用户提供了自定义宽高
        if (options.width && options.height) {
          const targetWidth = options.width - options.padding * 2;
          const targetHeight =
            options.height - options.padding - options.paddingBottom;
          const optionRatio = targetWidth / targetHeight;
          const currentRatio = targetBounds.width / targetBounds.height;
          // 若用户提供的宽高比大于实际宽高比
          if (optionRatio > currentRatio) {
            targetSVGInfo.scale = targetHeight / targetBounds.height;
            targetSVGInfo.scale =
              options.maxScale !== undefined && options.maxScale !== null
                ? Math.min(targetSVGInfo.scale, options.maxScale)
                : targetSVGInfo.scale;
            targetSVGInfo.svgWidth = targetWidth / targetSVGInfo.scale;
          } else {
            targetSVGInfo.scale = targetWidth / targetBounds.width;
            targetSVGInfo.scale =
              options.maxScale !== undefined && options.maxScale !== null
                ? Math.min(targetSVGInfo.scale, options.maxScale)
                : targetSVGInfo.scale;
            targetSVGInfo.svgHeight = targetHeight / targetSVGInfo.scale;
          }
        }
        let finalPadding = options.padding / targetSVGInfo.scale; // canvas size should be calculated with finalPadding (Fix vana#759)
        let finalPaddingBottom = options.paddingBottom / targetSVGInfo.scale;
        // 根据尺寸限制进一步改变缩放
        const size =
          (Math.max(
            targetSVGInfo.svgWidth + finalPadding * 2,
            targetSVGInfo.svgHeight + finalPadding + finalPaddingBottom,
          ) *
            targetSVGInfo.scale *
            targetSVGInfo.hidpi) /
          96;
        if (size >= CANVAS_LIMITED_SIZE) {
          targetSVGInfo.scale =
            ((targetSVGInfo.scale * CANVAS_LIMITED_SIZE) / size) * DOWN_RATIO;
          finalPadding = options.padding / targetSVGInfo.scale;
          finalPaddingBottom = options.paddingBottom / targetSVGInfo.scale;
        }
        // determine if canvasAreaSize is under CANVAS_LIMITED_AREA(the maximum area of canvas can be rendered in Chrome, for more information you can see https://stackoverflow.com/questions/6081483/maximum-size-of-a-canvas-element)
        const canvasAreaSize =
          (targetSVGInfo.svgWidth + finalPadding * 2) *
          (targetSVGInfo.svgHeight + finalPadding + finalPaddingBottom) *
          (targetSVGInfo.scale * targetSVGInfo.scale) *
          (((targetSVGInfo.hidpi / 96) * targetSVGInfo.hidpi) / 96);
        if (canvasAreaSize > CANVAS_LIMITED_AREA) {
          targetSVGInfo.scale =
            targetSVGInfo.scale *
            Math.sqrt(CANVAS_LIMITED_AREA / canvasAreaSize) *
            DOWN_RATIO;
          finalPadding = options.padding / targetSVGInfo.scale;
          finalPaddingBottom = options.paddingBottom / targetSVGInfo.scale;
        }
        targetSVGInfo.originLeft +=
          (targetSVGInfo.svgWidth - targetBounds.width) / 2;
        targetSVGInfo.originTop +=
          (targetSVGInfo.svgHeight - targetBounds.height) / 2;
        if (options.targetBranch) {
          const targetRealPosition = options.targetBranch.getRealPosition();
          targetSVGInfo.originLeft -= targetRealPosition.x;
          targetSVGInfo.originTop -= targetRealPosition.y;
        }
        // Add padding here
        // The padding passed in is the padding expected at the final png image.
        // But here padding should be in the svg's coordination
        targetSVGInfo.svgWidth += finalPadding * 2;
        targetSVGInfo.svgHeight += finalPadding + finalPaddingBottom;
        targetSVGInfo.originLeft += finalPadding;
        targetSVGInfo.originTop += finalPadding;
      }
      this._fixMatrixAppendViewBounds(
        targetSVGInfo,
        sheetEditor,
        options.targetBranch,
      );
      targetSVGInfo.$newSVG = options.targetBranch
        ? this._getBranchTreeSVG(options.targetBranch, sheetEditor)
        : jquery(svgView.svg.node.outerHTML);
      targetSVGInfo.$newSVG.attr({
        width: targetSVGInfo.svgWidth,
        height: targetSVGInfo.svgHeight,
      });
      targetSVGInfo.$newSVG
        .children("g")
        .eq(0)
        .attr({
          transform: `scale(${targetSVGInfo.containerScale}) translate(${targetSVGInfo.originLeft} ${targetSVGInfo.originTop})`,
        });
      if (options.format === formatOptionType.SVG) {
        this._addTopicHref(
          targetSVGInfo.$newSVG,
          sheetEditor,
          options.targetBranch,
        );
        if (
          !options.noBackground &&
          options.format !== formatOptionType.SKELETON
        ) {
          this._fixTransparentCentralBranchInMapStructure(
            targetSVGInfo.$newSVG,
            sheetEditor,
            options.targetBranch,
          );
        }
      }
      if (options.format === formatOptionType.PDF) {
        this._addTopicHref(
          targetSVGInfo.$newSVG,
          sheetEditor,
          options.targetBranch,
        );
        this._fixRelationshipTitle(
          targetSVGInfo.$newSVG,
          sheetEditor,
          options.targetBranch,
          options.noBackground,
        );
        // this._fixArrow(targetSVGInfo.$newSVG, sheetEditor, options.targetBranch)
        this._fixGradientBGColor(
          targetSVGInfo.$newSVG,
          sheetEditor,
          options.targetBranch,
        );
        // 放在 _fixGradientBGColor 后面执行, 避免运行结果被覆盖
        this._fixTransparentCentralBranchInMapStructure(
          targetSVGInfo.$newSVG,
          sheetEditor,
          options.targetBranch,
        );
      }
      if (options.wbPrintMode) {
        this.optimizeColorForWbPrintMode(targetSVGInfo.$newSVG, sheetEditor);
      }
      this._hideInteractiveElements(targetSVGInfo.$newSVG, options);
      if (options.noBackground) {
        targetSVGInfo.$newSVG.css("background-color", "transparent");
      }
    }
    return targetSVGInfo;
  }
  _fixArrow($newSVG, sheetEditor, targetBranchView) {
    const $arrowContainer = jquery('<g id="arrowContainer"></g>');
    $newSVG.find('[data-name="sheet"]').append($arrowContainer);
    const curryFixPathArrow = this.fixPathArrow.bind(
      this,
      $newSVG,
      $arrowContainer,
      sheetEditor,
      targetBranchView,
    );
    curryFixPathArrow((sheetEditor, targetBranchView) => {
      let relationshipViewList;
      if (targetBranchView) {
        relationshipViewList = this._getRelationshipViewListInBranchTree(
          targetBranchView,
          sheetEditor,
        );
      } else {
        relationshipViewList = [...sheetEditor.getSheetView().relationships];
      }
      return relationshipViewList.filter((relationshipView) => {
        return relationshipView.figure.isVisible;
      });
    }, relationshipArrowPathExporter);
    curryFixPathArrow((sheetEditor, targetBranchView) => {
      const connectionViewList: any[] = [];
      const rootBranchView =
        targetBranchView ?? sheetEditor.getSheetView().getCentralBranchView();
      rootBranchView
        .getDescendantBranchesByType(ALL_TOPIC_TYPES)
        .forEach((childBranchView) => {
          if (Object(utils.isDetachedBranch)(childBranchView)) {
            return;
          }
          // fishbone use private main line view to render connection line
          if (childBranchView.getFishboneMainLineView()) {
            return;
          }
          const connectionView = childBranchView.getConnectionView();
          if (!connectionView.figure.isVisible) {
            return;
          }
          connectionViewList.push(connectionView);
        });
      return connectionViewList;
    }, connectionArrowPathExporter);
    curryFixPathArrow((sheetEditor, targetBranchView) => {
      const fishBoneMainLineViewList: any[] = [];
      const rootBranchView =
        targetBranchView ?? sheetEditor.getSheetView().getCentralBranchView();
      rootBranchView
        .getDescendantBranchesByType(ALL_TOPIC_TYPES)
        .forEach((childBranchView) => {
          const fishBoneMainLineView =
            childBranchView.getFishBoneMainLineView();
          if (!fishBoneMainLineView || !fishBoneMainLineView.figure.isVisible) {
            return;
          }
          fishBoneMainLineViewList.push(fishBoneMainLineView);
        });
      return fishBoneMainLineViewList;
    }, fishBoneMainLineArrowPathExporter);
  }
  fixPathArrow(
    $newSVG,
    $container,
    sheetEditor,
    targetBranchView,
    getViewListCallback,
    pathExporter,
  ) {
    const viewList = getViewListCallback(sheetEditor, targetBranchView);
    viewList.forEach((view) => {
      pathExporter.export(view, view.arrowSelector).forEach(($elem) => {
        $newSVG.find(`#${$elem.attr("id")}`).remove();
        $container.append($elem);
      });
    });
  }
  optimizeColorForWbPrintMode($newSVG, sheetEditor) {
    const optimizedLineColor = "#0D0D0D";
    function getOptimizedFrontColor(frontColor, quickClass?) {
      let {
        // eslint-disable-next-line prefer-const
        h,
        l,
      } = esm.snowballUtil.hexStringToHSLObject(frontColor);
      if (quickClass === CLASS_TYPE.IMPORTANT_TOPIC) {
        l = l - l / 1.2;
      } else if (quickClass === CLASS_TYPE.MINOR_TOPIC) {
        l = l - l / 2;
      } else if (l >= 56 && l <= 80) {
        l = l - l / 2.5;
      }
      return esm.snowballUtil.hslObjectToHexString({
        h,
        s: 0,
        l,
      });
    }
    function getBranchViewOptimizedFillColor(branchView) {
      const quickClass = styleManager.getClassList(branchView)[0];
      return getOptimizedFrontColor(
        branchView.topicView.figure.visualFillColor,
        quickClass,
      );
    }
    function getTargetElement(s$sourceElement) {
      if (!s$sourceElement) {
        return null;
      }
      return $newSVG.find(`#${s$sourceElement.attr("id")}`);
    }
    function treatTopicFillColor(branchView) {
      const topicFillAttrKey = Object(utils.isSolidFillPattern)(
        branchView.topicView.figure.fillPattern,
      )
        ? "fill"
        : "stroke";
      const optimizedFillColor = getBranchViewOptimizedFillColor(branchView);
      getTargetElement(
        branchView.topicView.figure.renderWorker.topicShapeFill,
      ).attr(topicFillAttrKey, optimizedFillColor);
    }
    function treatTitleView(titleView, textColor) {
      if (!titleView) {
        return;
      }
      Array.from(titleView.figure.renderWorker.titleText.node.children).forEach(
        (node: any) => {
          const id = node.getAttribute("id");
          $newSVG.find(`#${id}`).attr("fill", textColor);
        },
      );
      getTargetElement(titleView.figure.renderWorker.svg).attr(
        "fill",
        textColor,
      );
      getTargetElement(titleView.figure.renderWorker.titleText).attr(
        "fill",
        textColor,
      );
    }
    function treatTopicTextColor(branchView) {
      const optimizedFillColor = getBranchViewOptimizedFillColor(branchView);
      treatTitleView(
        branchView.topicView.titleView,
        Object(esm.getSmartTextColor)(optimizedFillColor, ["#000", "#fff"]),
      );
    }
    function treatTopicBorderColor(branchView) {
      const quickClass = styleManager.getClassList(branchView)[0];
      const optimizedBorderColor = getOptimizedFrontColor(
        branchView.topicView.figure.borderColor,
        quickClass,
      );
      getTargetElement(
        branchView.topicView.figure.renderWorker.topicShape,
      ).attr("stroke", optimizedBorderColor);
    }
    function treatBranchLineColor(branchView) {
      let _b;
      let _d;
      const connectionFigure = branchView.getConnectionView().figure;
      const attrKey =
        connectionFigure.lineTapered &&
        ![LINE_PATTERN.HANDDRAWNDASH, LINE_PATTERN.HANDDRAWNSOLID].includes(
          connectionFigure.linePattern,
        )
          ? "fill"
          : "stroke";
      getTargetElement(
        branchView.getConnectionView().figure.renderWorker.s$svg,
      ).attr(attrKey, optimizedLineColor);
      if (
        (_b = getTargetElement(
          branchView.getConnectionView().arrowSelector.getEndArrowDomInfo()
            ?.s$SVG,
        )) === null ||
        _b === undefined
      ) {
        // do nothing
      } else {
        _b.attr({
          fill: optimizedLineColor,
          stroke: optimizedLineColor,
        });
      }
      if (
        (_d = getTargetElement(
          branchView.getConnectionView().arrowSelector.getBeginArrowDomInfo()
            ?.s$SVG,
        )) === null ||
        _d === undefined
      ) {
        // do nothing
      } else {
        _d.attr({
          fill: optimizedLineColor,
          stroke: optimizedLineColor,
        });
      }
    }
    function treatMatrixCell(branchView) {
      const matrixView = branchView.getMatrixView();
      if (!matrixView) {
        return;
      }
      const headBranchQuickClass = styleManager.getClassList(branchView)[0];
      const headBranchViewFillColor = getOptimizedFrontColor(
        branchView.topicView.figure.visualFillColor,
        headBranchQuickClass,
      );
      const matrixLabelFillColor = matrixUtils.getFillColor(
        headBranchViewFillColor,
      );
      const matrixLebelTextColor = Object(esm.getSmartTextColor)(
        matrixLabelFillColor,
        ["#000", "#fff"],
      );
      matrixView.getCellViews().forEach((cellView) => {
        const cellProxyView = cellView.getProxyView();
        const isLabelView =
          cellProxyView instanceof MatrixLabelView || !cellProxyView;
        let matrixCellFillColor = matrixLabelFillColor;
        if (!isLabelView && cellProxyView instanceof BranchView) {
          matrixCellFillColor = getBranchViewOptimizedFillColor(cellProxyView);
        }
        // matrix cell fill color
        getTargetElement(cellView.figure.renderWorker._s$fillPath).attr(
          "fill",
          matrixCellFillColor,
        );
        // matrix cell text color
        if (isLabelView && cellProxyView && !cellView.isNull) {
          Array.from(
            cellProxyView.figure.renderWorker.titleText.node.children,
          ).forEach((node: any) => {
            const matrixLabelTextElementId = node.getAttribute("id");
            $newSVG
              .find(`#${matrixLabelTextElementId}`)
              .attr("fill", matrixLebelTextColor);
          });
        }
        // matrix cell border color
        const matrixCellBorderColor = optimizedLineColor;
        getTargetElement(cellView.figure.renderWorker._s$borderPath).attr(
          "stroke",
          matrixCellBorderColor,
        );
      });
    }
    function treatTreeTableCell(branchView) {
      const treeTableCellView = branchView.getTreeTableCellView();
      if (!treeTableCellView) {
        return;
      }
      const treeTableFillColor = getBranchViewOptimizedFillColor(branchView);
      getTargetElement(
        treeTableCellView.figure.renderWorker.s$treeTableFill,
      ).attr("fill", treeTableFillColor);
      const treeTableBorderColor = optimizedLineColor;
      getTargetElement(
        treeTableCellView.figure.renderWorker.s$treeTableStroke,
      ).attr("stroke", treeTableBorderColor);
    }
    function treatFishBoneLine(branchView) {
      const fishboneHeadLineView = branchView.getFishboneHeadLineView();
      if (fishboneHeadLineView) {
        const fishboneHeadLineColor = optimizedLineColor;
        getTargetElement(
          fishboneHeadLineView.figure.renderWorker.s$fishBoneLine,
        ).attr({
          stroke: fishboneHeadLineColor,
          fill: fishboneHeadLineColor,
        });
      }
      const fishboneMainLineView = branchView.getFishboneMainLineView();
      if (fishboneMainLineView) {
        const fishboneMainLineColor = optimizedLineColor;
        getTargetElement(
          fishboneMainLineView.figure.renderWorker.s$fishBoneLine,
        ).attr({
          stroke: fishboneMainLineColor,
          fill: fishboneMainLineColor,
        });
      }
    }
    function treatTimeline(branchView) {
      const timelineMainLineView = branchView.getTimelineMainLineView();
      if (timelineMainLineView) {
        const timelineMainLineColor = optimizedLineColor;
        // @ts-ignore
        getTargetElement(timelineMainLineView.figure.renderWorker.s$line).attr({
          stroke: timelineMainLineColor,
        });
        // @ts-ignore
        timelineMainLineView.figure.renderWorker.s$steps
          .children()
          .forEach((step) => {
            getTargetElement(step).attr({
              fill: timelineMainLineColor,
            });
          });
      }
    }
    function treatBoundaryView(branchView) {
      branchView.boundaries.forEach((boundaryView) => {
        const borderColor = optimizedLineColor;
        getTargetElement(boundaryView.figure.renderWorker.boundaryPath).attr(
          "stroke",
          borderColor,
        );
        const fillColor = getOptimizedFrontColor(boundaryView.figure.fillColor);
        getTargetElement(
          boundaryView.figure.renderWorker.boundaryFillPath,
        ).attr("fill", fillColor);
        const textColor = Object(esm.getSmartTextColor)(borderColor, [
          "#000",
          "#fff",
        ]);
        treatTitleView(boundaryView.titleView, textColor);
        getTargetElement(
          boundaryView.titleView.figure.renderWorker.boundaryTitleBG,
        ).attr("fill", borderColor);
      });
    }
    const sheetView = sheetEditor.getSheetView();
    const centralBranchView = sheetView.centralBranchView;
    const allChildrenBranchView = centralBranchView.getDescendantBranchesByType(
      ...ALL_TOPIC_TYPES,
    );
    // treat all branchview
    const allBranchView = [centralBranchView, ...allChildrenBranchView];
    allBranchView.forEach((branchView) => {
      treatTopicFillColor(branchView);
      treatTopicTextColor(branchView);
      treatTopicBorderColor(branchView);
      treatBranchLineColor(branchView);
      treatBoundaryView(branchView);
      treatMatrixCell(branchView);
      treatTreeTableCell(branchView);
      treatFishBoneLine(branchView);
      treatTimeline(branchView);
    });
    // treat all relationship
    sheetView.relationships.forEach((relationshipView) => {
      let _b;
      let _d;
      const lineColor = optimizedLineColor;
      getTargetElement(relationshipView.figure.renderWorker.path).attr(
        "stroke",
        lineColor,
      );
      if (
        (_b = getTargetElement(
          relationshipView.arrowSelector.getEndArrowDomInfo()?.s$SVG,
        )) === null ||
        _b === undefined
      ) {
        // do nothing
      } else {
        _b.attr({
          fill: lineColor,
          stroke: lineColor,
        });
      }
      if (
        (_d = getTargetElement(
          relationshipView.arrowSelector.getBeginArrowDomInfo()?.s$SVG,
        )) === null ||
        _d === undefined
      ) {
        // no thing
      } else {
        _d.attr({
          fill: lineColor,
          stroke: lineColor,
        });
      }
      treatTitleView(relationshipView.titleView, "#000");
    });
    // treat background color
    $newSVG.css("background-color", "#fff");
  }
  _fixTransparentCentralBranchInMapStructure(
    $newSVG,
    sheetEditor,
    targetBranchView,
  ) {
    if (targetBranchView && !Object(utils.isRootBranch)(targetBranchView)) {
      return;
    }
    const structureListToFix = [
      STRUCTURECLASS.MAP,
      STRUCTURECLASS.MAPUNBALANCED,
      STRUCTURECLASS.MAPCLOCKWISE,
      STRUCTURECLASS.MAPANTICLOCKWISE,
      STRUCTURECLASS.MAPFLOATING,
      STRUCTURECLASS.MAPFLOATINGCLOCKWISE,
      STRUCTURECLASS.MAPFLOATINGANTICLOCKWISE,
    ];
    const sheetView = sheetEditor.getSheetView();
    const centralBranchView = sheetView.getCentralBranchView();
    if (!structureListToFix.includes(centralBranchView.getStructureClass())) {
      return;
    }
    const { snowballUtil } = Object(utils.getInjectModule)(
      MODULE_NAME.SNOWBALL,
    );
    const centralBranchRGBA = snowballUtil.hexStringToRgbObject(
      centralBranchView.topicView.figure.fillColor,
    );
    if (
      centralBranchView.topicView.figure.fillColor !== "none" &&
      centralBranchRGBA.a == 1
    ) {
      return;
    }
    // set central branch view fill rect's fill color to sheet fill color
    const centralBranchViewFillRectId =
      centralBranchView.topicView.topicShapeFill.node.getAttribute("id");
    const $targetFillRectInNewSVG = $newSVG.find(
      `#${centralBranchViewFillRectId}`,
    );
    let currentFill = "none";
    if (centralBranchView.topicView.figure.fillColor === "none") {
      currentFill = sheetView.figure.backgroundColor;
    } else {
      currentFill = snowballUtil.blendingColor(
        centralBranchRGBA,
        sheetView.figure.backgroundColor,
      );
    }
    $targetFillRectInNewSVG.attr({
      opacity: 1,
      fill: currentFill,
    });
  }
  _fixRelationshipTitle($newSVG, sheetEditor, targetBranchView, noBackground) {
    let relationshipViewList;
    if (targetBranchView) {
      relationshipViewList = this._getRelationshipViewListInBranchTree(
        targetBranchView,
        sheetEditor,
      );
    } else {
      relationshipViewList = [...sheetEditor.getSheetView().relationships];
    }
    relationshipViewList.forEach((relationshipView) => {
      if (relationshipView.model.getTitle()) {
        const $bgRect = jquery("<rect />");
        const titleRealPosition = relationshipView.titleView.getRealPosition();
        const titleBounds = Object.assign(
          {},
          relationshipView.titleView.bounds,
        );
        $bgRect.attr({
          width: titleBounds.width,
          height: titleBounds.height,
          x: titleRealPosition.x,
          y: titleRealPosition.y,
          fill: noBackground
            ? "#fff"
            : sheetEditor.getSheetView().figure.backgroundColor,
        });
        $newSVG
          .find(
            `#${relationshipView.titleView.figure.renderWorker.svg.node.getAttribute("id")}`,
          )
          .before($bgRect);
      }
    });
  }
  _fixGradientBGColor($newSVG, sheetEditor, targetBranchView) {
    const isGradient = sheetEditor.getSheetView().isGradient();
    if (!isGradient) {
      return;
    }
    targetBranchView =
      targetBranchView || sheetEditor.getSheetView().getCentralBranchView();
    const branchViewList = [
      ...targetBranchView.getDescendantBranchesByType(ALL_TOPIC_TYPES),
      targetBranchView,
    ];
    const boundaryViewList = branchViewList.reduce((pre, cur) => {
      return pre.concat([...cur.boundaries]);
    }, []);
    branchViewList.forEach((branchView) => {
      const fillPathId =
        branchView.topicView.figure.renderWorker.topicShapeFill.id();
      $newSVG
        .find(`#${fillPathId}`)
        .attr("fill", branchView.topicView.figure.fillColor);
    });
    boundaryViewList.forEach((boundaryView) => {
      const fillPathId = boundaryView.figure.renderWorker.boundaryFillPath.id();
      $newSVG
        .find(`#${fillPathId}`)
        .attr("fill", boundaryView.figure.fillColor);
    });
  }
  _addTopicHref($newSVG, sheetEditor, targetBranchView) {
    targetBranchView =
      targetBranchView || sheetEditor.getSheetView().getCentralBranchView();
    const branchViewList =
      targetBranchView.getDescendantBranchesByType(ALL_TOPIC_TYPES);
    branchViewList.push(targetBranchView);
    branchViewList.forEach((branchView) => {
      const href = branchView.model.getHref();
      if (!href) {
        return;
      }
      const informationIconView = branchView.topicView.informationIconView;
      if (informationIconView.iconType !== VIEW_TYPE.HREF) {
        return;
      }
      const id = informationIconView.el.id;
      const iconG = $newSVG.find(`#${id}`)[0];
      const aLink = document.createElementNS(lib.SVG.ns, "a");
      aLink.setAttribute("href", href);
      aLink.setAttribute("target", "_blank");
      const iconGParent = iconG.parentNode;
      iconGParent.replaceChild(aLink, iconG);
      aLink.appendChild(iconG);
    });
  }
  /**
   * @param {BranchView} branchView
   * @param {SheetEditor} sheetEditor
   * @return {jQuery}
   * */
  _getBranchTreeSVG(branchView, sheetEditor) {
    const $svgContainer = jquery(
      '<svg id="SvgjsSvg1001" xmlns="http://www.w3.org/2000/svg" version="1.1" width="100%" height="100%" xmlns:xlink="http://www.w3.org/1999/xlink" style="display: block; background-color: rgb(255, 255, 255);"></svg>',
    );
    const $mainGroupContainer = jquery('<g data-name="sheet"></g>');
    // 处理branch (summary已包含在其中)
    const $branchGroupContainer = jquery("<g></g>");
    // 处理connect line
    const $connectionLineGroupContainer = jquery("<g></g>");
    // 处理boundary
    const $boundaryGroupContainer = jquery("<g></g>");
    // 处理matrix 矩阵
    const $matrixGroupContainer = jquery("<g></g>");
    // deal tree map cell
    const $treeTableCellGroupContainer = jquery("<g></g>");
    // 处理relationship
    const $relationshipGroupContainer = jquery("<g></g>");
    const allBranchList = this._getAllBranchViewListInBranchTree(branchView);
    allBranchList.forEach((itemBranchView) => {
      $branchGroupContainer.append(jquery(itemBranchView.el).clone());
      if (itemBranchView !== branchView) {
        const connectionPath = itemBranchView.getConnectionView().getSvg();
        if (connectionPath) {
          $connectionLineGroupContainer.append(
            jquery(connectionPath.node.outerHTML),
          );
        }
      }
      if (itemBranchView.getFishboneHeadLineView()) {
        $connectionLineGroupContainer.append(
          itemBranchView.getFishboneHeadLineView().figure.renderWorker.s$svg
            .node.outerHTML,
        );
      }
      if (itemBranchView.getFishboneMainLineView()) {
        $connectionLineGroupContainer.append(
          itemBranchView.getFishboneMainLineView().figure.renderWorker.s$svg
            .node.outerHTML,
        );
      }
      itemBranchView.boundaries.forEach((itemBoundaryView) => {
        $boundaryGroupContainer.append(
          jquery(itemBoundaryView.$el[0].outerHTML),
        );
      });
      // 存在matrixView属性的bracnhView就是matrix主branch
      if (itemBranchView.getMatrixView()) {
        $matrixGroupContainer.append(
          jquery(itemBranchView.getMatrixView().$el[0].outerHTML),
        );
      }
      if (itemBranchView.getTreeTableCellView()) {
        $treeTableCellGroupContainer.append(
          jquery(itemBranchView.getTreeTableCellView().$el[0].outerHTML),
        );
      }
    });
    this._getFullWrappedBoundaryViewListInBranchTree(branchView).forEach(
      (boundaryView) => {
        $boundaryGroupContainer.append(jquery(boundaryView.$el[0].outerHTML));
      },
    );
    this._getRelationshipViewListInBranchTree(branchView, sheetEditor).forEach(
      (relationshipView) => {
        $relationshipGroupContainer.append(
          jquery(relationshipView.$el[0].outerHTML),
        );
      },
    );
    $mainGroupContainer
      .append($connectionLineGroupContainer)
      .append($boundaryGroupContainer)
      .append($matrixGroupContainer)
      .append($treeTableCellGroupContainer)
      .append($branchGroupContainer)
      .append($relationshipGroupContainer);
    $svgContainer
      .append($mainGroupContainer)
      .append(
        jquery(sheetEditor.getSVGView().svg.node.outerHTML).find("> defs"),
      );
    $svgContainer.css(
      "background-color",
      sheetEditor.getSheetView().figure.backgroundColor,
    );
    return $svgContainer;
  }
  _getAllBranchViewListInBranchTree(branchView) {
    const allBranchList = [
      branchView,
      ...Object(utils.getAllChildrenBranchViewList)(branchView),
    ];
    this._getFullWrappedSummaryBranchViewListInBranchTree(branchView).forEach(
      (summaryBranchView) => {
        allBranchList.push(
          summaryBranchView,
          ...Object(utils.getAllChildrenBranchViewList)(summaryBranchView),
        );
      },
    );
    return allBranchList;
  }
  _getRelationshipViewListInBranchTree(branchView, sheetEditor) {
    const allBranchList = this._getAllBranchViewListInBranchTree(branchView);
    const relationShipViewList = sheetEditor.getSheetView().relationships;
    return relationShipViewList.filter((relationshipView) => {
      const end1ViewInBranchTree = allBranchList.includes(
        relationshipView.end1View,
      );
      const end2ViewInBranchTree = allBranchList.includes(
        relationshipView.end2View,
      );
      return end1ViewInBranchTree && end2ViewInBranchTree;
    });
  }
  _getFullWrappedSummaryBranchViewListInBranchTree(branchView) {
    const parentBranchView = branchView.parent();
    if (!Object(utils.isBranch)(parentBranchView)) {
      return [];
    }
    const targetBranchViewIndex = branchView.branchIndex();
    const summaryBranchViewList = parentBranchView.getChildrenBranchesByType(
      TOPIC_TYPE.SUMMARY,
    );
    return summaryBranchViewList.filter((summaryBranchView) => {
      const summaryModel = summaryBranchView.summaryView.model;
      if (
        summaryModel.rangeStart === summaryModel.rangeEnd &&
        targetBranchViewIndex === summaryModel.rangeStart
      ) {
        return true;
      }
    });
  }
  _getFullWrappedBoundaryViewListInBranchTree(branchView) {
    const parentBranchView = branchView.parent();
    if (!Object(utils.isBranch)(parentBranchView)) {
      return [];
    }
    const targetBranchViewIndex = branchView.branchIndex();
    return parentBranchView.boundaries.filter((boundaryView) => {
      const boundaryModel = boundaryView.model;
      if (
        boundaryModel.rangeStart === boundaryModel.rangeEnd &&
        targetBranchViewIndex === boundaryModel.rangeStart
      ) {
        return true;
      }
    });
  }
  _getFontsInSheet(sheetEditor, skipFont) {
    // information-iconfont 是 topic 的 information icon 的 iconfont.
    const fonts = {
      "information-iconfont": 1,
    };
    if (!skipFont) {
      const svgView = sheetEditor.getSVGView();
      Object.keys(svgView.model2View).forEach((model) => {
        const view = svgView.model2View[model];
        if (view.model instanceof StyleComponent) {
          const ffs = styleManager.getStyleValue(view, STYLE_KEYS.FONT_FAMILY);
          if (ffs) {
            ffs
              .split(",")
              .forEach((fontFamily) => fontFamily && (fonts[fontFamily] = 1));
          }
        }
      });
    }
    const ret = Object.keys(fonts).map((fontName) => {
      return fontName.replace(/['"]/g, ""); //god know why they put ["] around font name.
    });
    return ret;
  }
  _hideInteractiveElements($newSVG, options: any = {}) {
    let dataNames = [
      "topic-select-box-container",
      "select-box-container",
      "other-container",
      "multi-select-box_container",
      "resize-box",
      "relationship-action-path",
      "controlPoint-group",
      "marker_border_box",
      "icon-border-box",
      "boundary-action-path",
      "cell-select-box",
      "matrix-plus-box",
      "topic-custom-width-control-bar",
      "relationship-default-title",
      "tree-map-select-box",
    ];
    if (options.hideCollapseOpen) {
      dataNames = dataNames.concat("collapse-folded");
    }
    if (options.hideCollapseClose) {
      dataNames = dataNames.concat("collapse-extended");
    }
    dataNames.forEach((dataName) => {
      if (dataName === "relationship-default-title") {
        const targetDefaultTitle = $newSVG.find(`[data-name="${dataName}"]`);
        targetDefaultTitle
          .siblings('[data-name="relationship-path"]')
          .attr("clip-path", "");
      }
      $newSVG.find(`[data-name="${dataName}"]`).remove();
    });
  }
  _fixMatrixAppendViewBounds(targetSvgInfo, sheetEditor, targetBranch) {
    const rootBranch = sheetEditor.getSheetView().getCentralBranchView();
    const matrixStructures = [
      STRUCTURECLASS.SPREADSHEET,
      STRUCTURECLASS.COLUMNSPREADSHEET,
    ];
    if (matrixStructures.includes(rootBranch.getStructureClass())) {
      targetSvgInfo.svgHeight -= layoutConstant.MATRIX_PLUS_RADIUS * 3;
    }
    // TODO: handle the case when target branch is not the root branch
  }
}

export const imageExporter = new ImageExporter();
export default imageExporter;

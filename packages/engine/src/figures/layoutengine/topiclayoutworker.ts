import { STRUCTURECLASS } from "../../common/constants/index";
import * as utils from "../../utils/index";

import { LayoutCell } from "../layoutengine/layouts/layout";

import { GridData, GridLayout } from "../layoutengine/layouts/gridlayout";

import { getTopicShape } from "../renderengine/svg/topicshapes/index";

function _createTopicLayout(topicView) {
  // 构建 numbering, marker icon, information icon 的 cell
  const numberingCell = _createNumberingCell(topicView);
  const markerGroupCell = _createMarkerGroupCell(topicView);
  const inforCell = _createInforCell(topicView);
  // 构建 topic title 的 cell
  const topicTitleCell = _createTitleCell(topicView);
  const topicTitleGroupCell = _createTitleGroupCell(topicView);
  topicTitleGroupCell.add(topicTitleCell);
  // 构建一个包含了 marker icon, topic title, information icon 的容器 innerGroup
  const innerGroupCell = _createInnerGroupCell(topicView);
  innerGroupCell.add(numberingCell);
  innerGroupCell.add(markerGroupCell);
  innerGroupCell.add(topicTitleGroupCell);
  innerGroupCell.add(inforCell);
  // 构建两个 ImageGroup，置于 innerGroup 左右两侧，适用于 topic image
  const leftImageLikeGroupCell = _createLeftImageGroupCell(topicView);
  const rightImageGroupCell = _createRightImageGroupCell(topicView);
  // 构建一个包含了 leftImage, innerGroup, rightImage 的容器 middleGroup
  const middleGroupCell = _createMiddleGroupCell(topicView);
  middleGroupCell.add(leftImageLikeGroupCell);
  middleGroupCell.add(innerGroupCell);
  middleGroupCell.add(rightImageGroupCell);
  // 构建两个 ImageGroup，置于 middleGroup 左右两侧，适用于 topic image and topic math jax
  const topImageLikeGroupCell = _createTopImageLikeGroupCell(topicView);
  const bottomImageGroupCell = _createBottomImageGroupCell(topicView);
  // 构建一个包含了 topImage, middleGroup, bottomImage 的容器 topicShapeGroup
  const topicShapeGroupCell = _createTopicShapeGroupCell(topicView);
  topicShapeGroupCell.add(topImageLikeGroupCell);
  topicShapeGroupCell.add(middleGroupCell);
  topicShapeGroupCell.add(bottomImageGroupCell);
  // 构建一个包含了 topicShapeGroup 的容器 topicShapePaddingGroup
  // 主要用于根据 contentBounds 和 topicShape 来包一层 padding
  const topicShapePaddingGroupCell =
    _createTopicShapePaddingGroupCell(topicView);
  topicShapePaddingGroupCell.add(topicShapeGroupCell);
  // 构建 topic labels 的 cell
  const labelsGroupCell = _createLabelGroupCell(topicView);
  // 构建包含 topicShapePaddingGroup, topic labels 的容器 topicCell
  // 同时 topicCell 也是最外层的容器了
  const topicCell = new LayoutCell();
  topicCell._testName = "topic";
  const gridLayoutForTopicCell = new GridLayout(1, false);
  gridLayoutForTopicCell.verticalSpacing = 4;
  topicCell.setLayout(gridLayoutForTopicCell);
  topicCell.add(topicShapePaddingGroupCell);
  topicCell.add(labelsGroupCell);
  return {
    numberingCell,
    markerGroupCell,
    inforCell,
    topicTitleCell,
    topicTitleGroupCell,
    innerGroupCell,
    leftImageLikeGroupCell,
    rightImageGroupCell,
    middleGroupCell,
    topImageLikeGroupCell,
    bottomImageGroupCell,
    topicShapeGroupCell,
    topicShapePaddingGroupCell,
    labelsGroupCell,
    topicCell,
  };
}

export const topicLayoutWorker = {
  work(viewController) {
    const topicView = viewController;
    if (!topicView.getContext()) {
      return;
    }
    const figure = topicView.figure;
    // 标记 topic title 是否以最小宽度来计算
    let useDefaultMinTopicTitleWidth = true;
    const forcedMinTopicTitleBounds = {
      width:
        (topicView._forcedMinTopicTitleBounds &&
          topicView._forcedMinTopicTitleBounds.width) ||
        0,
      height:
        (topicView._forcedMinTopicTitleBounds &&
          topicView._forcedMinTopicTitleBounds.height) ||
        0,
    };
    const branchView = topicView.parent();
    // 从 topicView._topicLayout 上读取 topicLayout
    // 若无，则构建所有 cell，并缓存挂靠在 topicView._topicLayout
    if (topicView._topicLayout === undefined) {
      topicView._topicLayout = _createTopicLayout(topicView);
    }
    const {
      numberingCell,
      markerGroupCell,
      inforCell,
      topicTitleCell,
      topicTitleGroupCell,
      innerGroupCell,
      leftImageLikeGroupCell,
      rightImageGroupCell,
      middleGroupCell,
      topImageLikeGroupCell,
      bottomImageGroupCell,
      topicShapeGroupCell,
      topicShapePaddingGroupCell,
      labelsGroupCell,
      topicCell,
    } = topicView._topicLayout;
    topicTitleCell.invalidate(true);
    // 计算 topic title 最小宽度, title 最短宽度为 'AA' 的宽度
    const { fontStyle, fontWeight, fontSize, fontFamily } =
      topicView.titleView.figure;
    const fontInfo = {
      fontStyle,
      fontWeight,
      fontSize,
      fontFamily,
    };
    const minTitleSize = Object(utils.getTextSize)("AA", fontInfo);
    // 设定 topicTitleCell 的 protectedCalcSize 方法
    topicTitleCell.protectedCalcSize = () => {
      const size = {
        width: 0,
        height: 0,
      };
      if (topicView.titleView) {
        if (!useDefaultMinTopicTitleWidth) {
          const contentCalculatedBounds = topicView.titleView.bounds;
          size.width = Math.max(
            contentCalculatedBounds.width,
            forcedMinTopicTitleBounds.width,
          );
          size.height = Math.max(
            contentCalculatedBounds.height,
            forcedMinTopicTitleBounds.height,
          );
          // fix non-content topic view size layout, exclude edit target topic view
          if (
            !topicView.titleView.figure.text &&
            !topicView.titleView.forceCalcSize
          ) {
            if (
              !topicView.numberingView &&
              !topicView.model.getMarkersData().length &&
              !topicView.getInformationData() &&
              !_hasImageLikeData(topicView)
            ) {
              const nonContentSize = Object(utils.calcTitleSize)(
                topicView.titleView,
              );
              size.height = nonContentSize.height;
              if (!topicView.titleView.figure.prefSize) {
                size.width = nonContentSize.width;
              }
            }
          }
        } else if (
          topicView.titleView.figure.text ||
          topicView.titleView.forceCalcSize
        ) {
          size.width = Math.max(
            minTitleSize.width,
            forcedMinTopicTitleBounds.width,
          );
          size.height = Math.max(
            minTitleSize.height,
            forcedMinTopicTitleBounds.height,
          );
        }
      }
      return size;
    };
    // 更新 cell.layoutData 的 exclude 属性
    numberingCell.getLayoutData().exclude = !topicView.numberingView;
    markerGroupCell.getLayoutData().exclude = !(
      topicView.model.getMarkersData().length > 0
    );
    inforCell.getLayoutData().exclude = !topicView.getInformationData();
    topicTitleGroupCell.getLayoutData().exclude = !topicView.titleView;
    topicTitleCell.getLayoutData().exclude = !topicView.titleView;
    innerGroupCell.getLayoutData().exclude = innerGroupCell
      .getChildren()
      .every((child) => child.getLayoutData().exclude);
    leftImageLikeGroupCell.getLayoutData().exclude = _isImageLikeCellExclude(
      topicView,
      "left",
    );
    rightImageGroupCell.getLayoutData().exclude = _isImageLikeCellExclude(
      topicView,
      "right",
    );
    middleGroupCell.getLayoutData().exclude = middleGroupCell
      .getChildren()
      .every((child) => child.getLayoutData().exclude);
    topImageLikeGroupCell.getLayoutData().exclude = _isImageLikeCellExclude(
      topicView,
      "top",
    );
    bottomImageGroupCell.getLayoutData().exclude = _isImageLikeCellExclude(
      topicView,
      "bottom",
    );
    labelsGroupCell.getLayoutData().exclude = !topicView.model.getLabel();
    // 第一次计算 topicShapeGroupCell 的尺寸，用于计算 padding
    const topicShapeGroupSize = topicShapeGroupCell.getPreferredSize(
      -1,
      -1,
      true,
    );
    topicShapeGroupCell.setSize(topicShapeGroupSize);
    // 根据 TopicShape 计算 padding, 生成 gridLayout, 并写入 topicShapePaddingGroupCell
    topicShapePaddingGroupCell.setLayout(
      _createTopicShapePaddingGridLayout(topicView, topicShapeGroupSize),
    );
    // 第一次计算 topicShapePaddingGroupCell 尺寸，记录 topic 最小宽度
    const minimumSize = topicShapePaddingGroupCell.getPreferredSize(
      -1,
      -1,
      true,
    );
    figure.setMinimumWidth(minimumSize.width);
    // topic 自定义宽度相关的初始化
    let topicPreferredWidth = topicView.figure.customWidth;
    if (topicView.figure.forceAlignmentWidth) {
      topicPreferredWidth = topicView.figure.forceAlignmentWidth;
    }
    const isFixedAspectShape = Object(utils.isFixedAspectShapeBranch)(
      branchView,
    );
    const topicShape = Object(utils.getTopicShape)(branchView);
    // 处理 topic 自定义宽度
    if (topicPreferredWidth) {
      let applyWidth = Math.max(topicPreferredWidth, minimumSize.width);
      let customWidthUpdated = false;
      const calcTitleShapeGroupCellSize = (applyWidth) => {
        let contentWidth;
        if (isFixedAspectShape) {
          // For fixed aspect shapes:
          // derive content area width by the ratio of specific shape
          contentWidth = topicShape.getDerivedContentSize(
            branchView,
            applyWidth,
          ).width;
        } else {
          // For fixed margin shapes
          const topicSize = topicView?.titleView?.bounds || topicShapeGroupSize;
          const margin = topicShape.getTopicMargins(branchView, topicSize);
          contentWidth = Math.max(
            applyWidth - (margin.left + margin.right),
            minTitleSize.width,
          );
        }
        const topicShapeGroupSizeCompute = topicShapeGroupCell.getPreferredSize(
          contentWidth,
          -1,
          true,
        );
        topicShapeGroupCell.setSize(topicShapeGroupSizeCompute);
        const iterChildren = (parent) => {
          for (const child of parent.getChildren()) {
            child.getPreferredSize(child.getSize().width, -1, true);
            iterChildren(child);
          }
        };
        iterChildren(topicShapeGroupCell);
        // 更新 topicView.titleView 的宽度
        const topicTitleGroupSize = topicTitleGroupCell.getSize();
        if (topicView.titleView) {
          topicView.titleView.figure.setPreferredSize(
            topicPreferredWidth ? topicTitleGroupSize : null,
          );
          topicView.titleView.figure.layoutWorker.work(topicView.titleView);
          useDefaultMinTopicTitleWidth = false;
          topicTitleCell.setPreferredSize(topicView.titleView.figure.prefSize);
          // fix topic shape group size when topic content is empty
          const hHint =
            isFixedAspectShape && topicTitleGroupSize.height <= 0 ? 0 : -1;
          topicShapeGroupCell.setSize(
            topicShapeGroupCell.getPreferredSize(-1, hHint, true),
          );
        }
        return topicShapeGroupCell.getSize(); // as content area size
      };
      /**
       * For fixed aspect shapes, if a smaller custom width will leads
       * topic scaled up, calculate a new custom width by dichotomy
       * to make sure that shape will shrink.
       */
      const oldCustomWidth = figure.customWidth;
      if (isFixedAspectShape && oldCustomWidth && applyWidth < oldCustomWidth) {
        const originShapePaddingWidth = topicView.shapeBounds.width;
        while (true) {
          const contentAreaSize = calcTitleShapeGroupCellSize(applyWidth);
          const newShapePaddingWidth = topicShape.getFinalShapeSizeWithPadding(
            branchView,
            contentAreaSize,
          ).width;
          if (newShapePaddingWidth > originShapePaddingWidth) {
            customWidthUpdated = true;
            applyWidth = (applyWidth + oldCustomWidth) / 2;
            // limit derived range to prevent endless loop
            if (Math.abs(oldCustomWidth - applyWidth) < 1) {
              applyWidth = oldCustomWidth;
              break;
            }
          } else {
            /**
             * With this algorithm, in some case an **updated width** already produced a
             * suitable shapePaddingWidth, but this width is still too small, so we
             * re-write it by the new shapePaddingWidth.
             */
            customWidthUpdated = newShapePaddingWidth > applyWidth;
            applyWidth = customWidthUpdated ? newShapePaddingWidth : applyWidth;
            break;
          }
        }
        if (customWidthUpdated) {
          topicView.model.customWidth(applyWidth);
        }
      } else {
        calcTitleShapeGroupCellSize(applyWidth);
      }
    } else {
      // 用户没有设定该 topic 的自定义宽度时，宽度根据实际内容适应
      if (topicView.titleView) {
        topicView.titleView.figure.setPreferredSize(null);
        topicView.titleView.figure.layoutWorker.work(topicView.titleView);
        useDefaultMinTopicTitleWidth = false;
      }
      // 由于 titleView 的宽度产生了变化，所以 topicShapeGroupSize 也要更新
      const topicShapeGroupSize = topicShapeGroupCell.getPreferredSize(
        -1,
        -1,
        true,
      );
      topicShapeGroupCell.setSize(topicShapeGroupSize);
      // 由于 title 的上方或下方可能有尺寸更大的 image 主导了 topic 宽度，
      // 所以要确保在这种情况下，title 的宽度仍然拉伸沾满剩余空白，否则居中居右会失效
      const iterChildren = (parent) => {
        for (const child of parent.getChildren()) {
          child.getPreferredSize(child.getSize().width, -1, true);
          iterChildren(child);
        }
      };
      iterChildren(topicShapeGroupCell);
      const topicTitleGroupSize = topicTitleGroupCell.getSize();
      if (topicView.titleView) {
        topicView.titleView.setSize(
          Object.assign(Object.assign({}, topicView.titleView.figure.size), {
            width: Math.ceil(topicTitleGroupSize.width),
          }),
        );
      }
    }
    // 由于 topicShapeGroupSize 产生了变化，故 topicShapePaddingGroupCell 也要更新
    topicShapePaddingGroupCell.setLayout(
      _createTopicShapePaddingGridLayout(
        topicView,
        topicShapeGroupCell.getSize(),
      ),
    );
    const topicShapePaddingGroupSize =
      topicShapePaddingGroupCell.getPreferredSize(-1, -1, true);
    topicShapePaddingGroupCell.setSize(topicShapePaddingGroupSize);
    // topicView.labelsView 的宽度与 topicShapePaddingGroup 宽度一致
    if (topicView.labelsView) {
      const labelsViewWidth = topicShapePaddingGroupCell.getSize().width;
      topicView.labelsView.setParentWidth(labelsViewWidth);
    }
    const topicSize = topicCell.getPreferredSize(
      topicShapePaddingGroupCell.getSize().width,
      -1,
      true,
    );
    topicCell.setSize(topicSize);
    // 写入 layout 结果
    topicView.figure.setTopicShapeGroupPosition({
      x: topicShapePaddingGroupCell.getPosition().x,
      y: topicShapePaddingGroupCell.getPosition().y,
    });
    topicView.figure.setTopicContentPosition({
      x:
        topicShapeGroupCell.getPosition().x -
        topicShapePaddingGroupCell.getSize().width / 2,
      y:
        topicShapeGroupCell.getPosition().y -
        topicShapePaddingGroupCell.getSize().height / 2,
    });
    topicView.figure.setTopicInnerElementPosition({
      x: innerGroupCell.getPosition().x + middleGroupCell.getPosition().x,
      y: innerGroupCell.getPosition().y + middleGroupCell.getPosition().y,
    });
    if (_hasImageLikeData(topicView)) {
      let position;
      switch (_getImageLikeAlign(topicView)) {
        case "left":
          position = {
            x:
              leftImageLikeGroupCell.getPosition().x +
              middleGroupCell.getPosition().x,
            y:
              leftImageLikeGroupCell.getPosition().y +
              middleGroupCell.getPosition().y,
          };
          break;
        case "bottom":
          position = bottomImageGroupCell.getPosition();
          break;
        case "right":
          position = {
            x:
              rightImageGroupCell.getPosition().x +
              middleGroupCell.getPosition().x,
            y:
              rightImageGroupCell.getPosition().y +
              middleGroupCell.getPosition().y,
          };
          break;
        case "top":
        default:
          position = topImageLikeGroupCell.getPosition();
      }
      (topicView.mathJaxView || topicView.image).move(position.x, position.y);
    }
    if (topicView.numberingView) {
      topicView.numberingView.move(
        numberingCell.getPosition().x,
        numberingCell.getPosition().y,
      );
    }
    if (topicView.markersView) {
      topicView.markersView.figure.setPosition({
        x: markerGroupCell.getPosition().x,
        y: markerGroupCell.getPosition().y,
      });
    }
    if (topicView.titleView) {
      topicView.titleView.move(
        topicTitleGroupCell.getPosition().x,
        topicTitleGroupCell.getPosition().y,
      );
    }
    if (topicView.informationIconView) {
      topicView.informationIconView.figure.setPosition({
        x: inforCell.getPosition().x,
        y: inforCell.getPosition().y,
      });
    }
    if (topicView.labelsView) {
      topicView.labelsView.figure.setPosition({
        x:
          labelsGroupCell.getPosition().x -
          topicShapePaddingGroupCell.getSize().width / 2,
        y:
          labelsGroupCell.getPosition().y -
          topicShapePaddingGroupCell.getSize().height / 2,
      });
    }
    topicView.contentBounds = Object.assign(
      {
        x: -topicShapeGroupCell.getSize().width / 2,
        y: -topicShapeGroupCell.getSize().height / 2,
      },
      topicShapeGroupCell.getSize(),
    );
    topicView.shapeBounds = Object.assign(
      {
        x: -topicShapePaddingGroupCell.getSize().width / 2,
        y: -topicShapePaddingGroupCell.getSize().height / 2,
      },
      topicShapePaddingGroupCell.getSize(),
    );
    topicView.bounds = Object.assign(
      {
        x: topicView.shapeBounds.x,
        y: topicView.shapeBounds.y,
      },
      topicCell.getSize(),
    );
    layoutSiblingsBranchViewInTimeLineHorizon(topicView);
    topicView.figure.setSize(
      Object.assign({}, topicView.bounds),
      isFixedAspectShape,
    );
    topicView.trigger("change:bounds", topicView.bounds, topicView);
    // work effect
    if (figure.shapeClassDirty || figure.sizeDirty) {
      topicShape.render(figure.viewController);
    }
    return topicView.bounds;
  },
};
/**
 * @description create a new gridLayoutForTopicShapePaddingGroupCell
 * @param {*} topicView
 * @param {*} topicShapeGroupSize
 */
function _createTopicShapePaddingGridLayout(topicView, topicShapeGroupSize) {
  const contentBounds = Object.assign(
    {
      x: -topicShapeGroupSize.width / 2,
      y: -topicShapeGroupSize.height / 2,
    },
    topicShapeGroupSize,
  );
  // 根据 contentBounds 和 topicShape 来设定 padding
  const ts = Object(getTopicShape)(topicView.figure.shapeClass);
  const padding = ts.getTopicMargins(topicView.parent(), contentBounds);
  const gridLayout = new GridLayout(1);
  gridLayout.marginTop = padding.top;
  gridLayout.marginLeft = padding.left;
  gridLayout.marginBottom = padding.bottom;
  gridLayout.marginRight = padding.right;
  return gridLayout;
}
/**
 * @description create a new TopicShapeGroupCell
 * @param {*} topicView
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _createTopicShapeGroupCell(topicView) {
  const cell = new LayoutCell();
  cell._testName = "shapeGroup";
  const gridLayout = new GridLayout(1);
  gridLayout.verticalSpacing = 10;
  cell.setLayout(gridLayout);
  const gridData = new GridData({
    horizontalAlignment: GridData.FILL,
    verticalAlignment: GridData.FILL,
    grabExcessHorizontalSpace: true,
    grabExcessVerticalSpace: true,
  });
  cell.setLayoutData(gridData);
  return cell;
}
/**
 * @description create a new TopicShapePaddingGroupCell
 * @param {*} topicView
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _createTopicShapePaddingGroupCell(topicView) {
  const cell = new LayoutCell();
  cell._testName = "paddingGroup";
  const gridData = new GridData({
    horizontalAlignment: GridData.FILL,
    verticalAlignment: GridData.FILL,
    grabExcessHorizontalSpace: true,
    grabExcessVerticalSpace: true,
  });
  cell.setLayoutData(gridData);
  return cell;
}
/**
 * @description create a new MiddleGroupCell
 * @param {*} topicView
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _createMiddleGroupCell(topicView) {
  const cell = new LayoutCell();
  cell._testName = "centerGroup";
  const gridLayout = new GridLayout(3, false);
  gridLayout.horizontalSpacing = 10;
  cell.setLayout(gridLayout);
  const gridData = new GridData({
    horizontalAlignment: GridData.FILL,
    verticalAlignment: GridData.FILL,
    grabExcessHorizontalSpace: true,
    grabExcessVerticalSpace: true,
  });
  cell.setLayoutData(gridData);
  return cell;
}
function hasSameAlign(testAlign, targetAlign) {
  if (targetAlign === "top") {
    return testAlign === "top" || testAlign === "up" || !testAlign;
  } else {
    return testAlign === targetAlign;
  }
}
function _hasImageLikeData(topicView) {
  if (topicView.mathJaxView || topicView.image) {
    return true;
  }
}
function _getImageLikeAlign(topicView) {
  if (topicView.mathJaxView) {
    return topicView.mathJaxView.figure.align;
  }
  const topicImage = topicView.model.get("image");
  if (topicImage && typeof topicImage === "object") {
    return topicImage.align;
  }
}
function _createProtectedCalcImageLikeSizeFunc(topicView, targetAlign) {
  return () => {
    if (!hasSameAlign(_getImageLikeAlign(topicView), targetAlign)) {
      return {
        width: 0,
        height: 0,
      };
    }
    if (topicView.mathJaxView) {
      return topicView.mathJaxView.figure.size;
    }
    const topicImage = topicView.model.get("image");
    if (topicImage && topicImage.src && topicView.image) {
      return topicView.image.bounds;
    }
  };
}
function _isImageLikeCellExclude(topicView, targetAlign) {
  if (topicView.mathJaxView) {
    const mathJaxViewFigure = topicView.mathJaxView.figure;
    return !hasSameAlign(mathJaxViewFigure.align, targetAlign);
  }
  const topicImage = topicView.model.get("image");
  const hasImage =
    topicImage &&
    typeof topicImage === "object" &&
    topicImage.src &&
    topicView.image;
  return !hasImage || !hasSameAlign(topicImage.align, targetAlign);
}
/**
 * @description create a new leftImageLikeGroupCell
 * @param {*} topicView
 */
function _createLeftImageGroupCell(topicView) {
  const cell = new LayoutCell();
  cell._testName = "imageLeft";
  cell.protectedCalcSize = _createProtectedCalcImageLikeSizeFunc(
    topicView,
    "left",
  );
  const gridData = new GridData({
    horizontalAlignment: GridData.BEGINNING,
    verticalAlignment: GridData.CENTER,
  });
  cell.setLayoutData(gridData);
  return cell;
}
/**
 * @description create a new RightImageGroupCell
 * @param {*} topicView
 */
function _createRightImageGroupCell(topicView) {
  const cell = new LayoutCell();
  cell._testName = "imageRight";
  cell.protectedCalcSize = _createProtectedCalcImageLikeSizeFunc(
    topicView,
    "right",
  );
  const gridData = new GridData({
    horizontalAlignment: GridData.END,
    verticalAlignment: GridData.CENTER,
  });
  cell.setLayoutData(gridData);
  return cell;
}
/**
 * @description create a new topImageLikeGroupCell
 * @param {*} topicView
 */
function _createTopImageLikeGroupCell(topicView) {
  const cell = new LayoutCell();
  cell._testName = "imageTop";
  cell.protectedCalcSize = _createProtectedCalcImageLikeSizeFunc(
    topicView,
    "top",
  );
  const gridData = new GridData({
    horizontalAlignment: GridData.CENTER,
    verticalAlignment: GridData.BEGINNING,
    grabExcessHorizontalSpace: true,
  });
  cell.setLayoutData(gridData);
  return cell;
}
/**
 * @description create a new BottomImageGroupCell
 * @param {*} topicView
 */
function _createBottomImageGroupCell(topicView) {
  const cell = new LayoutCell();
  cell._testName = "imageBottom";
  cell.protectedCalcSize = _createProtectedCalcImageLikeSizeFunc(
    topicView,
    "bottom",
  );
  const gridData = new GridData({
    horizontalAlignment: GridData.CENTER,
    verticalAlignment: GridData.END,
    grabExcessHorizontalSpace: true,
  });
  cell.setLayoutData(gridData);
  return cell;
}
/**
 * @description create a new InnerGroupCell
 * @param {*} topicView
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _createInnerGroupCell(topicView) {
  const cell = new LayoutCell();
  cell._testName = "inner";
  const gridLayout = new GridLayout(4, false);
  gridLayout.horizontalSpacing = 10;
  cell.setLayout(gridLayout);
  const gridData = new GridData({
    horizontalAlignment: GridData.FILL,
    verticalAlignment: GridData.CENTER,
    grabExcessHorizontalSpace: true,
    // grabExcessVerticalSpace: true
  });
  cell.setLayoutData(gridData);
  return cell;
}
function _createNumberingCell(topicView) {
  const cell = new LayoutCell();
  cell._testName = "numbering";
  cell.protectedCalcSize = () => {
    if (topicView.numberingView) {
      return topicView.numberingView.bounds;
    } else {
      return {
        width: 0,
        height: 0,
      };
    }
  };
  const gridData = new GridData({
    horizontalAlignment: GridData.FILL,
    verticalAlignment: GridData.CENTER,
  });
  cell.setLayoutData(gridData);
  return cell;
}
/**
 * @description create a new MarkerGroupCell
 * @param {*} topicView
 */
function _createMarkerGroupCell(topicView) {
  const cell = new LayoutCell();
  cell._testName = "markers";
  cell.protectedCalcSize = () => {
    if (topicView.markersView) {
      return topicView.markersView.bounds;
    } else {
      return {
        width: 0,
        height: 0,
      };
    }
  };
  const gridData = new GridData({
    horizontalAlignment: GridData.FILL,
    verticalAlignment: GridData.CENTER,
  });
  cell.setLayoutData(gridData);
  return cell;
}
/**
 * @description create a new InforCell
 * @param {*} topicView
 */
function _createInforCell(topicView) {
  const cell = new LayoutCell();
  cell._testName = "infor";
  cell.protectedCalcSize = () => {
    if (topicView.informationIconView) {
      return topicView.informationIconView.bounds;
    } else {
      return {
        width: 0,
        height: 0,
      };
    }
  };
  const gridData = new GridData({
    horizontalAlignment: GridData.FILL,
    verticalAlignment: GridData.CENTER,
  });
  cell.setLayoutData(gridData);
  return cell;
}
/**
 * @description create a new TitleGroupCell
 * @param {*} topicView
 * @param {*} calcSizeFn
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _createTitleGroupCell(topicView, titleCalcSizeFn?) {
  const cell = new LayoutCell();
  cell._testName = "titleGroup";
  const gridLayout = new GridLayout(1, false);
  gridLayout.horizontalSpacing = 0;
  cell.setLayout(gridLayout);
  const gridData = new GridData({
    horizontalAlignment: GridData.FILL,
    verticalAlignment: GridData.CENTER,
    grabExcessHorizontalSpace: true,
    // grabExcessVerticalSpace: true,
  });
  cell.setLayoutData(gridData);
  return cell;
}
/**
 * @description create a new topicTitleCell
 * @param {*} topicView
 * @param {*} calcSizeFn
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function _createTitleCell(topicView) {
  const cell = new LayoutCell();
  cell._testName = "title";
  const gridData = new GridData({
    horizontalAlignment: GridData.FILL,
    verticalAlignment: GridData.CENTER,
    grabExcessHorizontalSpace: true,
    // grabExcessVerticalSpace: true,
  });
  cell.setLayoutData(gridData);
  return cell;
}
function _createLabelGroupCell(topicView) {
  const cell = new LayoutCell();
  cell._testName = "label";
  cell.protectedCalcSize = () => {
    if (topicView.labelsView) {
      topicView.labelsView.render(false);
      return topicView.labelsView.bounds;
    } else {
      return {
        width: 0,
        height: 0,
      };
    }
  };
  const gridData = new GridData({
    horizontalAlignment: GridData.BEGINNING,
    verticalAlignment: GridData.BEGINNING,
  });
  cell.setLayoutData(gridData);
  return cell;
}
function layoutSiblingsBranchViewInTimeLineHorizon(topicView) {
  const parentBranchView = topicView.parent();
  if (parentBranchView.originBranchView) {
    return;
  }
  if (
    ![
      STRUCTURECLASS.TIMELINEHORIZONTALDOWN,
      STRUCTURECLASS.TIMELINEHORIZONTALUP,
    ].includes(parentBranchView.getStructureClass())
  ) {
    return;
  }
  const oldSize = topicView.figure.size;
  const newSize = topicView.bounds;
  if (oldSize.height === newSize.height) {
    return;
  }
  const siblingsBranchViewList = parentBranchView
    .parent()
    .getChildrenBranchesByType();
  const index = siblingsBranchViewList.indexOf(parentBranchView);
  // ignore first child or non-attached child of parent branch
  if (index <= 0) {
    return;
  }
  const toLayoutBranchView = siblingsBranchViewList[index - 1];
  const toLayoutTopicViewHeight = toLayoutBranchView.topicView.bounds.height;
  if (
    oldSize.height < toLayoutTopicViewHeight &&
    newSize.height < toLayoutTopicViewHeight
  ) {
    return;
  }
  toLayoutBranchView.figure.invalidateLayout();
}

import {
  STRUCTURECLASS,
  ALL_TOPIC_TYPES,
  TOPIC_TYPE,
  EVENTS,
} from "../../common/constants/index";
import * as utils from "../../utils/index";
import BranchView from "../../view/branchview";
import { BaseEvent } from "../../common/utils/index";
import mommonFuncs from "../../mommonfuncs";

function isTimeLineHorizontalMainBranchView(branchView) {
  const parentBranchView = branchView.parent();
  if (!(parentBranchView instanceof BranchView)) {
    return false;
  }
  return (
    parentBranchView.getStructureClass() === STRUCTURECLASS.TIMELINEHORIZONTAL
  );
}
function getAnotherBranchViewToCheckConnectionRedraw(branchView) {
  const _isTimeLineHorizontalMainBranchView =
    isTimeLineHorizontalMainBranchView(branchView) &&
    branchView.branchIndex() > 0;
  const parentBranchView = branchView.parent();
  if (_isTimeLineHorizontalMainBranchView) {
    return parentBranchView.getChildrenBranchesByType()[
      branchView.branchIndex() - 1
    ];
  } else {
    return parentBranchView;
  }
}
function shouldRedrawConnection(branchView) {
  const anotherBranchViewToCheck =
    getAnotherBranchViewToCheckConnectionRedraw(branchView);
  return (
    branchView.figure.positionDirty ||
    anotherBranchViewToCheck.figure.positionDirty ||
    branchView.figure.sizeDirty ||
    anotherBranchViewToCheck.figure.sizeDirty ||
    branchView.topicView.figure.sizeDirty ||
    anotherBranchViewToCheck.topicView.figure.sizeDirty ||
    branchView.topicView.figure.shapeClassDirty ||
    branchView.getConnectionView().figure.lineShapeDirty
  );
}
export function validateLayoutBranchFigures(
  branchFigures,
  layoutFunc = (f) => f.validateLayout(),
) {
  branchFigures
    .sort(
      (f1, f2) => f2.viewController.getLayer() - f1.viewController.getLayer(),
    )
    .forEach(layoutFunc);
  if (!branchFigures.length) {
    return;
  }
  const centralBranchViewList = new Set<any>();
  branchFigures.forEach((branchFigure) => {
    const centralBranchView = branchFigure.viewController
      .getContext()
      .getSheetView()
      .getCentralBranchView();
    centralBranchViewList.add(centralBranchView);
  });
  centralBranchViewList.forEach((centralBranchView: any) => {
    const children = centralBranchView.getChildrenBranchesByType([
      TOPIC_TYPE.ATTACHED,
      TOPIC_TYPE.DETACHED,
      TOPIC_TYPE.SUMMARY,
    ]);
    children.forEach((child) => child.updateStructure());
    mommonFuncs.preorderIterate(
      centralBranchView,
      ALL_TOPIC_TYPES,
      (branchView) => {
        let _b;
        branchView.updateRealPosition();
        if (!branchView.shouldCollapse()) {
          // todo: optimize layout boundary in treetable
          if (
            branchFigures.includes(branchView.figure) ||
            Object(utils.isTreeTableCell)(branchView)
          ) {
            branchView.boundaries.forEach((boundary) => {
              boundary.figure.dirtyLayout = true;
              boundary.figure.validateLayout();
            });
          } else {
            branchView.boundaries.forEach((boundary) => {
              boundary.updateRealPosition();
            });
          }
        }
        const branchVisible =
          !branchView.shouldHide() &&
          branchView.isVisible &&
          !branchView.isForcedInvisible;
        branchView.figure.setVisible(branchVisible);
        if (!branchVisible) {
          if (
            (_b = branchView.topicView?.topicShapeSelectBox) === null ||
            _b === undefined
          ) {
            // do nothing;
          } else {
            _b.figure.setHide();
          }
          if (branchView.isSummaryBranch() && branchView.selectBox) {
            branchView.selectBox.figure.setVisible(false);
          }
        }
        const connectionVisible =
          branchVisible &&
          branchView.getConnectionView().isVisible &&
          !branchView.getConnectionView().isForcedInvisible;
        branchView.getConnectionView().figure.setVisible(connectionVisible);
        // todo should check connection end point dirty
        if (shouldRedrawConnection(branchView)) {
          branchView.getConnectionView().figure.manuallyLayout();
          branchView.getConnectionView().figure.manuallyPaint();
        }
        branchView.refreshView();
      },
    );
  });
}
const alignmentTopicWidthPool =
  new (class AlignmentTopicWidthPool extends BaseEvent {
    pool: Map<any, any>;
    constructor() {
      super();
      this.pool = new Map();
    }
    getWidth(branchFigure) {
      let width = this.pool.get(branchFigure);
      if (width === undefined) {
        width = this.getTopicSizeWithoutEffect(branchFigure).width;
        this.pool.set(branchFigure, width);
        this.initListener(branchFigure);
      } else if (width === null) {
        width = this.getTopicSizeWithoutEffect(branchFigure).width;
        this.pool.set(branchFigure, width);
      }
      return width;
    }
    initListener(branchFigure) {
      const branchView = branchFigure.viewController;
      const sheetModel = branchView.getContext().model;
      const topicChangedListener = ({ target }) => {
        if (target === branchView.model) {
          this.pool.set(branchFigure, null);
        }
      };
      this.listenTo(
        sheetModel,
        EVENTS.AFTER_SHEET_CONTENT_CHANGE,
        topicChangedListener,
      );
      this.listenToOnce(sheetModel, EVENTS.AFTER_REMOVE_TOPIC, ({ topic }) => {
        if (topic === branchView.model) {
          this.stopListening(
            sheetModel,
            EVENTS.AFTER_SHEET_CONTENT_CHANGE,
            topicChangedListener,
          );
          this.pool.delete(branchFigure);
        }
      });
      this.listenTo(
        sheetModel,
        EVENTS.AFTER_THEME_CHANGED,
        ({ newColorTheme }) => {
          if (!newColorTheme) {
            this.pool.forEach((_, key) => this.pool.set(key, null));
          }
        },
      );
    }
    getTopicSizeWithoutEffect(branchFigure) {
      branchFigure.forbidInvalidateLayout = true;
      const topicView = Object(utils.standinTopicView)(
        branchFigure.viewController,
      );
      branchFigure.forbidInvalidateLayout = false;
      return topicView.figure.size;
    }
  })();
export class AlignmentByLevelLayoutInjector {
  currentBranchFigures: any[];
  constructor() {
    this.currentBranchFigures = [];
  }
  start(branchFigures) {
    if (
      !branchFigures.length ||
      branchFigures.some((figure) => figure.size.width === -1)
    ) {
      return;
    }
    this.currentBranchFigures = [...branchFigures];
    // check current status
    const sheetEditor =
      this.currentBranchFigures[0].viewController.getContext();
    const centralBranchViewFigure = sheetEditor
      .getSheetView()
      .getCentralBranchView().figure;
    const isAlignmentByLevelMode = sheetEditor.isAlignmentByLevelMode();
    if (isAlignmentByLevelMode) {
      this.doAlignment();
    } else if (centralBranchViewFigure.alignemntByLevelSettingDirty) {
      centralBranchViewFigure.alignemntByLevelSettingDirty = false;
      this.clearAlignment();
    }
  }
  doAlignment() {
    const centralBranchViewFigure = this.currentBranchFigures[0].viewController
      .getContext()
      .getSheetView()
      .getCentralBranchView().figure;
    this.expandBranchViewFigureToTableInfo(
      [centralBranchViewFigure],
      [],
    ).forEach((figureListInSameLevel) => {
      const maxWidth = this.getFinalWidthInSameLevel(figureListInSameLevel);
      const figureListToRelayout = [];
      figureListInSameLevel.forEach((branchFigure) => {
        const topicFigure = branchFigure.viewController.topicView.figure;
        if (
          Math.ceil(topicFigure.forceAlignmentWidth) !== Math.ceil(maxWidth)
        ) {
          figureListToRelayout.push(branchFigure);
          topicFigure.setForceAlignmentWidth(maxWidth);
        }
      });
      this.reLayoutBranchFigures(figureListToRelayout);
    });
  }
  clearAlignment() {
    const centralBranchViewFigure = this.currentBranchFigures[0].viewController
      .getContext()
      .getSheetView()
      .getCentralBranchView().figure;
    this.expandBranchViewFigureToTableInfo(
      [centralBranchViewFigure],
      [],
    ).forEach((figureListInSameLevel) => {
      figureListInSameLevel.forEach((figure) => {
        figure.viewController.topicView.figure.setForceAlignmentWidth(null);
      });
      this.reLayoutBranchFigures(figureListInSameLevel);
    });
  }
  reLayoutBranchFigures(branchFiguresToLayout) {
    branchFiguresToLayout = branchFiguresToLayout.filter((f) => {
      return !this.currentBranchFigures.includes(f);
    });
    validateLayoutBranchFigures(branchFiguresToLayout, (f) =>
      f.manuallyLayout(),
    );
  }
  getFinalWidthInSameLevel(branchFigures) {
    let finalWidth;
    const branchFigureListWithCustomWidth = branchFigures.filter(
      (branchFigure) => {
        return branchFigure.viewController.model.customWidth();
      },
    );
    if (branchFigureListWithCustomWidth.length) {
      finalWidth = alignmentTopicWidthPool.getWidth(
        branchFigureListWithCustomWidth[0],
      );
      const minimumWidthInSameLevel = Math.max(
        ...branchFigures.map((branchFigure) => {
          return branchFigure.viewController.topicView.figure.minimumWidth;
        }),
      );
      if (finalWidth < minimumWidthInSameLevel) {
        finalWidth = minimumWidthInSameLevel;
      }
    } else {
      finalWidth = Math.max(
        ...branchFigures.map((branchFigure) => {
          return alignmentTopicWidthPool.getWidth(branchFigure);
        }),
      );
    }
    return finalWidth;
  }
  expandBranchViewFigureToTableInfo(branchViewFigures, tableInfo = []) {
    const nextLevelInPool = [];
    const nextLevelToExtend = [];
    branchViewFigures.forEach((branchFigure) => {
      const nextLevelChildrenBranchViewList =
        branchFigure.viewController.getChildrenBranchesByType();
      nextLevelInPool.push(
        ...nextLevelChildrenBranchViewList
          .filter(this.filterBranchesToApplyAlignment)
          .map((v) => v.figure),
      );
      nextLevelToExtend.push(
        ...nextLevelChildrenBranchViewList.map((v) => v.figure),
      );
    });
    tableInfo.push(nextLevelInPool);
    if (nextLevelToExtend.length) {
      this.expandBranchViewFigureToTableInfo(nextLevelToExtend, tableInfo);
    }
    return tableInfo.filter((list) => list.length);
  }
  filterBranchesToApplyAlignment(branchView) {
    const isFilteredTreeTable =
      !Object(utils.isTreeTableCell)(branchView) ||
      !!Object(utils.isTreeTableHeadBranch)(branchView);
    const isFilteredMatrix =
      !Object(utils.isMatrixCell)(branchView) &&
      !Object(utils.isMatrixMainBranch)(branchView);
    const isFilteredPreventCustomWidthBranch = !Object(
      utils.isPreventCustomWidthBranch,
    )(branchView);
    return (
      isFilteredTreeTable &&
      isFilteredMatrix &&
      isFilteredPreventCustomWidthBranch
    );
  }
}

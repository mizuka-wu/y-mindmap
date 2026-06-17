import process from 'process';

import styleManager from '../utils/business/stylemanager/index';

import {
  TOPIC_TYPE,
  MAP_LIKE_STRUCTURES,
  EVENTS,
  TREE_TABLE_GROUP_LIST,
  MATRIX_GROUP_LIST,
  STYLE_KEYS,
  MODULE_NAME,
  UI_STATUS,
  BRANCHCONNECTION,
  LINE_PATTERN,
  LINETAPERED,
  ARROW_CLASS,
  ADAPTERS,
  ALIGNMENT_BY_LEVEL_STATUS,
  VIEW_TYPE,
  FIGURE_TYPE,
  STRUCTURECLASS,
  TIMELINE_SIDED_STRUCTURES,
  NUMBERFORMAT,
  CONFIG,
  DIRECTION,
  NUMBERSEPARATOR,
  CLASS_TYPE,
  EXPOSED_STRUCTURE,
  ANIMATION_FLAGS,
} from '../common/constants/index';

import * as pointUtils from '../utils/pointutils';

import * as layoututil from '../utils/layoututil';

import figures from '../figures/index';

import * as utils from '../utils/index';

import MatrixView from './matrixview';
import TreeTableCellView from './treetablecellview';
import FishBoneHeadLineView from './fishboneheadlineview';
import FishBoneMainLineView from './fishbinemainlineview';

import { getStructure } from '../structures/helper/allstructures';

import mommonFuncs from '../mommonfuncs';

import * as lazyRunner from '../figures/lazyrunner/index';

import WorkbookComponentView from './workbookcomponentview';

import TopicView from './topicview';

import ConnectionView from './connectionview';

import Util from '../util';

import structuresUtil from '../structures/helper/structuresutil';

import BoundaryView from './boundaryview';

import SummaryView from './summaryview';

import CollapseExtendView from './collapseextendview';

import underscore from 'underscore';

import SheetView from './sheetview';

import TopicModel from '../models/topic';

import TimelineMainLineView from './timelinemainlineview';

import { makeObservable, observable, action } from 'mobx';

const allType = [TOPIC_TYPE.ATTACHED, TOPIC_TYPE.SUMMARY, TOPIC_TYPE.DETACHED, TOPIC_TYPE.CALLOUT];
const sortBoundaries = structuresUtil.sortBoundaries;
const UpdateBranchViewConnectionMask = target => {
  return class BranchView extends target {
    initEventsListener() {
      super.initEventsListener();
      if (process.env.SB_MODE === 'readonly') {
        return;
      }
      this.addAutoRun(() => {
        this.updateConnectionMask();
      });
    }
    updateConnectionMask() {
      const structureClass = this.figure.structureClass;
      if (!MAP_LIKE_STRUCTURES.includes(structureClass)) {
        this.figure.setConnectionMasked(false);
      } else {
        this.figure.setConnectionMasked(true);
      }
    }
  } as typeof target;
};
const BackgroundCellBranchViewEnable = target => {
  return class BranchView extends target {
    constructor(model) {
      super(model);
      makeObservable(this, {
        backGroundCellBranchView: observable,
        setbackGroundCellBranchView: action,
      });
    }
    initView() {
      super.initView();
      this.refreshBackGroundCellBranchView(this.figure.structureClass, null);
      this.listenTo(this.getContext(), EVENTS.AFTER_SHEET_CONTENT_CHANGE, params => {
        if (params.target === this.model && params.attr === 'structureClass') {
          this.refreshBackGroundCellBranchView(this.figure.structureClass, params.oldValue);
        }
      });
    }
    setbackGroundCellBranchView(backGroundCellBranchView) {
      this.backGroundCellBranchView = backGroundCellBranchView;
    }
    isTransformWithinCell(curStructure, preStructure) {
      // for transform to tree table
      if (TREE_TABLE_GROUP_LIST.includes(curStructure)) {
        if (curStructure === this.model.getStructureClass()) {
          return Object(utils.isTreeTableHeadBranch)(this);
        } else {
          return true;
        }
      }
      // for transform to matrix
      if (MATRIX_GROUP_LIST.includes(curStructure)) {
        return true;
      }
      // for transform to others
      if (!preStructure) {
        return Object(utils.isInTreeTableCell)(this) || Object(utils.isInMatrixCell)(this);
      }
      if (TREE_TABLE_GROUP_LIST.includes(preStructure)) {
        return true;
      }
      return false;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getFilteredDescendantAttachedBranches(callback = (param?) => true) {
      const result = [];
      const iter = view => {
        result.push(view);
        const children = view.getChildrenBranchesByType(TOPIC_TYPE.ATTACHED).filter(child => callback(child));
        children.forEach(child => iter(child));
      };
      iter(this);
      return result;
    }
    refreshBackGroundCellBranchView(curStructure, preStructure) {
      if (!this.isTransformWithinCell(curStructure, preStructure)) {
        return;
      }
      // transform to tree table
      if (TREE_TABLE_GROUP_LIST.includes(curStructure)) {
        return this.getFilteredDescendantAttachedBranches().forEach(childBranchView => {
          childBranchView.setbackGroundCellBranchView(childBranchView.getBackgroundCell());
        });
      }
      // transform to others
      // from tree table
      const _isInTreeTableCell = Object(utils.isInTreeTableCell)(this);
      const isFromTreeTable = TREE_TABLE_GROUP_LIST.includes(preStructure) || (!preStructure && _isInTreeTableCell);
      if (isFromTreeTable) {
        if (_isInTreeTableCell) {
          return this.getFilteredDescendantAttachedBranches().forEach(childBranchView => {
            childBranchView.setbackGroundCellBranchView(childBranchView.getBackgroundCell());
          });
        } else {
          return this.getFilteredDescendantAttachedBranches(childBranchView => {
            return !utils.isTreeTableHeadBranch(childBranchView);
          }).forEach(childBranchView => {
            childBranchView.setbackGroundCellBranchView(null);
          });
        }
      }
    }
    getBackgroundCell() {
      if (Object(utils.isSingleItemTreeTableCell)(this)) {
        return this;
      }
      const isTargetCell = branchView => {
        const isTargetTreeTableCell =
          Object(utils.isTreeTableCell)(branchView) && !Object(utils.isSingleItemTreeTableCell)(branchView);
        return isTargetTreeTableCell;
      };
      // eslint-disable-next-line @typescript-eslint/no-this-alias
      let backgroundCell = this;
      while (!isTargetCell(backgroundCell)) {
        // @ts-ignore
        backgroundCell = backgroundCell.parent();
        if (!(backgroundCell instanceof BranchView)) {
          break;
        }
      }
      if (!(backgroundCell instanceof BranchView)) {
        backgroundCell = null;
      }
      return backgroundCell;
    }
  } as typeof target;
};
const Style = target => {
  return class BranchView extends target {
    constructor(model) {
      super(model);
      // constructor() {
      //   super(...arguments);
      this.changeHooks = {
        [STYLE_KEYS.LINE_WIDTH]: () => {
          this.refreshLineWidth();
        },
        [STYLE_KEYS.LINE_COLOR]: () => {
          this.refreshLineColor();
        },
        [STYLE_KEYS.LINE_CLASS]: () => {
          this.refreshLineShape();
        },
        [STYLE_KEYS.LINE_PATTERN]: () => {
          this.refreshLinePattern();
        },
        [STYLE_KEYS.ARROW_END_CLASS]: () => {
          this.refreshEndArrowClass();
        },
        summaryLineClass: () => {
          this.refreshSummaryLineShape();
        },
        summaryLineWidth: () => {
          this.refreshSummaryLineWidth();
        },
        summaryLineColor: () => {
          this.refreshSummaryLineColor();
        },
        summaryLinePattern: () => {
          this.refreshSummaryLinePattern();
        },
        [STYLE_KEYS.SPACING_MAJOR]: () => {
          this.refreshSpacingMajor();
        },
        [STYLE_KEYS.SPACING_MINOR]: () => {
          this.refreshSpacingMinor();
        },
        [STYLE_KEYS.ALIGNMENT_BY_LEVEL]: () => {
          this.setAlignmentByLevelSetting();
          this.getContext().trigger(EVENTS.ALIGNMENT_BY_LEVEL_STATUS_CHANGED);
        },
      };
    }
    refreshStyles() {
      this.refreshColorStyles();
      this.refreshSkeletonStyles();
    }
    refreshColorStyles() {
      this.refreshLineColor();
      this.refreshSummaryLineColor();
      this.topicView.refreshColorStyles();
      this.getChildrenBranchesByType(allType).forEach(childBranch => {
        childBranch.refreshColorStyles();
      });
      this.boundaries.forEach(boundaryView => {
        boundaryView.refreshColorStyles();
      });
    }
    refreshSkeletonStyles() {
      this.refreshSpacingMajor();
      this.refreshSpacingMinor();
      this.setAlignmentByLevelSetting();
      this.refreshLineWidth();
      this.refreshLineShape();
      this.refreshLinePattern();
      this.refreshEndArrowClass();
      this.refreshSummaryLineWidth();
      this.refreshSummaryLineShape();
      this.refreshSummaryLinePattern();
      this.topicView.refreshSkeletonStyles();
      this.getChildrenBranchesByType(allType).forEach(childBranch => {
        childBranch.refreshSkeletonStyles();
      });
      this.boundaries.forEach(boundaryView => {
        boundaryView.refreshSkeletonStyles();
      });
    }
    initStyle() {
      super.initStyle();
      this.refreshColorStyles();
      this.refreshSkeletonStyles();
    }
    initEventsListener() {
      super.initEventsListener();
      if (process.env.SB_MODE === 'readonly') {
        return;
      }
      this.listenTo(this.model, 'changeStyle', this.onChangeStyle);
      this.listenTo(this.model, 'changeClass', this.refreshStyles);
      this.listenTo(this.model, 'addTopic removeTopic', () => {
        let _a;
        if (
          this.isCentralBranch() &&
          ((_a = this.sheetView) === null || _a === undefined ? undefined : _a.isMultiLineColors())
        ) {
          this.getChildrenBranchesByType().forEach(mainBranchView => {
            mainBranchView.refreshLineColor();
          });
        }
      });
      this.listenTo(this.model, 'setStyleObject changeStructureClass', () => {
        const semaphoreModule = this.getContext().getModule(MODULE_NAME.SEMAPHORE);
        if (semaphoreModule.isStatusActive(UI_STATUS.CHANGING_THEME)) {
          return;
        }
        this.refreshStyles();
      });
      const parentView = this.parent();
      if (parentView instanceof BranchView) {
        this.addReaction(
          () => parentView.figure.lineColor,
          () => this.refreshLineColor()
        );
        this.addReaction(
          () => parentView.figure.lineWidth,
          () => this.refreshLineWidth()
        );
        this.addReaction(
          () => parentView.figure.linePattern,
          () => this.refreshLinePattern()
        );
        this.addReaction(
          () => parentView.figure.endArrowClass,
          () => this.refreshEndArrowClass()
        );
        if (Object(utils.isCentralBranch)(parentView)) {
          const sheetView = parentView.parent();
          this.addReaction(
            () => sheetView.figure.multiLineColors,
            () => this.refreshLineColor()
          );
        }
      }
      this.addReaction(
        () => this.figure.structureClass,
        () => this.refreshLineShape()
      );
      this.addAutoRun(() => {
        this.refreshEndArrowClass();
      });
      // refresh arrow class for curve arrow line Compatibility
      this.addReaction(
        () => this.figure.lineShape,
        (value, pre) => {
          if (value === BRANCHCONNECTION.CURVE || pre === BRANCHCONNECTION.CURVE) {
            this.refreshEndArrowClass();
          }
        }
      );
      this.reactionLineWidthByGlobal();
    }
    onChangeStyle(key) {
      let _a;
      if ((_a = this.changeHooks[key]) === null || _a === undefined) {
        // do nothing
      } else {
        _a.call(this);
      }
    }
    refreshSpacingMajor() {
      this.figure.setMajorSpacing(parseInt(`${styleManager.getStyleValue(this, STYLE_KEYS.SPACING_MAJOR)}`));
    }
    refreshSpacingMinor() {
      this.figure.setMinorSpacing(parseInt(`${styleManager.getStyleValue(this, STYLE_KEYS.SPACING_MINOR)}`));
    }
    refreshLineColor() {
      const lineColor = styleManager.getStyleValue(this, STYLE_KEYS.LINE_COLOR);
      this.figure.setLineColor(lineColor);
      this.trigger('refreshLineColor');
    }
    refreshLineWidth() {
      const lineWidth = parseInt(styleManager.getStyleValue(this, STYLE_KEYS.LINE_WIDTH));
      this.figure.setLineWidth(lineWidth);
      this.trigger('refreshLineWidth');
    }
    refreshLineShape() {
      const lineShape = styleManager.getStyleValue(this, STYLE_KEYS.LINE_CLASS);
      this.figure.setLineShape(lineShape);
    }
    refreshLinePattern() {
      const linePattern = styleManager.getStyleValue(this, STYLE_KEYS.LINE_PATTERN) || LINE_PATTERN.SOLID;
      this.figure.setLinePattern(linePattern);
    }
    refreshEndArrowClass() {
      const isLineTapered = this.getContext().getSheetView().figure.lineTapered === LINETAPERED.TAPERED;
      let endArrowClass = ARROW_CLASS.NONE;
      if (isLineTapered && Object(utils.isCentralBranch)(this)) {
        endArrowClass = ARROW_CLASS.NONE;
      } else {
        endArrowClass = styleManager.getStyleValue(this, STYLE_KEYS.ARROW_END_CLASS) || ARROW_CLASS.NONE;
      }
      this.figure.setEndArrowClass(endArrowClass);
    }
    refreshSummaryLineWidth() {
      const targetView = this.getAdapter(ADAPTERS.SUMMARY_VIEW);
      if (!targetView) {
        return;
      }
      const lineWidth = styleManager.getStyleValue(targetView, STYLE_KEYS.LINE_WIDTH);
      this.figure.setSummaryLineWidth(parseInt(lineWidth));
    }
    refreshSummaryLineColor() {
      const targetView = this.getAdapter(ADAPTERS.SUMMARY_VIEW);
      if (!targetView) {
        return;
      }
      const lineColor = styleManager.getStyleValue(targetView, STYLE_KEYS.LINE_COLOR);
      this.figure.setSummaryLineColor(lineColor);
    }
    refreshSummaryLineShape() {
      const targetView = this.getAdapter(ADAPTERS.SUMMARY_VIEW);
      if (!targetView) {
        return;
      }
      const lineShape = styleManager.getStyleValue(targetView, STYLE_KEYS.SHAPE_CLASS);
      this.figure.setSummaryLineShape(lineShape);
    }
    refreshSummaryLinePattern() {
      const targetView = this.getAdapter(ADAPTERS.SUMMARY_VIEW);
      if (!targetView) {
        return;
      }
      const linePattern = styleManager.getStyleValue(targetView, STYLE_KEYS.LINE_PATTERN);
      this.figure.setSummaryLinePattern(linePattern);
    }
    setAlignmentByLevelSetting() {
      const alignmentByLevelSetting =
        styleManager.getStyleValue(this, STYLE_KEYS.ALIGNMENT_BY_LEVEL) || ALIGNMENT_BY_LEVEL_STATUS.INACTIVED;
      this.figure.setAlignmentByLevelSetting(alignmentByLevelSetting);
    }
    reactionLineWidthByGlobal() {
      const sheetView = this.getContext().getSheetView();
      this.addReaction(
        () => sheetView.figure.globalLineWidth,
        () => this.refreshLineWidth()
      );
    }
  } as typeof target;
};

@Style
@BackgroundCellBranchViewEnable
@UpdateBranchViewConnectionMask
export class BranchView extends WorkbookComponentView {
  model: TopicModel;
  figure: any;
  _treeTableCellView: any;
  _fishBoneHeadLineView: any;
  _fishBoneMainLineView: any;
  _timelineMainLineView: any;
  collapseExtendView: any;
  _childrenBranches: Map<any, any>;
  sheetView: any;
  selectBox: any;
  summaryView: any;
  summaries: any[];
  boundaries: any[];
  _isLayout: boolean;
  _isHiding: boolean;
  _ignoreChildBranchBoundsChange: boolean;
  position: { x: number; y: number };
  linePosition: { x: number; y: number };
  bounds: { x: number; y: number; width: number; height: number };
  boundaryBounds: { x: number; y: number; width: number; height: number };
  outsidePadding: { left: number; right: number; up: number; down: number };
  structureClass: null;
  _presetStructureClass: null;
  layoutInfoMap: any;
  originBranchView: null;
  realPosition: { x: number; y: number };
  _noAnimation: boolean;
  backGroundCellBranchView: any;
  isVisible: boolean;
  layoutVisible: boolean;
  lazyHideTag: boolean;
  isSelected: boolean;
  isDeFocus: boolean;
  tag: any;
  preTag: any;
  collapse: boolean;
  summaryModel: any;
  summaryLineStyle: any;
  isCentralBranchView: boolean;
  isForcedInvisible: boolean;
  isPlaceHolderView: boolean;
  changeHooks: any;
  _topicView: TopicView & {
    infoItemDisplayChanged?: any;
    _forcedMinTopicTitleBounds?: any;
  };
  svg: any;
  _connectionView: ConnectionView;
  _matrixView: any;
  matrixContainer: any;
  boundaryContainer: any;
  branchContainer: any;
  connectionContainer: any;
  _layerCache: any;
  _editDomainCache: any;
  _contextCache: any;
  _forceLayer: any;
  _polyPointsArr: any;
  _proxy: any;
  constructor(model) {
    super({
      model,
    });
    this._treeTableCellView = null;
    this._fishBoneHeadLineView = null;
    this._fishBoneMainLineView = null;
    this._timelineMainLineView = null;
    this.collapseExtendView = null;
    this._childrenBranches = new Map();
    this.sheetView = null;
    this.selectBox = null;
    this.summaryView = null;
    this.summaries = [];
    this.boundaries = [];
    this._isLayout = false;
    this._isHiding = false;
    this._ignoreChildBranchBoundsChange = false;
    this.position = {
      x: 0,
      y: 0,
    }; //指topic的中心点应在位置，坐标以上级topic的中心点为零点
    this.linePosition = {
      x: 0,
      y: 0,
    }; //是topic的实时位置，在动画中会被更新，用于画线，坐标以central topic的中心点为零点
    this.bounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }; //包含branch的最小矩形的大小位置，x，y以该branch的topic中心点为原点
    this.boundaryBounds = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    }; //类似bounds，是添加了boundary后的大小
    this.outsidePadding = {
      left: 0,
      right: 0,
      up: 0,
      down: 0,
    };
    this.structureClass = null;
    this._presetStructureClass = null;
    this.layoutInfoMap = {};
    this.originBranchView = null;
    this.realPosition = {
      x: 0,
      y: 0,
    };
    this._noAnimation = false;
    this.backGroundCellBranchView = null;
    this.isVisible = true;
    this.layoutVisible = true;
    this.lazyHideTag = false;
    this.isSelected = false;
    this.isDeFocus = false;
    this.tag = null;
    this.preTag = null;
    this.collapse = false;
    this.summaryModel = null;
    this.summaryLineStyle = null;
    this.isCentralBranchView = false;
    this.isForcedInvisible = false;
    this.isPlaceHolderView = false;
    this.changeHooks = {};
    this.model = model;
    this.figure = figures.createFigure(this);
    this._topicView = new TopicView(this.model, this);
    this.svg = this.figure.getContent();
    this.isSelected = false;
    this.isDeFocus = false;
    if (this.shouldCollapse()) {
      this.collapseBranch();
    }
    if (this.model.unBalancedInfo()) {
      const unbalancedInfo = this.model.unBalancedInfo();
      if (unbalancedInfo && unbalancedInfo.name === 'right-number') {
        const content = parseInt(unbalancedInfo.content);
        this.setUnbalanceRightNumber(isNaN(content) ? 0 : content);
      }
    }
  }
  get type() {
    return VIEW_TYPE.BRANCH;
  }
  get figureType() {
    return FIGURE_TYPE.BRANCH;
  }
  get childrenBranches() {
    return this._childrenBranches;
  }
  parent(parent?: BranchView): BranchView {
    if (typeof parent === 'undefined') {
      return super.parent();
    }
    return super.parent(parent);
  }
  initEventsListener() {
    if (process.env.SB_MODE !== 'readonly') {
      this.listenTo(this.model, 'addTopic', this.onAddTopic);
      this.listenTo(this.model, 'removeTopic', this.onRemoveTopic);
      this.listenTo(this.model, 'moveChildTopic', this.onMoveChildTopic);
      this.listenTo(this.model, 'addBoundary', this.onAddBoundaryView);
      this.listenTo(this.model, 'removeBoundary', this.onRemoveBoundary);
      this.listenTo(this.model, 'changeBoundary', this.layout);
      this.listenTo(this.model, 'addSummary', this.onAddSummary);
      this.listenTo(this.model, 'removeSummary', this.onRemoveSummary);
      this.listenTo(this.model, 'addNumbering', this.onAddNumbering);
      this.listenTo(this.model, 'changeNumbering', this.onChangeNumbering);
      this.listenTo(this.model, 'changeStructureClass', this.updateStructure);
      this.listenTo(this.model, 'change:position', this.onPositionChange);
      this.listenTo(this.model, 'unbalancedInfoUpdated', (before, newValue) => {
        this.setUnbalanceRightNumber(newValue);
      });
      this.listenTo(this.model, 'matrixLabelInfoUpdated', this.onMatrixLabelInfoUpdated);
    }
    this.listenTo(this.model, 'change:branch', this.onCollapseChange);
  }
  initStyle() {}
  refreshStyles() {}
  refreshLineColor() {}
  // once, with parent
  initView() {
    this.initStyle();
    this._connectionView = new ConnectionView(this);
    this._initStructure(); // this line maybe remove later
    this.initEventsListener();
    const addChildrenBranches = childrenType => {
      const childrenList = this.model.children(childrenType);
      childrenList.forEach(child => {
        const childBranchView = new BranchView(child);
        this.addChildBranch(
          childBranchView,
          {
            type: childrenType,
          },
          true
        );
      });
    };
    // addBranches
    addChildrenBranches(TOPIC_TYPE.ATTACHED);
    if (this.isCentralBranch()) {
      addChildrenBranches(TOPIC_TYPE.DETACHED);
    }
    addChildrenBranches(TOPIC_TYPE.CALLOUT);
    this.topicView.initView();
    // addBoundaries
    this.model.boundaries().forEach(boundary => {
      this.addBoundaryView(new BoundaryView(boundary, this));
    });
    // addSummaries
    this.model.summaries().forEach(summary => {
      const summariesTopicList = this.model.children(TOPIC_TYPE.SUMMARY);
      summariesTopicList.forEach(summaryTopic => {
        if (summary.get('topicId') === summaryTopic.get('id')) {
          const summaryView = new SummaryView(summary);
          this.addSummaryView(summaryView);
          const summaryBranchView = new BranchView(summaryTopic);
          this.addChildBranch(
            summaryBranchView,
            {
              type: TOPIC_TYPE.SUMMARY,
              summaryModel: summary,
              summaryView: summaryView,
            },
            true
          );
        }
      });
    });
    this._initSpecialStructureView();
  }
  _initSpecialStructureView() {
    this._initMatrixViews();
    this._initFishBoneHeadLineView();
    this._initFishBoneMainLineView();
    this._initTreeTableCellViews();
    this._initTimelineMainLineView();
  }
  /**
   * @description 初始化matrix相关view
   * @private
   * */
  _initMatrixViews() {
    const matrixStructures = [STRUCTURECLASS.COLUMNSPREADSHEET, STRUCTURECLASS.SPREADSHEET];
    // 移除之前的matrixView
    const removeOldMatrix = () => {
      let _a;
      let _b;
      if ((_a = this._matrixView) === null || _a === undefined) {
        // do nothing
      } else {
        _a.removeSelf();
      }
      if ((_b = this._matrixView) === null || _b === undefined) {
        // do nothing
      } else {
        _b.parent(null);
      }
      this._matrixView = null;
    };
    const isCurrentStructureMatrixType = matrixStructures.includes(this.getStructureClass());
    // 若当前structure不是matrix
    if (!isCurrentStructureMatrixType) {
      // 若存在matrixView
      if (this._matrixView) {
        removeOldMatrix();
        updateMatrixInfluence(this);
      }
      return;
    }
    // 若新的structure依然是matrix，但是跟之前不一样
    if (this._matrixView && this._matrixView.matrixStructureType !== this.getStructureClass()) {
      removeOldMatrix();
    }
    updateMatrixInfluence(this);
    // 生成matrix view
    const matrixView = new MatrixView(this.getStructureClass());
    this._matrixView = matrixView;
    matrixView.parent(this);
    matrixView.figure.setLabelInfo(this.topicView.model.getMatrixLabelInfos());
    this.matrixContainer.add(matrixView.getSvg());
    // this.boundaries.forEach;
    function travelMatrixBranchView(branchView, callback) {
      const resultChildrenList = [];
      const firstLevelChildrenList = branchView.getChildrenBranchesByType();
      firstLevelChildrenList.forEach(v => {
        resultChildrenList.push(...v.getChildrenBranchesByType());
      });
      resultChildrenList.push(...firstLevelChildrenList);
      resultChildrenList.push(branchView);
      resultChildrenList.forEach(callback);
    }
    // 更新关于matrix的影响，主要是shapeClass与label展示问题
    function updateMatrixInfluence(mainMatrixBranchView) {
      travelMatrixBranchView(mainMatrixBranchView, v => {
        const topicView = v.topicView;
        // 更新topic shape class
        topicView.setTopicShapeClass(topicView.getShapeStyle());
        if (v === mainMatrixBranchView || v.parent() === mainMatrixBranchView) {
          return;
        }
        // 隐藏或者显示label
        topicView.refreshLabelViewState();
      });
    }
  }
  getFishBoneMainLineView() {
    return this._fishBoneMainLineView;
  }
  _initFishBoneHeadLineView() {
    let _a;
    if (this.originBranchView) {
      return;
    }
    if (!Object(utils.isFishBoneHead)(this)) {
      if ((_a = this._fishBoneHeadLineView) === null || _a === undefined) {
        // do nothing
      } else {
        _a.remove();
      }
      this._fishBoneHeadLineView = null;
      return;
    }
    if (this._fishBoneHeadLineView) {
      return;
    }
    this._fishBoneHeadLineView = new FishBoneHeadLineView(this);
  }
  _initTimelineMainLineView() {
    let _a;
    if (this.originBranchView) {
      return;
    }
    const structureClass = this.getStructureClass();
    const needMainLineView = TIMELINE_SIDED_STRUCTURES.includes(structureClass);
    if (!needMainLineView) {
      if ((_a = this._timelineMainLineView) === null || _a === undefined) {
        // do nothing
      } else {
        _a.remove();
      }
      this._timelineMainLineView = null;
      return;
    }
    if (this._timelineMainLineView) {
      return;
    }
    this._timelineMainLineView = new TimelineMainLineView(this);
  }

  _initFishBoneMainLineView() {
    let _a;
    if (this.originBranchView) {
      return;
    }
    if (!Object(utils.isFishBoneMainBone)(this)) {
      if ((_a = this._fishBoneMainLineView) === null || _a === undefined) {
        // do nothing
      } else {
        _a.remove();
      }
      this._fishBoneMainLineView = null;
      return;
    }
    if (this._fishBoneMainLineView) {
      return;
    }
    this._fishBoneMainLineView = new FishBoneMainLineView(this);
  }
  _initTreeTableCellViews() {
    if (this.originBranchView) {
      return;
    }
    if (!Object(utils.isTreeTableCell)(this)) {
      if (this._treeTableCellView) {
        this._treeTableCellView.remove();
        this._treeTableCellView = null;
      }
      return;
    }
    if (this._treeTableCellView) {
      return;
    }
    this._treeTableCellView = new TreeTableCellView(this);
  }
  afterAncestorChange() {
    //这个初始化过程依赖于:先初始化centralBranch再初始化子孙branchView

    // todo 这一大段的引用挂载都是不需要的
    const parent = this.parent();
    if (!parent) {
      this.sheetView = null;
    } else {
      if (parent instanceof SheetView) {
        this.sheetView = parent;
      } else {
        this.sheetView = parent.sheetView;
      }
      const sheetView = this.sheetView;
      this.boundaryContainer = sheetView?.boundaryContainer;
      this.branchContainer = sheetView?.branchContainer;
      this.connectionContainer = sheetView?.connectionContainer;
      this.matrixContainer = sheetView?.matrixContainer;
      super.afterAncestorChange.bind(this)(); //调用原型链上被覆盖的方法
      this.updateRealPosition();
      this._layerCache = null;
      this._editDomainCache = null;
      this._contextCache = null;
      const editDomain = this.editDomain();
      const eventBus = editDomain.eventBus;
      this.listenTo(eventBus, 'selecting.mouseMultiSelect', this.isMultiSelect);
      this.listenTo(this.sheetView?.model, 'change:infoItemDisplay', (...args) => {
        this.topicView.infoItemDisplayChanged(...args);
      });
      this.listenTo(eventBus, 'dragStart.dragManager', () => {
        if (this.shouldHide()) {
          return;
        }
        this.updatePolygon();
      });
    }
  }
  editDomain() {
    if (this._editDomainCache) {
      return this._editDomainCache;
    } else {
      this._editDomainCache = super.editDomain.bind(this)();
      return this._editDomainCache;
    }
  }
  getContext() {
    if (this._contextCache) {
      return this._contextCache;
    } else {
      this._contextCache = super.getContext.bind(this)();
      return this._contextCache;
    }
  }
  onPositionChange() {
    //This is better and more simple.
    this.refresh();
  }
  /**
   * @description 如果输入是字符串数组，返回不同类型的子branch数组的拼接
   * @param type 可以为字符串和数组，默认TOPIC_TYPE.ATTACHED
   * @returns {Array.<BranchView>}
   * @public
   */
  getChildrenBranchesByType(type: string | string[] = TOPIC_TYPE.ATTACHED): BranchView[] {
    if (Array.isArray(type)) {
      let result = [];
      type.forEach(item => {
        result = [...result, ...this.getChildrenBranchesByType(item)];
      });
      return result;
    }
    if (allType.indexOf(type) === -1) {
      return [];
    }
    let childrenBranches = this._childrenBranches.get(type);
    if (!childrenBranches) {
      childrenBranches = [];
      this._childrenBranches.set(type, childrenBranches);
    }
    // todo !important don't use business array as return value
    return childrenBranches;
  }
  getDescendantBranchesByType(...types) {
    const flatten = arr => arr.reduce((a, b) => a.concat(b), []);
    types = flatten(types);
    if (types.length === 0) {
      types.push(TOPIC_TYPE.ATTACHED);
    }
    const result = [];
    const iter = view => {
      result.push(view);
      const children = view.getChildrenBranchesByType(types);
      children.forEach(child => iter(child));
    };
    iter(this);
    result.shift(); // shift result to remove self branch
    return result;
  }
  addBoundaryView(boundaryView) {
    function getFirstChildIndex(branch) {
      function getBranchIndex(branches) {
        let childBranches = [];
        let minIndex = -1;
        for (const branch of branches) {
          let index;
          const boundaries = branch.boundaries;
          childBranches = childBranches.concat(branch.getChildrenBranchesByType(allType));
          for (const boundaryView of boundaries) {
            index = boundaryContainer.index(boundaryView.boundaryGroup);
            if (minIndex === -1 || (index !== -1 && index < minIndex)) {
              minIndex = index;
            }
          }
        }
        if (minIndex !== -1) {
          return minIndex;
        } else if (childBranches.length) {
          return getBranchIndex(childBranches);
        } else {
          return minIndex;
        }
      }
      const boundaryContainer = branch.boundaryContainer;
      return getBranchIndex(branch.getChildrenBranchesByType(allType));
    }
    boundaryView.parent(this);
    boundaryView.initStyle();
    let insertIndex = this.boundaries.length;
    let originalIndex = -1;
    let globalIndex;
    const { rangeStart: targetRangeStart, rangeEnd: targetRangeEnd } = boundaryView.model;
    if (this.boundaries.length > 0) {
      sortBoundaries(this.boundaries);
    }
    if (targetRangeStart === -1 && targetRangeEnd === -1) {
      insertIndex = 0;
    } else {
      for (const [index, boundaryView] of Array.from(this.boundaries.entries())) {
        const { rangeStart: compareStart, rangeEnd: compareEnd } = boundaryView.model;
        if (targetRangeStart < compareStart || (targetRangeStart === compareStart && targetRangeEnd > compareEnd)) {
          insertIndex = index;
          // break;
        }
      }
    }
    // insert sort
    if (insertIndex !== this.boundaries.length) {
      // has sibling
      originalIndex = this.boundaryContainer.index(this.boundaries[insertIndex].boundaryGroup);
    } else {
      // find descendants recursively
      originalIndex = getFirstChildIndex(this);
    }
    if (originalIndex === -1) {
      globalIndex = this.boundaryContainer.children().length;
    } else {
      globalIndex = originalIndex;
    }
    this.boundaries.splice(insertIndex, 0, boundaryView);
    this.boundaryContainer.add(boundaryView.boundaryGroup, globalIndex);
    return this;
  }
  addSummaryView(view) {
    view.parent(this);
    this.summaries.push(view);
  }
  findSummaryView(childBranchView) {
    for (const summaryView of this.summaries) {
      if (summaryView.model.get('topicId') === childBranchView.model.get('id')) {
        return summaryView;
      }
    }
  }
  addChildBranch(childBranchView, options, init) {
    childBranchView.parent(this);
    const type = options?.type ?? TOPIC_TYPE.ATTACHED;
    if (type === 'summary') {
      if (options.summaryModel) {
        childBranchView.summaryModel = options.summaryModel;
      }
      const summaryView = options.summaryView || this.findSummaryView(childBranchView);
      if (summaryView) {
        childBranchView.summaryView = summaryView;
      }
      childBranchView.summaryLineStyle =
        childBranchView.summaryLineStyle ||
        styleManager.getStyleValue(childBranchView.summaryView, STYLE_KEYS.SHAPE_CLASS);
      childBranchView.listenTo(childBranchView.summaryModel, 'changeStyle', childBranchView.onChangeStyle);
      childBranchView.listenTo(childBranchView.summaryModel, 'setStyleObject', () => {
        this.layout();
      });
    }
    const childrenBranches = this.getChildrenBranchesByType(type);
    if (options.at !== undefined) {
      childrenBranches.splice(options.at, 0, childBranchView);
    } else {
      childrenBranches.push(childBranchView);
    }
    childBranchView.initView();
    if (Object(utils.isFishBoneHead)(this)) {
      this.updateStructure();
    }
    this.listenTo(childBranchView, 'change:bounds', this.onChildBranchBoundsChange);
    if (!init && this.model.isCollapse() && !Object(utils.isCalloutBranch)(childBranchView)) {
      this.model.extendBranch();
      if (this.collapseExtendView) {
        this.collapseExtendView.render();
      }
    }
    if (
      !init &&
      childBranchView.getComputedNumberFormat() &&
      childBranchView.getComputedNumberFormat() !== NUMBERFORMAT.NONE
    ) {
      this.refreshTopicWithNumbering(options.at || 0);
    }
    this.layout();
    return this;
  }
  removeChildBranch(childBranch, type) {
    const childrenBranches = this.getChildrenBranchesByType(type);
    const childIndex = childrenBranches.indexOf(childBranch);
    if (childIndex < 0) {
      return;
    }
    this.stopListening(childBranch);
    childBranch.remove();
    childrenBranches.splice(childIndex, 1);
    childBranch.parent(null);
    if (Object(utils.isFishBoneHead)(this)) {
      this.updateStructure();
    }
    lazyRunner.lazyRunner.work(lazyRunner.runnerConstants.PRIORITY.SELECT_SELECTION, {
      execute: () => {
        if (Object(utils.isDetachedBranch)(childBranch)) {
          return;
        }
        const selectionManager = this.getModule(MODULE_NAME.SELECTION);
        if (selectionManager) {
          let nextSelectBranchView;
          if (childIndex > 0) {
            nextSelectBranchView = childrenBranches[childIndex - 1];
          } else if (childIndex === 0 && childrenBranches[0]) {
            nextSelectBranchView = childrenBranches[0];
          } else {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            nextSelectBranchView = this;
          }
          selectionManager.selectSingle(nextSelectBranchView);
        }
      },
    });
    this.layout();
  }
  removeSummaryBranch(summaryBranch) {
    const SummaryBranch = this.summaries.indexOf(summaryBranch);
    this.stopListening(summaryBranch);
    summaryBranch.remove();
    summaryBranch.getConnectionView().remove();
    this.summaries.splice(SummaryBranch, 1);
    summaryBranch.parent(null);
    this.refresh();
  }
  /** @description 设置branch的位置 */
  setPosition(position, positionY?) {
    if (typeof position === 'number') {
      this.position.x = position;
      if (typeof positionY !== 'undefined') {
        this.position.y = positionY;
      }
    } else {
      this.position.x = position.x;
      this.position.y = position.y;
    }
  }
  move(x, y) {
    this.linePosition.x = x;
    this.linePosition.y = y;
  }
  // byThemeChange ---- when theme changed set true;
  render() {
    if (this.boundaries.length) {
      sortBoundaries(this.boundaries);
    }
    this.renderMatrixView();
    return this;
  }
  onMatrixLabelInfoUpdated(keyArr) {
    let _a;
    if ((_a = this.getMatrixView()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.figure.setLabelInfo(keyArr);
    }
    this.layout();
  }
  renderMatrixView() {
    if (this._matrixView && this._matrixView.parent() === this && this._matrixView.figure.isVisible) {
      this._matrixView.render();
      this._matrixView.getSvg().front();
    }
  }
  /** 请求发起布局，布局处理会在一个delay为0的timer中执行 */
  layout() {
    // matrixHead 不直接 layout, 而是通过 matrixBranch 触发布局
    const target = this.isMatrixHeadCellBranch() ? this.parent() : this;
    if (target instanceof BranchView) {
      if (target._ignoreChildBranchBoundsChange) {
        return;
      }
      target.figure.invalidateLayout();
    }
  }
  calChildrenBounds() {
    this._ignoreChildBranchBoundsChange = true;
    this.getChildrenBranchesByType(allType).forEach(layoututil.doLayoutBranch);
    this._ignoreChildBranchBoundsChange = false;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onChildBranchBoundsChange(bounds, branchView) {
    this.layout();
  }
  remove() {
    const topic = this.model;
    const childrenBranches = this.getChildrenBranchesByType(allType);
    underscore.each(
      childrenBranches,
      childBranch => {
        // this.stopListening(childBranch);
        childBranch.remove();
      },
      this
    );
    childrenBranches.splice(0);
    const editDomain = this.editDomain();
    if (editDomain && editDomain.selectionManager) {
      editDomain.selectionManager.removeFromSelection(this);
    }
    this.boundaries.slice().forEach(item => {
      item.remove();
    });
    this.summaries.slice().forEach(item => {
      item.remove();
    });
    this._connectionView.remove();
    this.stopListening();
    this.clearReactions();
    this.topicView.remove();
    if (editDomain && editDomain.model2View) {
      delete editDomain.model2View[topic.id];
    }
    this._removeSpecialStructureView();
    if (this.collapseExtendView) {
      this.collapseExtendView.remove();
    }
    // clear cache
    this._contextCache = null;
    this._layerCache = null;
    this._editDomainCache = null;
    this.parent(null);
    this.figure.dispose();
    return this;
  }
  _removeSpecialStructureView() {
    let _a;
    let _b;
    let _c;
    let _d;
    if ((_a = this._matrixView) === null || _a === undefined) {
      // do nothing
    } else {
      _a.removeSelf();
    }
    if ((_b = this._treeTableCellView) === null || _b === undefined) {
      // do nothing
    } else {
      _b.remove();
    }
    if ((_c = this._fishBoneHeadLineView) === null || _c === undefined) {
      // do nothing
    } else {
      _c.remove();
    }
    if ((_d = this._fishBoneMainLineView) === null || _d === undefined) {
      // do nothing
    } else {
      _d.remove();
    }
  }
  select() {
    let _a;
    this.isSelected = true;
    // 检测当前是否处于deFocus状态
    /** @type {Semaphore} */
    const SemaphoreModule = this.getModule(MODULE_NAME.SEMAPHORE);
    if (SemaphoreModule && SemaphoreModule.isStatusActive(UI_STATUS.DE_FOCUS)) {
      this.getProxy().displayDeFocus();
    } else {
      this.getProxy().displaySelect();
    }
    this._showSummarySelectBox(false);
    if (!this.config(CONFIG.NO_AUTO_SHOW_BRANCH_IN_VIEW_PORT)) {
      if ((_a = this.getModule(MODULE_NAME.MOVE_VIEW_PORT)) === null || _a === undefined) {
        // do nothing
      } else {
        _a.showBranchInViewPort(this, this.onBranchHasInViewPort);
      }
    }
  }
  /**
   * @description 隐藏选择框
   * @public
   * */
  deselect() {
    this.isSelected = false;
    this.getProxy().displayDeselect();
    this._hideSummarySelectBox();
  }
  /**
   * @description 当有元素被放置进topic所在区域
   * @public
   * */
  onIntersect() {
    // 显示放置边界样式
    this.topicView.showIntersection();
  }
  onLeave() {
    this.topicView.hideIntersection();
  }
  /**
   * 会被wrap，在readonly模式下不被调用。
   * @param {boolean} transparent 是否透明，在hover的时候为true,选中时false
   */
  _showSummarySelectBox(transparent) {
    if (this.getContext().isReadOnly() && !this.config(CONFIG.ENABLE_SELECT_IN_READONLY)) {
      return;
    }
    if (this.selectBox) {
      this.selectBox.show().transparent(transparent);
      if (transparent) {
        this.selectBox.stateMachine.transition(this.selectBox.event_hover);
      } else {
        this.selectBox.stateMachine.transition(this.selectBox.event_select);
        if (this.getModule(MODULE_NAME.SEMAPHORE).isStatusActive(UI_STATUS.DE_FOCUS)) {
          this._deFocusSummarySelectBox();
        }
      }
      this._connectionView.activate(transparent);
    }
  }
  //or boundary selectbox
  _hideSummarySelectBox() {
    if (this.selectBox) {
      this.selectBox.hide();
      this.selectBox.stateMachine.transition(this.selectBox.event_deselect);
      this.selectBox.stateMachine.transition(this.selectBox.event_out);
      this._connectionView.deactivate();
    }
  }
  _deFocusSummarySelectBox() {
    if (this.selectBox) {
      this.selectBox.stateMachine.transition(this.selectBox.event_defocus);
    }
  }
  onMouseover(e) {
    if (this.getContext().getActiveUIStatus().includes(UI_STATUS.DRAG_TOPIC_SELECT_BOX)) {
      return;
    }
    if (this.isSelected) {
      return;
    }
    if (e && e.target.getAttribute('data-name') !== 'collapse-extend-hover-area') {
      this.getProxy().displayHover();
    }
    if (this.collapseExtendView && this.getProxy() === this) {
      this.collapseExtendView.hover();
    }
  }
  onMouseout() {
    if (!this.isSelected) {
      this.getProxy().displayDehover();
    }
  }
  onDblClick(e) {
    if (e) {
      e.stopPropagation();
    }
    if (e && e.target.getAttribute('data-name') === 'collapse-extend-hover-area') {
      return;
    }
    const editDomain = this.editDomain();
    if (editDomain && editDomain.selectionManager) {
      editDomain.selectionManager.selectSingle(this);
    }
  }
  changeSelection(childTopic) {
    const editDomain = this.editDomain();
    let childBranch;
    if (editDomain && editDomain.selectionManager) {
      editDomain.selectionManager.selectNone();
      childBranch = editDomain.model2View[childTopic.get('id')];
      const selectionManager = this.getModule(MODULE_NAME.SELECTION);
      if (selectionManager) {
        selectionManager.selectSingle(childBranch);
      }
    }
  }
  /**
   * @param {Object} options
   * @param {boolean} options.isPlaceholder
   * */
  onAddTopic(topic, options: any = {}, init) {
    const branchView = new BranchView(topic);
    this.addChildBranch(branchView, options, init);
    if (this.model.canCollapse() && !this.collapseExtendView) {
      this.addCollapseExtendView(new CollapseExtendView(this.model));
    }
    if (options.noAnimation) {
      branchView._noAnimation = true;
    }
    this.layout();
    lazyRunner.lazyRunner.work(lazyRunner.runnerConstants.PRIORITY.SELECT_SELECTION, {
      execute: () => {
        const selectionManager = this.getModule(MODULE_NAME.SELECTION);
        if (selectionManager) {
          selectionManager.selectSingle(branchView);
        }
      },
    });
  }
  onRemoveTopic(model, options) {
    const type = options?.type ?? TOPIC_TYPE.ATTACHED;
    const target = this.getChildrenBranchesByType(type).find(b => b.model === model);
    if (!target) {
      return;
    }
    const format = target.getComputedNumberFormat();
    this.removeChildBranch(target, type);
    if (!this.model.canCollapse() && this.collapseExtendView) {
      this.collapseExtendView.remove();
      this.collapseExtendView = null;
    }
    if (format && format !== NUMBERFORMAT.NONE) {
      const index = options?.at ?? 0;
      this.refreshTopicWithNumbering(index);
      this.layoutDeep();
    } else {
      this.layout();
    }
  }
  onMoveChildTopic(originIndex, targetIndex) {
    const branchList = this._childrenBranches.get(TOPIC_TYPE.ATTACHED);
    if (!branchList) {
      return;
    }
    const canMove =
      originIndex >= 0 &&
      originIndex <= branchList.length - 1 &&
      targetIndex >= 0 &&
      targetIndex <= branchList.length - 1;
    if (canMove) {
      const movingTopic = branchList.splice(originIndex, 1);
      branchList.splice(targetIndex, 0, ...movingTopic);
      this.layout();
    }
  }
  onChangeNumbering() {}
  onAddNumbering() {}
  removeBoundaryView(boundaryView) {
    boundaryView.remove();
  }
  onAddBoundaryView(boundary) {
    this.addBoundaryView(new BoundaryView(boundary, this));
    this.refresh();
  }
  onRemoveBoundary(boundary) {
    const boundaryView = this.boundaries.find(view => view.model === boundary);
    if (boundaryView) {
      this.removeBoundaryView(boundaryView);
      this.refresh();
    }
  }
  removeSummaryView(summaryView) {
    if (summaryView) {
      summaryView.remove();
      this.refresh();
    }
  }
  onAddSummary(summary) {
    this.addSummaryView(new SummaryView(summary));
    this.refresh();
  }
  onRemoveSummary(summary) {
    const summaryView = this.summaries.find(sv => sv.model === summary);
    if (summaryView) {
      this.removeSummaryView(summaryView);
    }
  }
  addCollapseExtendView(view) {
    this.collapseExtendView = view;
    view.parent(this.topicView);
    view.render();
  }
  /** @deprecated don't use this to mausally control extend view's display */
  showCollapseExtendView() {
    if (this.collapseExtendView) {
      this.collapseExtendView.show();
    } else {
      this.addCollapseExtendView(new CollapseExtendView(this.model));
    }
  }
  /** @deprecated */
  hideCollpaseExtendView() {
    if (this.collapseExtendView) {
      this.collapseExtendView.hide();
    }
  }
  /**
   * @description
   * @return {position}
   * */
  getRealPosition() {
    return this.realPosition;
  }
  updateRealPosition() {
    /** @type {position} */
    const realPosition = Object.assign({}, this.position);
    /** @type {BranchView} */
    const parent = this.parent();
    if (parent instanceof BranchView) {
      const parentRealPosition = parent.getRealPosition();
      realPosition.x += parentRealPosition.x;
      realPosition.y += parentRealPosition.y;
    }
    this.realPosition = realPosition;
    this.figure.setPosition(this.realPosition);
    this.move(this.realPosition.x, this.realPosition.y);
    if (this.figure.positionDirty || this.isSummaryBranch()) {
      this.trigger('afterRealPosChange', Object.assign({}, this.realPosition));
    }
    if (this.topicView.topicShapeSelectBox) {
      this.topicView.topicShapeSelectBox.figure.setPosition({
        x: this.getRealPosition().x,
        y: this.getRealPosition().y,
      });
    }
  }
  updateLayoutInfo(layoutInfo) {
    this.layoutInfoMap[layoutInfo.layoutStructureClass] = layoutInfo;
    this.trigger(`afterlayoutInfoUpdate`, this.layoutInfoMap);
  }
  getLayoutInfo(layoutStructureClass) {
    if (!layoutStructureClass) {
      layoutStructureClass = this.getStructureClass();
    }
    return this.layoutInfoMap[layoutStructureClass];
  }
  /**
   * @public
   * @description for selectable view
   */
  getClientRect() {
    const { bounds } = this.topicView;
    const realPos = pointUtils.add(this.getRealPosition(), bounds);
    const clientPos = this.editDomain().getCoordinateTransfer().mindMapToViewport(realPos);
    return {
      x: clientPos.x,
      y: clientPos.y,
      width: bounds.width,
      height: bounds.height,
    };
  }
  getTopicWidth() {
    return this.topicView.bounds.width;
  }
  getTopicCustomWidth() {
    // 0 means auto width.
    return this.model.customWidth() || 0;
  }
  _initStructure() {
    const modelStruct = this.model.getStructureClass();
    this.structureClass = Object(utils.getViewStructure)(this, modelStruct);
    this.figure.setStructureClass(this.structureClass);
    this._presetStructureClass = Object(utils.getViewStructure)(this, null);
  }
  updateStructure() {
    const structure = this.model.getStructureClass();
    // Ray: what's it used for?
    // it's used for clear timeline vertical (compatable) and treesided tag
    if (!this.parent() || this.parent()?.structureClass === structure) {
      this.tag = null;
    }
    const newStructure = Object(utils.getViewStructure)(this, structure);
    const oldStructure = this.structureClass;
    this.structureClass = newStructure;
    this.figure.setStructureClass(this.structureClass);
    const childrenBranchViewList = this.getChildrenBranchesByType(allType);
    childrenBranchViewList.forEach(child => child.updateStructure());
    if (oldStructure === newStructure) {
      // for spreadsheet reset collapse button position
      if (newStructure === STRUCTURECLASS.SPREADSHEET || newStructure === STRUCTURECLASS.COLUMNSPREADSHEET) {
        const newPresetStructureClass = Object(utils.getViewStructure)(this, null);
        if (newPresetStructureClass !== this._presetStructureClass) {
          this._presetStructureClass = newPresetStructureClass;
          return this.layout();
        }
      }
      // for dependency structure branch in treetable cell, try to init treetable view
      this._initTreeTableCellViews();
      return false;
    }
    if (this.isPlaceHolderView) {
      return false;
    } // TODO: this line should remove later
    this._initSpecialStructureView();
    this.layout();
    return true;
  }
  getStructureClass(): string {
    if (utils.isUndef(this.structureClass)) {
      this.updateStructure();
    }
    return this.structureClass;
  }
  getStructureObject() {
    return getStructure(this.getStructureClass());
  }
  getDirection() {
    const structure = this.getStructureClass();
    let direction;
    switch (structure) {
      case STRUCTURECLASS.ORGCHARTDOWN:
      case STRUCTURECLASS.ORGCHARTUP:
      case STRUCTURECLASS.TIMELINEHORIZONTAL:
      case STRUCTURECLASS.TIMELINESIDEDHORIZONTAL:
      case STRUCTURECLASS.FISHBONELEFTHEADED:
      case STRUCTURECLASS.FISHBONERIGHTHEADED:
        direction = DIRECTION.LEFTRIGHT;
        break;
      default:
        direction = DIRECTION.UPDOWN;
        break;
    }
    return direction;
  }
  getBrotherDirection() {
    const parent = this.parent();
    if (parent instanceof BranchView) {
      return parent.getDirection();
    }
    return 'LR';
  }
  isMapLike() {
    return this.getStructureClass().search(STRUCTURECLASS.MAP) !== -1;
  }
  isFishbone() {
    return this.getStructureClass().search('fishbone') !== -1;
  }
  isRotate() {
    // return [
    //   STRUCTURECLASS.LEFTHEADEDNEROTATED,
    //   STRUCTURECLASS.LEFTHEADEDSEROTATED,
    //   STRUCTURECLASS.RIGHTHEADEDNWROTATED,
    //   STRUCTURECLASS.RIGHTHEADEDSWROTATED
    // ].indexOf(this.getStructureClass()) !== -1;
    return false;
  }
  getRangeGrowthDirection(index) {
    return getStructure(this.getStructureClass()).getRangeGrowthDirection(this, index);
  }
  changeTag(tag) {
    if (this.tag !== tag) {
      if (this.tag) {
        this.preTag = this.tag;
      }
      this.tag = tag;
    }
  }
  getTag() {
    return this.tag;
  }
  onCollapseChange() {
    if (this.model.isCollapse()) {
      this.collapseBranch();
    } else {
      this.extendBranch();
    }
  }
  collapseBranch() {
    if (this.collapse === true) {
      return;
    }
    this.collapse = true;
    this.figure.setFolded(true);
  }
  extendBranch() {
    if (this.collapse === false) {
      return;
    }
    this.collapse = false;
    this.figure.setFolded(false);
  }
  // 判断 branch 是否支持收缩
  isUnableCollapse() {
    return (
      this.getChildrenBranchesByType().filter(branch => !branch.isPlaceHolderView).length === 0 ||
      this.isCentralBranch() ||
      this.isMapLike()
    );
  }
  isUnableShowCollapseBtn() {
    return (
      this.isUnableCollapse() ||
      (Object(utils.isTreeTableStructure)(this) && !this.model.isCollapse()) ||
      (this.isMatrixCellBranch() && !this.model.isCollapse())
    );
  }
  shouldCollapse() {
    return this.model.isCollapse() && !this.isUnableCollapse();
  }
  setLayoutVisible(layoutVisible) {
    this.layoutVisible = layoutVisible;
    this.figure.setVisible(this.layoutVisible);
  }
  tagCentralBranch(isCentralBranch) {
    this.isCentralBranchView = isCentralBranch;
  }
  /**
   * 是否是祖先元素收缩而被隐藏
   * @returns {boolean|*}
   */
  shouldHide() {
    if (!this.layoutVisible) {
      return true;
    }
    const parent = this.parent();
    if (!parent) {
      return true;
    }
    if (this.isCentralBranch()) {
      return false;
    }
    if (parent instanceof SheetView) {
      return false;
    }
    if (Object(utils.isCalloutBranch)(this) && this.isInMatrix()) {
      return true;
    }
    if (
      (Object(utils.isSummaryBranch)(this) || Object(utils.isCalloutBranch)(this)) &&
      Object(utils.isTreeTableCell)(this.parent()) &&
      Object(utils.isTreeTableStructure)(parent)
    ) {
      return true;
    }
    if (Object(utils.isSummaryBranch)(this) && Object(utils.isFishBoneHead)(this.parent())) {
      return true;
    }
    if (this.isMatrixCellBranch()) {
      return parent.shouldHide();
    }
    if (parent.shouldCollapse() && !Object(utils.isCalloutBranch)(this)) {
      return true;
    }
    return parent.shouldHide();
  }
  isBoundariesHide() {
    if (this.shouldCollapse() || this.shouldHide()) {
      return true;
    }
    // for fish bone main bone
    if (Object(utils.isFishBoneHead)(this)) {
      return true;
    }
  }
  isMatrixViewHide() {
    return this.shouldCollapse() || this.shouldHide();
  }
  isSummariesHide() {
    return this.shouldCollapse() || this.shouldHide();
  }
  _showOrHideCollapseExtendView() {
    let view = this.collapseExtendView;
    // 如果 branch 不能显示 collpase 按钮，则隐藏 collapseExtend 按钮
    if (this.isUnableCollapse()) {
      if (Object(utils.isDef)(view)) {
        if (view === null || view === undefined) {
          // do nothing
        } else {
          view.hide();
        }
      }
    } else {
      if (Object(utils.isUndef)(view)) {
        view = new CollapseExtendView(this.model);
        this.addCollapseExtendView(view);
      }
      if (view === null || view === undefined) {
        // do nothing
      } else {
        view.show();
      }
    }
  }
  _showOrHideBoundaries() {
    this.boundaries.forEach(boundaryView => {
      const isVisible = !this.isBoundariesHide() && !boundaryView.isForcedInvisible;
      boundaryView.setVisible(isVisible);
    });
  }
  _showOrHideMatrixView() {
    if (!this._matrixView) {
      return;
    }
    this._matrixView.setVisible(!this.isMatrixViewHide());
  }
  _showOrHideRelationShipViews() {
    let _a;
    const isUndef = v => v === undefined || v === null;
    const cSVGView = this.editDomain();
    if ((_a = this.sheetView) === null || _a === undefined) {
      // do nothing
    } else {
      _a.relationships.forEach(rView => {
        const rModel = rView.model;
        const end1Id = rModel.get('end1Id');
        const end2Id = rModel.get('end2Id');
        const end1View = cSVGView.model2View[end1Id];
        const end2View = cSVGView.model2View[end2Id];
        const isHide =
          isUndef(end1View) ||
          isUndef(end2View) ||
          !end1View.figure.isVisible ||
          !end2View.figure.isVisible ||
          rView.isForcedInvisible;
        rView.setVisible(!isHide);
      });
    }
  }
  refreshView() {
    if (this.shouldHide() && this._isHiding) {
      return mommonFuncs.SKIP;
    } else if (this.isPlaceHolderView) {
      return mommonFuncs.SKIP;
    } else {
      this.trigger('refreshView');
      if (this.isCentralBranch()) {
        this._showOrHideRelationShipViews();
      }
      this._showOrHideBoundaries();
      this._showOrHideMatrixView();
      this.render();
    }
  }
  setVisible(isVisible) {
    this.isVisible = isVisible;
    this.figure.setVisible(this.isVisible && !this.shouldHide() && !this.isForcedInvisible);
  }
  setRelatedViewsVisible(forcedInvisible, options) {
    let _a;
    let _b;
    let _c;
    const defaultOptions = {
      connection: true,
      boundary: true,
      topic: true,
      branch: true,
      treeTableCell: true,
    };
    options = Object.assign({}, defaultOptions, options);
    if (options.branch) {
      this.setForcedInvisible(forcedInvisible);
    }
    // topic
    if (options.topic) {
      this.topicView.setForcedInvisible(forcedInvisible);
    }
    // boundary
    if (options.boundary) {
      this.boundaries.forEach(boundaryView => {
        boundaryView.setForcedInvisible(forcedInvisible);
      });
    }
    // connection
    if (options.connection) {
      this._connectionView.setForcedInvisible(forcedInvisible);
      if ((_a = this._fishBoneHeadLineView) === null || _a === undefined) {
        // do nothing
      } else {
        _a.setForcedInvisible(forcedInvisible);
      }
      if ((_b = this._fishBoneMainLineView) === null || _b === undefined) {
        // do nothing
      } else {
        _b.setForcedInvisible(forcedInvisible);
      }
    }
    if (options.treeTableCell) {
      if ((_c = this._treeTableCellView) === null || _c === undefined) {
        // do nothing
      } else {
        _c.setForcedInvisible(forcedInvisible);
      }
    }
  }
  refreshTopicWithNumbering(index) {
    const attaches = this.getChildrenBranchesByType();
    const len = attaches.length;
    while (index < len) {
      attaches[index].figure.invalidateLayout();
      // attaches[index].topicView.render();
      attaches[index].refreshTopicWithNumbering(0);
      index++;
    }
  }
  refresh() {
    this.layout();
  }
  branchIndex() {
    const parent = this.parent();
    if (parent instanceof BranchView) {
      const attacheChildren = parent.getChildrenBranchesByType();
      return underscore.indexOf(attacheChildren, this);
    }
    return -1;
  }
  summaryIndex() {
    const parent = this.parent();
    if (parent instanceof BranchView) {
      const summaryChildren = parent.getChildrenBranchesByType(TOPIC_TYPE.SUMMARY);
      return underscore.indexOf(summaryChildren, this);
    }
    return -1;
  }
  floatingIndex() {
    const parent = this.parent();
    if (parent instanceof BranchView) {
      const floatingChildren = parent.getChildrenBranchesByType(TOPIC_TYPE.DETACHED);
      return underscore.indexOf(floatingChildren, this);
    }
    return -1;
  }
  isAttached() {
    return this.branchIndex() !== -1;
  }
  getNumberingText() {
    let numbering = '';
    const prefix = this.getPrefixText();
    const number = this.getNumberText();
    const suffix = this.getSuffixText();
    if (prefix && number) {
      numbering += prefix;
      if (number) {
        numbering += ' ';
      }
    }
    if (number) {
      numbering += number;
    }
    if (suffix) {
      if (number) {
        numbering += ' ';
      }
      numbering += suffix;
    }
    return numbering;
  }
  getNumberText() {
    const index = this.branchIndex();
    if (index !== -1) {
      const format = this.getComputedNumberFormat();
      if (format === NUMBERFORMAT.NONE) {
        return '';
      } else {
        let number = Util.getNumberText(format, index + 1);
        const parent = this.parent();
        if (parent instanceof BranchView) {
          const pNumbering = parent === null || parent === undefined ? undefined : parent.getNumberText();
          if (pNumbering) {
            number = pNumbering + this.getNumberSeparatorText(this.getComputedNumberSeparator()) + number;
          }
        }
        return number;
      }
    }
  }
  getNumberSeparatorText(separator) {
    switch (separator) {
      case NUMBERSEPARATOR.COMMA:
        return ',';
      case NUMBERSEPARATOR.DOT:
        return '.';
      case NUMBERSEPARATOR.HYPHEN:
        return '-';
      case NUMBERSEPARATOR.DASH:
        return '_';
      case NUMBERSEPARATOR.OBLIQUE:
        return '/';
      default:
        return '.';
    }
  }
  getPrefixText() {
    const numbering = this.getNumbering();
    if (numbering) {
      return numbering.prefix;
    }
  }
  getSuffixText() {
    const numbering = this.getNumbering();
    if (numbering) {
      return numbering.suffix;
    }
  }
  getPreOrSufNumber(text, oldText) {
    if (text === '') {
      return '';
    }
    if (text) {
      return text;
    } else {
      return oldText;
    }
  }
  getNumbering() {
    let _a;
    if (!this.isAttached()) {
      return;
    }
    if ((_a = this.parent()) === null || _a === undefined) {
      return undefined;
    } else {
      return _a.model.get('numbering');
    }
  }
  getComputedNumberFormat() {
    let _a;
    if (!this.isAttached()) {
      return;
    }
    const format = this.getNumberFormat();
    if (format) {
      return format;
    } else if ((_a = this.parent()) === null || _a === undefined) {
      return undefined;
    } else {
      return _a.getComputedNumberFormat();
    }
  }
  getNumberFormat() {
    const numbering = this.getNumbering();
    if (numbering) {
      return numbering.numberFormat;
    }
  }
  getComputedNumberSeparator() {
    let _a;
    if (!this.isAttached()) {
      return;
    }
    const separator = this.getNumberSeparator();
    if (separator) {
      return separator;
    } else if ((_a = this.parent()) === null || _a === undefined) {
      return undefined;
    } else {
      return _a.getComputedNumberSeparator();
    }
  }
  getNumberSeparator() {
    const numbering = this.getNumbering();
    if (numbering) {
      return numbering.numberSeparator;
    }
  }
  isCentralBranch() {
    return this.sheetView?.centralBranchView === this || this.isCentralBranchView;
  }
  isAttachedBranch() {
    return this.model.type() === TOPIC_TYPE.ATTACHED;
  }
  isSummaryBranch() {
    return this.model.type() === TOPIC_TYPE.SUMMARY;
  }
  /** @deprecated */
  isDetachedBranch() {
    return this.model.type() === TOPIC_TYPE.DETACHED;
  }
  /** @deprecated use sb_utils/branch.isCalloutBranch*/
  isCalloutBranch() {
    return this.model.type() === TOPIC_TYPE.CALLOUT;
  }
  isLeafBranch() {
    if (!this.isCentralBranch() && !this.getChildrenBranchesByType().length) {
      return true;
    }
  }
  isMatrixBranch() {
    const structure = this.getStructureClass();
    return structure === STRUCTURECLASS.COLUMNSPREADSHEET || structure === STRUCTURECLASS.SPREADSHEET;
  }
  // layer为向上追溯的层级, -1 表示向上追溯一直到 centralBranch
  getMatrixStructureBranch(layer = -1) {
    const iter = (view, layer) => {
      if (view.isMatrixBranch()) {
        return view;
      }
      if (layer !== 0 && Object(utils.isDetachedBranch)(view)) {
        const parent = view.parent();
        if (parent instanceof BranchView) {
          return iter(parent, layer - 1);
        } else {
          return null;
        }
      }
      return null;
    };
    return iter(this, layer);
  }
  // layer为向上追溯的层级, -1 表示向上追溯一直到 centralBranch
  isInMatrix(layer = -1) {
    const matrixBranch = this.getMatrixStructureBranch(layer);
    return matrixBranch !== null;
  }
  isMatrixHeadCellBranch() {
    const parent = this.parent();
    if (parent?.type !== VIEW_TYPE.BRANCH) {
      return false;
    } else {
      return this.isAttachedBranch() && (parent === null || parent === undefined ? undefined : parent.isMatrixBranch());
    }
  }
  /**
   * MatrixCellBranch means that branch's grandparent is matrix
   */
  isMatrixCellBranch() {
    const parent = this.parent();
    if (parent === null || parent === undefined ? undefined : parent.isDetachedBranch()) {
      return false;
    }
    if (parent?.type !== VIEW_TYPE.BRANCH) {
      return false;
    }
    const gParent = parent === null || parent === undefined ? undefined : parent.parent();
    if (gParent?.type !== VIEW_TYPE.BRANCH) {
      return false;
    } else {
      return this.isAttachedBranch() && gParent.isMatrixBranch();
    }
  }
  layoutDeep() {
    this.setLayoutFalse();
    this.layout();
  }
  setLayoutFalse() {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    self.isLayout = false;
    underscore.each(
      self.getChildrenBranchesByType([
        TOPIC_TYPE.ATTACHED,
        TOPIC_TYPE.DETACHED,
        TOPIC_TYPE.CALLOUT,
        TOPIC_TYPE.SUMMARY,
      ]),
      childBranch => {
        if (childBranch.getChildrenBranchesByType().length) {
          childBranch.setLayoutFalse();
        }
      }
    );
  }
  /** this function will be called by sheet changing theme,so how should we rewrite it?
   * @deprecated
   */
  renderByThemeChange() {
    this.isLayout = false;
    this.topicView.figure.invalidateLayout();
    // this.topicView.render();
    if (this.collapseExtendView) {
      this.collapseExtendView.render();
    }
    underscore.each(
      this.getChildrenBranchesByType([
        TOPIC_TYPE.ATTACHED,
        TOPIC_TYPE.DETACHED,
        TOPIC_TYPE.CALLOUT,
        TOPIC_TYPE.SUMMARY,
      ]),
      childBranch => {
        childBranch.renderByThemeChange();
      }
    );
  }
  /**
   * @description methods for edit receiver
   * @return {textClientStyle}
   **/
  getTextClientStyle() {
    const info = styleManager.getFontInfo(this);
    return Object.assign(Object.assign({}, info), {
      fontSize: parseInt(info.fontSize ?? '12'),
    });
  }
  getTextClientBounds() {
    let _b;
    if ((_b = this.topicView?.titleView) === null || _b === undefined) {
      return undefined;
    } else {
      return _b.getSvg().node.getBoundingClientRect();
    }
  }
  /**
   * @description 代理 topicView 的 hideTitle, showTitle
   */
  hideTitle() {
    this.topicView.hideTitle();
  }
  showTitle() {
    this.topicView.showTitle();
  }
  /**
   * @param {string} newText
   * @public
   * */
  saveEdit(newText, options) {
    const defaultOptions = {
      isSilent: false,
    };
    options = Object.assign({}, defaultOptions, options);
    this.model.changeTitle(newText, options);
  }
  getEditContent() {
    return this.model.getTitle();
  }
  /**
   * 获取branch节点的层级，centralBranch为1，mainTopic为2，以此递增
   * @returns {*}
   */
  getLayer() {
    if (this._forceLayer) {
      return this._forceLayer;
    }
    if (this._layerCache) {
      return this._layerCache;
    }
    let layer;
    if (this.isCentralBranch() || !this.parent()) {
      layer = 1;
    } else {
      layer = this.parent().getLayer() + 1;
    }
    this._layerCache = layer;
    return layer;
  }
  /**
   * @description 判断是否处于被选择框之内
   * @param rbox
   * @param {boolean} isSegmentMultiSelect 是否是分阶段框选
   * @public
   * */
  isMultiSelect(rbox, isSegmentMultiSelect) {
    const selectionManager = this.getModule(MODULE_NAME.SELECTION);
    if (selectionManager) {
      const positionTransfer = this.editDomain().getCoordinateTransfer();
      const topicClientPosition = positionTransfer.mindMapToVisibleArea({
        x: this.realPosition.x,
        y: this.realPosition.y,
      });
      const currentScale = this.editDomain().getScale() / 100;
      const scaledTopicBounds = {
        x: currentScale * this.topicView.shapeBounds.x,
        y: currentScale * this.topicView.shapeBounds.y,
        width: currentScale * this.topicView.shapeBounds.width,
        height: currentScale * this.topicView.shapeBounds.height,
      };
      const topicRBox = {
        x: topicClientPosition.x + scaledTopicBounds.x,
        y: topicClientPosition.y + scaledTopicBounds.y,
        x2: topicClientPosition.x + scaledTopicBounds.x + scaledTopicBounds.width,
        y2: topicClientPosition.y + scaledTopicBounds.y + scaledTopicBounds.height,
        width: scaledTopicBounds.width,
        height: scaledTopicBounds.height,
      };
      if (!selectionManager.isUnselectable(this) && Util.isBoxIntersect(rbox, topicRBox)) {
        selectionManager.addSelection(this);
      } else if (!isSegmentMultiSelect) {
        selectionManager.removeFromSelection(this);
      }
    }
  }
  /**
   * @description 更新多边形点列表，这些点相连接构成的区域，是branch的拖拽识别区域
   * @public
   * */
  updatePolygon() {
    this._polyPointsArr = getStructure(this.getStructureClass()).calcPolygons(this);
    return this;
  }
  /**
   * @description 获取多边形点列表
   * @public
   * */
  getPolyPointsArr() {
    return this._polyPointsArr;
  }
  getPolygonBounds() {
    if (this._treeTableCellView) {
      // for collapsed tree table head branch, tree table layout process is not executed
      // so there is no externalInfo
      if (Object(utils.isTreeTableHeadBranch)(this) && this.shouldCollapse()) {
        return Object.assign({}, this.topicView.bounds);
      }
      const layoutExternalInfo = this.getLayoutInfo(
        Object(utils.getTreeTableHeadBranchView)(this).getStructureClass()
      ).externalInfo;
      return {
        x: layoutExternalInfo.cellX,
        y: layoutExternalInfo.cellY,
        width: this.topicView.bounds.width,
        height: layoutExternalInfo.cellHeight,
      };
    }
    return Object.assign({}, this.topicView.bounds);
  }
  isFishBoneSpecial() {
    const model = this.model;
    const type = model.type();
    const structureClass = model.getStructureClass() || this.getStructureClass();
    if (!structureClass) {
      return false;
    }
    const isFishbone = structureClass.includes('fishbone');
    if (isFishbone && (type === 'root' || type === 'attached')) {
      return true;
    }
  }
  getBrotherDefaultTitle() {
    const topic = this.model;
    const type = styleManager.getClassName(this);
    if (type === CLASS_TYPE.FLOATING_TOPIC) {
      return this.getContext().getTranslatedText('DEFAULT_FLOATING_TOPIC_TITLE');
    } else {
      const parent = topic.parent();
      if (parent instanceof TopicModel) {
        const childNum = parent.children(TOPIC_TYPE.ATTACHED).length + 1;
        if (type === CLASS_TYPE.MAIN_TOPIC) {
          return this.getContext().getTranslatedText('DEFAULT_MAIN_TOPIC_TITLE') + ' ' + childNum;
        } else {
          return this.getContext().getTranslatedText('DEFAULT_SUBTOPIC_TITLE') + ' ' + childNum;
        }
      }
    }
  }
  getChildDefaultTitle() {
    const topic = this.model;
    const type = styleManager.getClassName(this);
    const childNum = topic.children(TOPIC_TYPE.ATTACHED).length + 1;
    if (type === CLASS_TYPE.CENTRAL_TOPIC) {
      return this.getContext().getTranslatedText('DEFAULT_MAIN_TOPIC_TITLE') + ' ' + childNum;
    } else {
      return this.getContext().getTranslatedText('DEFAULT_SUBTOPIC_TITLE') + ' ' + childNum;
    }
  }
  getAdapter(adapter) {
    if (adapter === ADAPTERS.SUMMARY_VIEW) {
      const parentBranchView = this.parent();
      if (!(parentBranchView instanceof BranchView)) {
        return;
      }
      return parentBranchView.findSummaryView(this);
    }
  }
  /**
   * 返回attached branch在整个topic树中的位置，以 .0.1.2这种方式。
   * 对于其它类型的branch，返回空字符串。
   */
  getBranchPath() {
    let _a;
    let curPath = '';
    if (this.isCentralBranch()) {
      return '0';
    }
    switch (this.model.type()) {
      case TOPIC_TYPE.SUMMARY:
        curPath = '.S' + this.summaryIndex();
        break;
      case TOPIC_TYPE.DETACHED:
        curPath = '.F' + this.floatingIndex();
        break;
      case TOPIC_TYPE.CALLOUT:
        curPath = '.C';
        break;
      default:
        curPath = '.' + this.branchIndex();
    }
    return ((_a = this.parent()) === null || _a === undefined ? undefined : _a.getBranchPath()) + curPath;
  }
  /** @description for vana */
  getAvailableStructure() {
    if (this.isCentralBranch() || this.isDetachedBranch()) {
      return EXPOSED_STRUCTURE;
    }
    if (this.isSummaryBranch() || Object(utils.isCalloutBranch)(this)) {
      return [];
    }
    // Atached Branch
    const parent = this.parent();
    if (parent === null || parent === undefined) {
      return undefined;
    } else {
      return parent.getStructureObject().getAvailableChildStructure(parent, this);
    }
  }
  // proxy for display change in mouseOver, mouseOut, used by cellView
  setProxy(newProxy) {
    const oldProxy = this.getProxy();
    this._proxy = newProxy;
    if (this.isSelected) {
      oldProxy.displayDeselect();
      if (this.isDeFocus) {
        newProxy.displayDeFocus();
      } else {
        newProxy.displaySelect();
      }
    } else {
      oldProxy.displayDehover();
    }
  }
  getProxy() {
    return this._proxy || this;
  }
  deleteProxy(proxy) {
    if (this._proxy !== proxy) {
      return;
    }
    if (this.isSelected) {
      this.getProxy().displayDeselect();
      this.displaySelect();
    }
    delete this._proxy;
  }
  displayHover() {
    let _a;
    this.topicView.showSelectBox();
    this._showSummarySelectBox(true);
    if ((_a = this.collapseExtendView) === null || _a === undefined) {
      // do nothing
    } else {
      _a.hover();
    }
  }
  displayDehover() {
    let _a;
    this.topicView.hideSelectBox();
    this._hideSummarySelectBox();
    if ((_a = this.collapseExtendView) === null || _a === undefined) {
      // do nothing
    } else {
      _a.dehover();
    }
  }
  displaySelect() {
    let _a;
    this.killAnimationByFlag(ANIMATION_FLAGS.BRANCH_SHOW_HIGH_LIGHT_SELECT_BOX);
    this.topicView.activateSelectBox();
    this._showSummarySelectBox(false);
    if ((_a = this.collapseExtendView) === null || _a === undefined) {
      // do nothing
    } else {
      _a.hover();
    }
  }
  displayDeselect() {
    let _a;
    this.killAnimationByFlag(ANIMATION_FLAGS.BRANCH_SHOW_HIGH_LIGHT_SELECT_BOX);
    this.topicView.hideSelectBox();
    if ((_a = this.collapseExtendView) === null || _a === undefined) {
      // do nothing
    } else {
      _a.dehover();
    }
  }
  displayDeFocus() {
    this.topicView.deFocusSelectBox();
    this._deFocusSummarySelectBox();
  }
  displayHighLightSelect() {
    this.killAnimationByFlag(ANIMATION_FLAGS.BRANCH_SHOW_HIGH_LIGHT_SELECT_BOX);
    const animationManager = this.getModule(MODULE_NAME.ANIMATION);
    if (animationManager) {
      animationManager.startAnimation(ANIMATION_FLAGS.BRANCH_SHOW_HIGH_LIGHT_SELECT_BOX, {
        target: this,
      });
    }
  }
  getSvg() {
    return this.figure.getContent();
  }
  /** @public */
  getMatrixView() {
    return this._matrixView;
  }
  getTreeTableCellView() {
    return this._treeTableCellView;
  }
  getFishboneHeadLineView() {
    return this._fishBoneHeadLineView;
  }
  getFishboneMainLineView() {
    return this._fishBoneMainLineView;
  }
  getTimelineMainLineView() {
    return this._timelineMainLineView;
  }
  getConnectionView() {
    return this._connectionView;
  }
  /** @public */
  setUnbalanceRightNumber(rightNumber) {
    this.figure.setUnbalanceRightNumber(rightNumber);
  }
  /** @deprecated use sb_utils.branch.showBranchIfHidden */
  extendParentBranchIfHidden() {
    if (!this.figure.isVisible) {
      const parent = this.parent();
      if (parent) {
        if (parent.type !== VIEW_TYPE.BRANCH) {
          return;
        }
        const isParentVisible = parent.figure.isVisible;
        let isParentCollapsed;
        if (!parent.collapseExtendView) {
          isParentCollapsed = false;
        } else {
          isParentCollapsed = parent.collapseExtendView.figure.isCollapsed;
        }
        if (isParentCollapsed) {
          parent.model.extendBranch();
        }
        if (!isParentVisible) {
          parent.extendParentBranchIfHidden();
        }
      }
    }
  }
  get topicView() {
    return this._topicView;
  }
  /** @deprecated */
  get connection() {
    return this._connectionView;
  }
  get isLayout() {
    return this._isLayout;
  }
  set isLayout(isLayout) {
    this._isLayout = isLayout;
  }
}

export default BranchView;

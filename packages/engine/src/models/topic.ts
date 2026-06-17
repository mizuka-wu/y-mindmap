import underscore from 'underscore';

import { parseTopic } from '../utils/business/parsetopic';

import * as commonUtils from '../common/utils/index';

import {
  TOPIC_TYPE,
  MATRIX_GROUP_LIST,
  TREE_TABLE_GROUP_LIST,
  MODEL_TYPE,
  EVENTS,
  CLASS_TYPE,
  STRUCTURECLASS,
  MODULE_NAME,
  EXTENSION_PROVIDER,
  VIEW_TYPE,
  CONFIG,
  SPECIAL_STRUCTURE_LIST,
  STYLE_KEYS,
  TOPIC_MAX_CUSTOM_WIDTH,
} from '../common/constants/index';

import Extensions from './extensions';

import StyleComponent from './stylecomponent';

import * as utils from '../utils/index';

import {
  StyleData,
  Point,
  TopicImageModel,
  NotesData,
  NumberingData,
  MarkerData,
  BoundaryData,
  SummaryData,
  ExtensionData,
  SheetModel,
  BoundaryModel,
  SummaryModel,
  UndoManager,
  ImageData,
  Size,
  Config,
} from '../type.d';

export type IComment = {
  creationTime?: string;
  author?: string;
  content: string;
};

export type TopicData = {
  id: string;
  title: string;
  style?: StyleData;
  class: string;
  position?: Point;
  structureClass?: STRUCTURECLASS;
  branch?: string;
  width?: number;
  labels?: string[];
  numbering?: NumberingData;
  href?: string;
  notes?: NotesData;
  image?: ImageData;
  customWidth?: number;
  children?: {
    [index: string]: Array<TopicData>;
  };
  markers?: Array<MarkerData>;
  boundaries?: Array<BoundaryData>;
  summaries?: Array<SummaryData>;
  extensions?: Array<ExtensionData>;
  titleUnedited?: boolean;
  comments?: IComment[];
};

export type ITaskInfoData = { provider: EXTENSION_PROVIDER.TASK_INFO; content: { status: 'done' | 'todo' } };
export type IMathJaxData = {
  provider: EXTENSION_PROVIDER.MATH_JAX;
  content: { content?: string; width?: number; align?: string };
};
export type IUnBalancedInfoData = {
  provider: EXTENSION_PROVIDER.UNBALANCED_MAP;
  content: { name: string; content: string }[];
};

function hasSameModel(models: (BoundaryModel | SummaryModel)[], newModel: BoundaryModel | SummaryModel) {
  for (let i = 0, l = models.length; i < l; i++) {
    if (models[i].rangeStart === newModel.rangeStart && models[i].rangeEnd === newModel.rangeEnd) {
      return true;
    }
  }
  return false;
}
function getChildDefaultTitle(topic: TopicModel) {
  let _a;
  let _c;
  const type = topic.getStyledTopicType();
  const childNum = topic.children(TOPIC_TYPE.ATTACHED).length + 1;
  const title =
    type === 'centralTopic'
      ? (((_a = topic.ownerSheet()) === null || _a === undefined
          ? undefined
          : _a.getTranslatedText('DEFAULT_MAIN_TOPIC_TITLE')) ?? '')
      : (((_c = topic.ownerSheet()) === null || _c === undefined
          ? undefined
          : _c.getTranslatedText('DEFAULT_SUBTOPIC_TITLE')) ?? '');
  return title + ' ' + childNum;
}
function isMatrixStructure(structureClass: STRUCTURECLASS) {
  return MATRIX_GROUP_LIST.includes(structureClass);
}
function isTreeTableStructure(structureClass: STRUCTURECLASS) {
  return TREE_TABLE_GROUP_LIST.includes(structureClass);
}
const addSubTopic = (topic: TopicModel) => {
  const title = getChildDefaultTitle(topic);
  const emptyTopic = topic.createEmptyTopic({
    title,
  });
  return topic.addChildTopic(emptyTopic);
};
// topic 的 structure 变为 matrix，如果 topic 没有 子topic，
// 则添加 matrix 子topic
function addMatrixDefaultChildren(topic: TopicModel) {
  let _a;
  const topic1 = addSubTopic(topic);
  addSubTopic(topic);
  const gTopic1 = addSubTopic(topic1);
  const gTopic2 = addSubTopic(topic1);
  const labelTitle =
    (_a = topic.ownerSheet()) === null || _a === undefined ? undefined : _a.getTranslatedText('LABEL_TITLE');
  gTopic1.changeLabel(`${labelTitle} 1`);
  gTopic2.changeLabel(`${labelTitle} 2`);
}
function addTreeTableDefaultChildren(topic: TopicModel) {
  addSubTopic(topic);
  addSubTopic(topic);
}
const extensionProviders = {
  taskInfo: 'org.xmind.ui.taskInfo',
  audioNotes: 'org.xmind.ui.audionotes',
  unbalanced: 'org.xmind.ui.map.unbalanced',
  spreadsheet: 'org.xmind.ui.spreadsheet',
};
/**
 * @description the model of topic
 * @constructor
 * */
export class TopicModel extends StyleComponent<TopicData> {
  _imageModel: TopicImageModel | null = null;
  _customWidth: number;
  _type: TOPIC_TYPE;
  _children: Partial<Record<TOPIC_TYPE, TopicModel[]>>;
  _boundaries: BoundaryModel[] = [];
  _summaries: SummaryModel[] = [];
  _extensions: Extensions;
  _titleUnedited?: boolean;
  /** @type {string} */
  get componentType() {
    return MODEL_TYPE.TOPIC;
  }
  /** @public */
  get modelEvents() {
    return {
      labelsChanged: 'labelsChanged',
      informationChanged: 'informationChanged',
      changeCustomWidth: 'changeCustomWidth',
      TITLE_CHANGED: 'titleChanged',
      STRUCTURE_CLASS_CHANGED: 'structureClassChanged',
      CUSTOM_WIDTH_CHANGED: 'customWidthChanged',
      POSITION_CHANGED: 'positionChanged',
      HREF_CHANGED: 'hrefChanged',
      LABEL_CHANGED: 'labelChanged',
      MARKER_CHANGED: 'markerChanged',
      MARKER_ADDED: 'markerAdded',
      MARKER_REMOVED: 'markerRemoved',
      NOTES_ADDED: 'notesAdded',
      NOTES_REMOVED: 'notesRemoved',
      AUDIO_NOTES_ADDED: 'audioNotesAdded',
      AUDIO_NOTES_REMOVED: 'audioNotesRemoved',
      NUMBERING_CHANGED: 'numberingChanged',
      BOUNDARY_ADDED: 'boundaryAdded',
      BOUNDARY_REMOVED: 'boundaryRemoved',
      SUMMARY_ADDED: 'summaryAdded',
      SUMMARY_REMOVED: 'summaryRemoved',
      IMAGE_ADDED: 'imageAdded',
      IMAGE_REMOVED: 'imageRemoved',
      MATH_JAX_ADDED: 'mathJaxAdded',
      MATH_JAX_REMOVED: 'mathJaxRemoved',
      MATH_JAX_WIDTH_CHANGED: 'mathJaxWidthChanged',
      MATH_JAX_ALIGN_CHANGED: 'mathJaxAlignChanged',
      STYLE_CHANGED: 'styleChanged',
    } as const;
  }

  constructor(attr: TopicData, options: { sheet: SheetModel }) {
    super(attr, options);
    let _a: SheetModel | null | undefined;
    this._imageModel = null;
    // this._customWidth = 0;
    // todo 应该在new之前就确保生成好id，而不是在这里check
    if (!this.get('id')) {
      this.set('id', (_a = this.ownerSheet()) === null || _a === undefined ? undefined : _a.generateComponentId());
    }
    this._imageModel = null;
  }
  // @ts-ignore
  parent(parentModel?: TopicModel | SheetModel | null) {
    if (parentModel === undefined) {
      return super.parent<TopicModel | SheetModel | null>();
    }
    if (parentModel && parentModel.componentType === MODEL_TYPE.SHEET) {
      this._type = TOPIC_TYPE.ROOT;
    }
    return super.parent<TopicModel | SheetModel | null>(parentModel);
  }
  /**
   * @todo 需要在remove中实现逻辑
   * @description remove the related components: relationships and markers
   * @private
   * */
  removeRelatedComponent() {
    // get all topic children
    const children = [
      ...this.children(TOPIC_TYPE.ATTACHED),
      ...this.children(TOPIC_TYPE.SUMMARY),
      ...this.children(TOPIC_TYPE.CALLOUT),
      ...this.children(TOPIC_TYPE.DETACHED),
    ];
    children.forEach(item => item.removeRelatedComponent());
    this.boundaries().forEach(item => this.removeRelationship(item.get('id') as string));
    this.getMarkersData().forEach(item => {
      const sheet = this.ownerSheet();
      if (sheet === null || sheet === undefined) {
        // do nothing
      } else {
        sheet.trigger(sheet.modelEvents.topicRemoveMarker, item.markerId);
      }
    });
    this.removeRelationship(this.get('id') as string);
  }
  /**
   * @todo 这个方法唯一起作用的是触发了topicAddMarker事件
   * */
  addRelatedComponent() {
    const children = [
      ...this.children(TOPIC_TYPE.ATTACHED),
      ...this.children(TOPIC_TYPE.SUMMARY),
      ...this.children(TOPIC_TYPE.CALLOUT),
      ...this.children(TOPIC_TYPE.DETACHED),
    ];
    children.forEach(child => child.addRelatedComponent());
    this.getMarkersData().forEach(item => {
      const sheet = this.ownerSheet();
      if (sheet === null || sheet === undefined) {
        // do nothing
      } else {
        sheet.trigger(sheet.modelEvents.topicAddMarker, item.markerId);
      }
    });
  }
  /**
   * @todo 这个方法的实现已经转移到sheet中
   * @public
   * */
  createEmptyTopic(opts: Partial<TopicData> = {}) {
    opts.titleUnedited = true;
    return this.createTopic(opts);
  }
  /** @todo 同上 */
  createTopic(topicData: Partial<TopicData>) {
    topicData = JSON.parse(JSON.stringify(topicData));
    const topic = Object(parseTopic)(topicData, this.ownerSheet());
    return topic;
  }
  children(...typeArgs: [(TOPIC_TYPE | TOPIC_TYPE[])?, ...TOPIC_TYPE[]]): TopicModel[] {
    const types: TOPIC_TYPE[] = Array.isArray(typeArgs[0]) ? typeArgs[0] : (typeArgs as TOPIC_TYPE[]);
    if (types.length > 1) {
      let children: TopicModel[] = [];
      types.forEach(type => (children = children.concat(this.children(type))));
      return children;
    }
    const type = types[0] || TOPIC_TYPE.ATTACHED;
    if (!this._children) {
      this._children = {};
    }
    let children = this._children[type];
    if (!children) {
      children = [];
      this._children[type] = children;
    }
    return children;
  }
  /**
   * @todo 这个方法还有没有必要存在呢
   * @description 获取所有的后代列表
   * @return {Array.<TopicModel>}
   * */
  getDescendantList(...types: TOPIC_TYPE[]) {
    const result: TopicModel[] = [];
    const children = this.children(types);
    if (!children.length) {
      return result;
    }
    result.push(...children);
    children.forEach(child => {
      result.push(...child.getDescendantList(...types));
    });
    return result;
  }
  /**
   * @param {TopicModel} childTopic
   * @param {object} options
   * @param {string} options.type 指定topic的类型
   * @param {number} options.at (default: -1)
   * @param {number} options.sourceIndex
   * @param {boolean} init
   * @public
   * */
  addChildTopic(
    childTopic: TopicModel,
    options: Partial<{
      type: TOPIC_TYPE;
      at?: number;
      sourceIndex: number;
      position?: Point;
      summaryModel?: SummaryModel;
    }> = {},
    init?: boolean
  ) {
    const newTopicModel = childTopic
      ? childTopic
      : this.createEmptyTopic({
          title: '',
        });
    const type = options.type ?? TOPIC_TYPE.ATTACHED;
    const children = this.children(type);
    const at = options.at === undefined || options.at < 0 ? children.length : options.at;
    const sourceIndex = options.sourceIndex;
    const nonNullOptions = Object.assign(Object.assign({}, options), {
      type,
      at,
      sourceIndex,
    });
    this._addTopic(newTopicModel, nonNullOptions, init);
    if (typeof sourceIndex === 'number') {
      this.boundaries().forEach(b => {
        b.afterTopicAdd(newTopicModel, sourceIndex);
      });
      this.summaries().forEach(s => {
        s.afterTopicAdd(newTopicModel, sourceIndex);
      });
    }
    return newTopicModel;
  }
  syncTopic(options: { type: TOPIC_TYPE; at: number }, topic: TopicModel) {
    const data = topic.toJSON();
    const childrenData = this.get('children') || {};
    if (childrenData[options.type]) {
      childrenData[options.type].splice(options.at, 0, data);
    } else {
      childrenData[options.type] = [data];
      this.set('children', childrenData);
    }
    this.topicChanged({
      target: this,
      attr: 'children',
    });
  }
  /** @private */
  _addTopic(topic: TopicModel, options: { type: TOPIC_TYPE; at: number; noAnimation?: boolean }, init?: boolean) {
    let _a: SheetModel | null | undefined;
    let _b: UndoManager | null | undefined;
    let _c;
    let _d;
    this._modifyUnbalanceInfoOnAddTopic(options, init);
    if ((_a = this.ownerSheet()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.trigger(EVENTS.BEFORE_ADD_TOPIC, {
        parent: this,
        at: options.at,
        type: options.type || TOPIC_TYPE.ATTACHED,
        topic: topic,
      });
    }
    if (!init) {
      this.syncTopic(options, topic);
    }
    topic._titleUnedited = topic.has('titleUnedited') && topic.get('titleUnedited');
    const children = this.children(options.type);
    topic.parent(this);
    topic._type = options.type; // change type
    children.splice(options.at, 0, topic);
    if ((_b = this.getUndo()) === null || _b === undefined ? undefined : _b.isExecuting()) {
      topic.addRelatedComponent();
    } // remove add summary's animation
    if (topic.type() === TOPIC_TYPE.SUMMARY) {
      options.noAnimation = true;
    }
    this.trigger('addTopic', topic, options, init);
    if ((_c = this.ownerSheet()) === null || _c === undefined) {
      // do nothing
    } else {
      _c.trigger(EVENTS.AFTER_ADD_TOPIC, {
        parent: this,
        at: options.at,
        type: options.type || TOPIC_TYPE.ATTACHED,
        topic: topic,
      });
    }
    if (!init) {
      if ((_d = this.getUndo()) === null || _d === undefined) {
        // do nothing
      } else {
        _d.add(
          {
            undo: () => {
              this._removeTopic(options);
            },
            redo: () => {
              this._addTopic(topic, options, init);
            },
          },
          'addTopic'
        );
      }
    }
  }
  boundaries() {
    if (!this._boundaries) {
      this._boundaries = [];
    }
    let boundaries = this._boundaries;
    if (!boundaries.length) {
      boundaries = [];
      this._boundaries = boundaries;
    }
    return boundaries;
  }
  summaries() {
    if (!this._summaries) {
      this._summaries = [];
    }
    let summaries = this._summaries;
    if (!summaries.length) {
      summaries = [];
      this._summaries = summaries;
    }
    return summaries;
  }
  extensions() {
    if (!this._extensions) {
      const info = (this.get('extensions') || []).filter(Boolean);
      this._extensions = new Extensions(info);
    }
    return this._extensions;
  }
  addExtension<T extends ExtensionData>(provider: string, data: T, init?: boolean) {
    if (init) {
      return;
    }
    this.extensions().add<T>(provider, data);
    this.syncExtension();
  }
  removeExtension(provider: string) {
    this.extensions().remove(provider);
    this.syncExtension();
  }
  syncExtension() {
    const info = this.extensions().getInfo();
    this.set('extensions', info);
    this.topicChanged({
      target: this,
      attr: 'extensions',
    });
  }
  type() {
    return this._type || TOPIC_TYPE.ATTACHED;
  }
  setType(type: TOPIC_TYPE) {
    this._type = type;
  }
  canCollapse() {
    return this.children().length > 0 && !this.isCentralTopic();
  }
  isCollapse() {
    return this.get('branch') === 'folded' && this.canCollapse();
  }
  extendBranch() {
    let _a;
    if (this.isCollapse()) {
      this.unset('branch');
      this.topicChanged({
        target: this,
        attr: 'branch',
      });
      this.trigger(EVENTS.SE_BRANCH_COLLAPSE_TOGGLE, this.isCollapse());
      if ((_a = this.getUndo()) === null || _a === undefined) {
        // do nothing
      } else {
        _a.add({
          undo: () => {
            this.collapseBranch();
          },
          redo: () => {
            this.extendBranch();
          },
        });
      }
    }
  }
  collapseBranch() {
    let _a;
    if (this.canCollapse() && !this.isCollapse()) {
      this.set('branch', 'folded');
      this.topicChanged({
        target: this,
        attr: 'branch',
      });
      this.trigger(EVENTS.SE_BRANCH_COLLAPSE_TOGGLE, this.isCollapse());
      if ((_a = this.getUndo()) === null || _a === undefined) {
        // do nothing
      } else {
        _a.add({
          undo: () => {
            this.extendBranch();
          },
          redo: () => {
            this.collapseBranch();
          },
        });
      }
    }
  }
  /**
   * @description 切换子节点的搜索或者展开
   * @public (CollapseExtendView.onClick调用)
   * */
  toggleCollapse() {
    if (this.isCollapse()) {
      this.extendBranch();
    } else {
      this.collapseBranch();
    }
  }
  /** @public */
  getStyledTopicType() {
    if (!this.hasAncestor()) {
      return null;
    }
    if (this.isRootTopic()) {
      return CLASS_TYPE.CENTRAL_TOPIC;
    }
    switch (this._type) {
      case TOPIC_TYPE.SUMMARY:
        return CLASS_TYPE.SUMMARY_TOPIC;
      case TOPIC_TYPE.DETACHED:
        return CLASS_TYPE.FLOATING_TOPIC;
      case TOPIC_TYPE.CALLOUT:
        return CLASS_TYPE.CALLOUT_TOPIC;
      default:
        if ((this.parent() as TopicModel).isRootTopic()) {
          return CLASS_TYPE.MAIN_TOPIC;
        } else {
          return CLASS_TYPE.SUB_TOPIC;
        }
    }
  }
  /**
   * @return {position}
   * @public
   * */
  getPosition() {
    const modelPosition = this.get('position');
    // model的position数据也可能存在x和y都为null或者undefined的情况
    if (modelPosition && modelPosition.x !== null && modelPosition.y !== null) {
      return modelPosition;
    } else {
      return {
        x: 0,
        y: 0,
      };
    }
  }
  isSummary() {
    return this._type === TOPIC_TYPE.SUMMARY;
  }
  isCallout() {
    return this._type === TOPIC_TYPE.CALLOUT;
  }
  /**
   * @deprecated 方法名拼写错误，使用isDetached
   * */
  isDetacthed() {
    return this._type === TOPIC_TYPE.DETACHED;
  }
  /** @public */
  isDetached() {
    return this._type === TOPIC_TYPE.DETACHED;
  }
  /**
   * 判断是否有可能自由拖拽（只有map结构的main topic才可以, 并且sheet上需要有标志位）
   * @deprecated please use util function `isFreePositionBranch()` instead.
   */
  isFree() {
    // todo getStructurePolicy方法是干嘛用的？
    let _a: SheetModel | null | undefined;
    return (
      (((_a = this.ownerSheet()) === null || _a === undefined ? undefined : _a.isFreePositionEnabled()) ?? false) &&
      this.getStyledTopicType() === 'mainTopic' &&
      ((this.parent() as TopicModel).getStructureClass() || '').search(STRUCTURECLASS.MAP) !== -1 //只有map结构可以是free position
    );
  }
  /**
   * @param options.isTitleEdited {boolean}
   * */
  addBrotherTopic(
    topicData: TopicData,
    options: { isTitleEdited?: boolean; before?: boolean; position?: Point; title?: string } = {}
  ) {
    const { before = false, title } = options;
    let { position } = options;
    if (this.isSummary()) {
      return false;
    }
    if (this.isRootTopic()) {
      return false;
    }
    const sourceIndex = this.getIndexInParent();
    const at = before ? sourceIndex : sourceIndex + 1;
    const type = this.type();
    const brother = topicData
      ? this.createTopic(topicData)
      : this.createEmptyTopic({
          title,
        });
    if (options.isTitleEdited) {
      brother.unset('titleUnedited');
    }
    if (this.isCallout() || this.isDetached()) {
      if (this.isDetached()) {
        // todo 位置向下偏移
        position = Object.assign({}, position);
      } else {
        position = Object.assign({}, position);
      }
      brother.set('position', position);
    }
    const parent = this.parent() as TopicModel;
    return parent.addChildTopic(brother, {
      at,
      type,
      // before,
      sourceIndex,
      position,
    });
  }
  /**
   * options:
   *  - type: (string) topic type (default: TOPIC_TYPE.ATTACHED)
   */
  removeSelf(options: { at?: number; type?: TOPIC_TYPE; side?: string } = {}) {
    const index = this.getIndexInParent();
    const type = this.type();
    const parent = this.parent();
    if (index < 0) {
      return false;
    }
    options.at = index;
    options.type = type;
    const side = this.getSideInParent(index);
    if (side) {
      options.side = side;
    }
    const nonNullOptions = options as {
      at: number;
      type: TOPIC_TYPE;
      side: string;
      summaryModel: SummaryModel;
    };
    switch (type) {
      case TOPIC_TYPE.ROOT:
        return;
      case TOPIC_TYPE.ATTACHED:
      case TOPIC_TYPE.DETACHED:
      case TOPIC_TYPE.CALLOUT:
        return (parent as TopicModel).removeChildTopic(nonNullOptions);
      case TOPIC_TYPE.SUMMARY:
        return this._removeSelfAsSummaryFrom(parent as TopicModel, nonNullOptions);
      default:
        break;
    }
  }
  _removeSelfAsSummaryFrom(
    parent: TopicModel,
    options: { at: number; type: TOPIC_TYPE; side?: string; summaryModel: SummaryModel }
  ) {
    const id = this.get('id') as string;
    const summaryModel = parent.getSummaryByTopicId(id);
    if (summaryModel) {
      options.summaryModel = summaryModel;
      return parent.removeSummary(options);
    } else {
      return parent.removeChildTopic(options);
    }
  }
  /**
   * @description 删除子topic
   * @param {object} options
   * @param {number} options.at child在数组中的index
   * @param {string} options.type child类型
   * @public
   * */
  removeChildTopic(options: { at: number; type: TOPIC_TYPE; side?: string }) {
    const { at, type } = options;
    const topic = this.children(type)[at];
    //Check the boundary or summary that will be remove first
    this.boundaries()
      .filter(item => item.rangeStart === item.rangeEnd && item.rangeStart === at)
      .forEach(item => item.beforeTopicRemove(topic, at));
    this.summaries()
      .filter(item => item.rangeStart === item.rangeEnd && item.rangeStart === at)
      .forEach(item => item.beforeTopicRemove(topic, at));
    this.boundaries()
      .slice()
      .forEach(b => {
        b.beforeTopicRemove(topic, at);
      });
    this.summaries()
      .slice()
      .forEach(s => {
        s.beforeTopicRemove(topic, at);
      });
    this._modifyUnbalanceInfoOnRemoveTopic(options);
    this._removeTopic(options);
  }
  /**
   * @param {object} options
   * @param {number} options.at child在数组中的index
   * @param {string} options.type child类型
   * */
  _removeTopic(options: { at: number; type: TOPIC_TYPE; side?: string }) {
    let _a: SheetModel | null | undefined;
    let _b: UndoManager | null | undefined;
    let _c: SheetModel | null | undefined;
    const { at, type } = options;
    const children = this.children(type);
    const topic = children[at];
    if ((_a = this.ownerSheet()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.trigger(EVENTS.BEFORE_REMOVE_TOPIC, {
        parent: this,
        at: at,
        type: type,
        topic: topic,
      });
    }
    topic.removeRelatedComponent();
    topic.parent(null);
    children.splice(at, 1);
    const childrenData = this.get('children') as NonNullable<TopicData['children']>;
    childrenData[type].splice(at, 1);
    // 若该类型修改后为空，直接删除该类型数组
    if (!childrenData[type].length) {
      delete childrenData[type];
    }
    // 若children对象已无任何内容，删除children
    if (Object(underscore.isEmpty)(childrenData)) {
      this.unset('children');
    }
    this.topicChanged({
      target: this,
      attr: 'children',
    });
    if ((_b = this.getUndo()) === null || _b === undefined) {
      // do nothing
    } else {
      _b.add(
        {
          undo: () => {
            this._addTopic(topic, options);
          },
          redo: () => {
            this._removeTopic(options);
          },
        },
        'removeTopic'
      );
    }
    this.trigger('removeTopic', topic, options);
    if ((_c = this.ownerSheet()) === null || _c === undefined) {
      // do nothing
    } else {
      _c.trigger(EVENTS.AFTER_REMOVE_TOPIC, {
        parent: this,
        at: at,
        type: type,
        topic: topic,
      });
    }
  }
  moveChildTopic(originIndex?: number, targetIndex?: number) {
    let _a;
    if (originIndex === undefined || targetIndex === undefined) {
      return;
    }
    if (originIndex === targetIndex) {
      return;
    }
    const topicList = this.children(TOPIC_TYPE.ATTACHED);
    const canMove =
      originIndex >= 0 &&
      originIndex <= topicList.length - 1 &&
      targetIndex >= 0 &&
      targetIndex <= topicList.length - 1;
    if (!canMove) {
      return;
    }
    const movingTopic = topicList[originIndex];
    topicList.splice(originIndex, 1);
    topicList.splice(targetIndex, 0, movingTopic);
    (this.get('children') as NonNullable<TopicData['children']>)[TOPIC_TYPE.ATTACHED].splice(originIndex, 1);
    (this.get('children') as NonNullable<TopicData['children']>)[TOPIC_TYPE.ATTACHED].splice(
      targetIndex,
      0,
      movingTopic.toJSON()
    );
    this.topicChanged({
      target: this,
      attr: 'children',
    });
    this.trigger('moveChildTopic', originIndex, targetIndex);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.moveChildTopic(targetIndex, originIndex);
          },
          redo: () => {
            this.moveChildTopic(originIndex, targetIndex);
          },
        },
        'moveChildTopic'
      );
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _getComponent(data: any, type: (typeof MODEL_TYPE)[keyof typeof MODEL_TYPE]) {
    const isModel = data.cid;
    if (isModel) {
      return data;
    } else {
      return (this.ownerSheet() as SheetModel).createComponent(type, data);
    }
  }
  syncBoundaries() {
    const data = this.boundaries().map(model => model.toJSON());
    this.set('boundaries', data);
    this.topicChanged({
      target: this,
      attr: 'boundaries',
    });
  }
  addBoundary(boundaryData: BoundaryData | BoundaryModel, init?: boolean) {
    let _a: UndoManager | null | undefined;
    const boundaries = this.boundaries();
    const newComponent = this._getComponent(boundaryData, 'Boundary');
    //判断是否已有相同range的boundary
    // if (hasSameModel(boundaries, newComponent)) {
    //   return false;
    // }
    if (!newComponent.checkRange(this)) {
      return false;
    }
    newComponent.parent(this);
    boundaries.push(newComponent);
    if (!init) {
      // set title unedited flag
      newComponent.set('titleUnedited', true);
      this.syncBoundaries();
    }

    newComponent._titleUnedited = newComponent.has('titleUnedited') && newComponent.get('titleUnedited');
    this.trigger('addBoundary', newComponent);
    this.trigger(this.modelEvents.BOUNDARY_ADDED, newComponent);
    if (!init) {
      if ((_a = this.getUndo()) === null || _a === undefined) {
        // do nothing
      } else {
        _a.add(
          {
            undo: () => {
              this.removeBoundary(newComponent);
            },
            redo: () => {
              this.addBoundary(newComponent, init);
            },
          },
          'addBoundary'
        );
      }
    }
    return newComponent;
  }
  removeBoundary(boundary: BoundaryModel) {
    let _a: UndoManager | null | undefined;
    const boundaries = this.boundaries();
    const boundaryIndex = boundaries.indexOf(boundary);
    if (boundaryIndex < 0) {
      return this;
    }
    this.removeRelationship(boundary.get('id') as string);
    (this.get('boundaries') as NonNullable<TopicData['boundaries']>).splice(boundaryIndex, 1);
    this.topicChanged({
      target: this,
      attr: 'boundaries',
    });
    boundaries.splice(boundaryIndex, 1);
    boundary.parent(null);
    this.trigger('removeBoundary', boundary, this);
    this.trigger(this.modelEvents.BOUNDARY_REMOVED, boundary);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.addBoundary(boundary);
          },
          redo: () => {
            this.removeBoundary(boundary);
          },
        },
        'removeBoundary'
      );
    }
    return this;
  }
  syncSummaries() {
    const data = this.summaries().map(model => model.toJSON());
    this.set('summaries', data);
    this.topicChanged({
      target: this,
      attr: 'summaries',
    });
  }
  addSummary(
    summaryData: SummaryData | SummaryModel,
    init: boolean | undefined,
    summaryTopic: TopicModel,
    options = {}
  ) {
    const summaryModel = this._addSummary(summaryData, init, options);
    if (!summaryModel) {
      return false;
    }
    if (summaryTopic) {
      this.addChildTopic(summaryTopic, {
        type: TOPIC_TYPE.SUMMARY,
        summaryModel,
      });
    }
    return summaryModel;
  }
  // 本方法与addBoundary方法相同逻辑
  _addSummary(summaryData: SummaryData | SummaryModel, init?: boolean, options = {}) {
    let _a: UndoManager | null | undefined;
    const summaries = this.summaries();
    const newComponent = this._getComponent(summaryData, 'Summary');
    //判断是否已有相同range的boundary
    if (hasSameModel(summaries, newComponent)) {
      return false;
    }
    if (!newComponent.checkRange(this)) {
      return false;
    }
    newComponent.parent(this);
    summaries.push(newComponent);
    if (!init) {
      this.syncSummaries();
    }
    this.trigger('addSummary', newComponent);
    this.trigger(this.modelEvents.SUMMARY_ADDED, newComponent);
    if (!init) {
      if ((_a = this.getUndo()) === null || _a === undefined) {
        // do nothing
      } else {
        _a.add(
          {
            undo: () => {
              this._removeSummary(options, newComponent);
            },
            redo: () => {
              this._addSummary(summaryData, init, options);
            },
          },
          'addSummary'
        );
      }
    }
    return newComponent;
  }
  getSummaryByTopicId(id: string) {
    const summaries = this.summaries();
    for (let i = 0, len = summaries.length; i < len; i++) {
      const summary = summaries[i];
      const topicId = summary.get('topicId');
      if (topicId === id) {
        return summary;
      }
    }
    return null;
  }
  removeSummary(options: { summaryModel: SummaryModel; at: number; type: TOPIC_TYPE; side?: string | undefined }) {
    const { summaryModel } = options;
    this.removeChildTopic(options);
    this._removeSummary(options, summaryModel);
  }
  _removeSummary(options = {}, oldSummary: SummaryModel) {
    let _a: UndoManager | null | undefined;
    const id = oldSummary.get('id');
    oldSummary.parent(null);
    const summariesData = this.get('summaries') as NonNullable<TopicData['summaries']>;
    this.set(
      'summaries',
      summariesData.filter(item => item.id !== id)
    );
    this._summaries = this._summaries.filter(item => item.get('id') !== id);
    this.topicChanged({
      target: this,
      attr: 'summaries',
    });
    this.trigger('removeSummary', oldSummary);
    this.trigger(this.modelEvents.SUMMARY_REMOVED, oldSummary);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this._addSummary(oldSummary, false, options);
          },
          redo: () => {
            this._removeSummary(options, oldSummary);
          },
        },
        'removeSummary'
      );
    }
    return this;
  }
  initMarkersDataForLegend() {
    const markersDataList = this.getMarkersData();
    const sheetModel = this.ownerSheet() as SheetModel;
    markersDataList.forEach(markerInfo => {
      this.trigger(this.modelEvents.MARKER_ADDED, markerInfo.markerId);
      sheetModel.trigger(sheetModel.modelEvents.topicAddMarker, markerInfo.markerId);
    });
  }
  getMarkersData(): Array<MarkerData> {
    if (this.get('markers')) {
      return JSON.parse(JSON.stringify(this.get('markers')));
    } else {
      return [];
    }
  }
  changeMarker(markerId: string): void {
    let _a: UndoManager | null | undefined;
    const markersDataList = this.getMarkersData();
    const hasSameMarker = markersDataList.some(markerInfo => markerInfo.markerId === markerId);
    if (hasSameMarker) {
      return;
    }
    const { markerModule } = utils.getInjectModule(MODULE_NAME.SNOWBIRD);
    const siblingMarkerInfo = markersDataList.find(markerInfo => {
      return markerModule.isSiblingMarker(markerId, markerInfo.markerId);
    });
    if (!siblingMarkerInfo) {
      return this.addMarker(markerId);
    }
    const oldMarkerId = siblingMarkerInfo.markerId;
    // change data to new marker id
    siblingMarkerInfo.markerId = markerId;
    this.set('markers', markersDataList);
    this.topicChanged({
      target: this,
      attr: 'markers',
    });
    this.trigger(this.modelEvents.MARKER_CHANGED, oldMarkerId, markerId);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.changeMarker(oldMarkerId);
          },
          redo: () => {
            this.changeMarker(markerId);
          },
        },
        this.modelEvents.MARKER_CHANGED
      );
    } // for sheet model's legend
    const sheetModel = this.ownerSheet() as SheetModel;
    sheetModel.trigger(sheetModel.modelEvents.topicChangeMarker, oldMarkerId, markerId);
  }
  /** @public */
  addMarker(markerId: string) {
    let _a;
    const markersDataList = this.getMarkersData();
    const hasSameMarker = markersDataList.some(markerInfo => markerInfo.markerId === markerId);
    if (hasSameMarker) {
      return;
    }
    const { markerModule } = Object(utils.getInjectModule)(MODULE_NAME.SNOWBIRD);
    const siblingMarkerInfo = markersDataList.find(markerInfo => {
      return markerModule.isSiblingMarker(markerInfo.markerId, markerId);
    });
    if (siblingMarkerInfo) {
      return this.changeMarker(markerId);
    }
    const newMarkerInfo = {
      markerId,
    };
    // update the marker info inside this topic model
    markersDataList.push(newMarkerInfo);
    this.set('markers', markersDataList);
    this.topicChanged({
      target: this,
      attr: 'markers',
    });
    this.trigger(this.modelEvents.MARKER_ADDED, markerId);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.removeMarker(markerId);
          },
          redo: () => {
            this.addMarker(markerId);
          },
        },
        this.modelEvents.MARKER_ADDED
      );
    }
    const sheetModel = this.ownerSheet() as SheetModel;
    sheetModel.trigger(sheetModel.modelEvents.topicAddMarker, markerId);
  }
  /** @public */
  removeMarker(markerId: string) {
    let _a: UndoManager | null | undefined;
    const markersDataList = this.getMarkersData();
    const targetMarkerIndex = markersDataList.findIndex(markerInfo => markerInfo.markerId === markerId);
    if (targetMarkerIndex === -1) {
      return;
    }
    markersDataList.splice(targetMarkerIndex, 1);
    this.set('markers', markersDataList);
    this.topicChanged({
      target: this,
      attr: 'markers',
    });
    this.trigger(this.modelEvents.MARKER_REMOVED, markerId);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.addMarker(markerId);
          },
          redo: () => {
            this.removeMarker(markerId);
          },
        },
        this.modelEvents.MARKER_REMOVED
      );
    } // for sheet model's legend
    const sheetModel = this.ownerSheet() as SheetModel;
    sheetModel.trigger(sheetModel.modelEvents.topicRemoveMarker, markerId);
  }
  /**
   * @return {taskInfo}
   * @public
   * */
  getTaskInfo() {
    return this.extensions().getExtension<ITaskInfoData>(EXTENSION_PROVIDER.TASK_INFO);
  }
  /** @public */
  addTaskInfo(taskInfoData: ITaskInfoData, init?: boolean) {
    let _a: UndoManager | null | undefined;
    this.addExtension(EXTENSION_PROVIDER.TASK_INFO, taskInfoData, init);
    this.trigger(this.modelEvents.informationChanged, VIEW_TYPE.TASK);
    if (!init) {
      if ((_a = this.getUndo()) === null || _a === undefined) {
        // do nothing
      } else {
        _a.add({
          undo: () => {
            this.removeTaskInfo();
          },
          redo: () => {
            this.addTaskInfo(taskInfoData, init);
          },
        });
      }
    }
    return this;
  }
  /** @public */
  removeTaskInfo() {
    let _a: UndoManager | null | undefined;
    const taskInfo = this.getTaskInfo() as ITaskInfoData;
    this.removeExtension(EXTENSION_PROVIDER.TASK_INFO);
    this.trigger(this.modelEvents.informationChanged, VIEW_TYPE.TASK);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => {
          this.addTaskInfo(taskInfo);
        },
        redo: () => {
          this.removeTaskInfo();
        },
      });
    }
    return this;
  }
  /**
   * @return {audioNotesProvider}
   * @public
   * */
  getAudioNotes() {
    return this.extensions().getExtension(EXTENSION_PROVIDER.AUDIO_NOTES);
  }
  /**
   * @param {audioNotesProvider} audioNotesData
   * @param {boolean} [init]
   * @public
   * */
  addAudioNotes(audioNotesData: ExtensionData, init?: boolean) {
    this.addExtension(EXTENSION_PROVIDER.AUDIO_NOTES, audioNotesData, init);
    this.trigger(this.modelEvents.informationChanged, VIEW_TYPE.AUDIO);
    this.trigger(this.modelEvents.AUDIO_NOTES_ADDED, audioNotesData);
    return this;
  }
  removeAudioNotes() {
    let _a;
    const audioNotes = this.getAudioNotes();
    this.removeExtension(EXTENSION_PROVIDER.AUDIO_NOTES);
    this.trigger(this.modelEvents.informationChanged, VIEW_TYPE.AUDIO);
    this.trigger(this.modelEvents.AUDIO_NOTES_REMOVED);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => {
          this.addAudioNotes(audioNotes as ExtensionData);
        },
        redo: () => {
          this.removeAudioNotes();
        },
      });
    }
    return this;
  }
  getIOSDrawing() {
    return this.extensions().getExtension(EXTENSION_PROVIDER.IOS_DRAWING);
  }
  updateIOSDrawing(iOSDrawingData: ExtensionData, init?: boolean) {
    let _a;
    const oldIOSDrawingData = this.getIOSDrawing();
    if (!iOSDrawingData) {
      this.removeExtension(EXTENSION_PROVIDER.IOS_DRAWING);
    } else {
      this.addExtension(EXTENSION_PROVIDER.IOS_DRAWING, iOSDrawingData, init);
    }
    if (!init) {
      if ((_a = this.getUndo()) === null || _a === undefined) {
        // do nothing
      } else {
        _a.add({
          undo: () => {
            this.updateIOSDrawing(oldIOSDrawingData as ExtensionData);
          },
          redo: () => {
            this.updateIOSDrawing(iOSDrawingData);
          },
        });
      }
    }
  }
  getPitchInfo() {
    return this.extensions().getExtension(EXTENSION_PROVIDER.PITCH);
  }
  updatePitchInfo(PitchData: ExtensionData | null | undefined, init?: boolean) {
    let undomanager: UndoManager | null | undefined;
    const oldPitchData = this.getPitchInfo();
    if (!PitchData) {
      this.removeExtension(EXTENSION_PROVIDER.PITCH);
    } else {
      this.addExtension(EXTENSION_PROVIDER.PITCH, PitchData, init);
    }
    if (!init) {
      if ((undomanager = this.getUndo()) === null || undomanager === undefined) {
        // do nothing
      } else {
        undomanager.add({
          undo: () => {
            this.updatePitchInfo(oldPitchData);
          },
          redo: () => {
            this.updatePitchInfo(PitchData);
          },
          options: {
            shouldBindSelectionRestore: true,
            model: this,
          },
        });
      }
    }
  }
  getMathJaxInfo() {
    let content;

    const mathJaxData = this.extensions().getExtension<IMathJaxData>(EXTENSION_PROVIDER.MATH_JAX);
    if ((content = mathJaxData?.content?.content) === null || content === undefined ? undefined : content.trim()) {
      return mathJaxData;
    }
    return null;
  }
  getMathJaxText() {
    let _b;
    const mathJaxInfo = this.getMathJaxInfo();
    return ((_b = mathJaxInfo?.content?.content) === null || _b === undefined ? undefined : _b.trim()) ?? null;
  }
  updateMathJaxInfo(mathJaxData: IMathJaxData | null, init?: boolean) {
    let _b;
    let _d;
    const oldMathJaxData = this.getMathJaxInfo();
    if (!((_b = mathJaxData?.content?.content) === null || _b === undefined ? undefined : _b.trim())) {
      this.removeExtension(EXTENSION_PROVIDER.MATH_JAX);
      this.updateMathJaxFallBackImageInfo(null);
      this.trigger(this.modelEvents.MATH_JAX_REMOVED);
    } else {
      if (oldMathJaxData?.content?.align && !(mathJaxData as IMathJaxData).content.align) {
        (mathJaxData as IMathJaxData).content.align = oldMathJaxData.content.align;
      }
      this.addExtension<IMathJaxData>(EXTENSION_PROVIDER.MATH_JAX, mathJaxData as IMathJaxData, init);
      if (this._imageModel) {
        this.removeImage();
      }
      this.updateMathJaxFallBackImageInfo(null);
      this.trigger(this.modelEvents.MATH_JAX_ADDED);
    }
    if (!init) {
      if ((_d = this.getUndo()) === null || _d === undefined) {
        // do nothing
      } else {
        _d.add({
          undo: () => {
            this.updateMathJaxInfo(oldMathJaxData as IMathJaxData);
          },
          redo: () => {
            this.updateMathJaxInfo(mathJaxData);
          },
          options: {
            shouldBindSelectionRestore: true,
            model: this,
          },
        });
      }
    }
  }
  removeMathJaxInfo() {
    this.updateMathJaxInfo(null);
  }
  // add from mathjax layout worker
  updateMathJaxFallBackImageInfo(imageInfo: ImageData | null) {
    const preImageInfo = this.get('image');
    if (
      imageInfo &&
      preImageInfo &&
      imageInfo.src === preImageInfo.src &&
      imageInfo.width === preImageInfo.width &&
      imageInfo.height === preImageInfo.height
    ) {
      return;
    }
    if (!imageInfo && !preImageInfo) {
      return;
    }
    if (imageInfo) {
      this.set('image', imageInfo);
    } else {
      this.unset('image');
    }
    this.topicChanged({
      target: this,
      attr: 'image',
    });
  }
  updateMathJaxWidth(newWidth: number) {
    let _a: UndoManager | null | undefined;
    const preMathJaxInfo = this.getMathJaxInfo();
    if (!preMathJaxInfo || !preMathJaxInfo.content || preMathJaxInfo.content.width === newWidth) {
      return;
    }
    const newMathJaxInfo = JSON.parse(JSON.stringify(preMathJaxInfo));
    const oldWidth = newMathJaxInfo.content.width;
    if (newWidth) {
      newMathJaxInfo.content.width = newWidth;
    } else {
      delete newMathJaxInfo.content.width;
    }
    this.addExtension(EXTENSION_PROVIDER.MATH_JAX, newMathJaxInfo);
    this.trigger(this.modelEvents.MATH_JAX_WIDTH_CHANGED, newWidth);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => {
          this.updateMathJaxWidth(oldWidth);
        },
        redo: () => {
          this.updateMathJaxWidth(newWidth);
        },
        options: {
          shouldBindSelectionRestore: true,
          model: this,
        },
      });
    }
  }
  updateMathJaxAlign(newAlign: string) {
    let _a: UndoManager | null | undefined;
    const preMathJaxInfo = this.getMathJaxInfo();
    if (!preMathJaxInfo || !preMathJaxInfo.content || preMathJaxInfo.content.align === newAlign) {
      return;
    }
    const newMathJaxInfo = JSON.parse(JSON.stringify(preMathJaxInfo));
    const oldAlign = newMathJaxInfo.content.align;
    newMathJaxInfo.content.align = newAlign;
    this.addExtension(EXTENSION_PROVIDER.MATH_JAX, newMathJaxInfo);
    this.trigger(this.modelEvents.MATH_JAX_ALIGN_CHANGED, newAlign);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => {
          this.updateMathJaxAlign(oldAlign);
        },
        redo: () => {
          this.updateMathJaxAlign(newAlign);
        },
        options: {
          shouldBindSelectionRestore: true,
          model: this,
        },
      });
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  addMapUnbalanced(data: any, init?: boolean) {
    this.addExtension(EXTENSION_PROVIDER.UNBALANCED_MAP, data, init);
    return this;
  }
  getImageData() {
    if (this.get('image')) {
      return Object.assign({}, this.get('image'));
    } else {
      return null;
    }
  }
  getImageModel() {
    return this._imageModel;
  }
  /** @deprecated */
  changeImage(imageData: ImageData) {
    let _a: Config | null | undefined;
    if ((_a = this.getConfig()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.get(CONFIG.LOGGER).warn(Object(commonUtils.methodDeprecatedWarn)('changeImage', 'addImage'));
    }
    return this.addImage(imageData);
  }
  addImage(imageData: ImageData | TopicImageModel | null, isInit?: boolean) {
    let _a;
    if (this.get('image') && this._imageModel && this._imageModel.parent()) {
      this.removeImage();
    }
    if (this.getMathJaxInfo() && !isInit) {
      this.removeMathJaxInfo();
    }
    const newImageModel = this._getComponent(imageData, MODEL_TYPE.IMAGE);
    this._imageModel = newImageModel;
    (this._imageModel as TopicImageModel).parent(this);
    this.set('image', newImageModel.toJSON());
    this.topicChanged({
      target: this,
      attr: 'image',
    });
    this.trigger('addImage');
    this.trigger(this.modelEvents.IMAGE_ADDED, imageData);
    if (!isInit) {
      if ((_a = this.getUndo()) === null || _a === undefined) {
        // do nothing
      } else {
        _a.add(
          {
            undo: () => {
              this.removeImage();
            },
            redo: () => {
              this.addImage(newImageModel);
            },
            options: {
              shouldBindSelectionRestore: true,
              model: this,
            },
          },
          'addImage'
        );
      }
    }
    return this;
  }
  removeImage() {
    let _a;
    let _b;
    this.unset('image');
    this.topicChanged({
      target: this,
      attr: 'image',
    });
    this.trigger('removeImage');
    this.trigger(this.modelEvents.IMAGE_REMOVED);
    const oldImageModel = this._imageModel;
    if ((_a = this._imageModel) === null || _a === undefined) {
      // do nothing
    } else {
      _a.parent(null);
    }
    this._imageModel = null;
    if ((_b = this.getUndo()) === null || _b === undefined) {
      // do nothing
    } else {
      _b.add(
        {
          undo: () => {
            this.addImage(oldImageModel);
          },
          redo: () => {
            this.removeImage();
          },
          options: {
            shouldBindSelectionRestore: true,
            model: this,
          },
        },
        'removeImage'
      );
    }
    return this;
  }
  /** @deprecated */
  resizeImage(size: Partial<Size>) {
    let _a: Config | null | undefined;
    let _b: TopicImageModel | null | undefined;
    if ((_a = this.getConfig()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.get(CONFIG.LOGGER).warn(
        Object(commonUtils.methodDeprecatedWarn)('topicModel.resizeImage', 'imageModel.resize')
      );
    }
    if ((_b = this.getImageModel()) === null || _b === undefined) {
      // do nothing
    } else {
      _b.resize(size);
    }
  }
  /** @deprecated */
  alignImage(direction: 'top' | 'left' | 'right' | 'bottom') {
    let _a;
    let _b;
    if ((_a = this.getConfig()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.get(CONFIG.LOGGER).warn(Object(commonUtils.methodDeprecatedWarn)('topicModel.alignImage', 'imageModel.align'));
    }
    if ((_b = this.getImageModel()) === null || _b === undefined) {
      // do nothing
    } else {
      _b.align(direction);
    }
  }
  /**
   * @return {string}
   * @public
   * */
  getLabel() {
    const labels = this.get('labels') || ([] as string[]);
    return labels.join(',');
  }
  /**
   * @param {string} newLabels
   * @public
   * */
  changeLabel(newLabels = '') {
    let _a: UndoManager | null | undefined;
    newLabels = newLabels.trim();
    const oldLabels = this.getLabel();
    if (newLabels === oldLabels) {
      return false;
    }
    if (!newLabels) {
      this.unset('labels');
    } else {
      this.set('labels', newLabels.split(','));
    }
    this.trigger(this.modelEvents.labelsChanged);
    this.trigger(this.modelEvents.LABEL_CHANGED);
    this.topicChanged({
      target: this,
      attr: 'labels',
    });
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.changeLabel(oldLabels);
          },
          redo: () => {
            this.changeLabel(newLabels);
          },
        },
        this.modelEvents.labelsChanged
      );
    }
  }
  /**
   * @return {notesInfo}
   * @public
   * */
  getNotes() {
    return this.get('notes') || null;
  }
  /**
   * @description 因为历史原因，名字不能改了
   * @param {notesInfo} newNotes
   * @param {Object} options
   * @public
   * */
  changeNote(newNotes: NotesData | null, options = {}) {
    let _a: UndoManager | null | undefined;
    // todo fix me
    if (typeof newNotes === 'string' && newNotes !== '') {
      newNotes = {
        plain: {
          content: newNotes,
        },
      };
    }
    const oldNotes = this.getNotes();
    if (Object(underscore.isEqual)(oldNotes, newNotes)) {
      return false;
    }
    if (!newNotes) {
      this.unset('notes');
      this.trigger(this.modelEvents.NOTES_REMOVED);
    } else {
      this.set('notes', newNotes);
      this.trigger(this.modelEvents.NOTES_ADDED, newNotes);
    }
    this.trigger(this.modelEvents.informationChanged, VIEW_TYPE.NOTE);
    this.topicChanged({
      target: this,
      attr: 'notes',
    });
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.changeNote(oldNotes, options);
          },
          redo: () => {
            this.changeNote(newNotes, options);
          },
        },
        this.modelEvents.informationChanged
      );
    }
  }
  /**
   * @return {string}
   * @public
   * */
  getHref() {
    return this.get('href') || null;
  }
  /**
   * @param {string} newHref
   * @param {Object} options
   * @public
   * */
  changeHref(newHref: string | null, options = {}) {
    let _a: UndoManager | null | undefined;
    const oldHref = this.getHref();
    if (newHref === oldHref) {
      return false;
    }
    newHref = (newHref || '').trim();
    if (!newHref) {
      this.unset('href');
    } else {
      this.set('href', newHref);
    }
    this.trigger(this.modelEvents.informationChanged, VIEW_TYPE.HREF);
    this.trigger(this.modelEvents.HREF_CHANGED, newHref);
    this.topicChanged({
      target: this,
      attr: 'href',
    });
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.changeHref(oldHref, options);
          },
          redo: () => {
            this.changeHref(newHref, options);
          },
        },
        this.modelEvents.informationChanged
      );
    }
  }
  /**
   * @return {commentsInfo}
   * @public
   * */
  getComments() {
    return this.get('comments') || null;
  }
  /**
   * @param {commentsInfo}  newCommentsInfo
   * @public
   * */
  changeComments(newCommentsInfo: IComment[] | null) {
    let _a;
    const oldCommentsInfo = this.getComments();
    if (!newCommentsInfo) {
      this.unset('comments');
    } else {
      this.set('comments', newCommentsInfo);
    }
    this.topicChanged({
      target: this,
      attr: 'comments',
    });
    this.trigger(this.modelEvents.informationChanged, VIEW_TYPE.COMMENT);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => this.changeComments(oldCommentsInfo),
        redo: () => this.changeComments(newCommentsInfo),
      });
    }
  }
  addNumbering(numberingData?: NumberingData) {
    this.set('numbering', numberingData);
    this.trigger('addNumbering');
    return this;
  }
  changeNumbering(key: keyof NumberingData, value: string) {
    let numberingData = this.get('numbering');
    if (underscore.isEmpty(numberingData)) {
      numberingData = {
        numberFormat: '',
        numberSeparator: '',
        prefix: '',
        suffix: '',
      };
      numberingData[key] = value;
      this.addNumbering(numberingData);
    } else {
      (numberingData as NumberingData)[key] = value;
      this.set('numbering', numberingData);
      this.trigger('changeNumbering');
      this.trigger(this.modelEvents.NUMBERING_CHANGED);
    }
    this.topicChanged({
      target: this,
      attr: 'numbering',
    });
    return this;
  }
  _changeStructure(structureClass?: STRUCTURECLASS | null) {
    let undoManager: UndoManager | null | undefined;
    const oldStructure = this.getStructureClass();
    if (structureClass === null) {
      this.unset('structureClass');
    } else {
      this.set('structureClass', structureClass);
    }
    this.trigger('changeStructureClass', structureClass);
    this.trigger(this.modelEvents.STRUCTURE_CLASS_CHANGED, structureClass);
    this.topicChanged({
      target: this,
      attr: 'structureClass',
      oldValue: oldStructure,
    });
    if ((undoManager = this.getUndo()) === null || undoManager === undefined) {
      // do nothing
    } else {
      undoManager.add({
        undo: () => {
          this._changeStructure(oldStructure);
        },
        redo: () => {
          this._changeStructure(structureClass);
        },
      });
    }
  }
  /**
   * @description 修改topic的structure
   * @param {string} structureClass
   * @public
   * */
  changeStructure(structureClass: STRUCTURECLASS | null) {
    const oldStructure = this.getStructureClass();
    if (oldStructure === structureClass) {
      return;
    }
    if (structureClass !== null) {
      // prepare default children for matrix and treetable
      if (this.children(TOPIC_TYPE.ATTACHED).length === 0) {
        if (isMatrixStructure(structureClass)) {
          addMatrixDefaultChildren(this);
        }
        if (isTreeTableStructure(structureClass)) {
          addTreeTableDefaultChildren(this);
        }
      }
      // @link for issue https://gitlab.xmind.cn/xmind/snowbrush/issues/512
      const isOldStructureSpecial = SPECIAL_STRUCTURE_LIST.includes(oldStructure as STRUCTURECLASS);
      const isNewStructureSpecial = SPECIAL_STRUCTURE_LIST.includes(structureClass);
      if (!isOldStructureSpecial && isNewStructureSpecial) {
        this._saveConnectionLineTypeInNormalStructure();
      }
      if (isOldStructureSpecial && !isNewStructureSpecial) {
        this._restoreConnectionLineTypeInNormalStructure();
      }
      if (this.isRootTopic()) {
        // remove skeleton data from sheet
        (this.parent() as SheetModel).removeSkeletonStructureStyle();
      }
    }
    this._changeStructure(structureClass);
  }
  _saveConnectionLineTypeInNormalStructure() {
    const preConnectionLineType = this.getStyleValue(STYLE_KEYS.LINE_CLASS);
    if (!preConnectionLineType) {
      return;
    }
    const extension = {
      provider: EXTENSION_PROVIDER.LINE_CLASS_IN_NORMAIL_STRUCTURE,
      content: preConnectionLineType,
    };
    this.addExtension(EXTENSION_PROVIDER.LINE_CLASS_IN_NORMAIL_STRUCTURE, extension);
  }
  _restoreConnectionLineTypeInNormalStructure() {
    const preConnectionLineType = this.extensions().getExtension(
      EXTENSION_PROVIDER.LINE_CLASS_IN_NORMAIL_STRUCTURE
    )?.content;
    if (!preConnectionLineType) {
      return;
    }
    this.changeStyle(STYLE_KEYS.LINE_CLASS, preConnectionLineType as string);
    this.removeExtension(EXTENSION_PROVIDER.LINE_CLASS_IN_NORMAIL_STRUCTURE);
  }
  /**
   * @param array {Array.<{ id: string }>}
   * @param id {string}
   * */
  getIndexById(array: { id: string }[], id: string) {
    return array.findIndex(item => item.id === id);
  }
  /**
   * @description 根据给定的topic id，获取其index
   * @param {string} id
   * @param {string} type
   * @return {number}
   * @public
   * */
  getChildrenIndexById(id: string, type = TOPIC_TYPE.ATTACHED) {
    const children = this.children(type);
    return children.findIndex(topicModel => topicModel.id === id);
  }
  getIndexInParent() {
    const type = this.type();
    if (type === TOPIC_TYPE.ROOT) {
      return 0;
    }
    const parent = this.parent();
    if (!parent) {
      return 0;
    }
    const arr = (parent as TopicModel).children([type]);
    return arr.indexOf(this);
  }
  getSideInParent(at: number) {
    const parent = this.parent();
    if (!parent) {
      return false;
    }
    if (
      (parent as TopicModel).getStructureClass() !== STRUCTURECLASS.MAPUNBALANCED ||
      this.type() !== TOPIC_TYPE.ATTACHED
    ) {
      return false;
    }
    const type = this.type();
    if (type === TOPIC_TYPE.ROOT) {
      return false;
    }
    const parentUnBalancedInfo = (parent as TopicModel).unBalancedInfo();
    if (!parentUnBalancedInfo) {
      return false;
    }
    const count = parseInt(parentUnBalancedInfo.content);
    if (at < count) {
      return 'right';
    } else {
      return 'left';
    }
  }
  removeRelationship(id: string) {
    const sheet = this.ownerSheet();
    if (sheet && sheet.relationships().length) {
      sheet
        .relationships()
        .filter(r => r.get('end1Id') === id || r.get('end2Id') === id)
        .forEach(r => sheet.removeRelationship(r));
    }
  }
  styleChanged() {
    const style = this.style();
    if (style) {
      this.set('style', style.toJSON());
    } else {
      this.unset('style');
    }
    this.trigger(this.modelEvents.STYLE_CHANGED);
    this.topicChanged({
      target: this,
      attr: 'style',
    });
  }
  /** @public */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  topicChanged({ target, attr, oldValue }: { target: TopicModel | SheetModel; attr: string; oldValue?: any }) {
    //TODO
    const parent = this.parent();
    if (!parent) {
      return;
    }
    if (parent.componentType === MODEL_TYPE.SHEET) {
      parent.sheetChanged(parent.rootTopic(), {
        target,
        attr,
        oldValue,
      });
    } else {
      const type = this.type();
      const index = parent.children(type).indexOf(this);
      // 更新 data
      if (index !== -1) {
        const child = parent.get('children');
        if (child) child[type][index] = this.toJSON();
      }
      parent.topicChanged({
        target,
        attr,
        oldValue,
      });
    }
    return this;
  }
  /**
   * @param {string} newTitle
   * */
  changeTitle(newTitle?: string, options: { isSilent?: boolean; titleUnedited?: boolean } = {}) {
    let _a: UndoManager | null | undefined;
    const defaultOptions = {
      isSilent: false,
      titleUnedited: false,
    };
    options = Object.assign({}, defaultOptions, options);
    const oldTitle = this.get('title');
    if (newTitle === oldTitle) {
      return false;
    }
    if (typeof newTitle !== 'string') {
      return false;
    }
    this.set('title', newTitle);
    const oldTitleUnedited = this._titleUnedited;
    if (!options.titleUnedited && this.has('titleUnedited')) {
      this.unset('titleUnedited');
      this._titleUnedited = false;
    } else if (options.titleUnedited === true) {
      this.set('titleUnedited', true);
      this._titleUnedited = true;
    }
    this.trigger(this.modelEvents.TITLE_CHANGED, newTitle);
    this.topicChanged({
      target: this,
      attr: 'titleUnedited',
    });
    if (!options.isSilent) {
      const undoTask = {
        undo: () => {
          this.changeTitle(oldTitle, {
            titleUnedited: oldTitleUnedited,
          });
        },
        redo: () => {
          this.changeTitle(newTitle, options);
        },
        options: {
          shouldBindSelectionRestore: true,
          model: this,
        },
      };
      if ((_a = this.getUndo()) === null || _a === undefined) {
        // do nothing
      } else {
        _a.add(undoTask, 'changeTitle');
      }
    }
  }
  /**
   * @public
   */
  getTitle() {
    return this.get('title') || '';
  }
  changePosition(position?: Point) {
    let _a: UndoManager | null | undefined;
    const oldPos = this.get('position');
    this.set('position', position);
    this.trigger(this.modelEvents.POSITION_CHANGED, Object.assign({}, position));
    this.topicChanged({
      target: this,
      attr: 'position',
    });
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.changePosition(oldPos);
          },
          redo: () => {
            this.changePosition(position);
          },
        },
        'changePosition'
      );
    }
  }
  clearPosition() {
    let _a: UndoManager | null | undefined;
    const oldPos = this.get('position');
    if (!oldPos) {
      return;
    }
    this.unset('position');
    this.topicChanged({
      target: this,
      attr: 'position',
    });
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.changePosition(oldPos);
          },
          redo: () => {
            this.clearPosition();
          },
        },
        'clearPosition'
      );
    }
  }
  removePendantItem(type: (typeof VIEW_TYPE)[keyof typeof VIEW_TYPE]) {
    const methodMap: Partial<Record<(typeof VIEW_TYPE)[keyof typeof VIEW_TYPE], keyof TopicModel>> = {
      [VIEW_TYPE.HREF]: 'changeHref',
      [VIEW_TYPE.LABEL]: 'changeLabel',
      [VIEW_TYPE.NOTE]: 'changeNote',
      [VIEW_TYPE.IMAGE]: 'removeImage',
      [VIEW_TYPE.TASK]: 'removeTaskInfo',
      [VIEW_TYPE.AUDIO]: 'removeAudioNotes',
      [VIEW_TYPE.MATH_JAX]: 'removeMathJaxInfo',
    } as const;
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    if (!methodMap[type]) {
      return;
    }
    if (self[methodMap[type]]) {
      self[methodMap[type]]();
    }
  }
  isCentralTopic() {
    return this.type() === 'root';
  }
  getMatrixLabelInfos() {
    const extension = this.extensions().getExtension<{
      provider: EXTENSION_PROVIDER.SPREAD_SHEET;
      content?: {
        name: string;
        content: {
          content: string;
        }[];
      }[];
    }>(EXTENSION_PROVIDER.SPREAD_SHEET);
    if (!extension) {
      return [];
    }
    const { content } = extension;
    if (!content) {
      return [];
    }
    for (let i = 0; i < content.length; i++) {
      const info = content[i];
      if (info.name === 'columns') {
        // todo some time, content info would be lost, why?
        const colsInfo = info.content || [];
        return colsInfo.map(col => col.content);
      }
    }
    return [];
  }
  /** @public */
  setMatrixLabelInfos(keyArr: string[] = []) {
    let _a: UndoManager | null | undefined;
    const oldKeyArr = [...this.getMatrixLabelInfos()];
    const colsInfo = keyArr.map(content => {
      return {
        name: 'column',
        content,
      };
    });
    const colsContent = {
      name: 'columns',
      content: colsInfo,
    };
    const extension = {
      provider: extensionProviders.spreadsheet,
      content: [colsContent],
    };
    this.addExtension(EXTENSION_PROVIDER.SPREAD_SHEET, extension);
    this.trigger('matrixLabelInfoUpdated', keyArr);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => this.setMatrixLabelInfos(oldKeyArr),
        redo: () => this.setMatrixLabelInfos(keyArr),
      });
    }
  }
  unBalancedInfo() {
    const extension = this.extensions().getExtension<IUnBalancedInfoData>(EXTENSION_PROVIDER.UNBALANCED_MAP);
    if (!extension) {
      return false;
    }
    const { content } = extension;
    if (content && content.length !== 0) {
      const info = content[0];
      if (info.content && info.name) {
        return info;
      }
    }
    return false;
  }
  unBalancedInfoTotal() {
    return this.extensions().getExtension<IUnBalancedInfoData>(EXTENSION_PROVIDER.UNBALANCED_MAP);
  }
  /** @public */
  setUnBalancedInfoContent(content: number | string, init?: boolean) {
    let _a;
    let extension = this.unBalancedInfoTotal();
    if (!extension) {
      extension = {
        content: [
          {
            content: content + '',
            name: 'right-number',
          },
        ],
        provider: 'org.xmind.ui.map.unbalanced' as EXTENSION_PROVIDER.UNBALANCED_MAP,
      };
    }
    const totalInfo = extension.content;
    if (totalInfo[0]) {
      const before = totalInfo[0].content;
      totalInfo[0].content = content + '';
      this.addExtension(EXTENSION_PROVIDER.UNBALANCED_MAP, extension);
      this.trigger('unbalancedInfoUpdated', before, content);
      if (!init) {
        if ((_a = this.getUndo()) === null || _a === undefined) {
          // do nothing
        } else {
          _a.add(
            {
              undo: () => {
                this.setUnBalancedInfoContent(before);
              },
              redo: () => {
                this.setUnBalancedInfoContent(content);
              },
            },
            'setUnbalancedInfoContent'
          );
        }
      }
    }
  }
  _modifyUnbalanceInfoOnRemoveTopic(option: { type: TOPIC_TYPE; at: number }) {
    if (this.getStructureClass() === STRUCTURECLASS.MAPUNBALANCED && option.type === TOPIC_TYPE.ATTACHED) {
      const unBalancedInfo = this.unBalancedInfo();
      if (!unBalancedInfo) {
        return;
      }
      const count = parseInt(unBalancedInfo.content);
      const isRight = option.at < count;
      if (isRight) {
        this.setUnBalancedInfoContent(Math.max(0, count - 1));
      }
    }
  }
  /**
   * @param option
   * @param {boolean} init
   * @private
   * */
  _modifyUnbalanceInfoOnAddTopic(
    option: { type: TOPIC_TYPE; side?: 'left' | 'right'; sourceIndex?: number },
    init?: boolean
  ) {
    if (init) {
      return;
    }
    if (this.getStructureClass() === STRUCTURECLASS.MAPUNBALANCED && option.type === TOPIC_TYPE.ATTACHED) {
      const unBalancedInfo = this.unBalancedInfo();
      if (!unBalancedInfo) {
        return;
      }
      let count = parseInt(unBalancedInfo.content);
      count = count ? count : 0;
      let isRight;
      const allChildCount = (this._children.attached as TopicModel[]).length - 1; //before add the current one.
      if (option.side === 'right') {
        isRight = true;
      } else if (option.side === 'left') {
        isRight = false;
      } else if (option.sourceIndex !== undefined) {
        //parent上按下enter
        if (count === allChildCount) {
          //left is empty
          if (option.sourceIndex === count - 1) {
            //right edge
            isRight = count < 3;
          } else {
            isRight = true;
          }
        } else {
          //left is not empty, dont care about edge.
          isRight = option.sourceIndex < count;
        }
      }
      //parent上按tab
      else if (count === allChildCount) {
        //left is empty
        isRight = count < 3;
      } else {
        //left not empty
        isRight = false;
      }
      if (isRight) {
        this.setUnBalancedInfoContent(count + 1, init);
      }
    }
  }
  isRootTopic() {
    return !!this.parent() && (this.parent() as TopicModel | SheetModel).componentType === MODEL_TYPE.SHEET;
  }
  /**
   * @param {string[]} typeArr - array of topic type, indicate topic in type arrary will be accessed
   * @param {function} fn - callback, return true to stop trasverse
   * @param {TopicModel} fn.args[0] - topic model
   */
  traverseTopic(typeArr: TOPIC_TYPE[], fn: (topicModel: TopicModel) => true | void) {
    if (!fn) {
      return;
    }
    if (typeArr.indexOf(this.type()) !== -1 && fn(this)) {
      return true;
    } else {
      this.children(typeArr).some(topic => topic.traverseTopic(typeArr, fn));
    }
  }
  getStructureClass() {
    let structureClass: STRUCTURECLASS | undefined | null = this.get('structureClass');
    if (!structureClass) {
      structureClass = this.getStyleValue('structureClass' as unknown as STYLE_KEYS) as STRUCTURECLASS | null;
    }
    return structureClass;
  }
  getStructurePolicy(): STRUCTURECLASS | '' {
    return (
      this.getStructureClass() ||
      (this.parent() && (this.parent() as TopicModel | SheetModel).componentType === MODEL_TYPE.TOPIC
        ? (this.parent() as TopicModel).getStructurePolicy()
        : '')
    );
  }
  getLayer(): number {
    if (this.isRootTopic()) {
      return 1;
    } else {
      const parent = this.parent();
      if (parent && parent.componentType === MODEL_TYPE.TOPIC) {
        return parent.getLayer() + 1;
      } else {
        // Default as subtopic
        return 3;
      }
    }
  }
  customWidth(value?: number) {
    let _a;
    /* init */
    if (this._customWidth === null) {
      this._customWidth = this.get('customWidth') || 0;
    }
    /* getter */
    if (value === undefined) {
      return this._customWidth;
    }
    /* setter */
    if (typeof value !== 'number' || value === this._customWidth) {
      return;
    }
    if (!this._customWidth && !value) {
      return;
    }
    let newWidth = value;
    if (newWidth > TOPIC_MAX_CUSTOM_WIDTH) {
      newWidth = TOPIC_MAX_CUSTOM_WIDTH;
    } else if (newWidth < 0) {
      newWidth = 0;
    }
    const oldWidth = this._customWidth;
    this._customWidth = newWidth;
    this.set('customWidth', this._customWidth);
    this.trigger(this.modelEvents.changeCustomWidth, newWidth);
    this.trigger(this.modelEvents.CUSTOM_WIDTH_CHANGED, newWidth);
    this.topicChanged({
      target: this,
      attr: 'customWidth',
    });
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this.customWidth(oldWidth);
          },
          redo: () => {
            this.customWidth(value);
          },
        },
        'changeCustomWidth'
      );
    }
  }
  isTitleUnedited() {
    if (this.has('titleUnedited') && this.get('titleUnedited') === true) {
      return true;
    } else {
      return false;
    }
  }
}

export default TopicModel;

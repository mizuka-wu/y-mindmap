import underscore from 'underscore';
import {
  MODEL_TYPE,
  TOPIC_TYPE,
  EVENTS,
  INFOITEM_TYPE_SHORT,
  INFOITEM_TYPE_FULL,
  LANGS,
  MODULE_NAME,
  COMPACT_LAYOUT_MODE_LEVEL,
  EXTENSION_PROVIDER,
} from '../common/constants/index';
import * as commonUtils from '../common/utils/index';
import { UndoManager } from '../common/undo';
import { parseTopic } from '../utils/business/parsetopic';
import { utils as langUtils } from '../utils/langs';
import { Config } from '../common/config';
import * as utils from '../utils/index';
import Extensions from './extensions';
import StyleComponent from './stylecomponent';

import {
  SheetComponentFactoryModel,
  IModel as ISheetComponentFactorySupportedComponentModel,
} from './sheetcomponentfactory';

import type {
  ThemeModel,
  TopicModel,
  LegendModel,
  RelationshipModel,
  ExtensionData,
  RelationshipData,
  ThemeData,
  TopicData,
  StyleData,
  LegendData,
} from '../type.d';

type ISettingItem = {
  type: string;
  mode: 'card' | 'icon';
};

export interface SheetData {
  id: string;
  title: string;
  rootTopic: TopicData;
  style?: StyleData;
  topicPositioning?: 'free' | 'fixed';
  topicOverlapping?: 'overlap' | 'none';
  floatingTopicFlexible?: boolean;
  theme?: ThemeData;
  relationships?: RelationshipData[];
  legend?: LegendData;
  extensions: ExtensionData[];
  coreVersion?: string;
  handDrawnModeActive?: boolean;
  compactLayoutModeLevel?: COMPACT_LAYOUT_MODE_LEVEL;
  settings?: {
    [key: string]: ISettingItem[];
  };
}

const allType = [TOPIC_TYPE.ATTACHED, TOPIC_TYPE.SUMMARY, TOPIC_TYPE.DETACHED, TOPIC_TYPE.CALLOUT] as const;
const typeMap = {
  [INFOITEM_TYPE_SHORT.LABEL]: {
    newTypeName: INFOITEM_TYPE_FULL.LABEL,
    defaultMode: 'card',
  },
  [INFOITEM_TYPE_SHORT.HREF]: {
    newTypeName: INFOITEM_TYPE_FULL.HREF,
    defaultMode: 'icon',
  },
  [INFOITEM_TYPE_SHORT.NOTE]: {
    newTypeName: INFOITEM_TYPE_FULL.NOTE,
    defaultMode: 'icon',
  },
  [INFOITEM_TYPE_SHORT.TASK]: {
    newTypeName: INFOITEM_TYPE_FULL.TASK,
    defaultMode: 'icon',
  },
  [INFOITEM_TYPE_SHORT.AUDIO]: {
    newTypeName: INFOITEM_TYPE_FULL.AUDIO,
    defaultMode: 'icon',
  },
} as const;

/**
 * @description the model of Sheet
 * @constructor
 * */
export class SheetModel extends StyleComponent<SheetData & { class: 'sheet' }> {
  _config: Config;
  _idMap: Record<string, ISheetComponentFactorySupportedComponentModel>;
  _sheetComponentFactory: SheetComponentFactoryModel;
  legendModel: LegendModel | null;
  _floatingTopicFlexible: boolean;
  _undoManager: UndoManager;
  _textTranslator: (key: string) => string;
  _extensions: Extensions;
  _rootTopic: TopicModel;
  _relationships: RelationshipModel[];
  _theme: ThemeModel;
  /** @type {string} */
  get componentType() {
    return MODEL_TYPE.SHEET;
  }
  /** @public */
  get modelEvents() {
    return {
      topicAddMarker: 'topicAddMarker',
      topicChangeMarker: 'topicChangeMarker',
      topicRemoveMarker: 'topicRemoveMarker',
    } as const;
  }
  /**
   * @param sheetData
   * @param {WorkbookModel} ownerWorkbook
   * */
  constructor(sheetData: SheetData, opt?: { undo?: UndoManager | null }) {
    const restoredSheetData = utils.restoreFile([sheetData])[0] as SheetData;
    super({ ...restoredSheetData, class: 'sheet' }, opt);
    this._config = new Config();
    this._idMap = {};
    this._sheetComponentFactory = new SheetComponentFactoryModel(this);
    this.legendModel = null;
    this._floatingTopicFlexible = false;

    this.set(restoredSheetData);
    if (opt && opt.undo) {
      this._undoManager = opt.undo;
    } else {
      this._undoManager = new UndoManager();
      this._undoManager.setStackLimitedLength(Infinity);
      this._undoManager.on(EVENTS.UNDO_STATE_CHANGE, (...params: unknown[]) =>
        this.trigger(EVENTS.UNDO_STATE_CHANGE, ...params)
      );
    }
    this.initInnerModel();
    this.initUserMarkerInfo();
  }
  setTextTranslator(fn: (key: string) => string) {
    this._textTranslator = fn;
  }
  getTranslatedText(key: string) {
    if (!this._textTranslator) {
      return langUtils.translate(LANGS.ZH_CN, key);
    } else {
      return this._textTranslator(key);
    }
  }
  extensions() {
    if (!this._extensions) {
      const info = (this.get('extensions') || []).filter(Boolean);
      this._extensions = new Extensions(info);
    }
    return this._extensions;
  }
  addExtension<T extends ExtensionData>(provider: string, data: T) {
    this.extensions().add(provider, data);
    this.syncExtension();
  }
  removeExtension(provider: string) {
    this.extensions().remove(provider);
    this.syncExtension();
  }
  syncExtension() {
    const info = this.extensions().getInfo();
    this.set('extensions', info);
    this.sheetChanged(this.rootTopic(), {
      target: this,
      attr: 'extensions',
    });
  }
  initUserMarkerInfo() {
    const legendInfo = this.get('legend');
    if (!legendInfo) {
      return;
    }
    const { markers, groups } = legendInfo;
    const { markerModule } = Object(utils.getInjectModule)(MODULE_NAME.SNOWBIRD);
    if (markers) {
      markerModule.addUserMarkerInfoList(markers, groups);
    }
  }
  /**
   * @param {BaseComponent} component
   * @public
   * */
  registerComponent(component: ISheetComponentFactorySupportedComponentModel) {
    // @ts-ignore
    const id = component.get('id') as string;
    this._idMap[id] = component;
    return this;
  }
  unregisterComponent(id: string) {
    if (this._idMap[id]) {
      delete this._idMap[id];
    }
    return this;
  }
  /**
   * @description 生成组件id
   * @return {string}
   * @public
   * */
  generateComponentId(): string {
    let id = commonUtils.UUID();
    while (this._idMap[id]) {
      id = commonUtils.UUID();
    }
    return id;
  }
  findComponentById(id: string) {
    return this._idMap[id];
  }
  /**
   * @description 若ownerSheet调用到这里，直接返回sheetModel本身
   * */
  ownerSheet(): SheetModel {
    return this;
  }

  createComponent<T extends ISheetComponentFactorySupportedComponentModel>(
    modelType: (typeof MODEL_TYPE)[keyof typeof MODEL_TYPE],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attr: any = {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any = {}
  ): T {
    return this._sheetComponentFactory.create(modelType, attr, options) as T;
  }
  initInnerModel() {
    this.initLegendModel();
    //TODO deal revision
    this.rootTopic(Object(parseTopic)(this.get('rootTopic'), this));
    underscore.each(this.get('relationships') as RelationshipData[], relationshipData => {
      if (!underscore.isEmpty(relationshipData)) {
        this.addRelationship(relationshipData, true);
      }
    });
    this.enableOldFreePosition();
    if (this.get('style') && !underscore.isEmpty(this.get('style'))) {
      this.initStyle(this.get('style'));
    }
    this.addTheme(this.get('theme') as ThemeData, true);
    return this;
  }
  /** @private */
  initLegendModel() {
    this.legendModel = this.createComponent<LegendModel>(MODEL_TYPE.LEGEND, this.get('legend'), {
      sheet: this,
      parentModel: this,
    });
  }
  /**
   * @return {LegendModel}
   * @public
   * */
  getLegendModel() {
    return this.legendModel;
  }

  rootTopic(newRootTopic?: TopicModel): TopicModel {
    const replaceRootTopic = (newRT: TopicModel) => {
      if (newRT) {
        newRT.parent(this);
      }
      this._rootTopic = newRT;
      this.trigger('replaceRootTopic', newRT, this);
    };
    let rootTopic = this._rootTopic || null;
    if (newRootTopic === undefined) {
      if (!rootTopic) {
        rootTopic = this.createComponent('Topic');
        replaceRootTopic(rootTopic);
      }
      return rootTopic;
    }
    newRootTopic = newRootTopic || null;
    if (newRootTopic === rootTopic) {
      return newRootTopic;
    }
    if (rootTopic) {
      rootTopic.parent(null);
    }
    replaceRootTopic(newRootTopic);
    return rootTopic;
  }
  relationships() {
    if (!this._relationships) {
      this._relationships = [];
    }
    return this._relationships;
  }

  addRelationship(newRelationshipData: RelationshipData | RelationshipModel, init?: boolean) {
    let undoManager: UndoManager | null | undefined;
    const dataIsModel = Reflect.has(newRelationshipData as object, 'cid');
    const newRelationship: RelationshipModel = dataIsModel
      ? (newRelationshipData as RelationshipModel)
      : this.createComponent('Relationship', newRelationshipData);
    if (!init) {
      // set title unedited flag
      (newRelationship as RelationshipModel).set('titleUnedited', true);
    }

    newRelationship._titleUnedited =
      newRelationship.has('titleUnedited') && (newRelationship.get('titleUnedited') as boolean);
    const relationshipData = (
      dataIsModel ? (newRelationship.toJSON() as RelationshipData) : newRelationshipData
    ) as RelationshipData;
    const relationships = this.relationships();
    let relationshipsData: RelationshipData[] | undefined;
    if (!init) {
      relationshipsData = this.get('relationships');
      if (relationshipsData) {
        (relationshipsData as RelationshipData[]).push(relationshipData);
      } else {
        this.set('relationships', [relationshipData]);
      }
      this.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
        target: this,
        attr: 'relationships',
      });
    }
    newRelationship.parent(this);
    relationships.push(newRelationship);
    this.trigger('addRelationship', newRelationship, this);
    // add UndoManager
    if (!init) {
      if ((undoManager = this.getUndo()) === null || undoManager === undefined) {
        // do nothing
      } else {
        undoManager.add(
          {
            undo: () => this.removeRelationship(newRelationship),
            redo: () => this.addRelationship(newRelationship),
          },
          'R-add'
        );
      }
    }
    return newRelationship;
  }
  removeRelationship(oldRelationship: RelationshipModel) {
    let undoManager: UndoManager | null | undefined;
    const relationship = this.relationships();
    const relationshipIndex = relationship.indexOf(oldRelationship);
    if (relationshipIndex < 0) {
      return this;
    }
    const relationshipsData = this.get('relationships') as RelationshipData[];
    relationshipsData.splice(relationshipIndex, 1);
    this.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
      target: this,
      attr: 'relationships',
    });
    relationship.splice(relationshipIndex, 1);
    oldRelationship.parent(null);
    this.trigger('removeRelationship', oldRelationship);
    if ((undoManager = this.getUndo()) === null || undoManager === undefined) {
      // do nothing
    } else {
      undoManager.add(
        {
          undo: () => this.addRelationship(oldRelationship),
          redo: () => this.removeRelationship(oldRelationship),
        },
        'R-remove'
      );
    }
    return this;
  }
  theme() {
    return this._theme;
  }
  _createThemeComponent(themeData: ThemeData) {
    const theme = this.createComponent<ThemeModel>('Theme', themeData);
    this.set('theme', theme.toJSON());
    return theme;
  }
  addTheme(themeData: ThemeData, init?: boolean) {
    const theme = this._createThemeComponent(themeData);
    const properties = theme.attributes;
    underscore.each(properties, (property, componentName) => {
      if (!underscore.isEmpty(property)) {
        theme.addProperties(componentName, property as StyleData);
      }
    });
    this._theme = theme;
    theme.parent(this);
    if (!init) {
      this.trigger('addTheme', theme);
    }
    return theme;
  }

  changeTheme(
    themeData: ThemeData,
    options: Partial<{
      fixUserStyleWhenChangeTheme: () => void;
    }> = {}
  ) {
    let fixUserStyleWhenChangeTheme;
    let undoManager: UndoManager | null | undefined;
    const theme = this.theme();
    let oldThemeData: Partial<ThemeData> = {};
    if (!theme) {
      this.addTheme(themeData);
    } else {
      oldThemeData = theme.toJSON() as ThemeData;
      const newTheme = this._createThemeComponent(themeData);
      const properties = newTheme.attributes;
      Object.keys(properties).forEach(componentName => {
        const property = properties[componentName as keyof ThemeData];
        if (!Object(underscore.isEmpty)(property)) {
          newTheme.addProperties(componentName, property as StyleData);
        }
      });
      this._theme = newTheme;
      newTheme.parent(this);
      if (
        (fixUserStyleWhenChangeTheme = options.fixUserStyleWhenChangeTheme) === null ||
        fixUserStyleWhenChangeTheme === undefined
      ) {
        // do nothing
      } else {
        fixUserStyleWhenChangeTheme.call(options);
      }
      this.trigger('changeTheme', options);
    }
    this.set('theme', themeData);
    this.trigger(EVENTS.AFTER_THEME_CHANGED, options);
    this.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
      target: this,
      attr: 'theme',
    });
    if ((undoManager = this.getUndo()) === null || undoManager === undefined) {
      // do nothing
    } else {
      undoManager.add(
        {
          undo: () => {
            this.changeTheme(oldThemeData as ThemeData);
          },
          redo: () => {
            this.changeTheme(themeData);
          },
        },
        'changeTheme'
      );
    }
  }
  clearAllSelfStyle() {
    const rootTopicModel = this.rootTopic() as TopicModel;
    let queueToClear = [rootTopicModel];
    while (queueToClear.length) {
      const nextTopic = queueToClear.pop() as TopicModel;
      nextTopic.summaries().forEach(summary => summary.setStyleObj(null));
      nextTopic.boundaries().forEach(boundary => boundary.setStyleObj(null));
      nextTopic.setStyleObj(null);
      allType.forEach(type => {
        queueToClear = queueToClear.concat(nextTopic.children(type));
      });
    }
    this.relationships().forEach(relationship => relationship.setStyleObj(null));
    this.setStyleObj(null);
  }
  haveSelfStyle() {
    const rootTopicModel = this.rootTopic();
    let queueToCheck = [rootTopicModel];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const isDirty = (compArr: StyleComponent<any>[]) => compArr.some(com => com.style());
    while (queueToCheck.length) {
      const nextTopic = queueToCheck.pop() as TopicModel;
      if (nextTopic.style()) {
        return true;
      }
      if (isDirty(nextTopic.boundaries()) || isDirty(nextTopic.summaries())) {
        return true;
      }
      allType.forEach(type => {
        queueToCheck = queueToCheck.concat(nextTopic.children(type));
      });
    }
    return isDirty(this.relationships());
  }
  styleChanged() {
    const style = this.style();
    if (style) {
      this.set('style', style.toJSON());
    } else {
      this.unset('style');
    }
    this.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
      target: this,
      attr: 'style',
    });
  }

  sheetChanged(
    newRootTopic: TopicModel,
    {
      target,
      attr,
      oldValue,
    }: {
      target: ISheetComponentFactorySupportedComponentModel | SheetModel;
      attr: string;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      oldValue?: any;
    }
  ) {
    //TODO
    this.set('rootTopic', newRootTopic.toJSON());
    this.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
      target,
      attr,
      oldValue,
    });
  }
  changeInfoItemDisplay(type: keyof typeof typeMap, mode: 'card' | 'icon') {
    let undoManager: UndoManager | null | undefined;
    let setting = this.get('settings');
    if (!setting) {
      this.set('settings', {
        'info-items/info-item': [],
      });
      setting = this.get('settings');
    }

    // 强制类型转换判断存在即可
    if (!setting) return;

    if (!setting['info-items/info-item'] && !setting['infoItems/infoItem']) {
      setting['info-items/info-item'] = [];
    }
    const isNewType = !!setting['info-items/info-item'];
    const infoItemsSetting = setting['info-items/info-item']
      ? setting['info-items/info-item']
      : setting['infoItems/infoItem'];
    const parsedType = isNewType ? typeMap[type].newTypeName : type;
    let targetJSONData: Partial<ISettingItem> = {};
    const isHasItem =
      infoItemsSetting &&
      infoItemsSetting.some(item => {
        if (item.type === parsedType) {
          targetJSONData = item;
          return true;
        }
      });
    let oldMode = targetJSONData.mode;
    if (oldMode === mode) {
      return false;
    }
    if (!oldMode) {
      oldMode = 'icon';
    }
    targetJSONData.mode = mode;
    if (!isHasItem) {
      targetJSONData.type = parsedType;
      if (infoItemsSetting) infoItemsSetting.push(targetJSONData as ISettingItem);
    }
    this.trigger('change:infoItemDisplay', type, mode);
    this.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE);
    if ((undoManager = this.getUndo()) === null || undoManager === undefined) {
      // do nothing
    } else {
      undoManager.add(
        {
          undo: () => {
            this.changeInfoItemDisplay(type, oldMode);
          },
          redo: () => {
            this.changeInfoItemDisplay(type, mode);
          },
        },
        'changeInfoItemDisplay'
      );
    }
  }
  hasAncestor() {
    return true;
  }
  /**
   * @public
   * @return {Undo}
   * */
  getUndo() {
    return this._undoManager;
  }
  getConfig() {
    return this._config;
  }
  /**
   * @description 开关free position特性
   * @param {boolean} [status] 可以为undefined，将自动切换。
   */
  toggleFreePosition(status?: boolean) {
    const preStatus = this.get('topicPositioning');
    let nextStatus: 'fixed' | 'free';
    if (status === undefined) {
      nextStatus = preStatus === 'free' ? 'fixed' : 'free';
    } else {
      nextStatus = status ? 'free' : 'fixed';
    }
    if (preStatus === 'free' && nextStatus === 'fixed') {
      // status change from enable to disable
      clearPositionOfAllAttachedTopic(this);
    }
    this._changePositioning(nextStatus);
  }
  toggleFloatingTopicFlexible(nextStatus: boolean) {
    const preStatus = this.get('floatingTopicFlexible');
    if (preStatus && !nextStatus) {
      // 当从 flex 切换到 sticky 需要清除位置信息
      clearPositionOfAllAttachedTopic(this);
    }
    this._changeFloatingTopicFlexible(nextStatus);
  }
  /**
   * @private
   * @param {string} nextStatus - "fixed" or "free"
   */
  _changePositioning(nextStatus: 'fixed' | 'free') {
    let _a;
    const preStatus = this.get('topicPositioning') as 'fixed' | 'free';
    if (nextStatus === preStatus || (!preStatus && nextStatus === 'fixed')) {
      return;
    }
    this.set('topicPositioning', nextStatus);
    this.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
      target: this,
      attr: 'topicPositioning',
    });
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this._changePositioning(preStatus);
          },
          redo: () => {
            this._changePositioning(nextStatus);
          },
        },
        'changeTopicPositioning'
      );
    }
  }
  _changeFloatingTopicFlexible(nextStatus: boolean) {
    let _a;
    const preStatus = this._floatingTopicFlexible;
    if (nextStatus === preStatus) {
      return;
    }
    this._floatingTopicFlexible = nextStatus;
    this.set('floatingTopicFlexible', nextStatus);
    this.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
      target: this,
      attr: 'floatingTopicFlexible',
    });
    this.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
      target: this,
      attr: 'floatingTopicFlexible',
    });
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => {
            this._changeFloatingTopicFlexible(preStatus);
          },
          redo: () => {
            this._changeFloatingTopicFlexible(nextStatus);
          },
        },
        'changeFloatingTopicFlexible'
      );
    }
  }
  isFreePositionEnabled() {
    return this.get('topicPositioning') === 'free';
  }
  isFloatingTopicFlexible() {
    return this._floatingTopicFlexible;
  }
  /**
   * 如果以前在free position下编辑的，应该开启标志位。
   */
  enableOldFreePosition() {
    if (this.get('topicPositioning') !== undefined) {
      return;
    }
    const mainTopics = this.rootTopic().children();
    for (let i = 0; i < mainTopics.length; i++) {
      if (mainTopics[i].get('position')) {
        this.set('topicPositioning', 'free');
        return;
      }
    }
    this.set('topicPositioning', 'fixed');
  }
  /**
   * @param {string} newVal - "overlap" or "none"
   */
  changeOverlap(newVal: 'overlap' | 'none') {
    let _a;
    const oldVal = this.get('topicOverlapping') as 'overlap' | 'none';
    if (isOverlapEqual(newVal, oldVal)) {
      return;
    }
    this.set('topicOverlapping', newVal);
    this.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
      target: this,
      attr: 'topicOverlapping',
    });
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => this.changeOverlap(oldVal),
          redo: () => this.changeOverlap(newVal),
        },
        'changeTopicOverlapping'
      );
    }
  }
  /**
   * @return {boolean}
   * @public
   * */
  isTopicOverlapping() {
    return this.get('topicOverlapping') === 'overlap';
  }
  changeCompactLayoutModeLevel(level: COMPACT_LAYOUT_MODE_LEVEL) {
    let _a;
    const oldLevel = this.getCompactLayoutModeLevel();
    if (oldLevel === level) {
      return;
    }
    this.set('compactLayoutModeLevel', level);
    this.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
      target: this,
      attr: 'compactLayoutModeLevel',
    });
    this.trigger(EVENTS.COMPACT_LAYOUT_MODE_LEVEL_CHANGED);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => this.changeCompactLayoutModeLevel(oldLevel),
          redo: () => this.changeCompactLayoutModeLevel(level),
        },
        'changeCompactLayoutModeLevel'
      );
    }
  }
  changeHandDrawnModeActive(isActive: boolean) {
    let _a;
    const oldStatus = this.getHandDrawnModeActive();
    if (oldStatus === isActive) {
      return;
    }
    this.set('handDrawnModeActive', isActive);
    this.trigger(EVENTS.AFTER_SHEET_CONTENT_CHANGE, {
      target: this,
      attr: 'handDrawnModeActive',
    });
    this.trigger(EVENTS.HAND_DRAWN_MODE_ACTIVE_CHANGED);
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add(
        {
          undo: () => this.changeHandDrawnModeActive(oldStatus),
          redo: () => this.changeHandDrawnModeActive(isActive),
        },
        'changeHandDrawnModeActive'
      );
    }
  }
  getCompactLayoutModeLevel() {
    return this.get('compactLayoutModeLevel') ?? COMPACT_LAYOUT_MODE_LEVEL.Third;
  }
  getHandDrawnModeActive() {
    return this.get('handDrawnModeActive') ?? false;
  }
  /**
   * @param {string[]} typeArr - array of topic type, indicate topic in type arrary will be accessed
   * @param {function} fn - callback, return true to stop trasverse
   * @param {TopicModel} fn.args[0] - topic model
   */
  traverseTopic(typeArr: TOPIC_TYPE[], fn: (topicModel: TopicModel) => void) {
    this.rootTopic().traverseTopic(typeArr, fn);
  }
  toJSON() {
    const jsonData = super.toJSON();
    // add current env version
    jsonData.coreVersion = this.getEnvCoreVersion();
    return jsonData;
  }
  getFileCoreVersion() {
    return this.get('coreVersion');
  }
  /**
   * traverse all stylecomponent's instances, include instances of its subclass: topic, summary, boundary, relationship, sheet.
   * cb will receive `model` as the only parameter, you can check the model.componentType property to determine what type it is.
   * @param {Function} cb
   */
  traverseStyleComponent(cb: (type: unknown) => void) {
    const rootTopicModel = this.rootTopic();
    let queue = [rootTopicModel];
    while (queue.length) {
      const nextTopic = queue.pop() as TopicModel;
      cb(nextTopic);
      nextTopic.summaries().forEach(summary => cb(summary));
      nextTopic.boundaries().forEach(boundary => cb(boundary));
      allType.forEach(type => {
        queue = queue.concat(nextTopic.children(type));
      });
    }
    this.relationships().forEach(relationship => cb(relationship));
    cb(this); //sheet
  }
  collapseBranchesToLevel(level: number) {
    this.traverseTopic([TOPIC_TYPE.ATTACHED, TOPIC_TYPE.DETACHED, TOPIC_TYPE.SUMMARY, TOPIC_TYPE.CALLOUT], topic => {
      if (topic.getLayer() === level) {
        topic.collapseBranch();
      }
    });
  }
  extendAllBranches() {
    this.traverseTopic([TOPIC_TYPE.ATTACHED, TOPIC_TYPE.DETACHED, TOPIC_TYPE.SUMMARY, TOPIC_TYPE.CALLOUT], topic => {
      topic.extendBranch();
    });
  }
  addSkeletonStructureStyle(skeletonStructureStyle: string) {
    this.addExtension(EXTENSION_PROVIDER.SKELETON_STRUCTURE_STYLE, {
      provider: EXTENSION_PROVIDER.SKELETON_STRUCTURE_STYLE,
      content: skeletonStructureStyle,
    });
  }
  getSkeletonStructureStyle() {
    return this.extensions().getExtension(EXTENSION_PROVIDER.SKELETON_STRUCTURE_STYLE)?.content || {};
  }
  removeSkeletonStructureStyle() {
    this.removeExtension(EXTENSION_PROVIDER.SKELETON_STRUCTURE_STYLE);
  }
}
export default SheetModel;

function isOverlapEqual(val1: string, val2: string) {
  return val1 === val2 || (!val1 && val2 === 'none') || (val1 === 'none' && !val2);
}
function clearPositionOfAllAttachedTopic(sheet: SheetModel) {
  sheet.traverseTopic([TOPIC_TYPE.ATTACHED], (topic: TopicModel) => {
    const position = topic.get('position');
    if (position && position.x && position.y) {
      topic.clearPosition();
    }
  });
}

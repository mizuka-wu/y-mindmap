import underscore from 'underscore';
import { COMPONENT_TYPE } from '../common/constants/index';
import * as commonUtils from '../common/utils/index';
import { BaseComponent } from './basecomponent';

import type { SheetModel, Size } from '../type.d';
export interface ImageData extends Partial<Size> {
  src?: string;
  align?: string;
  borderWidth?: number;
  borderColor?: string;
  opacity?: number;
  shadowVisible?: boolean;
  lockRatio?: boolean;
  flipAndRotateRecords?: string;
}

export class TopicImageModel extends BaseComponent<ImageData> {
  constructor(attrs: ImageData, options?: { sheet: SheetModel }) {
    super(attrs, options);
    this.id = Object(commonUtils.UUID)();
  }
  get componentType() {
    return COMPONENT_TYPE.IMAGE;
  }
  getId() {
    return this.id;
  }
  getSrc() {
    return this.get('src');
  }
  getWidth() {
    return this.get('width');
  }
  getHeight() {
    return this.get('height');
  }
  getAlign() {
    return this.get('align');
  }
  getBorderWidth() {
    return this.get('borderWidth') || 0;
  }
  getBorderColor() {
    return this.get('borderColor') || 'none';
  }
  getOpacity() {
    return this.get('opacity') || 1;
  }
  getShadowVisible() {
    return this.get('shadowVisible');
  }
  getLockRatio() {
    if (typeof this.get('lockRatio') === 'undefined') {
      return true;
    } else {
      return this.get('lockRatio');
    }
  }
  getFlipAndRotateRecords() {
    const originRecords = this.get('flipAndRotateRecords');
    if (!originRecords) {
      return [];
    }
    return JSON.parse(originRecords);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setFlipAndRotateRecords(records: any) {
    this.set('flipAndRotateRecords', JSON.stringify(records));
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pushFlipAndRotateRecord(record: any) {
    const records = this.getFlipAndRotateRecords();
    records.push(record);
    this.setFlipAndRotateRecords(records);
  }
  replaceNewData(imageData: ImageData) {
    this.clear();
    this.set(imageData);
  }
  changeImageData(imageData: ImageData, record: boolean) {
    console.log(imageData);
    let _a;
    const preImageData = {
      src: this.getSrc(),
      width: this.getWidth(),
      height: this.getHeight(),
      align: this.getAlign(),
    };
    const preFlipAndRotateRecords = this.getFlipAndRotateRecords();
    const isNeedChange =
      Object.keys(imageData).findIndex(key => {
        return imageData[key as keyof ImageData] !== preImageData[key as keyof typeof preImageData];
      }) !== -1;
    if (!isNeedChange) {
      return;
    }
    this.set(imageData);
    if (record) {
      if (Array.isArray(record)) {
        this.setFlipAndRotateRecords(record);
      } else {
        this.pushFlipAndRotateRecord(record);
      }
    }
    this.trigger('changeImageData');
    this.imageChanged();
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => this.changeImageData(preImageData, preFlipAndRotateRecords),
        redo: () => this.changeImageData(imageData, record),
      });
    }
  }
  changeOpacity(opacity: number) {
    let _a;
    const preOpacity = this.getOpacity();
    if (opacity === preOpacity) {
      return;
    }
    this.set('opacity', opacity);
    this.trigger('changeOpacity', opacity);
    this.imageChanged();
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => this.changeOpacity(preOpacity),
        redo: () => this.changeOpacity(opacity),
        options: {
          shouldBindSelectionRestore: true,
          model: this.parent(),
        },
      });
    }
  }
  changeBorderWidth(borderWidth: number) {
    let _a;
    const preBorderWidth = this.getBorderWidth();
    if (borderWidth === preBorderWidth) {
      return;
    }
    this.set('borderWidth', borderWidth);
    this.trigger('changeBorderWidth', borderWidth);
    this.imageChanged();
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => this.changeBorderWidth(preBorderWidth),
        redo: () => this.changeBorderWidth(borderWidth),
        options: {
          shouldBindSelectionRestore: true,
          model: this.parent(),
        },
      });
    }
  }
  changeBorderColor(borderColor: string) {
    let _a;
    const preBorderColor = this.getBorderColor();
    if (borderColor === preBorderColor) {
      return;
    }
    this.set('borderColor', borderColor);
    this.trigger('changeBorderColor', borderColor);
    this.imageChanged();
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => this.changeBorderColor(preBorderColor),
        redo: () => this.changeBorderColor(borderColor),
        options: {
          shouldBindSelectionRestore: true,
          model: this.parent(),
        },
      });
    }
  }
  changeShadowVisible(visible?: boolean) {
    let _a;
    const preVisible = this.getShadowVisible();
    if (visible === preVisible) {
      return;
    }
    this.set('shadowVisible', visible);
    this.trigger('changeShadowVisible', visible);
    this.imageChanged();
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => this.changeShadowVisible(preVisible),
        redo: () => this.changeShadowVisible(visible),
        options: {
          shouldBindSelectionRestore: true,
          model: this.parent(),
        },
      });
    }
  }
  changeLockRatio(lockRatio?: boolean) {
    let _a;
    const preLock = this.getLockRatio();
    if (lockRatio === preLock) {
      return;
    }
    this.set('lockRatio', lockRatio);
    this.trigger('changeLockRatio', lockRatio);
    this.imageChanged();
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => this.changeLockRatio(preLock),
        redo: () => this.changeLockRatio(lockRatio),
        options: {
          shouldBindSelectionRestore: true,
          model: this.parent(),
        },
      });
    }
  }
  resize(newSize: Partial<Size>) {
    let _a;
    const preSize = {
      width: this.getWidth(),
      height: this.getHeight(),
    };
    if (Object(underscore.isEqual)(newSize, preSize)) {
      return;
    }
    if (newSize.width) {
      this.set('width', newSize.width);
    } else {
      this.unset('width');
    }
    if (newSize.height) {
      this.set('height', newSize.height);
    } else {
      this.unset('height');
    }
    this.trigger('resize', newSize);
    this.imageChanged();
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => this.resize(preSize),
        redo: () => this.resize(newSize),
        options: {
          shouldBindSelectionRestore: true,
          model: this.parent(),
        },
      });
    }
  }
  /**
   * @param direction: left right top bottom
   * */
  align(direction?: string) {
    let _a;
    const preDirection = this.getAlign();
    if (direction === preDirection) {
      return;
    }
    this.set('align', direction);
    this.trigger('align');
    this.imageChanged();
    if ((_a = this.getUndo()) === null || _a === undefined) {
      // do nothing
    } else {
      _a.add({
        undo: () => this.align(preDirection),
        redo: () => this.align(direction),
        options: {
          shouldBindSelectionRestore: true,
          model: this.parent(),
        },
      });
    }
  }
  imageChanged() {
    const parent = this.parent();
    const imageData = this.toJSON();
    parent.set('image', imageData);
    parent.topicChanged({
      target: parent,
      attr: 'image',
    });
  }
  removeSelf() {
    const parent = this.parent();
    if (!parent) {
      return;
    }
    parent.removeImage();
  }
}

export default TopicImageModel;

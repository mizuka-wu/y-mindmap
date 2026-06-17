import * as baseutil from "../utils/baseutil";
import {
  MODULE_NAME,
  TOPIC_TYPE,
  VIEW_TYPE,
  CONFIG,
  EVENTS,
  ACTION_NAMES,
  XAP_TYPE,
  SUPPORTED_LIMITED_OPERATIONS,
} from "../common/constants/index";
import config from "../common/config";
import { FileDragHandler } from "./draghandler/filedraghandler";

import underscore from "underscore";

const dragEnterEvent = "dragenter";
const dragOverEvent = "dragover";
const dragLeaveEvent = "dragleave";
const dropEvent = "drop";
let dragTimeout;
const tools = {
  isImage(dataTransfer) {
    if (!this.isFile(dataTransfer)) {
      return false;
    }
    return (
      dataTransfer.files[0].type.indexOf(
        dropmanager_DropHandler.DropDataTypes.IMAGE,
      ) === 0
    );
  },
  isAttachment(dataTransfer) {
    return this.isFile(dataTransfer) && !this.isImage(dataTransfer);
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isText(dataTransfer) {
    return false;
  },
  isFile(dataTransfer) {
    return dataTransfer.files.length !== 0;
  },
  isFolder(dataTransfer) {
    return Boolean(
      dataTransfer.files.length && dataTransfer.files[0].type === "",
    );
  },
  // 若是外部自定义的文件
  isXFile(dataTransfer) {
    return Boolean(dataTransfer.getData("isXTypeFile"));
  },
  isDragEnterFileIllegal(dataTransfer) {
    if (!dataTransfer) {
      return true;
    }
    // should all are files
    if (dataTransfer.types.every((type) => type === "Files")) {
      // only support images now
      const isFileImage = Array.from(dataTransfer.items).every((item: any) => {
        return item.type.startsWith("image/");
      });
      return !isFileImage;
    } else {
      return true;
    }
  },
};
/**
 * @description 此模块仅管理从外部拖入文件的处理
 * */
export class DropManager {
  _dragHandler: any;
  _dropView: any;
  _branchDragLevelCounterMap: any;
  _positionTransfer: any;
  _onDragMoving: any;
  _transferOptions: any;
  _context: any;
  _dropHandler: dropmanager_DropHandler;
  static identifier: string;
  constructor(context) {
    this._dragHandler = null;
    this._dropView = null;
    /**
     * @description branch拖拽层级记录，具体参考
     * https://stackoverflow.com/questions/7110353/html5-dragleave-fired-when-hovering-a-child-element
     * */
    this._branchDragLevelCounterMap = {};
    this._positionTransfer = null;
    this._onDragMoving = Object(underscore.throttle)((position) => {
      let _a;
      let _b;
      this._dropView =
        (_a = this._dragHandler) === null || _a === undefined
          ? undefined
          : _a.getDropView(position);
      this._transferOptions =
        (_b = this._dragHandler) === null || _b === undefined
          ? undefined
          : _b.onDragMoving(this._dropView, position);
    }, 100);
    this._context = context;
    this._dropHandler = new dropmanager_DropHandler(context);
    this._initEventListener();
  }
  _initEventListener() {
    const context = this._context;
    context.onEvent(dragEnterEvent, VIEW_TYPE.BRANCH, (e) =>
      this._onBranchDragEnter(e),
    );
    context.onEvent(dragLeaveEvent, VIEW_TYPE.BRANCH, (e) =>
      this._onBranchDragLeave(e),
    );
    context.onEvent(dropEvent, VIEW_TYPE.BRANCH, (e) => this._onBranchDrop(e));
    context.onEvent(dragEnterEvent, VIEW_TYPE.SVG, (e) =>
      this._onSVGDragEnter(e),
    );
    context.onEvent(
      dragOverEvent,
      VIEW_TYPE.SVG,
      baseutil.frameStabilize(
        (e) => this._onSVGDragOver(e),
        (e) => {
          e.preventDefault();
          if (e.originalEvent.dataTransfer) {
            e.originalEvent.dataTransfer.dropEffect = "copy";
          }
        },
      ),
    );
    context.onEvent(dropEvent, VIEW_TYPE.SVG, (e) => this._onSVGDrop(e));
  }
  _onBranchDragEnter(e) {
    e.preventDefault();
    if (this._isDragTargetOutOfBranch(e)) {
      const targetBranchView = e.sbView;
      targetBranchView.topicView.showSelectBox();
    }
    this._increaseBranchLevel(e);
  }
  _onBranchDragLeave(e) {
    e.preventDefault();
    this._decreaseBranchLevel(e);
    if (this._isDragTargetOutOfBranch(e)) {
      const targetBranchView = e.sbView;
      targetBranchView.topicView.hideSelectBox();
    }
  }
  _onBranchDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    if (!this._checkEventValid(e)) {
      return;
    }
    this._branchDragLevelCounterMap[e.sbView.cid] = 0;
    this._dropHandler.dropToBranch(
      e.sbView,
      e.originalEvent.dataTransfer,
      this._dropView,
      this._transferOptions,
    );
    this._dragFinish();
  }
  _increaseBranchLevel(e) {
    const sbViewId = e.sbView.cid;
    if (this._branchDragLevelCounterMap[sbViewId] === undefined) {
      this._branchDragLevelCounterMap[sbViewId] = 0;
    }
    this._branchDragLevelCounterMap[sbViewId]++;
  }
  _decreaseBranchLevel(e) {
    this._branchDragLevelCounterMap[e.sbView.cid]--;
  }
  _isDragTargetOutOfBranch(e) {
    // _branchDragLevelCounter为0的时候说明焦点不在branch内部
    return !this._branchDragLevelCounterMap[e.sbView.cid];
  }
  _onSVGDragEnter(e) {
    e.preventDefault();
    if (!this._dragHandler && e.originalEvent.dataTransfer) {
      this._dragStart();
    }
    if (!this._positionTransfer) {
      this._positionTransfer = this._context
        .getSVGView()
        .getCoordinateTransfer();
    }
    if (!tools.isDragEnterFileIllegal(e.originalEvent.dataTransfer)) {
      if (e.originalEvent.dataTransfer) {
        e.originalEvent.dataTransfer.dropEffect = "copy";
      }
    }
  }
  _onSVGDragOver(e) {
    e.preventDefault();
    if (!e.originalEvent.dataTransfer) {
      return;
    }
    if (!this._positionTransfer) {
      return;
    }
    const realPosition = this._positionTransfer.viewportToMindMap(
      this._context.getDragEventClientPosition(e.originalEvent),
    );
    const oldPosition = this._transferOptions?.position;
    const positionThreshold = (pos, oldPos) => {
      if (!pos || !oldPos) {
        return true;
      }
      const dist = Math.sqrt(
        Math.pow(pos.x - oldPos.x, 2) + Math.pow(pos.y - oldPos.y, 2),
      );
      return dist > 4;
    };
    if (positionThreshold(realPosition, oldPosition)) {
      this._onDragMoving(realPosition);
    }
    /**
     * Drag maybe cancelled by system or move out of current window,
     * To detect, we can use a Timer on dragOver event,
     * since its continuous firing until dropped or cancelled
     * If `dragOver` stop firing without dropped, we can tell its cancelled or leaved
     */
    clearTimeout(dragTimeout);
    dragTimeout = setTimeout(() => {
      this._dragFinish();
    }, 300);
  }
  _onSVGDrop(e) {
    e.preventDefault();
    if (!e.originalEvent.dataTransfer) {
      return;
    }
    const realPosition = this._positionTransfer.viewportToMindMap(
      this._context.getDragEventClientPosition(e.originalEvent),
    );
    this._dropHandler.dropToSVG(
      e.originalEvent.dataTransfer,
      realPosition,
      this._dropView,
      this._transferOptions,
    );
    this._dragFinish();
  }
  /**
   * @description 检测event内容是否合法
   * */
  _checkEventValid(e) {
    const dataTransfer = e.originalEvent.dataTransfer;
    if (!dataTransfer || !dataTransfer.types || !dataTransfer.types.length) {
      return false;
    }
    return true;
  }
  _dragStart() {
    this._dragHandler = new FileDragHandler(this._context);
    this._dragHandler.dragStart();
  }
  _dragFinish() {
    let _a;
    this._dropView = null;
    this._transferOptions = undefined;
    if ((_a = this._dragHandler) === null || _a === undefined) {
      // do nothing
    } else {
      _a.dragFinish();
    }
    this._dragHandler = null;
  }
}
DropManager.identifier = MODULE_NAME.DROP;

export default DropManager;

class dropmanager_DropHandler {
  static DropDataTypes: any;
  _context: any;
  constructor(context) {
    /**
     * @type {SheetEditor}
     * @private
     * */
    this._context = context;
  }
  get _xapGenerator() {
    const xapGenerator = this._context.config(CONFIG.XAP_GENERATOR);
    if (!xapGenerator) {
      config
        .get(CONFIG.LOGGER)
        .error("[DropManager] not work since there is no xapGenerator");
    }
    return xapGenerator;
  }
  /**
   * @param {BranchView} branchView
   * @param {DataTransfer} dataTransfer
   * @public
   * */
  dropToBranch(branchView, dataTransfer, dropView, transferOPtions) {
    if (!dataTransfer) {
      return;
    }
    const isPlaceHolderView = !!branchView.isPlaceHolderView;
    const addAsChildTopic = (topicAttribute, branchView, transferOptions) => {
      const newTopicModel = branchView.model.createEmptyTopic(topicAttribute);
      newTopicModel.set("titleUnedited", true);
      if (transferOptions) {
        const { index, isAddToRight } = transferOptions;
        branchView.model.addChildTopic(newTopicModel, {
          at: index,
          side: isAddToRight ? "right" : "left",
        });
      } else {
        branchView.model.addChildTopic(newTopicModel);
      }
    };
    if (tools.isFolder(dataTransfer)) {
      /**
       * Currently, only electron has path property.
       * See: https://gitlab.xmind.cn/xmind/snowbrush/issues/705
       */
      // @ts-ignore
      const path = dataTransfer.files[0].path;
      if (path) {
        this._context.trigger(EVENTS.FILE_DROP_IN_END);
        return this._dealFolder(() => {
          this._context.execAction(ACTION_NAMES.CHANGE_HYPER_LINK, {
            link: `file://${path}`,
            targets: [branchView],
          });
          if (isPlaceHolderView && dropView) {
            addAsChildTopic(
              {
                href: `file://${path}`,
                title: fileName,
              },
              dropView,
              transferOPtions,
            );
          } else {
            this._context.execAction(ACTION_NAMES.CHANGE_HYPER_LINK, {
              link: `file://${path}`,
              targets: [branchView],
            });
          }
        });
      }
    }
    if (tools.isXFile(dataTransfer)) {
      this._context.trigger(EVENTS.FILE_DROP_IN_START);
      const xapType = dataTransfer.getData("xapType");
      return this._dealXFile(dataTransfer, (xapString) => {
        this._context.trigger(EVENTS.FILE_DROP_IN_END);
        //should not call dataTransfer.getData here
        //because dataTransfer is clear at next mirco task
        if (xapType === XAP_TYPE.X_STICKER) {
          if (isPlaceHolderView && dropView) {
            addAsChildTopic(
              {
                image: {
                  src: xapString,
                },
                title: "",
              },
              dropView,
              transferOPtions,
            );
          } else {
            this._context.execAction(ACTION_NAMES.CHANGE_STICKER, {
              imageInfo: xapString,
              targets: [branchView],
            });
          }
        }
      });
    }
    let fileName = "";
    if (dataTransfer.files[0]) {
      fileName = dataTransfer.files[0].name;
    }
    branchView.topicView.hideSelectBox();
    if (tools.isImage(dataTransfer)) {
      this._context.trigger(EVENTS.FILE_DROP_IN_START);
      this._dealImage(dataTransfer, (xapString) => {
        this._context.trigger(EVENTS.FILE_DROP_IN_END);
        if (isPlaceHolderView && dropView) {
          addAsChildTopic(
            {
              image: {
                src: xapString,
              },
              title: fileName,
            },
            dropView,
            transferOPtions,
          );
        } else {
          this._context.execAction(ACTION_NAMES.ADD_IMAGE, {
            imageInfo: xapString,
            targets: [branchView],
          });
        }
      });
    } else if (tools.isAttachment(dataTransfer)) {
      this._context.trigger(EVENTS.FILE_DROP_IN_START);
      this._dealAttachment(dataTransfer, (xapString) => {
        this._context.trigger(EVENTS.FILE_DROP_IN_END);
        if (isPlaceHolderView && dropView) {
          addAsChildTopic(
            {
              href: xapString,
              title: fileName,
            },
            dropView,
            transferOPtions,
          );
        } else {
          this._context.execAction(ACTION_NAMES.CHANGE_HYPER_LINK, {
            link: xapString,
            targets: [branchView],
          });
        }
      });
    } else if (tools.isText(dataTransfer)) {
      config.get(CONFIG.LOGGER).info("drop text");
    }
  }
  /**
   * @public
   * */
  dropToSVG(dataTransfer, realPosition, dropView, transferOPtions) {
    const centralBranchView = this._context
      .getSheetView()
      .getCentralBranchView();
    const addAsFloatingTopic = (topicAttribute) => {
      const newTopicModel =
        centralBranchView.model.createEmptyTopic(topicAttribute);
      newTopicModel.set("position", realPosition);
      newTopicModel.set("titleUnedited", true);
      centralBranchView.model.addChildTopic(newTopicModel, {
        type: TOPIC_TYPE.DETACHED,
      });
    };
    const addAsChildTopic = (topicAttribute, branchView, transferOptions) => {
      const newTopicModel = branchView.model.createEmptyTopic(topicAttribute);
      newTopicModel.set("titleUnedited", true);
      if (transferOptions) {
        const { index, isAddToRight } = transferOptions;
        branchView.model.addChildTopic(newTopicModel, {
          at: index,
          side: isAddToRight ? "right" : "left",
        });
      } else {
        branchView.model.addChildTopic(newTopicModel);
      }
    };
    let fileName = "";
    if (dataTransfer.files[0]) {
      fileName = dataTransfer.files[0].name;
    }
    if (tools.isFolder(dataTransfer)) {
      /**
       * Currently, only electron has path property.
       * See: https://gitlab.xmind.cn/xmind/snowbrush/issues/705
       */
      // @ts-ignore
      const path = dataTransfer.files[0].path;
      if (path) {
        this._context.trigger(EVENTS.FILE_DROP_IN_START);
        return this._dealFolder(() => {
          if (dropView) {
            addAsChildTopic(
              {
                title: fileName,
                href: `file://${path}`,
              },
              dropView,
              transferOPtions,
            );
          } else {
            addAsFloatingTopic({
              title: fileName,
              href: `file://${path}`,
            });
          }
          this._context.trigger(EVENTS.FILE_DROP_IN_END);
        });
      }
    }
    if (tools.isXFile(dataTransfer)) {
      this._context.trigger(EVENTS.FILE_DROP_IN_START);
      const xapType = dataTransfer.getData("xapType");
      return this._dealXFile(dataTransfer, (xapString) => {
        this._context.trigger(EVENTS.FILE_DROP_IN_END);
        if (xapType === XAP_TYPE.X_STICKER) {
          if (dropView) {
            addAsChildTopic(
              {
                title: "",
                image: {
                  src: xapString,
                },
              },
              dropView,
              transferOPtions,
            );
          } else {
            addAsFloatingTopic({
              title: "",
              image: {
                src: xapString,
              },
            });
          }
        }
      });
    }
    if (tools.isImage(dataTransfer)) {
      this._context.trigger(EVENTS.FILE_DROP_IN_START);
      this._dealImage(dataTransfer, (xapString) => {
        this._context.trigger(EVENTS.FILE_DROP_IN_END);
        if (dropView) {
          addAsChildTopic(
            {
              title: fileName,
              image: {
                src: xapString,
              },
            },
            dropView,
            transferOPtions,
          );
        } else {
          addAsFloatingTopic({
            title: fileName,
            image: {
              src: xapString,
            },
          });
        }
      });
    } else if (tools.isAttachment(dataTransfer)) {
      this._context.trigger(EVENTS.FILE_DROP_IN_START);
      this._dealAttachment(dataTransfer, (xapString) => {
        this._context.trigger(EVENTS.FILE_DROP_IN_END);
        if (dropView) {
          addAsChildTopic(
            {
              title: fileName,
              href: xapString,
            },
            dropView,
            transferOPtions,
          );
        } else {
          addAsFloatingTopic({
            title: fileName,
            href: xapString,
          });
        }
      });
    }
  }
  /** @private */
  _dealXFile(dataTransfer, callback) {
    const xapType = dataTransfer.getData("xapType");
    const dataUrl = dataTransfer.getData("dataUrl");
    const extType = dataTransfer.getData("extType");
    const xapParam = {
      xapType: xapType,
      mimeType: "",
      extType: extType,
      data: dataUrl,
    };
    this._xapGenerator(xapParam).then(callback);
  }
  /** @private */
  _dealFile(xapType, file, callback) {
    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = () => {
      let extType = "";
      const fileNameSplitArray = file.name.split(".");
      if (fileNameSplitArray.length > 1) {
        extType = fileNameSplitArray[fileNameSplitArray.length - 1];
      }
      const xapParam = {
        xapType: xapType,
        mimeType: file.type,
        extType: extType,
        data: fileReader.result,
        isNewFile: true,
      };
      this._xapGenerator(xapParam).then(callback);
    };
    fileReader.onerror = () => {
      config.get(CONFIG.LOGGER).error("读取文件二进制数据错误");
    };
  }
  _dealSupportedLimitedOperation(operationType, dealFunc) {
    const limitedOperationHandler = this._context.config(
      CONFIG.LIMITED_OPERATION_HANDLER,
    );
    limitedOperationHandler(operationType).then((canContinue) => {
      if (canContinue) {
        dealFunc();
      } else {
        this._context.trigger(EVENTS.FILE_DROP_IN_END);
      }
    });
  }
  _dealImage(dataTransfer, callback) {
    const file = dataTransfer.files[0];
    this._dealSupportedLimitedOperation(
      SUPPORTED_LIMITED_OPERATIONS.INSERT_IMAGE,
      () => {
        this._dealFile(XAP_TYPE.IMAGE, file, callback);
      },
    );
  }
  _dealAttachment(dataTransfer, callback) {
    const file = dataTransfer.files[0];
    this._dealSupportedLimitedOperation(
      SUPPORTED_LIMITED_OPERATIONS.INSERT_ATTACHMENT,
      () => {
        this._dealFile(XAP_TYPE.ATTACHMENT, file, callback);
      },
    );
  }
  _dealFolder(callback) {
    this._dealSupportedLimitedOperation(
      SUPPORTED_LIMITED_OPERATIONS.INSERT_FOLDER,
      () => {
        callback();
      },
    );
  }
}
dropmanager_DropHandler.DropDataTypes = {
  TEXT: "text",
  HYPERLINK: "hyperlink",
  IMAGE: "image",
  OTHER: "other",
};

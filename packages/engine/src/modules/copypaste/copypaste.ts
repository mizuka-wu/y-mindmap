/* eslint-disable @typescript-eslint/no-unused-vars */
import styleManager from "../../utils/business/stylemanager/index";

import mommonFuncs from "../../mommonfuncs";

import {
  CONFIG,
  TOPIC_ATTACHED,
  TOPIC_DETACHED,
  TOPIC_CALLOUT,
  TOPIC_SUMMARY,
  VIEW_TYPE,
  TOPIC_TYPE,
  STYLE_KEYS,
  MODULE_NAME,
  MASTER_RANGE,
  SUPPORTED_LIMITED_OPERATIONS,
  ACTION_NAMES,
} from "../../common/constants/index";

import config from "../../common/config";

import Util from "../../util";
import { cpUtil } from "./cputil";

import { parseTopic } from "../../utils/business/parsetopic";
import { ClipboardHelper } from "./clipboardhelper";

import * as utils from "../../common/utils/index";
import { CopyTopicProcessor } from "./copytopicprocessor";

const processStrategy = {
  [VIEW_TYPE.BRANCH]: {
    copy: "_copyTopic",
    paste: "_addTopics",
  },
  [VIEW_TYPE.IMAGE]: {
    copy: "_copyImage",
    paste: "_addImages",
  },
  [VIEW_TYPE.MARKER]: {
    copy: "_copyMarker",
    paste: "_addMarkers",
  },
  [VIEW_TYPE.MATH_JAX]: {
    copy: "_copyMathJax",
    paste: "_addMathJax",
  },
};
class CopyPasteManager {
  context: any;
  clipboardHelper: ClipboardHelper;
  copyTargets: any;
  pasteClintPosition: any;
  constructor(context) {
    this.context = context;
    this.clipboardHelper = new ClipboardHelper(context);
  }
  copy(e, targets?) {
    this.copyTargets = targets?.length
      ? targets
      : this.context.getModule(MODULE_NAME.SELECTION).getSelections();
    const firstSelection = this.copyTargets[0];
    if (!firstSelection) {
      return;
    }
    const strategy = processStrategy[firstSelection.type];
    const fnName = strategy && strategy.copy;
    if (fnName) {
      this.clipboardHelper.reset();
      if (e) {
        this.clipboardHelper.setDataTransfer(e.clipboardData);
        e.preventDefault();
      }
      return this[fnName](e);
    }
  }
  paste(
    e,
    { toImage, toMarker, toBranch, toMathJax, clientPosition }: any = {},
  ) {
    if (e) {
      e.preventDefault();
      this.clipboardHelper.setDataTransfer(e.clipboardData);
    }
    this.pasteClintPosition = clientPosition;
    const typesShouldHandle: any[] = [];
    if (toImage) {
      typesShouldHandle.push(VIEW_TYPE.IMAGE);
    }
    if (toMarker) {
      typesShouldHandle.push(VIEW_TYPE.MARKER);
    }
    if (toBranch) {
      typesShouldHandle.push(VIEW_TYPE.BRANCH);
    }
    if (toMathJax) {
      typesShouldHandle.push(VIEW_TYPE.MATH_JAX);
    }
    this._processXMindObject(typesShouldHandle)
      .catch(() => {
        return this._processImageList(typesShouldHandle).catch(() => {
          return this._processPlainText(typesShouldHandle).catch(() => {
            this._processSystemPaste();
          });
        });
      })
      .finally(() => {
        delete this.pasteClintPosition;
      });
  }
  /**
   * @todo 这个方法太大了，需要被重构 by morse.guo
   * */
  _copyTopic() {
    const selectionArr = this.copyTargets;
    if (selectionArr && selectionArr.length > 0) {
      const result = new CopyTopicProcessor(selectionArr).generateData();
      if (result && result.topic && result.topic.length > 0) {
        const serializedStr = result.topic
          .map((item) => {
            return item && cpUtil.serializeBranchToString(item);
          })
          .filter((item) => !!item)
          .join(cpUtil.linefeed);
        (this.clipboardHelper as any)
          .write({
            "text/plain": serializedStr,
            "text/x-array-json": result.topic,
            "text/x-type": VIEW_TYPE.BRANCH,
            "text/x-other-object-json": {
              relationship: result.relationship,
              boundary: result.boundary,
              summary: result.summary,
              sheetId: this.context.getSheetModel().id,
            },
          })
          .catch(() => {
            config.get(CONFIG.LOGGER).warn("something wrong copy fail");
          });
        return true;
      }
    }
  }
  /**
   * @todo use BranchRebuildManager
   * @memberof CopyPaste
   */
  _addTopics(toPasteDataArr, otherDataObj: any = {}) {
    const sheetView = this.context.getSheetView();
    const selectionArr = this.context
      .getModule(MODULE_NAME.SELECTION)
      .getSelections();
    let isPastedAsFloatingTopic = false;
    if (!selectionArr.length) {
      selectionArr.push(sheetView.centralBranchView);
      isPastedAsFloatingTopic = true;
    }
    selectionArr
      .filter((selection) => selection.type === VIEW_TYPE.BRANCH)
      .forEach((selection) => {
        const selectionModel = selection.model;
        let replaceIdMap = {};
        toPasteDataArr.forEach((toPasteData) => {
          let _a;
          toPasteData = JSON.parse(JSON.stringify(toPasteData));
          const result = mommonFuncs.replaceId(toPasteData, () => {
            return Object(utils.UUID)();
          });
          replaceIdMap = Object.assign(Object.assign({}, replaceIdMap), result);
          const topic = Object(parseTopic)(
            toPasteData,
            selectionModel.ownerSheet(),
          );
          if (isPastedAsFloatingTopic) {
            let floatingTopicRealPosition;
            const canvasControl = this.context.getSVGView().getCanvasControl();
            if (!this.pasteClintPosition) {
              // add floating topic's default position, it's map's current central position
              const visibleAreaBounds = canvasControl.getVisibleAreaBounds();
              floatingTopicRealPosition = canvasControl
                .getCoordinateTransfer()
                .visibleAreaToMindMap({
                  x: visibleAreaBounds.width / 2,
                  y: visibleAreaBounds.height / 2,
                });
            } else {
              floatingTopicRealPosition = canvasControl
                .getCoordinateTransfer()
                .viewportToMindMap(this.pasteClintPosition);
            }
            topic.changePosition(floatingTopicRealPosition);
            // if boundary exsits, add floating topic's master boundary
            if ((_a = otherDataObj.boundary) === null || _a === undefined) {
              // do nothing
            } else {
              _a.forEach((boundary) => {
                const topicIds = boundary.content;
                if (
                  topicIds.length === 1 &&
                  replaceIdMap[topicIds[0]] === toPasteData.id
                ) {
                  topic.addBoundary({
                    id: Object(utils.UUID)(),
                    title: boundary.title,
                    range: `(${MASTER_RANGE})`,
                  });
                }
              });
            }
          }
          const pastedTopic = selectionModel.addChildTopic(topic, {
            type: isPastedAsFloatingTopic
              ? TOPIC_TYPE.DETACHED
              : TOPIC_TYPE.ATTACHED,
          });
          if (
            otherDataObj.sheetId &&
            otherDataObj.sheetId !== this.context.getSheetModel().id
          ) {
            const pastedBranch =
              this.context.getSVGView().model2View[pastedTopic.id];
            const allChildrenBranchView =
              pastedBranch.getDescendantBranchesByType([
                TOPIC_TYPE.ATTACHED,
                TOPIC_TYPE.DETACHED,
                TOPIC_TYPE.SUMMARY,
                TOPIC_TYPE.CALLOUT,
              ]);
            const allBranchView = [pastedBranch, ...allChildrenBranchView];
            allBranchView.forEach((branch) => {
              styleManager.fixUserStyle(branch);
            });
          }
        });
        _addBoundary(selection, replaceIdMap);
        _addSummary(selection, replaceIdMap);
        _addRelationship(selection, replaceIdMap);
        if (
          otherDataObj.sheetId &&
          otherDataObj.sheetId !== this.context.getSheetModel().id
        ) {
          // 由于前面的 fixUserStyle 是静默的，故最后需要再 setStyleObj 一次
          const selectionUserStyle = styleManager.getUserStyle(selection);
          const styleObj = selectionUserStyle
            ? selectionUserStyle.attributes
            : {
                properties: {},
              };
          selectionModel.setStyleObj(styleObj, false);
        }
      });
    function _addBoundary(selection, replaceIdMap) {
      const boundaryArr = otherDataObj.boundary;
      if (boundaryArr) {
        boundaryArr.forEach((boundary) => {
          const topicIds = boundary.content;
          const startId = replaceIdMap[topicIds[0]];
          const endId = replaceIdMap[topicIds[topicIds.length - 1]];
          const startIndex = selection.model.getChildrenIndexById(startId);
          const endIndex = selection.model.getChildrenIndexById(endId);
          selection.model.addBoundary({
            // class: 'boundary',
            id: Object(utils.UUID)(),
            title: boundary.title,
            range: `(${startIndex},${endIndex})`,
          });
        });
      }
    }
    function _addSummary(selection, replaceIdMap) {
      const summaryArr = otherDataObj.summary;
      if (summaryArr) {
        summaryArr.forEach((s) => {
          const topicIds = s.content;
          const startId = replaceIdMap[topicIds[0]];
          const endId = replaceIdMap[topicIds[topicIds.length - 1]];
          const startIndex = selection.model.getChildrenIndexById(startId);
          const endIndex = selection.model.getChildrenIndexById(endId);
          const toPasteSummaryTopic = s.st;
          mommonFuncs.replaceId(toPasteSummaryTopic, () => {
            return Object(utils.UUID)();
          });
          const summaryData = {
            // class: 'summary',
            id: Object(utils.UUID)(),
            range: `(${startIndex},${endIndex})`,
            topicId: toPasteSummaryTopic.id,
          };
          selection.model.addSummary(
            summaryData,
            false,
            Object(parseTopic)(
              toPasteSummaryTopic,
              selection.model.ownerSheet(),
            ),
          );
        });
      }
    }
    function _addRelationship(selection, replaceIdMap) {
      const relationshipArr = otherDataObj.relationship;
      if (relationshipArr) {
        relationshipArr.forEach((relationship) => {
          relationship = JSON.parse(JSON.stringify(relationship));
          relationship.id = Object(utils.UUID)();
          relationship.end1Id = replaceIdMap[relationship.end1Id];
          relationship.end2Id = replaceIdMap[relationship.end2Id];
          if (!relationship.end1Id || !relationship.end2Id) {
            return;
          }
          sheetView.model.addRelationship(relationship);
        });
      }
    }
  }
  _copyImage() {
    const imgDataArr = this.copyTargets
      .filter((item) => item.type === VIEW_TYPE.IMAGE)
      .map((imgView) => imgView.parent().model.get("image"));
    this.clipboardHelper.write({
      "text/plain": JSON.stringify(imgDataArr),
      "text/x-array-json": imgDataArr,
      "text/x-type": VIEW_TYPE.IMAGE,
    });
    return true;
  }
  async _addImages(imgDataArr, otherDataObject?, isXObject?) {
    if (imgDataArr.length === 0) {
      return;
    }
    const limitedOperationHandler = this.context.config(
      CONFIG.LIMITED_OPERATION_HANDLER,
    );
    const canContinue =
      isXObject ||
      (await limitedOperationHandler(
        SUPPORTED_LIMITED_OPERATIONS.INSERT_IMAGE,
      ));
    if (!canContinue) {
      return;
    }
    const branchViewSelections = this._getBranchViewSelections();
    // add image to selected branch view
    if (imgDataArr.length === 1 && branchViewSelections.length) {
      branchViewSelections.forEach((branchView) => {
        this.context.execAction(ACTION_NAMES.ADD_IMAGE, {
          imageInfo: imgDataArr[0],
          targets: [branchView],
        });
      });
    }
    // add new image topic to selected branch, or as floating topic if there is no selection
    else {
      this._addTopics(
        imgDataArr.map((imgData) => {
          return {
            id: Object(utils.UUID)(),
            title: "",
            image: imgData,
          };
        }),
      );
    }
  }
  _copyMarker() {
    const markerDataArr = this.copyTargets
      .filter((view) => view.type === VIEW_TYPE.MARKER)
      .map((markerView) => {
        return {
          markerId: markerView.getMarkerId(),
        };
      });
    this.clipboardHelper.write({
      "text/plain": JSON.stringify(markerDataArr),
      "text/x-array-json": markerDataArr,
      "text/x-type": VIEW_TYPE.MARKER,
    });
    return true;
  }
  _addMarkers(markerDataArr) {
    const branchViewSelections = this._getBranchViewSelections();
    // add marker with selected branch view
    if (branchViewSelections.length) {
      branchViewSelections.forEach((branchView) => {
        markerDataArr.forEach((markerData) => {
          branchView.model.changeMarker(markerData.markerId);
        });
      });
    }
    // add new topic with markers as floating topic
    else {
      this._addTopics([
        {
          id: Object(utils.UUID)(),
          title: "",
          markers: [...markerDataArr],
        },
      ]);
    }
  }
  _copyMathJax() {
    const selections = this.copyTargets.filter(
      (view) => view.type === VIEW_TYPE.MATH_JAX,
    );
    const mathJaxExtensionDataList = selections.map((mathJaxView) => {
      return mathJaxView.parent().model.getMathJaxInfo();
    });
    const imageDataList = selections.map((mathJaxView) => {
      return mathJaxView.parent().model.getImageData();
    });
    this.clipboardHelper.write({
      "text/plain": JSON.stringify(mathJaxExtensionDataList),
      "text/x-array-json": mathJaxExtensionDataList,
      "text/x-type": VIEW_TYPE.MATH_JAX,
      "text/x-other-object-json": {
        imageDataList: imageDataList,
      },
    });
    return true;
  }
  _addMathJax(mathJaxExtensionDataList) {
    if (mathJaxExtensionDataList.length === 0) {
      return;
    }
    const branchViewSelections = this._getBranchViewSelections();
    // update mathjax within selected topic
    if (mathJaxExtensionDataList.length === 1 && branchViewSelections.length) {
      branchViewSelections.forEach((branchView) => {
        branchView.model.updateMathJaxInfo(
          JSON.parse(JSON.stringify(mathJaxExtensionDataList[0])),
        );
      });
    }
    // add new topic with mathjax
    else {
      this._addTopics(
        mathJaxExtensionDataList.map((mathJaxExtensionData) => {
          return {
            id: Object(utils.UUID)(),
            title: "",
            extensions: [JSON.parse(JSON.stringify(mathJaxExtensionData))],
          };
        }),
      );
    }
  }
  async _processMathJaxObject(typesShouldHandle) {
    if (typesShouldHandle.indexOf(VIEW_TYPE.MATH_JAX) === -1) {
      return Promise.reject();
    }
    const mathJaxObjectList =
      await this.clipboardHelper.readMathJaxObjectList();
    this._addMathJax(mathJaxObjectList["text/x-array-json"]);
  }
  _processXMindObject(typesShouldHandle) {
    return this.clipboardHelper.readObj().then((data) => {
      if (typesShouldHandle.indexOf(data["text/x-type"]) === -1) {
        return Promise.reject();
      }
      this[processStrategy[data["text/x-type"]].paste](
        data["text/x-array-json"],
        data["text/x-other-object-json"],
        true,
      );
    });
  }
  async _processImageList(typesShouldHandle) {
    if (typesShouldHandle.indexOf(VIEW_TYPE.IMAGE) === -1) {
      return Promise.reject();
    }
    let htmlData;
    let plainTextData;
    try {
      htmlData = await this.clipboardHelper.readHTML();
    } catch (e) {
      /* TODO: Handle exceptions when pasting. */
    }
    try {
      plainTextData = await this.clipboardHelper.readPlainText();
    } catch (e) {
      /* TODO: Handle exceptions when pasting. */
    }
    // for copy image from ms app process
    // in macOS, there is only imageData, no htmlData, no plainTextData
    // in Windows, there is htmlData, no plainTextData
    const copyFromMac = !htmlData;
    const copyFromWindows = htmlData && !plainTextData;
    if (!copyFromMac && !copyFromWindows) {
      return Promise.reject();
    }
    const xapArr = await this.clipboardHelper.readImageArr();
    return this._addImages(
      (xapArr as any[]).map((imgXap) => {
        return {
          src: imgXap,
          align: "up",
        };
      }),
    );
  }
  _processPlainText(typesShouldHandle) {
    return this.clipboardHelper.readPlainText().then((plainStr) => {
      if (!plainStr) {
        return Promise.reject();
      }
      let obj;
      try {
        obj = JSON.parse(plainStr);
      } catch (e) {
        // TODO: Handle exceptions when pasting.
      }
      if (obj && typeof obj === "object") {
        if (typesShouldHandle.indexOf(obj.type) === -1) {
          return Promise.reject();
        }
        this[processStrategy[obj.type].paste](obj.dataArr);
      } else {
        if (typesShouldHandle.indexOf(VIEW_TYPE.BRANCH) === -1) {
          return Promise.reject();
        }
        return this._addTopics(
          cpUtil.deserialize(plainStr, this.context.getSheetView().model),
        );
      }
    });
  }
  _processSystemPaste() {
    return document.execCommand("paste");
  }
  _getBranchViewSelections() {
    return this.context
      .getModule(MODULE_NAME.SELECTION)
      .getSelections()
      .filter((v) => v.type === VIEW_TYPE.BRANCH);
  }
}
export class CopyPaste {
  static identifier: string;
  constructor(context) {
    const copyPasteManager = new CopyPasteManager(context);
    if (
      !context.config(CONFIG.NO_KEYBIND) &&
      !context.config(CONFIG.NO_EDIT_RECEIVER)
    ) {
      const editReceiver = context.getModule(MODULE_NAME.EDIT_RECEIVER);
      editReceiver.on("copy", (e) => {
        //e.clipboardData.setData("text/plain", "cp hahah");
        copyPasteManager.copy(e);
      });
      editReceiver.on("paste", (e) => {
        if (context.isReadOnly()) {
          return;
        }
        // context.execAction('paste', { clientPosition: { x: 200, y: 100 } })
        copyPasteManager.paste(e, {
          toImage: true,
          toMarker: true,
          toBranch: true,
          toMathJax: true,
        });
      });
      editReceiver.on("cut", (e) => {
        if (copyPasteManager.copy(e)) {
          context.execAction(ACTION_NAMES.DELETE_ITEM);
        }
        //context.execAction(ACTION_NAMES.CUT);
      });
    }
    return copyPasteManager;
  }
}
CopyPaste.identifier = MODULE_NAME.COPY_PASTE;
export default CopyPaste;

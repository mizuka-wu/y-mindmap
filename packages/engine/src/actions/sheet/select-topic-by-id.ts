import { ACTION_NAMES } from "../../common/constants/index";
import BaseAction from "../action";

export class SelectTopicByIdAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.SELECT_TOPIC_BY_ID;
  }
  doExecute({ componentId, callback }: any = {}) {
    let targetBranch;
    const workbookEditor = this._context.parent();
    if (this._context.model.findComponentById(componentId)) {
      targetBranch = this._context.getComponentViewById(componentId);
    } else if (workbookEditor) {
      workbookEditor.model.sheets.some((sheet) => {
        if (sheet.findComponentById(componentId)) {
          if (sheet.id !== workbookEditor.currentSheetId) {
            const sheetIndex = workbookEditor.findSheetIndex(sheet.id);
            workbookEditor.switchTo(sheetIndex);
          }
          targetBranch =
            workbookEditor.sheetEditors[sheet.id] &&
            workbookEditor.sheetEditors[sheet.id].getComponentViewById(
              componentId,
            );
          return true;
        }
      });
    }
    if (!targetBranch) {
      if (callback) {
        callback({
          resolve: false,
          reject: true,
        });
      }
      return;
    }
    const currentSheet = workbookEditor
      ? workbookEditor.sheetEditors[workbookEditor.currentSheetId]
      : this._context;
    currentSheet.execAction(ACTION_NAMES.FOCUS_CENTER, {
      targets: [targetBranch],
      animated: false,
      finishToRun: () => {
        currentSheet.execAction(ACTION_NAMES.SELECT, {
          id: targetBranch.model.get("id"),
          isSingle: true,
          prue: true,
        });
        if (callback) {
          callback({
            resolve: true,
            reject: false,
          });
        }
      },
    });
  }
}

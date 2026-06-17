import { initActions } from '../utils';
import { AddNewSheetAction } from './add-new-sheet';
import { ChangeSheetTitleAction } from './change-sheet-title';
import { CloseUndoKeepModeAction } from './close-undo-keep-mode';
import { OpenUndoKeepModeAction } from './open-undo-keep-mode';
import { RedoAction } from './redo';
import { RefreshMindMapAction } from './refresh-mind-map';
import { RemoveSheetAction } from './remove-sheet';
import { SetExtColIconDisplayAction } from './set-ext-col-icon-display';
import { SetMiniMapDisplayAction } from './set-mini-map-display';
import { UndoAction } from './undo';
import { WorkbookSavedAction } from './workbook-saved';
import { WorkbookModifiedAction } from './workbook-modified';

import type { WorkbookEditor } from '../../type.d';

const actions = [
  AddNewSheetAction,
  ChangeSheetTitleAction,
  CloseUndoKeepModeAction,
  OpenUndoKeepModeAction,
  RedoAction,
  RefreshMindMapAction,
  RemoveSheetAction,
  SetExtColIconDisplayAction,
  SetMiniMapDisplayAction,
  UndoAction,
  WorkbookSavedAction,
  WorkbookModifiedAction,
];
export const initWorkbookActions = (context: WorkbookEditor) => {
  return initActions(context, actions);
};

export default initWorkbookActions;

import { EVENTS, MODULE_NAME, VIEW_TYPE } from "../../common/constants/index";

import * as lazyrunner from "../../figures/lazyrunner/index";
import * as lazyrunner_constants from "../../figures/lazyrunner/constants";

export class SelectionStatesRestorer {
  constructor(context) {
    new UndoRedoSelectionRestorer(context);
    new DragSelectionRestorer(context);
  }
}
class UndoRedoSelectionRestorer {
  _undoGroupToSelectionsMap: Map<any, any>;
  _redoGroupToSelectionsMap: Map<any, any>;
  _context: any;
  _undoManager: any;
  _selectionManager: any;
  constructor(context /*View.SheetEditor*/) {
    this._undoGroupToSelectionsMap = new Map();
    this._redoGroupToSelectionsMap = new Map();
    this._context = context;
    this._undoManager = this._context.model.getUndo();
    this._selectionManager = this._context.getModule(MODULE_NAME.SELECTION);
    this._undoManager.on(this._undoManager.NEW_GROUP_STAND_BY_EVENT, () => {
      this._saveSelectionStates();
    });
    this._undoManager.on(
      this._undoManager.GROUP_RESTORE_EVENT,
      (bindGroup, isUndo) => {
        this._restoreSelectionStates(bindGroup, isUndo);
      },
    );
  }
  _saveSelectionStates() {
    this._saveUndoGroupSelectionStates();
    this._saveRedoGroupSelectionStates();
  }
  _saveUndoGroupSelectionStates() {
    const bindGroup = this._undoManager.getLastGroup();
    if (!bindGroup) {
      return;
    }
    let finalSelections;
    // todo is there multi changTitle's situation?
    const bindModelSelections = this._getSelectionForBindModelAction(bindGroup);
    if (bindModelSelections.length) {
      finalSelections = bindModelSelections;
    } else {
      const branchViewSelections = this._selectionManager
        .getSelections()
        .filter((view) => {
          return view.type === VIEW_TYPE.BRANCH;
        });
      if (!this._undoGroupToSelectionsMap.get(bindGroup)) {
        finalSelections = branchViewSelections;
      } else {
        const oldSelections = [
          ...this._undoGroupToSelectionsMap.get(bindGroup),
        ];
        branchViewSelections.forEach((view) => {
          if (!oldSelections.includes(view)) {
            oldSelections.push(view);
          }
        });
        finalSelections = oldSelections;
      }
    }
    this._undoGroupToSelectionsMap.set(bindGroup, finalSelections);
  }
  _saveRedoGroupSelectionStates() {
    lazyrunner.lazyRunner.work(lazyrunner_constants.PRIORITY.AFTER_EACH, {
      execute: () => {
        const bindGroup = this._undoManager.getLastGroup();
        if (!bindGroup) {
          return;
        }
        let finalSelections;
        const bindModelSelections =
          this._getSelectionForBindModelAction(bindGroup);
        if (bindModelSelections.length) {
          finalSelections = bindModelSelections;
        } else {
          finalSelections = this._selectionManager
            .getSelections()
            .filter((view) => {
              return view.type === VIEW_TYPE.BRANCH;
            });
        }
        this._redoGroupToSelectionsMap.set(bindGroup, finalSelections);
      },
    });
  }
  _restoreSelectionStates(bindGroup, isUndo) {
    this._refreshGroupToSelectionsMap();
    lazyrunner.lazyRunner.work(
      lazyrunner.runnerConstants.PRIORITY.BEFORE_SELECT_SELECTION,
      {
        execute: () => {
          // @ts-ignore
          lazyrunner.lazyRunner.clearPriority(
            lazyrunner.runnerConstants.PRIORITY.SELECT_SELECTION,
          );
          const targetGroupToSelectionMap = isUndo
            ? this._undoGroupToSelectionsMap
            : this._redoGroupToSelectionsMap;
          const targetSelectionList = targetGroupToSelectionMap.get(bindGroup);
          // in outliner environment, PRIORITY.AFTER_EACH will not work
          // so redo's bindGroup selection will be undefined
          if (!targetSelectionList) {
            return;
          }
          const branchViewSelections = targetGroupToSelectionMap
            .get(bindGroup)
            .map((view) => {
              if (view.parent()) {
                return view;
              }
              const model = view.model;
              const newView =
                this._context.getSVGView().model2View[model.getId()];
              if (newView) {
                return newView;
              }
            })
            .filter((view) => view);
          targetGroupToSelectionMap.set(bindGroup, branchViewSelections);
          this._selectionManager.selectNone();
          branchViewSelections.forEach((view) => {
            this._selectionManager.addSelection(view);
          });
        },
      },
    );
  }
  _getSelectionForBindModelAction(bindGroup) {
    const bindModelTasks = bindGroup.getTasks().filter((task) => {
      return task.options?.shouldBindSelectionRestore;
    });
    if (!bindModelTasks.length) {
      return [];
    }
    return bindModelTasks
      .map((task) => {
        const model = task.options.model;
        return this._context.getSVGView().model2View[model.getId()];
      })
      .filter((v) => v);
  }
  _refreshGroupToSelectionsMap() {
    const allUndoGroups = this._undoManager.getAllGroups();
    const groupToRemoveList: any[] = [];
    this._undoGroupToSelectionsMap.forEach((selections, bindGroup) => {
      if (!allUndoGroups.includes(bindGroup)) {
        groupToRemoveList.push(bindGroup);
      }
    });
    // redo group list and map is same to undo group list and map
    groupToRemoveList.forEach((group) => {
      this._undoGroupToSelectionsMap.delete(group);
      this._redoGroupToSelectionsMap.delete(group);
    });
  }
}
class DragSelectionRestorer {
  _context: any;
  _dragManager: any;
  constructor(context) {
    this._context = context;
    this._dragManager = this._context.getModule(MODULE_NAME.DRAG);
    if (!this._dragManager) {
      return;
    }
    this._context.on(EVENTS.SE_BRANCH_DRAG_END, () => {
      this._restoreSelectionStatus();
    });
  }
  _restoreSelectionStatus() {
    const originalDragSelections = [
      ...this._dragManager.getOriginalDragSelections(),
    ];
    lazyrunner.lazyRunner.work(
      lazyrunner.runnerConstants.PRIORITY.BEFORE_SELECT_SELECTION,
      {
        execute: () => {
          lazyrunner.lazyRunner.clearPriority(
            lazyrunner.runnerConstants.PRIORITY.SELECT_SELECTION,
          );
          const selectionManager = this._context.getModule(
            MODULE_NAME.SELECTION,
          );
          const SVGView = this._context.getSVGView();
          originalDragSelections.forEach((originalBranchView) => {
            const newBranchView =
              SVGView.model2View[originalBranchView.model.getId()];
            if (selectionManager === null || selectionManager === undefined) {
              // do nothing
            } else {
              selectionManager.addSelection(newBranchView);
            }
          });
        },
      },
    );
  }
}

export default SelectionStatesRestorer;

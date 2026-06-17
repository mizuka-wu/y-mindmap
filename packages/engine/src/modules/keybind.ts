import {
  CONFIG,
  UI_STATUS,
  MODULE_NAME,
  ACTION_NAMES,
  DIRECTION,
} from "../common/constants/index";
import mommonFuncs from "../mommonfuncs";
export class KeyBind {
  static identifier: string;
  constructor(context) {
    const isNoKeybind = () => context.config(CONFIG.NO_KEYBIND);
    const keybindHandler = {
      keyMap: {
        9: "Tab",
        13: "Enter",
        8: "Delete",
        46: "Delete",
        90: "Z",
        65: "A",
        38: "Up",
        40: "Down",
        37: "Left",
        39: "Right",
        32: "Space",
        27: "Esc",
      },
      readOnlyAllowed: {
        38: true,
        40: true,
        37: true,
        39: true,
      },
      editingTitleAllowed: {
        9: true,
      },
      operationMap: {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        Tab: function (e) {
          const selection = this.getSelection();
          if (
            selection &&
            selection.length === 1 &&
            selection[0].type === "branch"
          ) {
            let currentSelection = selection[0];
            const isEditingTitle =
              context.getActiveUIStatus().indexOf(UI_STATUS.EDIT_TITLE) !== -1;
            if (isEditingTitle) {
              currentSelection = currentSelection.originBranchView;
            }
            context.execAction(ACTION_NAMES.ADD_SUB_TOPIC, {
              targets: [currentSelection],
            });
          }
        },
        Enter: function (e) {
          const selection = this.getSelection();
          if (
            selection &&
            selection.length > 0 &&
            mommonFuncs.isFunctionEnabled(e)
          ) {
            if (selection.some((view) => view.type !== "branch")) {
              return;
            }
            context.execAction(ACTION_NAMES.ADD_PARENT_TOPIC);
            return;
          }
          if (
            selection &&
            selection.length === 1 &&
            selection[0].type === "branch"
          ) {
            if (selection[0].isCentralBranch()) {
              context.execAction(ACTION_NAMES.ADD_SUB_TOPIC, {
                targets: [selection[0]],
              });
              return;
            }
            if (e.shiftKey) {
              context.execAction(ACTION_NAMES.ADD_TOPIC_BEFORE, {
                targets: [selection[0]],
              });
            } else {
              context.execAction(ACTION_NAMES.ADD_TOPIC_AFTER, {
                targets: [selection[0]],
              });
            }
          }
        },
        Delete: function (e) {
          e.preventDefault();
          const selection = this.getSelection();
          if (selection) {
            context.execAction(ACTION_NAMES.DELETE_ITEM);
          }
        },
        Z: function (e) {
          if (e.metaKey || e.ctrlKey) {
            const targetEditor = context.parent() || context;
            if (e.shiftKey) {
              targetEditor.execAction(ACTION_NAMES.REDO);
            } else {
              targetEditor.execAction(ACTION_NAMES.UNDO);
            }
          }
        },
        A: function (e) {
          if (e.metaKey || e.ctrlKey) {
            context.execAction(ACTION_NAMES.SELECT_ALL);
          }
        },
        Up: function (e) {
          e.preventDefault();
          if (e.altKey) {
            context.execAction(ACTION_NAMES.EXCHANGE_SIBLING_TOPIC, {
              direction: DIRECTION.UP,
            });
          } else {
            context.execAction(ACTION_NAMES.SELECTION_NAVIGATE, {
              direction: DIRECTION.UP,
              addNext: e.metaKey || e.ctrlKey,
            });
          }
        },
        Down: function (e) {
          e.preventDefault();
          if (e.altKey) {
            context.execAction(ACTION_NAMES.EXCHANGE_SIBLING_TOPIC, {
              direction: DIRECTION.DOWN,
            });
          } else {
            context.execAction(ACTION_NAMES.SELECTION_NAVIGATE, {
              direction: DIRECTION.DOWN,
              addNext: e.metaKey || e.ctrlKey,
            });
          }
        },
        Left: function (e) {
          e.preventDefault();
          if (e.altKey) {
            context.execAction(ACTION_NAMES.EXCHANGE_SIBLING_TOPIC, {
              direction: DIRECTION.LEFT,
            });
          } else {
            context.execAction(ACTION_NAMES.SELECTION_NAVIGATE, {
              direction: DIRECTION.LEFT,
              addNext: e.metaKey || e.ctrlKey,
            });
          }
        },
        Right: function (e) {
          e.preventDefault();
          if (e.altKey) {
            context.execAction(ACTION_NAMES.EXCHANGE_SIBLING_TOPIC, {
              direction: DIRECTION.RIGHT,
            });
          } else {
            context.execAction(ACTION_NAMES.SELECTION_NAVIGATE, {
              direction: DIRECTION.RIGHT,
              addNext: e.metaKey || e.ctrlKey,
            });
          }
        },
        Space: function (e) {
          e.preventDefault();
        },
      },
      forceOperationMap: {
        Up: function (e) {
          e.preventDefault();
        },
        Down: function (e) {
          e.preventDefault();
        },
        Left: function (e) {
          e.preventDefault();
        },
        Right: function (e) {
          e.preventDefault();
        },
        Space: function (e) {
          e.preventDefault();
        },
      },
      getSelection: function () {
        return context.getModule(MODULE_NAME.SELECTION).selections;
      },
    };
    const $el = context.$el;
    $el.on("keydown", (e) => {
      const { keyCode } = e;
      const { keyMap, operationMap, forceOperationMap } = keybindHandler;
      if (keyCode in keybindHandler.keyMap) {
        if (
          (context.isReadOnly() &&
            keybindHandler.readOnlyAllowed[keyCode] !== true) ||
          (context.getActiveUIStatus().indexOf(UI_STATUS.EDIT_TITLE) !== -1 &&
            keybindHandler.editingTitleAllowed[keyCode] !== true)
        ) {
          return;
        } else if (isNoKeybind()) {
          // todo:
          // forceOperationMap is likely for preventDefault() of browser's scroll hotkey.
          // it should be moved to the right place.
          const handler = forceOperationMap[keyMap[keyCode]];
          if (handler) {
            handler.call(keybindHandler, e);
          }
        } else {
          const handler = operationMap[keybindHandler.keyMap[keyCode]];
          if (handler) {
            handler.call(keybindHandler, e);
          }
        }
      }
    });
    return keybindHandler;
  }
}
KeyBind.identifier = MODULE_NAME.KEY_BIND;

export default KeyBind;

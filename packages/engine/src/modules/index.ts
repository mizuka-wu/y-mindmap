import process from "process";

import ModuleSelectionManager from "./selectionmanager";

import ModuleMoveViewPort from "./moveviewport";

import ModuleSemaphore from "./semaphore";

import ModuleLayout from "./layout";

import ModuleOverridedStyle from "./overridedstyle";

import ModuleUiStatusManager from "./uistatusmanager";

import ModuleEditReceiver from "./editreceiver";

import ModuleAddRelationshipManager from "./addrelationshipmanager";

import ModuleCopyPaste from "./copypaste/copypaste";

import ModuleDragManager from "./dragmanager";

import ModuleSelectDragManager from "./selectdragmanager";

import ModuleKeyBind from "./keybind";

import ModulePreAddFloatingTopic from "./preaddfloatingtopic";

import ModuleMiniMap from "./minimap";

import ModuleMouseBoxSelect from "./mouseboxselect";

import ModuleDropManager from "./dropmanager";

import ModuleModifyCheck from "./modifycheck";

import ModuleSvgDraggable from "./svgdraggable";

import ModuleAnimationManager from "./animationmanager/index";

export const availableModules: any[] = [];

availableModules.push(
  ...[
    ModuleSelectionManager,
    ModuleSemaphore,
    ModuleMoveViewPort,
    ModuleLayout,
    ModuleOverridedStyle,
    ModuleUiStatusManager,
  ],
);
if (process.env.SB_MODE !== "readonly") {
  availableModules.push(
    ...[
      ModuleEditReceiver,
      ModuleAddRelationshipManager,
      ModuleCopyPaste,
      ModuleDragManager,
      ModuleSelectDragManager,
      ModuleKeyBind,
      ModulePreAddFloatingTopic,
      ModuleMiniMap,
      ModuleMouseBoxSelect,
      ModuleDropManager,
      ModuleModifyCheck,
      ModuleSvgDraggable,
      ModuleAnimationManager,
    ],
  );
}
/* harmony default export */
export default availableModules;

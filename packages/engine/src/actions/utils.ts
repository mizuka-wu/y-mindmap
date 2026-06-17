import { CONFIG } from '../common/constants/index';

import type { WorkbookEditor, SheetEditor, Action } from '../type.d';

// @flow
export function initActions(context: WorkbookEditor | SheetEditor, actions: (typeof Action)[]) {
  const actionNameToInstance: Record<string, Action> = {};
  const preactions: Record<string, Action> = context.config(CONFIG.PRE_ACTIONS);
  for (const ActionConstructor of actions) {
    const instance = new ActionConstructor(context);
    actionNameToInstance[instance.actionName] = instance;
    // inject preaction
    const preaction = preactions && preactions[instance.actionName];
    if (preaction) {
      instance.injectPreaction(preaction);
    }
  }
  return actionNameToInstance;
}

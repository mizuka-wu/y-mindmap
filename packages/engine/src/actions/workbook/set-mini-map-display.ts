import { ACTION_NAMES } from '../../common/constants/index';
import BaseAction from '../../actions/action';

import type { WorkbookEditor } from '../../type.d';

/**
 * @description 切换minimap的显示与隐藏
 */
export class SetMiniMapDisplayAction extends BaseAction<WorkbookEditor> {
  constructor(context: WorkbookEditor) {
    super(context);
    this.actionName = ACTION_NAMES.SET_MINI_MAP_DISPLAY;
  }
  doExecute({ show }: { show: boolean }) {
    this._context.miniMapManager.setMiniMapDisplay(show);
  }
}

export default SetMiniMapDisplayAction;

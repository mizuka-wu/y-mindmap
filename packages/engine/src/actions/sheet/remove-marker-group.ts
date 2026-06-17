import {
  ACTION_NAMES,
  MODULE_NAME,
  TOPIC_TYPE,
} from "../../common/constants/index";
import BaseAction from "../action";

import * as js_utils from "../../utils/index";
export class RemoveMarkerGroupAction extends BaseAction {
  constructor(context) {
    super(context);
    this.actionName = ACTION_NAMES.REMOVE_MARKER_GROUP;
  }
  /**
   * remove all markers of certain group
   */
  doExecute({ groupId }: any = {}) {
    if (!groupId) {
      return;
    }
    const { markerModule } = Object(js_utils.getInjectModule)(
      MODULE_NAME.SNOWBIRD,
    );
    const groupInfo = markerModule.getGroupInfoById(groupId);
    if (!groupInfo) {
      return;
    }
    const markerIdList = groupInfo.markers.map(
      (markerInfo) => markerInfo.markerId,
    );
    this._context.model.traverseTopic(
      Object.values(TOPIC_TYPE),
      (topicModel) => {
        topicModel.getMarkersData().forEach((markerInfo) => {
          if (markerIdList.includes(markerInfo.markerId)) {
            topicModel.removeMarker(markerInfo.markerId);
          }
        });
      },
    );
  }
}

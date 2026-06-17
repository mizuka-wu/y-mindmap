import { VIEW_TYPE, ACTION_NAMES, MODULE_NAME, ACTION_STATUS, TOPIC_TYPE } from '../../common/constants/index';
import BaseAction from '../action';
import styleManager from '../../utils/business/stylemanager/index';

import { mergeParentAndRange } from './utils';
import type { SheetEditor, SelectionManager } from '../../type.d';

export class AddBoundaryAction extends BaseAction<SheetEditor> {
  constructor(context: SheetEditor) {
    super(context);
    this.actionName = ACTION_NAMES.ADD_BOUNDARY;
  }
  doExecute() {
    const selections = this._context.getModule<SelectionManager>(MODULE_NAME.SELECTION).getSelections();
    const length = selections.length;
    // if no selection, just return
    if (!length) {
      return;
    }
    // add single boundary
    if (length === 1 && selections[0].type === VIEW_TYPE.BRANCH) {
      const selection = selections[0];
      // if the only selection is central branch, return too
      if (selection.isCentralBranch()) {
        return;
      }
      const model = selection.model;
      const topicType = styleManager.getClassName(selection);
      const masterRangeTopicList = ['summaryTopic', 'calloutTopic', 'floatingTopic'];
      // if selection's boundary
      if (masterRangeTopicList.includes(topicType)) {
        model.addBoundary(generateBoundaryData('master'));
      } else {
        const parent = selection.parent();
        const index = parent.getChildrenBranchesByType().indexOf(selection);
        if (index < 0) {
          return;
        }
        parent.model.addBoundary(generateBoundaryData(`(${index},${index})`));
      }
    } else {
      const result = mergeParentAndRange(selections);
      result.masterArr.forEach(item => {
        item.model.addBoundary(generateBoundaryData('master'));
      });
      Object.values(result.rangeMap).forEach((complexObject: any) => {
        const { parent, range } = complexObject;
        range.forEach(r => {
          parent.model.addBoundary(generateBoundaryData(`(${r.start},${r.end})`));
        });
      });
    }
    function generateBoundaryData(range) {
      return {
        // class: VIEW_TYPE.BOUNDARY,
        id: selections[0].model.ownerSheet().generateComponentId(),
        title: '',
        range,
      };
    }
  }
  queryStatus() {
    const targets = this._context
      .getModule(MODULE_NAME.SELECTION)
      .getSelections()
      .filter(view => view.type === VIEW_TYPE.BRANCH && view.model.type() === TOPIC_TYPE.ATTACHED);
    if (targets.length > 0) {
      return ACTION_STATUS.NORMAL;
    } else {
      return ACTION_STATUS.DISABLE;
    }
  }
}

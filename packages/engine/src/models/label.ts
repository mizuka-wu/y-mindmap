import { COMPONENT_TYPE } from '../common/constants/index';
import { BaseComponent } from './basecomponent';

export class LabelModel extends BaseComponent<object> {
  get componentType() {
    return COMPONENT_TYPE.LABEL;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(attrs: object, options: any) {
    super(attrs, options);
  }
}
export default LabelModel;

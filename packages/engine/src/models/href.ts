import { COMPONENT_TYPE } from '../common/constants/index';
import { BaseComponent } from './basecomponent';

/**
 * @fileOverview href info item's backbone model
 * */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class HrefModel extends BaseComponent<any> {
  get componentType() {
    return COMPONENT_TYPE.HREF;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(attrs: any, options: any) {
    super(attrs, options);
  }
}

export default HrefModel;

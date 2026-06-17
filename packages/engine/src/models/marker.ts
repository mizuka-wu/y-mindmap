import { MODEL_TYPE } from '../common/constants/index';
import { BaseComponent } from './basecomponent';

export interface MarkerData {
  markerId: string;
}

export class MarkerModel extends BaseComponent<MarkerData> {
  get componentType() {
    return MODEL_TYPE.MARKER;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(attrs: MarkerData, options: any) {
    super(attrs, options);
  }
}
export default MarkerModel;

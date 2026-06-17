import { COMPONENT_TYPE } from '../common/constants/index';
import { BaseComponent } from './basecomponent';

export type NumberingData = {
  numberFormat: string;
  prefix: string;
  suffix: string;
  prependingNumbers?: string;
  numberSeparator?: string;
};

export class NumberingModel extends BaseComponent<NumberingData> {
  get componentType() {
    return COMPONENT_TYPE.NUMBERING;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(attrs: NumberingData, options: any) {
    super(attrs, options);
  }

  // createEmptyNumbering(): NumberingData;
  // changeNumbering(key: string, value: string): void;
}
export default NumberingModel;

import backbone, { ObjectHash } from 'backbone';

export type { ObjectHash } from 'backbone';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class BaseModel<T extends ObjectHash = any> extends backbone.Model<T> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(attr: T, options: any) {
    super(attr, options);
    return this;
  }
  /**
   * @override
   */
  toJSON(): T {
    return JSON.parse(JSON.stringify(this.attributes));
  }
  getEnvCoreVersion() {
    return '2.0.0';
  }
}

export default BaseModel;

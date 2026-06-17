export interface _ExtensionData_TextNode {
  provider: string;
  content: string;
}
export interface _ExtensionData_Node<T = object> {
  provider: string;
  content?: T;
  resourceRefs?: [string];
}
export declare type ExtensionData = _ExtensionData_TextNode | _ExtensionData_Node;

export class Extensions {
  exMap: Record<string, ExtensionData>;
  constructor(arr: ExtensionData[]) {
    this.exMap = {};
    arr.forEach(item => {
      this.exMap[item.provider] = item;
    });
  }
  add<T extends ExtensionData = ExtensionData>(provider: string, data: T) {
    this.exMap[provider] = data;
  }
  remove(provider: string) {
    delete this.exMap[provider];
  }
  getExtension<T extends ExtensionData = ExtensionData>(provider: string): T | undefined {
    return this.exMap[provider] as T | undefined;
  }
  getInfo() {
    return Object.values(this.exMap);
  }
}

export default Extensions;

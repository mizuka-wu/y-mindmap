import { COMPONENT_TYPE } from '../common/constants/index';
import { BaseComponent } from './basecomponent';

import type { StyleData } from './stylecomponent';

export declare type NoteSpanData = TextSpanData | ImageSpanData | HyperlinkSpanData;
export interface TextSpanData {
  style: StyleData;
  text: string;
  class: string;
}
export interface ImageSpanData {
  style: StyleData;
  class: string;
  image: string;
}
export interface HyperlinkSpanData {
  style: StyleData;
  class: string;
  href: string;
  spans: [NoteSpanData];
}
export interface NotesData {
  plain: {
    content: string;
  };
  // html: {
  //   content: {
  //     paragraphs: [
  //       {
  //         style: StyleData;
  //         spans: [NoteSpanData];
  //       },
  //     ];
  //   };
  // };
  realHTML?: {
    content: string;
  };
}

export class NoteModel extends BaseComponent<NotesData> {
  get componentType() {
    return COMPONENT_TYPE.NOTE;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(attrs: NotesData, options: any) {
    console.log(attrs);
    super(attrs, options);
  }
}
export default NoteModel;

import { StyleData } from "@y-mindmap/core";

export interface SummaryData {
  id: string;
  style?: StyleData;
  range: string;
  topicId: string;
}

export class Summary {
  readonly id: string;
  readonly style: StyleData | undefined;
  readonly range: string;
  readonly topicId: string;

  constructor(data: SummaryData) {
    this.id = data.id;
    this.style = data.style;
    this.range = data.range;
    this.topicId = data.topicId;
  }

  getRangeStart(): number {
    const match = this.range.match(/\(\s*(\d+)\s*,/);
    return match && match[1] ? parseInt(match[1]) : 0;
  }

  getRangeEnd(): number {
    const match = this.range.match(/,\s*(\d+)\s*\)/);
    return match && match[1] ? parseInt(match[1]) : 0;
  }

  toJSON(): SummaryData {
    return this.toData();
  }

  private toData(): SummaryData {
    return {
      id: this.id,
      style: this.style,
      range: this.range,
      topicId: this.topicId,
    };
  }

  static fromJSON(data: SummaryData): Summary {
    return new Summary(data);
  }

  static create(
    topicId: string,
    rangeStart: number,
    rangeEnd: number,
  ): Summary {
    return new Summary({
      id: crypto.randomUUID(),
      topicId,
      range: `(${rangeStart},${rangeEnd})`,
    });
  }
}

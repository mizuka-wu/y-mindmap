import { StyleData } from "@y-mindmap/core";

export interface BoundaryData {
  id: string;
  title?: string;
  style?: StyleData;
  range: string;
  titleUnedited?: boolean;
}

export class Boundary {
  readonly id: string;
  readonly title: string;
  readonly style: StyleData | undefined;
  readonly range: string;

  constructor(data: BoundaryData) {
    this.id = data.id;
    this.title = data.title || "";
    this.style = data.style;
    this.range = data.range;
  }

  getRangeStart(): number {
    const match = this.range.match(/\(\s*(\d+)\s*,/);
    return match && match[1] ? parseInt(match[1]) : 0;
  }

  getRangeEnd(): number {
    const match = this.range.match(/,\s*(\d+)\s*\)/);
    return match && match[1] ? parseInt(match[1]) : 0;
  }

  withTitle(title: string): Boundary {
    return new Boundary({
      ...this.toData(),
      title,
    });
  }

  withRange(start: number, end: number): Boundary {
    return new Boundary({
      ...this.toData(),
      range: `(${start},${end})`,
    });
  }

  toJSON(): BoundaryData {
    return this.toData();
  }

  private toData(): BoundaryData {
    return {
      id: this.id,
      title: this.title,
      style: this.style,
      range: this.range,
    };
  }

  static fromJSON(data: BoundaryData): Boundary {
    return new Boundary(data);
  }

  static create(rangeStart: number, rangeEnd: number): Boundary {
    return new Boundary({
      id: crypto.randomUUID(),
      range: `(${rangeStart},${rangeEnd})`,
    });
  }
}

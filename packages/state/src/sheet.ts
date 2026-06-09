import { StyleData, ThemeData } from "@y-mindmap/core";
import { SheetData } from "@y-mindmap/core";
import { RootTopic } from "./root-topic";
import { Relationship, RelationshipData } from "./relationship";
import { Boundary, BoundaryData } from "./boundary";
import { Summary, SummaryData } from "./summary";

export class Sheet {
  readonly id: string;
  readonly title: string;
  readonly doc: RootTopic;
  readonly relationships: readonly Relationship[];
  readonly boundaries: readonly Boundary[];
  readonly summaries: readonly Summary[];
  readonly theme: ThemeData | undefined;
  readonly style: StyleData | undefined;

  constructor(data: {
    id: string;
    title: string;
    doc: RootTopic;
    relationships?: readonly Relationship[];
    boundaries?: readonly Boundary[];
    summaries?: readonly Summary[];
    theme?: ThemeData;
    style?: StyleData;
  }) {
    this.id = data.id;
    this.title = data.title;
    this.doc = data.doc;
    this.relationships = data.relationships ?? [];
    this.boundaries = data.boundaries ?? [];
    this.summaries = data.summaries ?? [];
    this.theme = data.theme;
    this.style = data.style;
  }

  withTitle(title: string): Sheet {
    return new Sheet({ ...this.toData(), title });
  }

  withDoc(doc: RootTopic): Sheet {
    return new Sheet({ ...this.toData(), doc });
  }

  addRelationship(rel: Relationship): Sheet {
    return new Sheet({
      ...this.toData(),
      relationships: [...this.relationships, rel],
    });
  }

  removeRelationship(id: string): Sheet {
    return new Sheet({
      ...this.toData(),
      relationships: this.relationships.filter((r) => r.id !== id),
    });
  }

  updateRelationship(
    id: string,
    updater: (r: Relationship) => Relationship,
  ): Sheet {
    return new Sheet({
      ...this.toData(),
      relationships: this.relationships.map((r) =>
        r.id === id ? updater(r) : r,
      ),
    });
  }

  addBoundary(boundary: Boundary): Sheet {
    return new Sheet({
      ...this.toData(),
      boundaries: [...this.boundaries, boundary],
    });
  }

  removeBoundary(id: string): Sheet {
    return new Sheet({
      ...this.toData(),
      boundaries: this.boundaries.filter((b) => b.id !== id),
    });
  }

  updateBoundary(id: string, updater: (b: Boundary) => Boundary): Sheet {
    return new Sheet({
      ...this.toData(),
      boundaries: this.boundaries.map((b) => (b.id === id ? updater(b) : b)),
    });
  }

  addSummary(summary: Summary): Sheet {
    return new Sheet({
      ...this.toData(),
      summaries: [...this.summaries, summary],
    });
  }

  removeSummary(id: string): Sheet {
    return new Sheet({
      ...this.toData(),
      summaries: this.summaries.filter((s) => s.id !== id),
    });
  }

  updateSummary(id: string, updater: (s: Summary) => Summary): Sheet {
    return new Sheet({
      ...this.toData(),
      summaries: this.summaries.map((s) => (s.id === id ? updater(s) : s)),
    });
  }

  withTheme(theme: ThemeData | undefined): Sheet {
    return new Sheet({ ...this.toData(), theme });
  }

  withStyle(style: StyleData | undefined): Sheet {
    return new Sheet({ ...this.toData(), style });
  }

  static fromData(data: SheetData): Sheet {
    return new Sheet({
      id: data.id,
      title: data.title,
      doc: RootTopic.fromJSON(data.rootTopic),
      relationships:
        data.relationships?.map((r) => Relationship.fromJSON(r)) ?? [],
      boundaries: [], // TODO: parse boundaries from SheetData when format is defined
      summaries: [], // TODO: parse summaries from SheetData when format is defined
      theme: data.theme,
      style: data.style,
    });
  }

  toData(): {
    id: string;
    title: string;
    doc: RootTopic;
    relationships: readonly Relationship[];
    boundaries: readonly Boundary[];
    summaries: readonly Summary[];
    theme: ThemeData | undefined;
    style: StyleData | undefined;
  } {
    return {
      id: this.id,
      title: this.title,
      doc: this.doc,
      relationships: this.relationships,
      boundaries: this.boundaries,
      summaries: this.summaries,
      theme: this.theme,
      style: this.style,
    };
  }

  toJSON(): SheetData {
    return {
      id: this.id,
      title: this.title,
      rootTopic: this.doc.toJSON(),
      theme: this.theme,
      style: this.style,
      relationships: this.relationships.map((r) => r.toJSON()),
      // TODO: boundaries, summaries serialization when format is defined
    };
  }
}

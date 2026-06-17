import { MODEL_TYPE } from '../common/constants/index';

import { BoundaryModel } from './boundary';
import { HrefModel } from './href';
import { LabelModel } from './label';
import { LegendModel } from './legend';
import { MarkerModel } from './marker';
import { NoteModel } from './note';
import { NumberingModel } from './numbering';
import { TopicModel } from './topic';
import { RelationshipModel } from './relationship';
import { SummaryModel } from './summary';
import { ThemeModel } from './theme';
import { TopicImageModel } from './topicimage';
import SheetModel from './sheet';

type IConstructorType =
  | typeof BoundaryModel
  | typeof HrefModel
  | typeof LabelModel
  | typeof LegendModel
  | typeof MarkerModel
  | typeof NoteModel
  | typeof NumberingModel
  | typeof RelationshipModel
  | typeof SummaryModel
  | typeof ThemeModel
  | typeof TopicModel
  | typeof TopicImageModel;

export type IModel =
  | BoundaryModel
  | HrefModel
  | LabelModel
  | LegendModel
  | MarkerModel
  | NoteModel
  | NumberingModel
  | RelationshipModel
  | SummaryModel
  | ThemeModel
  | TopicModel
  | TopicImageModel;

export type IConstructorsKey = Lowercase<(typeof MODEL_TYPE)[keyof typeof MODEL_TYPE]>;
const defaultConstructors: Partial<Record<IConstructorsKey, IConstructorType>> = {
  [MODEL_TYPE.BOUNDARY.toLowerCase()]: BoundaryModel,
  [MODEL_TYPE.HREF.toLowerCase()]: HrefModel,
  [MODEL_TYPE.LABEL.toLowerCase()]: LabelModel,
  [MODEL_TYPE.LEGEND.toLowerCase()]: LegendModel,
  [MODEL_TYPE.MARKER.toLowerCase()]: MarkerModel,
  [MODEL_TYPE.NOTE.toLowerCase()]: NoteModel,
  [MODEL_TYPE.NUMBERING.toLowerCase()]: NumberingModel,
  [MODEL_TYPE.RELATIONSHIP.toLowerCase()]: RelationshipModel,
  [MODEL_TYPE.SUMMARY.toLowerCase()]: SummaryModel,
  [MODEL_TYPE.THEME.toLowerCase()]: ThemeModel,
  [MODEL_TYPE.TOPIC.toLowerCase()]: TopicModel,
  [MODEL_TYPE.IMAGE.toLowerCase()]: TopicImageModel,
};

/**
 * @constructor
 * */
export class SheetComponentFactoryModel {
  sheet: SheetModel;
  constructors = { ...defaultConstructors };
  constructor(sheet: SheetModel) {
    this.sheet = sheet;
  }

  create<T extends IModel>(
    modelType: (typeof MODEL_TYPE)[keyof typeof MODEL_TYPE],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attr: any = {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options: any = {}
  ): T {
    options.sheet = this.sheet;
    const ModelConstructor = this.constructors[modelType.toLowerCase() as Lowercase<typeof modelType>];
    if (!ModelConstructor) {
      throw new Error(`No such model type: ${modelType}`);
    }
    const model = new ModelConstructor(attr, options) as T;
    this.sheet.registerComponent(model);
    return model;
  }
}

export default SheetComponentFactoryModel;

// editor
export { SheetEditor } from './core/sheeteditor';
export { WorkbookEditor } from './core/workbookeditor';

export { Action, IExecuteParams } from './actions/action';

// views
export { SvgView } from './view/svgview';
export { BranchView } from './view/branchview';
export { SvgComponentView } from './view/svgcomponentview';
export { BoundaryView } from './view/boundaryview';
export { MarkersView, MarkerView } from './view/markerview';
export { InformationIconView } from './view/informationiconview';
export { LabelsView, LabelUnitView } from './view/labelsview';
export { TopicView } from './view/topicview';

// modules
export { SelectionManager } from './modules/selectionmanager';
export { Semaphore } from './modules/semaphore';
export { OverridedStyle } from './modules/overridedstyle';
export { EditReceiver } from './modules/editreceiver';
export { ModifyCheck } from './modules/modifycheck';
export { MiniMap } from './modules/minimap';

// models
export { WorkbookModel } from './models/workbook';
export { BoundaryModel, BoundaryData } from './models/boundary';
export { Extensions, ExtensionData } from './models/extensions';
export { HrefModel } from './models/href';
export { LabelModel } from './models/label';
export { LegendModel, LegendData } from './models/legend';
export { MarkerModel, MarkerData } from './models/marker';
export { NoteModel, NotesData } from './models/note';
export { NumberingModel, NumberingData } from './models/numbering';
export { RelationshipModel, RelationshipData } from './models/relationship';
export { SheetModel, SheetData } from './models/sheet';
export { SummaryModel, SummaryData } from './models/summary';
export { ThemeModel, ThemeData } from './models/theme';
export { TopicModel, TopicData, ITaskInfoData, IMathJaxData } from './models/topic';
export { TopicImageModel, ImageData } from './models/topicimage';
export { BaseComponent } from './models/basecomponent';
export { StyleData, StyleModel, StyleComponent } from './models/stylecomponent';

export { Library as SVG } from 'svg.js';
export { Config } from './common/config';
export { UndoManager } from './common/undo';

export type Position = {
  x: number;
  y: number;
};

export interface Point {
  x?: number;
  y?: number;
  amount?: number;
  angle?: number;
}

export interface Size {
  height: number;
  width: number;
}

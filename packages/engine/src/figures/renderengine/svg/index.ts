import { FIGURE_TYPE } from "../../../common/constants/index";
import { SheetRenderWorker } from "./renderworkers/sheetrenderworker";
import { BranchRenderWorker } from "./renderworkers/branchrenderworker";
import { ConnectionRenderWorker } from "./renderworkers/connectionrenderworker";
import { TopicRenderWorker } from "./renderworkers/topicrenderworker";
import { CollapseExtendRenderWorker } from "./renderworkers/collapseextendrenderworker";
import { TopicTitleRenderWorker } from "./renderworkers/topictitlerenderworker";
import { NumberingRenderWorker } from "./renderworkers/numberingrenderworker";
import { RelationshipTitleRenderWorker } from "./renderworkers/relationshiptitlerenderworker";
import { RelationshipRenderWorker } from "./renderworkers/relationshiprenderworker";
import { ImageRenderWorker } from "./renderworkers/imagerenderworker";
import { MarkersRenderWorker } from "./renderworkers/markersrenderworker";
import { MarkerRenderWorker } from "./renderworkers/markerrenderworker";
import { InformationRenderWorker } from "./renderworkers/informationrenderworker";
import { LabelsRenderWorker } from "./renderworkers/labelsrenderworker";
import { LabelRenderWorker } from "./renderworkers/labelrenderworker";
import { BoundaryRenderWorker } from "./renderworkers/boundaryrenderworker";
import { SelectBoxRenderWorker } from "./renderworkers/selectboxrenderworker";
import { ResizeBoxRenderWorker } from "./renderworkers/resizeboxrenderworker";
import { TopicSelectBoxRenderWorker } from "./renderworkers/topicselectboxrenderworker";
import { PlaceHolderTopicRenderWorker } from "./renderworkers/placeholdertopicrenderworker";
import { MatrixRenderWorker } from "./renderworkers/matrixrenderworker";
import { MatrixLabelRenderWorker } from "./renderworkers/matrixlabelrenderworker";
import { MatrixCellRenderWorker } from "./renderworkers/matrixcellrenderworker";
import { MatrixPlusRenderWorker } from "./renderworkers/matrixplusrenderworker";
import { BoundaryTitleRenderWorker } from "./renderworkers/boundarytitlerenderworker";
import { MathJaxRenderWorker } from "./renderworkers/mathjaxrenderworker";
import { TreeTableCellRenderWorker } from "./renderworkers/treetablecellrenderworker";
import { FishBoneHeadLineRenderWorker } from "./renderworkers/fishboneheadlinerenderworker";
import { FishBoneMainLineRenderWorker } from "./renderworkers/fishbonemainlinerenderworker";
import { IndicatorRenderWorker } from "./renderworkers/indicatorrenderworker";
import { TimelineMainLineRenderWorker } from "./renderworkers/timelinemainlinerenderworker";

class SVGRenderEngine {
  createRenderWorker(type, figure) {
    switch (type) {
      case FIGURE_TYPE.SHEET:
        return new SheetRenderWorker(figure);
      case FIGURE_TYPE.CONNECTION:
        return new ConnectionRenderWorker(figure);
      case FIGURE_TYPE.TOPIC:
        return new TopicRenderWorker(figure);
      case FIGURE_TYPE.COLLAPSE_EXTEND:
        return new CollapseExtendRenderWorker(figure);
      case FIGURE_TYPE.TOPIC_TITLE:
        return new TopicTitleRenderWorker(figure);
      case FIGURE_TYPE.NUMBERING:
        return new NumberingRenderWorker(figure);
      case FIGURE_TYPE.RELATIONSHIP_TITLE:
        return new RelationshipTitleRenderWorker(figure);
      case FIGURE_TYPE.RELATIONSHIP:
        return new RelationshipRenderWorker(figure);
      case FIGURE_TYPE.IMAGE:
        return new ImageRenderWorker(figure);
      case FIGURE_TYPE.MARKERS:
        return new MarkersRenderWorker(figure);
      case FIGURE_TYPE.MARKER:
        return new MarkerRenderWorker(figure);
      case FIGURE_TYPE.INFORMATION:
        return new InformationRenderWorker(figure);
      case FIGURE_TYPE.LABELS:
        return new LabelsRenderWorker(figure);
      case FIGURE_TYPE.LABEL:
        return new LabelRenderWorker(figure);
      case FIGURE_TYPE.BOUNDARY:
        return new BoundaryRenderWorker(figure);
      case FIGURE_TYPE.SELECT_BOX:
        return new SelectBoxRenderWorker(figure);
      case FIGURE_TYPE.RESIZE_BOX:
        return new ResizeBoxRenderWorker(figure);
      case FIGURE_TYPE.TOPIC_SELECT_BOX:
        return new TopicSelectBoxRenderWorker(figure);
      case FIGURE_TYPE.PLACE_HOLDER_TOPIC:
        return new PlaceHolderTopicRenderWorker(figure);
      case FIGURE_TYPE.MATRIX:
        return new MatrixRenderWorker(figure);
      case FIGURE_TYPE.MATRIX_LABEL:
        return new MatrixLabelRenderWorker(figure);
      case FIGURE_TYPE.MATRIX_CELL:
        return new MatrixCellRenderWorker(figure);
      case FIGURE_TYPE.MATRIX_PLUS:
        return new MatrixPlusRenderWorker(figure);
      case FIGURE_TYPE.BOUNDARY_TITLE:
        return new BoundaryTitleRenderWorker(figure);
      case FIGURE_TYPE.MATH_JAX:
        return new MathJaxRenderWorker(figure);
      case FIGURE_TYPE.TREE_TABLE_CELL:
        return new TreeTableCellRenderWorker(figure);
      case FIGURE_TYPE.FISH_BONE_HEAD_LINE:
        return new FishBoneHeadLineRenderWorker(figure);
      case FIGURE_TYPE.FISH_BONE_MAIN_LINE:
        return new FishBoneMainLineRenderWorker(figure);
      case FIGURE_TYPE.INDICATOR:
        return new IndicatorRenderWorker(figure);
      case FIGURE_TYPE.TIMELINE_MAIN_LINE:
        return new TimelineMainLineRenderWorker(figure);
      case FIGURE_TYPE.BRANCH:
      default:
        return new BranchRenderWorker(figure);
    }
  }
}

export const svgRenderEngine = new SVGRenderEngine();
export default svgRenderEngine;

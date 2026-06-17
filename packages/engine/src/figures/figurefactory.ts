import { FIGURE_TYPE } from "../common/constants/index";

import { ConnectionFigure } from "./connectionfigure";

import { SheetFigure } from "./sheetfigure";

import { BranchFigure } from "./branchfigure";

import { TitleFigure } from "./titlefigure";

import { TopicFigure } from "./topicfigure";

import { CollapseExtendFigure } from "./collapseextendfigure";

import { TopicTitleFigure } from "./topictitlefigure";

import RelationshipTitleFigure from "./relationshiptitlefigure";
import { NumberingFigure } from "./numberingfigure";

import { RelationshipFigure } from "./relationshipfigure";

import { ImageFigure } from "./imagefigure";

import { MarkerFigure } from "./markerfigure";

import { MarkersFigure } from "./markersfigure";

import { InformationFigure } from "./informationfigure";

import { LabelsFigure } from "./labelsfigure";

import { LabelFigure } from "./labelfigure";

import { BoundaryFigure } from "./boundaryfigure";

import { SelectBoxFigure } from "./selectboxfigure";

import { ResizeBoxFigure } from "./resizeboxfigure";

import { TopicSelectBoxFigure } from "./topicselectboxfigure";

import { PlaceHolderTopicFigure } from "./placeholdertopicfigure";

import { MatrixFigure } from "./matrixfigure";

import { MatrixCellFigure } from "./matrixcellfigure";

import { MatrixPlusFigure } from "./matrixplusfigure";

import { TreeTableCellFigure } from "./treetablecellfigure";

import { BoundaryTitleFigure } from "./boundarytitlefigure";

import { MathJaxFigure } from "./mathjaxfigure";

import { FishBoneHeadLineFigure } from "./fishboneheadlinefigure";

import { FishBoneMainLineFigure } from "./fishbonemainlinefigure";

import { IndicatorFigure } from "./indicatorfigure";

import { TimelineMainlineFigure } from "./timelinemainlinefigure";

const supportedFigures = {
  [FIGURE_TYPE.SHEET]: SheetFigure,
  [FIGURE_TYPE.CONNECTION]: ConnectionFigure,
  [FIGURE_TYPE.TOPIC]: TopicFigure,
  [FIGURE_TYPE.TOPIC_TITLE]: TopicTitleFigure,
  [FIGURE_TYPE.BRANCH]: BranchFigure,
  [FIGURE_TYPE.RELATIONSHIP]: RelationshipFigure,
  [FIGURE_TYPE.RELATIONSHIP_TITLE]: RelationshipTitleFigure,
  [FIGURE_TYPE.NUMBERING]: NumberingFigure,
  [FIGURE_TYPE.COLLAPSE_EXTEND]: CollapseExtendFigure,
  [FIGURE_TYPE.IMAGE]: ImageFigure,
  [FIGURE_TYPE.MARKERS]: MarkersFigure,
  [FIGURE_TYPE.MARKER]: MarkerFigure,
  [FIGURE_TYPE.INFORMATION]: InformationFigure,
  [FIGURE_TYPE.LABELS]: LabelsFigure,
  [FIGURE_TYPE.LABEL]: LabelFigure,
  [FIGURE_TYPE.BOUNDARY]: BoundaryFigure,
  [FIGURE_TYPE.SELECT_BOX]: SelectBoxFigure,
  [FIGURE_TYPE.RESIZE_BOX]: ResizeBoxFigure,
  [FIGURE_TYPE.TOPIC_SELECT_BOX]: TopicSelectBoxFigure,
  [FIGURE_TYPE.PLACE_HOLDER_TOPIC]: PlaceHolderTopicFigure,
  [FIGURE_TYPE.MATRIX]: MatrixFigure,
  [FIGURE_TYPE.MATRIX_LABEL]: TitleFigure,
  [FIGURE_TYPE.MATRIX_CELL]: MatrixCellFigure,
  [FIGURE_TYPE.MATRIX_PLUS]: MatrixPlusFigure,
  [FIGURE_TYPE.TREE_TABLE_CELL]: TreeTableCellFigure,
  [FIGURE_TYPE.BOUNDARY_TITLE]: BoundaryTitleFigure,
  [FIGURE_TYPE.MATH_JAX]: MathJaxFigure,
  [FIGURE_TYPE.FISH_BONE_HEAD_LINE]: FishBoneHeadLineFigure,
  [FIGURE_TYPE.FISH_BONE_MAIN_LINE]: FishBoneMainLineFigure,
  [FIGURE_TYPE.INDICATOR]: IndicatorFigure,
  [FIGURE_TYPE.TIMELINE_MAIN_LINE]: TimelineMainlineFigure,
};
export const figurefactory = {
  createFigure(viewController) {
    const type = viewController.figureType;
    const SupportedFigure = supportedFigures[type];
    if (!SupportedFigure) {
      throw new Error(`Invalid figure type: ${type}`);
    }
    return new SupportedFigure(viewController);
  },
};

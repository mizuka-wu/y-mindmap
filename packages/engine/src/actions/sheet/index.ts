import { initActions } from "../utils";

import { AddBoundaryAction } from "./add-boundary";

import { AddCalloutTopicAction } from "./add-callout-topic";

import { AddClassAction } from "./add-class";

import { AddFloatingTopicAction } from "./add-floating-topic";

import { AddImageAction } from "./add-image";

import { AddParentTopicAction } from "./add-parent-topic";

import { AddRelationshipAction } from "./add-relationship";

import { AddSubTopicAction } from "./add-sub-topic";

import { AddSummaryAction } from "./add-summary";

import { AddTopicAfterAction } from "./add-topic-after";

import { AddTopicBeforeAction } from "./add-topic-before";

import { AlignAction } from "./align";

import { CancelAddRelationshipAction } from "./cancel-add-relationship";

import { ChangeBorderColorAction } from "./change-border-color";

import { ChangeBorderGradientAction } from "./change-border-gradient";

import { ChangeBorderWidthAction } from "./change-border-width";

import { ChangeBorderPatternAction } from "./change-border-pattern";

import { ChangeBoundaryBackgroundColorAction } from "./change-boundary-background-color";

import { ChangeBoundaryLineColorAction } from "./change-boundary-line-color";

import { ChangeBoundaryLinePatternAction } from "./change-boundary-line-pattern";

import { ChangeBoundaryOpacityAction } from "./change-boundary-opacity";

import { ChangeBoundaryPreInstallStyleAction } from "./change-boundary-pre-install-style";

import { ChangeBranchLineStyleAction } from "./change-branch-line-style";

import { ChangeCJKFontFamilyAction } from "./change-cjk-font-family";

import { ChangeColorGradientAction } from "./change-color-gradient";

import { ChangeColorAction } from "./change-color";

import { ChangeCommentsInfoAction } from "./change-comments-info";

import { ChangeComponentPreInstallStyleAction } from "./change-component-pre-install-style";

import { ChangeEndArrowTypeAction } from "./change-end-arrow-type";

import { ChangeFillGradientAction } from "./change-fill-gradient";

import { ChangeFontFamilyAction } from "./change-font-family";

import { ChangeFontSizeAction } from "./change-font-size";

import { ChangeFontStyleAction } from "./change-font-style";

import { ChangeFontWeightAction } from "./change-font-weight";

import { ChangeHyperLinkAction } from "./change-hyper-link";

import { ChangeInfoItemDisplayAction } from "./change-info-item-display";

import { ChangeLabelAction } from "./change-label";

import { ChangeLegendDisplayAction } from "./change-legend-display";

import { ChangeLineColorAction } from "./change-line-color";

import { ChangeLinePatternAction } from "./change-line-pattern";

import { ChangeLineTaperedAction } from "./change-line-tapered";

import { ChangeLineWidthAction } from "./change-line-width";

import { ChangeMapOpacityAction } from "./change-map-opacity";

import { ChangeMarkerAction } from "./change-marker";

import { ChangeMultiLineColorsAction } from "./change-multi-line-colors";

import { ChangeNoteAction } from "./change-note";

import { ChangeRelationshipLineColorAction } from "./change-relationship-line-color";

import { ChangeRelationshipPreInstallStyleAction } from "./change-relationship-pre-install-style";

import { ChangeShapeClassAction } from "./change-shape-class";

import { ChangeShapeColorAction } from "./change-shape-color";

import { ChangeSheetBackgroundAction } from "./change-sheet-background";

import { ChangeStartArrowTypeAction } from "./change-start-arrow-type";

import { ChangeStickerAction } from "./change-sticker";

import { ChangeStrutureAction } from "./change-structure";

import { ChangeSummaryLineColorAction } from "./change-summary-line-color";

import { ChangeSummaryLineStyleAction } from "./change-summary-line-style";

import { ChangeSummaryLineWidthAction } from "./change-summary-line-width";

import { ChangeSummaryLinePatternAction } from "./change-summary-line-pattern";

import { changeTextAlignAction } from "./change-text-align";

import { ChangeTextColorAction } from "./change-text-color";

import { ChangeTextDecorationAction } from "./change-text-decoration";

import { changeTextTransformAction } from "./change-text-transform";

import { ChangeThemeAction } from "./change-theme";

import { ChangeTitleAction } from "./change-title";

import { ChangeTopicCustomWidthAction } from "./change-topic-custom-width";

import { ChangeTopicOverlapAction } from "./change-topic-overlap";

import { ChangeTopicPositioningAction } from "./change-topic-positioning";

import { ChangeTopicPreInstallStyleAction } from "./change-topic-pre-install-style";

import { change_fill_pattern_ChangeFillPattern } from "./change-fill-pattern";

import { CloseUndoKeepModeAction } from "./close-undo-keep-mode";

import { CollapseBranchesAction } from "./collapse-branches";

import { CopyStyleAction } from "./copy-style";

import { CopyAction } from "./copy";

import { CutAction } from "./cut";

import { DeleteItemAction } from "./delete-item";

import { DivideAction } from "./divide";

import { DuplicateTopicAction } from "./duplicate-topic";

import { ExchangeSiblingTopicAction } from "./exchange-sibling-topic";

import { ExtendBranchesAction } from "./extend-branches";

import { FitMapAction } from "./fit-map";

import { FocusCenterAction } from "./focus-center";

import { FocusInputAction } from "./focus-input";

import { HideEditBoxAction } from "./hide-edit-box";

import { HideTitleAction } from "./hide-title";

import { InsertAudioNotesOnNewTopicAction } from "./insert-audio-notes-on-new-topic";

import { InsertAudioNotesAction } from "./insert-audio-notes";

import { InsertHrefOnNewTopicAction } from "./insert-href-on-new-topic";

import { MoveViewportAction } from "./move-viewport";

import { OpenUndoKeepModeAction } from "./open-undo-keep-mode";

import { PasteStyleAction } from "./paste-style";

import { PasteAction } from "./paste";

import { PreAddFloatingTopicAction } from "./pre-add-floating-topic";

import { RedoAction } from "./redo";

import { RefreshMindMapAction } from "./refresh-mind-map";

import { RemoveAllSelectionAction } from "./remove-all-selection";

import { RemoveAudioNotesAction } from "./remove-audio-notes";

import { RemoveClassAction } from "./remove-class";

import { RemoveMarkerAction } from "./remove-marker";

import { RemoveMarkerGroupAction } from "./remove-marker-group";

import { RemoveSelectionAction } from "./remove-selection";

import { RemoveTaskInfoAction } from "./remove-task-info";

import { RepairEditReceiverPositionAction } from "./repair-edit-receiver-position";

import { ResetImageAction } from "./reset-image";

import { ResizeImageAction } from "./resize-image";

import { ResetPositionAction } from "./reset-position";

import { ResizeEditorAction } from "./resize-editor";

import { SelectAllAction } from "./select-all";

import { SelectTopicByIdAction } from "./select-topic-by-id";

import { SelectAction } from "./select";

import { SelectionNavigateAction } from "./selection-navigate";

import { SetDeviceScaleAction } from "./set-device-scale";

import { SetExtColIconDisplayAction } from "./set-ext-col-icon-display";

import { SetMiniMapDisplayAction } from "./set-mini-map-display";

import { SetStyleObjectAction } from "./set-style-object";

import { SetSummaryStyleObjectAction } from "./set-summary-style-object";

import { SetTransformAction } from "./set-transform";

import { SheetSavedAction } from "./sheet-saved";

import { ShowEditBoxAction } from "./show-edit-box";

import { ShowTitleAction } from "./show-title";

import { ShowViewInViewportAction } from "./show-view-in-view-port";

import { ToggleSelectAction } from "./toggle-select";

import { UndoAction } from "./undo";

import { UpdateClassIntoThemeAction } from "./update-class-into-theme";

import { ZoomAction } from "./zoom";

import { ShowBranchOnlyAction } from "./show-branch-only";

import { ShowFullContentAction } from "./show-full-content";

import { ChangeIOSDrawingAction } from "./change-ios-drawing";

import { RemoveIOSDrawingAction } from "./remove-ios-drawing";

import { ChangeMathJaxAction } from "./change-math-jax";

import { ResizeMathJaxAction } from "./resize-math-jax";

import { ClearSelectionAction } from "./clear-selection";

import { ClearPreSelectionAction } from "./clear-pre-selection";

import { DeleteSingleTopicAction } from "./delete-single-topic";

import { HighLightSelectAction } from "./high-light-select";

import { RemoveClassFromThemeAction } from "./remove-class-from-theme";

import { CollapseToSpecificRelativeLayerAction } from "./collpase-to-specific-relative-layer";

import { FilterBranchAction } from "./filter-branch";

import { change_flexible_floating_topic_ChangeFlexibleFloatingTopic } from "./change-flexible-floating-topic";

import { SetMultiSelectModeAction } from "./set-multi-select-mode";

import { ChangeImageOpacityAction } from "./change-image-opacity";

import { ChangeImageBorderWidthAction } from "./change-image-border-width";

import { ChangeImageBorderColorAction } from "./change-image-border-color";

import { ChangeImageShadowVisibleAction } from "./change-image-shadow-visible";

import { ChangeImageLockRatioAction } from "./change-image-lock-ratio";

import { ChangeImageAction } from "./change-image";

import { SetAlignmentByLevelAction } from "./toggle-alignment-by-level-mode";

import { ChangeCompactLayoutModeLevelAction } from "./change-compact-layout-mode-level";

import { SheetModifiedAction } from "./sheet-modified";

import { ChangeHandDrawnModeActiveAction } from "./change-hand-drawn-mode-active";

import { ChangeGlobalStyleAction } from "./change-global-style";

export { Action } from "../action";

const actions = [
  AddBoundaryAction,
  AddCalloutTopicAction,
  AddClassAction,
  AddFloatingTopicAction,
  AddImageAction,
  AddParentTopicAction,
  AddRelationshipAction,
  AddSubTopicAction,
  AddSummaryAction,
  AddTopicAfterAction,
  AddTopicBeforeAction,
  AlignAction,
  CancelAddRelationshipAction,
  ChangeBorderColorAction,
  ChangeBorderGradientAction,
  ChangeBorderWidthAction,
  ChangeBorderPatternAction,
  ChangeBoundaryBackgroundColorAction,
  ChangeBoundaryLineColorAction,
  ChangeBoundaryLinePatternAction,
  ChangeBoundaryOpacityAction,
  ChangeBoundaryPreInstallStyleAction,
  ChangeBranchLineStyleAction,
  ChangeCJKFontFamilyAction,
  ChangeColorGradientAction,
  ChangeColorAction,
  ChangeCommentsInfoAction,
  ChangeComponentPreInstallStyleAction,
  ChangeEndArrowTypeAction,
  ChangeFillGradientAction,
  change_flexible_floating_topic_ChangeFlexibleFloatingTopic,
  ChangeFontFamilyAction,
  ChangeFontSizeAction,
  ChangeFontStyleAction,
  ChangeFontWeightAction,
  ChangeHyperLinkAction,
  ChangeInfoItemDisplayAction,
  ChangeLabelAction,
  ChangeLegendDisplayAction,
  ChangeLineColorAction,
  ChangeLinePatternAction,
  ChangeLineTaperedAction,
  ChangeLineWidthAction,
  ChangeMapOpacityAction,
  ChangeMarkerAction,
  ChangeMultiLineColorsAction,
  ChangeNoteAction,
  ChangeRelationshipLineColorAction,
  ChangeRelationshipPreInstallStyleAction,
  ChangeShapeClassAction,
  ChangeShapeColorAction,
  ChangeSheetBackgroundAction,
  ChangeStartArrowTypeAction,
  ChangeStickerAction,
  ChangeStrutureAction,
  ChangeSummaryLineColorAction,
  ChangeSummaryLineStyleAction,
  ChangeSummaryLineWidthAction,
  ChangeSummaryLinePatternAction,
  changeTextAlignAction,
  ChangeTextColorAction,
  ChangeTextDecorationAction,
  changeTextTransformAction,
  ChangeThemeAction,
  ChangeTitleAction,
  ChangeTopicCustomWidthAction,
  ChangeTopicOverlapAction,
  ChangeTopicPositioningAction,
  ChangeTopicPreInstallStyleAction,
  ChangeImageOpacityAction,
  ChangeImageBorderWidthAction,
  ChangeImageBorderColorAction,
  ChangeImageShadowVisibleAction,
  ChangeImageLockRatioAction,
  ChangeImageAction,
  change_fill_pattern_ChangeFillPattern,
  CloseUndoKeepModeAction,
  CollapseBranchesAction,
  CopyStyleAction,
  CopyAction,
  CutAction,
  DeleteItemAction,
  DivideAction,
  DuplicateTopicAction,
  ExchangeSiblingTopicAction,
  ExtendBranchesAction,
  FitMapAction,
  FocusCenterAction,
  FocusInputAction,
  HideEditBoxAction,
  HideTitleAction,
  InsertAudioNotesOnNewTopicAction,
  InsertAudioNotesAction,
  InsertHrefOnNewTopicAction,
  MoveViewportAction,
  OpenUndoKeepModeAction,
  PasteStyleAction,
  PasteAction,
  PreAddFloatingTopicAction,
  RedoAction,
  RefreshMindMapAction,
  RemoveAllSelectionAction,
  RemoveAudioNotesAction,
  RemoveClassAction,
  RemoveMarkerAction,
  RemoveMarkerGroupAction,
  RemoveSelectionAction,
  RemoveTaskInfoAction,
  RepairEditReceiverPositionAction,
  ResetImageAction,
  ResizeImageAction,
  ResetPositionAction,
  ResizeEditorAction,
  SelectAllAction,
  SelectAction,
  SelectionNavigateAction,
  SelectTopicByIdAction,
  SetDeviceScaleAction,
  SetExtColIconDisplayAction,
  SetMiniMapDisplayAction,
  SetStyleObjectAction,
  SetSummaryStyleObjectAction,
  SetTransformAction,
  SheetSavedAction,
  SheetModifiedAction,
  ShowEditBoxAction,
  ShowTitleAction,
  ShowViewInViewportAction,
  SetMultiSelectModeAction,
  ToggleSelectAction,
  UndoAction,
  UpdateClassIntoThemeAction,
  ZoomAction,
  ShowBranchOnlyAction,
  ShowFullContentAction,
  ChangeIOSDrawingAction,
  RemoveIOSDrawingAction,
  ChangeMathJaxAction,
  ResizeMathJaxAction,
  ClearSelectionAction,
  ClearPreSelectionAction,
  DeleteSingleTopicAction,
  HighLightSelectAction,
  RemoveClassFromThemeAction,
  CollapseToSpecificRelativeLayerAction,
  FilterBranchAction,
  SetAlignmentByLevelAction,
  ChangeCompactLayoutModeLevelAction,
  ChangeHandDrawnModeActiveAction,
  ChangeGlobalStyleAction,
];
export const initSheetActions = (context) => {
  return initActions(context, actions);
};

export default initSheetActions;

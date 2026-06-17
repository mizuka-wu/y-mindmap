import TitleFigure from "./titlefigure"; // @flow
export class RelationshipTitleFigure extends TitleFigure {
  isVisible: any;
  isVisibleDirty: boolean;
  isDefaultTitle: any;
  isDefaultTitleDirty: boolean;
  setVisible(isVisible) {
    if (this.isVisible !== isVisible) {
      this.isVisible = isVisible;
      this.isVisibleDirty = true;
      this.invalidatePaint();
    }
  }
  setIsDefaultTitle(isDefaultTitle) {
    if (this.isDefaultTitle !== isDefaultTitle) {
      this.isDefaultTitleDirty = true;
      this.isDefaultTitle = isDefaultTitle;
      this.invalidatePaint();
    }
  }
}

export default RelationshipTitleFigure;

import styleManager from "../utils/business/stylemanager/index";
import { VIEW_TYPE, FIGURE_TYPE } from "../common/constants/index";

import TextView from "./textview";

import RelationshipTitleFigure from "../figures/relationshiptitlefigure";
export class RelationShipTitleView extends TextView {
  isVisible: boolean;
  isForcedInvisible: boolean;
  figure: any;
  text: any;
  bounds: any;
  constructor() {
    super();
    // super(...arguments);
    this.isVisible = true;
    this.isForcedInvisible = false;
  }
  get type() {
    return VIEW_TYPE.RELATIONSHIP_TITLE;
  }
  get figureType() {
    return FIGURE_TYPE.RELATIONSHIP_TITLE;
  }
  parent(parent?) {
    if (typeof parent === "undefined") {
      return super.parent();
    }
    return super.parent(parent);
  }
  afterAncestorChange() {
    const parent = this.parent();
    if (
      !(parent === null || parent === undefined ? undefined : parent.parent())
    ) {
      return;
    }
    this.setText(parent.model.get("title"));
    this.initEventsListener();
    super.afterAncestorChange.bind(this)();
  }
  protectedHandleText(text) {
    return (
      text || this.getContext().getTranslatedText("DEFAULT_RELATIONSHIP_TITLE")
    );
  }
  setVisible(visible) {
    this.isVisible = visible;
    this.figure.setVisible(visible && !this.isForcedInvisible);
  }
  /** @deprecated */
  refreshStyles() {
    const relationship = this.parent();
    this.refreshFontInfo(styleManager.getFontInfo(relationship) || {});
  }
  setText(text) {
    let _a;
    text = this.protectedHandleText(text);
    this.text = text;
    this.figure.setText(text);
    // check if is default title
    if (this.figure instanceof RelationshipTitleFigure) {
      this.figure.setIsDefaultTitle(
        !((_a = this.parent()) === null || _a === undefined
          ? undefined
          : _a.model.get("title")),
      );
    }
  }
  getTextVectorPosition() {
    return Object.assign({}, this.figure.textPosition);
  }
  getRealPosition() {
    return {
      x: this.figure.textPosition.x - this.bounds.width / 2,
      y: this.figure.textPosition.y,
    };
  }
  getClientRect() {
    return Object.assign(
      {
        width: this.bounds.width,
        height: this.bounds.height,
      },
      this.editDomain()
        .getCoordinateTransfer()
        .mindMapToViewport(this.getRealPosition()),
    );
  }
}

export default RelationShipTitleView;

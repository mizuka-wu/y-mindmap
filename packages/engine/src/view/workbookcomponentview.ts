import SvgComponentView from "./svgcomponentview";
export class WorkbookComponentView extends SvgComponentView {
  afterAncestorChange() {
    this.updateModel2View();
    super.afterAncestorChange();
  }
}

export default WorkbookComponentView;

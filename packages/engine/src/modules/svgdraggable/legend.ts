import { MODULE_NAME } from "../../common/constants/index";
/* harmony default export */
export class Legend {
  /** @public */
  init(legendView) {
    const svgDraggableModule = legendView.getModule(MODULE_NAME.SVG_DRAGGABLE);
    if (svgDraggableModule) {
      const s$svg = legendView.s$svg;
      svgDraggableModule
        .draggable(s$svg)
        .dragStart(() => {
          legendView.style(s$svg, "legend_dragging");
        })
        .dragEnd(() => {
          legendView.style(s$svg, "legend");
          legendView.model.setLegendPosition({
            x: s$svg.x(),
            y: s$svg.y(),
          });
        });
    }
  }
}

export default Legend;

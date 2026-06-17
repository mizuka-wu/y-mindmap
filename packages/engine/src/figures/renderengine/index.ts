import { RENDER_ENGINE_TYPE } from "../../common/constants/index";
import { svgRenderEngine } from "./svg/index";

function getRenderEngine(type) {
  switch (type) {
    case RENDER_ENGINE_TYPE.CANVAS:
      break;
    case RENDER_ENGINE_TYPE.SVG:
    default:
      return svgRenderEngine;
  }
}
export const renderEngine = getRenderEngine(RENDER_ENGINE_TYPE.SVG);
export default renderEngine;

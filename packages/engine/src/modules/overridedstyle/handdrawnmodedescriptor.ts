import { STYLE_LAYER } from "../../common/constants/index";
/* harmony import */
import configurations from "../../utils/patternmanager/configurations";
const getHandDrawnModeDescriptor = () => {
  return Object.keys(configurations).reduce<any[]>((result, styleKey) => {
    const styleParams = configurations[styleKey];
    Object.keys(styleParams).forEach((viewTypeKey) => {
      result.push({
        type: styleKey,
        test: (view) => {
          return view.type === viewTypeKey;
        },
        value: (view) => {
          if (typeof styleParams[view.type] === "function") {
            return (styleParams[view.type] as (view: any) => any)(view);
          } else {
            return styleParams[view.type];
          }
        },
      });
    });
    return result;
  }, []);
};
export const handDrawnModeDescriptor = {
  [STYLE_LAYER.DYNAMIC_PRIORITY]: getHandDrawnModeDescriptor(),
};

export default handDrawnModeDescriptor;

import {
  CONFIG,
  STYLE_KEYS,
  SERVICE_NAME,
  XAP_TYPE,
} from "../../common/constants/index";
import * as utils from "../../utils/index";
import { layoutConstant } from "../../utils/layoutconstant";

import styleManager from "../../utils/business/stylemanager/index";

class MathJaxLayoutWorker {
  work(viewController /*View.MathJaxView*/) {
    const figure = viewController.figure;
    if (figure.textDirty) {
      const parentBranchView = viewController.parent().parent();
      const lang = viewController.getContext().config(CONFIG.LANGUAGE);
      let exportData = utils.mathJaxExporterUtil.export(figure.text, {
        lang,
        fontFamily: styleManager.getStyleValue(
          parentBranchView,
          STYLE_KEYS.FONT_FAMILY,
        ),
      });
      let resultSVGDom = exportData.result;
      let originalSize = viewController
        .getContext()
        .callService(SERVICE_NAME.GET_SVG_DOM_SIZE, resultSVGDom);
      // if original size was [0, 0], replace result with error message
      if (originalSize.width === 0 || originalSize.height === 0) {
        exportData = {
          result: utils.mathJaxExporterUtil.generateErrorMessageSVG({
            lang,
            fontFamily: styleManager.getStyleValue(
              parentBranchView,
              STYLE_KEYS.FONT_FAMILY,
            ),
          }),
          errorCode: 1,
          errorMessage: "mathjax export result empty error",
        };
        resultSVGDom = exportData.result;
        originalSize = viewController
          .getContext()
          .callService(SERVICE_NAME.GET_SVG_DOM_SIZE, resultSVGDom);
      }
      figure.setErrorCode(exportData.errorCode);
      figure.setErrorMessage(exportData.errorMessage);
      figure.setSVGOutput(resultSVGDom);
      figure.setOriginalSize({
        width:
          originalSize.width * layoutConstant.MATH_JAX_INIT_SIZE_PLUS_MULTIPLE,
        height:
          originalSize.height * layoutConstant.MATH_JAX_INIT_SIZE_PLUS_MULTIPLE,
      });
    }
    figure.setSize({
      width: figure.finalWidth,
      height:
        (figure.originalSize.height * figure.finalWidth) /
        figure.originalSize.width,
    });
    if (viewController.getContext().isInitRenderingCompleted()) {
      this.generateFallbackImageData(viewController);
    }
    if (viewController.resizeBox) {
      viewController.resizeBox.size(figure.size.width, figure.size.height);
    }
  }
  async generateFallbackImageData(viewController, options: any = {}) {
    const figure = viewController.figure;
    const parentTopicModel = viewController.parent().model;
    const newImageData = parentTopicModel.getImageData() || {
      src: "",
      width: 0,
      height: 0,
      isMathJaxImage: false,
      // todo align
    };
    let shouldRefreshBySizeDirty = false;
    const imageSize = {
      width: figure.size.width + layoutConstant.MATH_JAX_IMAGE_PADDING * 2,
      height: figure.size.height + layoutConstant.MATH_JAX_IMAGE_PADDING * 2,
    };
    if (figure.sizeDirty) {
      if (
        newImageData.width !== imageSize.width &&
        newImageData.height !== imageSize.height
      ) {
        shouldRefreshBySizeDirty = true;
      }
      Object.assign(newImageData, imageSize);
    }
    // need to generate new image src data
    if (
      !newImageData.isMathJaxImage ||
      options.forceRefresh ||
      shouldRefreshBySizeDirty
    ) {
      const SVGOutput = viewController.createStandColorSVG(
        options.isInheritColor,
      );
      const result = await viewController.getContext().exportImage(
        Object.assign(
          {
            targetSVG: SVGOutput.node,
            skipFont: true,
            hidpi: 192,
          },
          imageSize,
        ),
      );
      // mathjax or it's parent topic might has been removed after async image exporting
      if (!viewController.parent()) {
        return;
      }
      newImageData.src = result.data;
      newImageData.isMathJaxImage = true;
      const xapGenerator = viewController
        .getContext()
        .config(CONFIG.XAP_GENERATOR);
      const xapParam = {
        xapType: XAP_TYPE.IMAGE,
        mimeType: "image/png",
        extType: "png",
        data: newImageData.src,
        isBase64: true,
      };
      xapGenerator(xapParam).then((xapString) => {
        // same reason as line 94
        if (!viewController.parent()) {
          return;
        }
        newImageData.src = xapString;
        parentTopicModel.updateMathJaxFallBackImageInfo(newImageData);
      });
    } else {
      parentTopicModel.updateMathJaxFallBackImageInfo(newImageData);
    }
  }
}
export const mathjaxLayoutWorker = new MathJaxLayoutWorker();

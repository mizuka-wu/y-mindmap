import embeddedFonts from "../common/embeddedfonts";
import { CONFIG } from "../common/constants/index";
import config from "./config";

class ResourceManager {
  hasFontFaceGenerator() {
    return !!config.get(CONFIG.FONT_FACE_GENERATOR);
  }
  async getFontFaces(fontFamily) {
    const fontFace = embeddedFonts[fontFamily];
    if (fontFace) {
      return [fontFace];
    }
    const fontFaceGenerator = config.get(CONFIG.FONT_FACE_GENERATOR);
    if (fontFaceGenerator) {
      return fontFaceGenerator(fontFamily);
    }
    return [];
  }
}

export const resourceManager = new ResourceManager();
export default resourceManager;

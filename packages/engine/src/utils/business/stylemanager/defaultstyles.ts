import {
  MODULE_NAME,
  CLASS_TYPE,
  STYLE_KEYS,
  LINE_PATTERN,
  ARROW_CLASS,
  TEXTALIGN,
  TOPICSHAPE,
} from "../../../common/constants/index";
import * as utils from "../../index";

const { snowballConstant, getSkeletonThemeDataById, getColorThemeDataById } =
  Object(utils.getInjectModule)(MODULE_NAME.SNOWBALL);
function combineThemeData(oldThemeData, newThemeData) {
  const finalThemeData = JSON.parse(JSON.stringify(oldThemeData));
  Object.values(CLASS_TYPE).forEach((classType) => {
    if (oldThemeData[classType] || newThemeData[classType]) {
      const oldStyle = oldThemeData[classType] ?? {
        properties: {},
      };
      const newStyle = newThemeData[classType] ?? {
        properties: {},
      };
      const finalStyle: any = {};
      finalStyle.properties = Object.assign(
        Object.assign({}, oldStyle.properties),
        newStyle.properties,
      );
      finalThemeData[classType] = finalStyle;
    }
  });
  return finalThemeData;
}
const stableStyles = {
  [CLASS_TYPE.CENTRAL_TOPIC]: {
    properties: {
      [STYLE_KEYS.FONT_WEIGHT]: "normal",
      [STYLE_KEYS.TEXT_COLOR]: "#FFFFFF",
      [STYLE_KEYS.FONT_FAMILY]: "$system$",
      [STYLE_KEYS.FONT_STYLE]: "normal",
      [STYLE_KEYS.FONT_SIZE]: "28pt",
      [STYLE_KEYS.TEXT_DECORATION]: "none",
      [STYLE_KEYS.SHAPE_CLASS]: "org.xmind.topicShape.roundedRect",
      [STYLE_KEYS.FILL_COLOR]: "#2A7AC2",
      [STYLE_KEYS.FILL_PATTERN]: "solid",
      [STYLE_KEYS.LINE_CLASS]: "org.xmind.branchConnection.curve",
      [STYLE_KEYS.LINE_COLOR]: "#333333",
      [STYLE_KEYS.LINE_WIDTH]: "2pt",
      [STYLE_KEYS.TEXT_TRANSFORM]: "manual",
      [STYLE_KEYS.BORDER_LINE_COLOR]: "none",
      [STYLE_KEYS.BORDER_LINE_WIDTH]: "0pt",
      [STYLE_KEYS.LINE_CORNER]: "16pt",
      [STYLE_KEYS.MARGIN_LEFT]: "29pt",
      [STYLE_KEYS.MARGIN_RIGHT]: "29pt",
      [STYLE_KEYS.MARGIN_TOP]: "15pt",
      [STYLE_KEYS.MARGIN_BOTTOM]: "15pt",
      [STYLE_KEYS.SPACING_MAJOR]: "50pt",
      [STYLE_KEYS.SPACING_MINOR]: "35pt",
      [STYLE_KEYS.BORDER_LINE_PATTERN]: LINE_PATTERN.SOLID,
      [STYLE_KEYS.LINE_PATTERN]: LINE_PATTERN.SOLID,
      [STYLE_KEYS.ARROW_END_CLASS]: ARROW_CLASS.NONE,
    },
  },
  [CLASS_TYPE.MAIN_TOPIC]: {
    properties: {
      [STYLE_KEYS.FONT_WEIGHT]: "normal",
      [STYLE_KEYS.TEXT_COLOR]: "#333333",
      [STYLE_KEYS.FONT_FAMILY]: "$system$",
      [STYLE_KEYS.FONT_STYLE]: "normal",
      [STYLE_KEYS.FONT_SIZE]: "16pt",
      [STYLE_KEYS.TEXT_DECORATION]: "none",
      [STYLE_KEYS.SHAPE_CLASS]: "org.xmind.topicShape.roundedRect",
      [STYLE_KEYS.FILL_COLOR]: "#E8E8E8",
      [STYLE_KEYS.FILL_PATTERN]: "solid",
      [STYLE_KEYS.LINE_CLASS]: "org.xmind.branchConnection.roundedElbow",
      [STYLE_KEYS.LINE_COLOR]: "#333333",
      [STYLE_KEYS.LINE_WIDTH]: "1pt",
      [STYLE_KEYS.TEXT_TRANSFORM]: "manual",
      [STYLE_KEYS.BORDER_LINE_COLOR]: "#333333",
      [STYLE_KEYS.BORDER_LINE_WIDTH]: "1pt",
      [STYLE_KEYS.SHAPE_CORNER]: "5pt",
      [STYLE_KEYS.LINE_CORNER]: "8pt",
      [STYLE_KEYS.MARGIN_LEFT]: "18pt",
      [STYLE_KEYS.MARGIN_RIGHT]: "18pt",
      [STYLE_KEYS.MARGIN_TOP]: "10pt",
      [STYLE_KEYS.MARGIN_BOTTOM]: "10pt",
      [STYLE_KEYS.SPACING_MAJOR]: "26pt",
      [STYLE_KEYS.SPACING_MINOR]: "6pt",
      [STYLE_KEYS.LINE_PATTERN]: LINE_PATTERN.SOLID,
      [STYLE_KEYS.BORDER_LINE_PATTERN]: LINE_PATTERN.SOLID,
      [STYLE_KEYS.ARROW_END_CLASS]: ARROW_CLASS.NONE,
    },
  },
  [CLASS_TYPE.SUB_TOPIC]: {
    properties: {
      [STYLE_KEYS.FONT_WEIGHT]: "normal",
      [STYLE_KEYS.TEXT_COLOR]: "#0A0E16",
      [STYLE_KEYS.FONT_FAMILY]: "$system$",
      [STYLE_KEYS.FONT_STYLE]: "normal",
      [STYLE_KEYS.FONT_SIZE]: "12pt",
      [STYLE_KEYS.TEXT_DECORATION]: "none",
      [STYLE_KEYS.SHAPE_CLASS]: "org.xmind.topicShape.underline",
      [STYLE_KEYS.FILL_COLOR]: "none",
      [STYLE_KEYS.FILL_PATTERN]: "solid",
      [STYLE_KEYS.LINE_CLASS]: "org.xmind.branchConnection.roundedElbow",
      [STYLE_KEYS.LINE_COLOR]: "#232323",
      [STYLE_KEYS.LINE_WIDTH]: "1pt",
      [STYLE_KEYS.TEXT_TRANSFORM]: "manual",
      [STYLE_KEYS.BORDER_LINE_COLOR]: "#232323",
      [STYLE_KEYS.BORDER_LINE_WIDTH]: "1pt",
      [STYLE_KEYS.SHAPE_CORNER]: "3pt",
      [STYLE_KEYS.LINE_CORNER]: "8pt",
      [STYLE_KEYS.MARGIN_LEFT]: "6pt",
      [STYLE_KEYS.MARGIN_RIGHT]: "6pt",
      [STYLE_KEYS.MARGIN_TOP]: "6pt",
      [STYLE_KEYS.MARGIN_BOTTOM]: "6pt",
      [STYLE_KEYS.SPACING_MAJOR]: "26pt",
      [STYLE_KEYS.SPACING_MINOR]: "8pt",
      [STYLE_KEYS.LINE_PATTERN]: LINE_PATTERN.SOLID,
      [STYLE_KEYS.BORDER_LINE_PATTERN]: LINE_PATTERN.SOLID,
      [STYLE_KEYS.ARROW_END_CLASS]: ARROW_CLASS.NONE,
    },
  },
  [CLASS_TYPE.CALLOUT_TOPIC]: {
    properties: {
      [STYLE_KEYS.FONT_WEIGHT]: "normal",
      [STYLE_KEYS.TEXT_COLOR]: "#FFFFFF",
      [STYLE_KEYS.FONT_FAMILY]: "$system$",
      [STYLE_KEYS.FONT_STYLE]: "italic",
      [STYLE_KEYS.FONT_SIZE]: "12pt",
      [STYLE_KEYS.TEXT_DECORATION]: "none",
      [STYLE_KEYS.CALLOUT_SHAPE_CLASS]:
        "org.xmind.calloutTopicShape.balloon.roundedRect",
      [STYLE_KEYS.BORDER_LINE_COLOR]: "none",
      [STYLE_KEYS.BORDER_LINE_WIDTH]: "1pt",
      [STYLE_KEYS.SHAPE_CORNER]: "5pt",
      [STYLE_KEYS.FILL_COLOR]: "#333333",
      [STYLE_KEYS.FILL_PATTERN]: "solid",
      [STYLE_KEYS.LINE_CLASS]: "org.xmind.branchConnection.curve",
      [STYLE_KEYS.LINE_COLOR]: "#333333",
      [STYLE_KEYS.LINE_WIDTH]: "1pt",
      [STYLE_KEYS.TEXT_TRANSFORM]: "manual",
      [STYLE_KEYS.LINE_CORNER]: "8pt",
      [STYLE_KEYS.MARGIN_LEFT]: "6pt",
      [STYLE_KEYS.MARGIN_RIGHT]: "6pt",
      [STYLE_KEYS.MARGIN_TOP]: "6pt",
      [STYLE_KEYS.MARGIN_BOTTOM]: "6pt",
      [STYLE_KEYS.SPACING_MAJOR]: "26pt",
      [STYLE_KEYS.SPACING_MINOR]: "8pt",
      [STYLE_KEYS.LINE_PATTERN]: LINE_PATTERN.SOLID,
      [STYLE_KEYS.BORDER_LINE_PATTERN]: LINE_PATTERN.SOLID,
      [STYLE_KEYS.ARROW_END_CLASS]: ARROW_CLASS.NONE,
    },
  },
  [CLASS_TYPE.FLOATING_TOPIC]: {
    properties: {
      [STYLE_KEYS.FONT_WEIGHT]: "normal",
      [STYLE_KEYS.TEXT_COLOR]: "#FFFFFF",
      [STYLE_KEYS.FONT_FAMILY]: "$system$",
      [STYLE_KEYS.FONT_STYLE]: "normal",
      [STYLE_KEYS.FONT_SIZE]: "14pt",
      [STYLE_KEYS.TEXT_DECORATION]: "none",
      [STYLE_KEYS.SHAPE_CLASS]: "org.xmind.topicShape.roundedRect",
      [STYLE_KEYS.SHAPE_CORNER]: "8pt",
      [STYLE_KEYS.FILL_COLOR]: "#333333",
      [STYLE_KEYS.FILL_PATTERN]: "solid",
      [STYLE_KEYS.LINE_CLASS]: "org.xmind.branchConnection.roundedElbow",
      [STYLE_KEYS.LINE_COLOR]: "#333333",
      [STYLE_KEYS.LINE_WIDTH]: "1pt",
      [STYLE_KEYS.LINE_CORNER]: "8pt",
      [STYLE_KEYS.TEXT_TRANSFORM]: "manual",
      [STYLE_KEYS.BORDER_LINE_COLOR]: "#333333",
      [STYLE_KEYS.BORDER_LINE_WIDTH]: "0pt",
      [STYLE_KEYS.MARGIN_LEFT]: "11pt",
      [STYLE_KEYS.MARGIN_RIGHT]: "11pt",
      [STYLE_KEYS.MARGIN_TOP]: "11pt",
      [STYLE_KEYS.MARGIN_BOTTOM]: "11pt",
      [STYLE_KEYS.SPACING_MAJOR]: "26pt",
      [STYLE_KEYS.SPACING_MINOR]: "8pt",
      [STYLE_KEYS.LINE_PATTERN]: LINE_PATTERN.SOLID,
      [STYLE_KEYS.BORDER_LINE_PATTERN]: LINE_PATTERN.SOLID,
      [STYLE_KEYS.ARROW_END_CLASS]: ARROW_CLASS.NONE,
    },
  },
  [CLASS_TYPE.SUMMARY_TOPIC]: {
    properties: {
      [STYLE_KEYS.FONT_WEIGHT]: "normal",
      [STYLE_KEYS.TEXT_COLOR]: "#FFFFFF",
      [STYLE_KEYS.FONT_FAMILY]: "$system$",
      [STYLE_KEYS.FONT_STYLE]: "italic",
      [STYLE_KEYS.FONT_SIZE]: "14pt",
      [STYLE_KEYS.TEXT_DECORATION]: "none",
      [STYLE_KEYS.SHAPE_CLASS]: "org.xmind.topicShape.roundedRect",
      [STYLE_KEYS.SHAPE_CORNER]: "5pt",
      [STYLE_KEYS.FILL_COLOR]: "#333333",
      [STYLE_KEYS.FILL_PATTERN]: "solid",
      [STYLE_KEYS.MARGIN_LEFT]: "12pt",
      [STYLE_KEYS.MARGIN_RIGHT]: "12pt",
      [STYLE_KEYS.MARGIN_TOP]: "6pt",
      [STYLE_KEYS.MARGIN_BOTTOM]: "6pt",
      [STYLE_KEYS.LINE_CLASS]: "org.xmind.branchConnection.roundedElbow",
      [STYLE_KEYS.LINE_COLOR]: "#232323",
      [STYLE_KEYS.LINE_CORNER]: "8pt",
      [STYLE_KEYS.LINE_WIDTH]: "1pt",
      [STYLE_KEYS.TEXT_TRANSFORM]: "manual",
      [STYLE_KEYS.SPACING_MAJOR]: "26pt",
      [STYLE_KEYS.SPACING_MINOR]: "8pt",
      [STYLE_KEYS.BORDER_LINE_COLOR]: "none",
      [STYLE_KEYS.BORDER_LINE_WIDTH]: "1pt",
      [STYLE_KEYS.LINE_PATTERN]: LINE_PATTERN.SOLID,
      [STYLE_KEYS.BORDER_LINE_PATTERN]: LINE_PATTERN.SOLID,
      [STYLE_KEYS.ARROW_END_CLASS]: ARROW_CLASS.NONE,
    },
  },
  [CLASS_TYPE.IMPORTANT_TOPIC]: {
    properties: {},
  },
  [CLASS_TYPE.MINOR_TOPIC]: {
    properties: {},
  },
  [CLASS_TYPE.EXPIRED_TOPIC]: {
    properties: {},
  },
  [CLASS_TYPE.BOUNDARY]: {
    properties: {
      [STYLE_KEYS.SHAPE_CLASS]: "org.xmind.boundaryShape.roundedRect",
      [STYLE_KEYS.SHAPE_CORNER]: "20pt",
      [STYLE_KEYS.FILL_COLOR]: "#D5E9FC",
      [STYLE_KEYS.LINE_COLOR]: "#2A7AC2",
      [STYLE_KEYS.LINE_WIDTH]: "2pt",
      [STYLE_KEYS.LINE_PATTERN]: "dash",
      [STYLE_KEYS.OPACITY]: "0.2",
      [STYLE_KEYS.FONT_FAMILY]: "$system$",
      [STYLE_KEYS.FONT_WEIGHT]: "normal",
      [STYLE_KEYS.TEXT_COLOR]: "#333333",
      [STYLE_KEYS.FONT_STYLE]: "italic",
      [STYLE_KEYS.FONT_SIZE]: "12pt",
      [STYLE_KEYS.MARGIN_LEFT]: "10pt",
      [STYLE_KEYS.MARGIN_RIGHT]: "10pt",
      [STYLE_KEYS.MARGIN_TOP]: "6pt",
      [STYLE_KEYS.MARGIN_BOTTOM]: "6pt",
      [STYLE_KEYS.TEXT_DECORATION]: "none",
      [STYLE_KEYS.TEXT_ALIGN]: "left",
      [STYLE_KEYS.TEXT_TRANSFORM]: "manual",
    },
  },
  [CLASS_TYPE.RELATIONSHIP]: {
    properties: {
      [STYLE_KEYS.SHAPE_CLASS]: "org.xmind.relationshipShape.curved",
      [STYLE_KEYS.LINE_COLOR]: "#2A7AC2",
      [STYLE_KEYS.LINE_WIDTH]: "2pt",
      [STYLE_KEYS.LINE_PATTERN]: "dash",
      [STYLE_KEYS.ARROW_BEGIN_CLASS]: "org.xmind.arrowShape.none",
      [STYLE_KEYS.ARROW_END_CLASS]: "org.xmind.arrowShape.triangle",
      [STYLE_KEYS.FONT_FAMILY]: "$system$",
      [STYLE_KEYS.FONT_WEIGHT]: "normal",
      [STYLE_KEYS.TEXT_COLOR]: "#333333",
      [STYLE_KEYS.FONT_STYLE]: "italic",
      [STYLE_KEYS.FONT_SIZE]: "12pt",
      [STYLE_KEYS.TEXT_DECORATION]: "none",
      [STYLE_KEYS.TEXT_ALIGN]: "center",
      [STYLE_KEYS.TEXT_TRANSFORM]: "manual",
    },
  },
  [CLASS_TYPE.SUMMARY]: {
    properties: {
      [STYLE_KEYS.SHAPE_CLASS]: "org.xmind.summaryShape.square",
      [STYLE_KEYS.LINE_COLOR]: "#007ac8",
      [STYLE_KEYS.LINE_WIDTH]: "2pt",
      [STYLE_KEYS.LINE_PATTERN]: "solid",
      [STYLE_KEYS.LINE_CORNER]: "8pt",
    },
  },
  [CLASS_TYPE.MAP]: {
    properties: {
      [STYLE_KEYS.FILL_COLOR]: "#ffffff",
      [STYLE_KEYS.GRADIENT_COLOR]: "none",
    },
  },
};
let defaultStyles = Object.assign({}, stableStyles);
defaultStyles = combineThemeData(
  defaultStyles,
  getSkeletonThemeDataById(snowballConstant.DEFAULT_SKELETON_THEME_ID).theme,
);
defaultStyles = combineThemeData(
  defaultStyles,
  getColorThemeDataById(snowballConstant.DEAFULT_COLOR_THEME_FOR_SNOWBRUSH)
    .theme,
);
// fix default style with pre setting
Object.assign(defaultStyles[CLASS_TYPE.CENTRAL_TOPIC].properties, {
  [STYLE_KEYS.TEXT_ALIGN]: TEXTALIGN.CENTER,
});
Object.assign(defaultStyles[CLASS_TYPE.SUB_TOPIC].properties, {
  [STYLE_KEYS.FILL_COLOR]: "none",
  [STYLE_KEYS.TEXT_COLOR]: "#0A0E16",
  [STYLE_KEYS.SHAPE_CLASS]: TOPICSHAPE.UNDERLINE,
});
// treat dynamic style keys
const dynamicKeys = [STYLE_KEYS.BORDER_LINE_WIDTH];
dynamicKeys.forEach((dynamicKey) => {
  delete defaultStyles[CLASS_TYPE.SUB_TOPIC].properties[dynamicKey];
});

export default {
  getStyleValue(className, key) {
    if (!defaultStyles[className]) {
      return;
    }
    if (defaultStyles[className].properties[key]) {
      return defaultStyles[className].properties[key];
    }
    if (key === STYLE_KEYS.TEXT_ALIGN) {
      return TEXTALIGN.LEFT;
    }
  },
  hasClass(className) {
    return !!defaultStyles[className];
  },
};

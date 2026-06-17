export enum CLASS_TYPE {
  CENTRAL_TOPIC = "centralTopic",
  MAIN_TOPIC = "mainTopic",
  SUB_TOPIC = "subTopic",
  SUMMARY_TOPIC = "summaryTopic",
  CALLOUT_TOPIC = "calloutTopic",
  FLOATING_TOPIC = "floatingTopic",
  BOUNDARY = "boundary",
  SUMMARY = "summary",
  RELATIONSHIP = "relationship",
  MAP = "map",
  IMPORTANT_TOPIC = "importantTopic",
  MINOR_TOPIC = "minorTopic",
  EXPIRED_TOPIC = "expiredTopic",
  GLOBAL = "global",
}
export const TOPIC_CLASS_TYPES = [
  CLASS_TYPE.CENTRAL_TOPIC,
  CLASS_TYPE.MAIN_TOPIC,
  CLASS_TYPE.SUB_TOPIC,
  CLASS_TYPE.CALLOUT_TOPIC,
  CLASS_TYPE.SUMMARY_TOPIC,
  CLASS_TYPE.FLOATING_TOPIC,
  CLASS_TYPE.IMPORTANT_TOPIC,
  CLASS_TYPE.MINOR_TOPIC,
  CLASS_TYPE.EXPIRED_TOPIC,
];
/**
 * @deprecated
 */
export const STYLED_TOPIC_TYPE = {
  CENTRAL: "centralTopic",
  SUMMARY: "summaryTopic",
  FLOATING: "floatingTopic",
  CALLOUT: "calloutTopic",
  MAIN: "mainTopic",
  SUB: "subTopic",
};
export enum STYLE_KEYS {
  FONT_FAMILY = "fo:font-family",
  FONT_STYLE = "fo:font-style",
  FONT_WEIGHT = "fo:font-weight",
  FONT_SIZE = "fo:font-size",
  TEXT_COLOR = "fo:color",
  TEXT_ALIGN = "fo:text-align",
  TEXT_BULLET = "fo:text-bullet",
  TEXT_TRANSFORM = "fo:text-transform",
  TEXT_DECORATION = "fo:text-decoration",
  TEXT_BACKGROUND_COLOR = "fo:background-color",
  MARGIN_LEFT = "fo:margin-left",
  MARGIN_RIGHT = "fo:margin-right",
  MARGIN_TOP = "fo:margin-top",
  MARGIN_BOTTOM = "fo:margin-bottom",
  SPACING_MAJOR = "spacing-major",
  SPACING_MINOR = "spacing-minor",
  SHAPE_CLASS = "shape-class",
  SHAPE_CORNER = "shape-corner",
  LINE_CORNER = "line-corner",
  LINE_COLOR = "line-color",
  LINE_CLASS = "line-class",
  LINE_WIDTH = "line-width",
  LINE_PATTERN = "line-pattern",
  LINE_TAPERED = "line-tapered",
  BORDER_LINE_COLOR = "border-line-color",
  BORDER_LINE_WIDTH = "border-line-width",
  BORDER_LINE_PATTERN = "border-line-pattern",
  CALLOUT_FILL_COLOR = "callout-fill-color",
  CALLOUT_LINE_CLASS = "callout-line-class",
  CALLOUT_LINE_CORNER = "callout-line-corner",
  CALLOUT_LINE_PATTERN = "callout-line-pattern",
  CALLOUT_LINE_WIDTH = "callout-line-width",
  CALLOUT_SHAPE_CLASS = "callout-shape-class",
  CALLOUT_LINE_COLOR = "callout-line-color",
  OPACITY = "svg:opacity",
  FILL_COLOR = "svg:fill",
  BACKGROUND = "background",
  ARROW_END_CLASS = "arrow-end-class",
  ARROW_BEGIN_CLASS = "arrow-begin-class",
  ALLOW_OVERLAP = "allow-overlap",
  ALLOW_FREE_POSITION = "allow-free-position",
  GRADIENT_COLOR = "color-gradient",
  MULTI_LINE_COLORS = "multi-line-colors",
  CJK_FONT_FAMILY = "cjk-font-family",
  STRUCTURE_CLASS = "structure-class",
  COLOR_LIST = "color-list",
  FILL_GRADIENT = "fill-gradient",
  BORDER_GRADIENT = "border-gradient",
  ALIGNMENT_BY_LEVEL = "alignment-by-level",
  FILL_PATTERN = "fill-pattern",
}

export const TEXT_SKELETON_STYLE_KEYS = [
  STYLE_KEYS.FONT_FAMILY,
  STYLE_KEYS.FONT_STYLE,
  STYLE_KEYS.FONT_WEIGHT,
  STYLE_KEYS.FONT_SIZE,
  STYLE_KEYS.TEXT_TRANSFORM,
  STYLE_KEYS.TEXT_DECORATION,
  STYLE_KEYS.TEXT_ALIGN,
];
export const TEXT_COLOR_STYLE_KEYS = [STYLE_KEYS.TEXT_COLOR];

export const FONT_STYLE_KEYS = [
  ...TEXT_SKELETON_STYLE_KEYS,
  ...TEXT_COLOR_STYLE_KEYS,
];

export const TOPIC_SKELETON_STYLE_KEYS = [
  STYLE_KEYS.SHAPE_CLASS,
  STYLE_KEYS.LINE_CLASS,
  STYLE_KEYS.LINE_WIDTH,
  STYLE_KEYS.LINE_PATTERN,
  STYLE_KEYS.FILL_COLOR,
  STYLE_KEYS.FILL_PATTERN,
  STYLE_KEYS.BORDER_LINE_WIDTH,
  STYLE_KEYS.BORDER_LINE_PATTERN,
  STYLE_KEYS.ARROW_END_CLASS,
  STYLE_KEYS.ALIGNMENT_BY_LEVEL,
  ...TEXT_SKELETON_STYLE_KEYS,
];
export const TOPIC_COLOR_STYLE_KEYS = [
  STYLE_KEYS.FILL_COLOR,
  STYLE_KEYS.BORDER_LINE_COLOR,
  STYLE_KEYS.LINE_COLOR,
  ...TEXT_COLOR_STYLE_KEYS,
];
export const TOPIC_STYLE_KEYS = Array.from(
  new Set([
    ...TOPIC_SKELETON_STYLE_KEYS,
    ...TOPIC_COLOR_STYLE_KEYS,
    STYLE_KEYS.MARGIN_LEFT,
    STYLE_KEYS.MARGIN_RIGHT,
    STYLE_KEYS.MARGIN_TOP,
    STYLE_KEYS.MARGIN_BOTTOM,
    STYLE_KEYS.SPACING_MAJOR,
    STYLE_KEYS.SPACING_MINOR,
  ]),
);

export const CALLOUT_TOPIC_SKELETON_STYLE_KEYS = [
  STYLE_KEYS.CALLOUT_SHAPE_CLASS,
  STYLE_KEYS.LINE_PATTERN,
  STYLE_KEYS.FILL_PATTERN,
  ...TEXT_SKELETON_STYLE_KEYS,
];
export const CALLOUT_TOPIC_COLOR_STYLE_KEYS = [
  STYLE_KEYS.FILL_COLOR,
  ...TEXT_COLOR_STYLE_KEYS,
];
export const CALLOUT_TOPIC_STYLE_KEYS = [
  ...CALLOUT_TOPIC_SKELETON_STYLE_KEYS,
  ...CALLOUT_TOPIC_COLOR_STYLE_KEYS,
];
export const BOUNDARY_SKELETON_STYLE_KEYS = [
  STYLE_KEYS.SHAPE_CLASS,
  STYLE_KEYS.SHAPE_CORNER,
  STYLE_KEYS.LINE_WIDTH,
  STYLE_KEYS.LINE_PATTERN,
  STYLE_KEYS.FILL_PATTERN,
  ...TEXT_SKELETON_STYLE_KEYS,
];
export const BOUNDARY_COLOR_STYLE_KEYS = [
  STYLE_KEYS.FILL_COLOR,
  STYLE_KEYS.LINE_COLOR,
  STYLE_KEYS.OPACITY,
  ...TEXT_COLOR_STYLE_KEYS,
];
export const BOUNDARY_STYLE_KEYS = Array.from(
  new Set([
    ...BOUNDARY_SKELETON_STYLE_KEYS,
    ...BOUNDARY_COLOR_STYLE_KEYS,
    STYLE_KEYS.MARGIN_LEFT,
    STYLE_KEYS.MARGIN_RIGHT,
    STYLE_KEYS.MARGIN_TOP,
    STYLE_KEYS.MARGIN_BOTTOM,
  ]),
);
export const SUMMARY_SKELETON_STYLE_KEYS = [
  STYLE_KEYS.SHAPE_CLASS,
  STYLE_KEYS.LINE_WIDTH,
  STYLE_KEYS.LINE_PATTERN,
  STYLE_KEYS.LINE_CORNER,
];
export const SUMMARY_COLOR_STYLE_KEYS = [STYLE_KEYS.LINE_COLOR];
export const SUMMARY_STYLE_KEYS = [
  ...SUMMARY_SKELETON_STYLE_KEYS,
  ...SUMMARY_COLOR_STYLE_KEYS,
];
export const RELATIONSHIP_SKELETON_STYLE_KEYS = [
  STYLE_KEYS.SHAPE_CLASS,
  STYLE_KEYS.LINE_CORNER,
  STYLE_KEYS.LINE_WIDTH,
  STYLE_KEYS.LINE_PATTERN,
  STYLE_KEYS.ARROW_BEGIN_CLASS,
  STYLE_KEYS.ARROW_END_CLASS,
  ...TEXT_SKELETON_STYLE_KEYS,
];
export const RELATIONSHIP_COLOR_STYLE_KEYS = [
  STYLE_KEYS.LINE_COLOR,
  ...TEXT_COLOR_STYLE_KEYS,
];
export const RELATIONSHIP_STYLE_KEYS = [
  ...RELATIONSHIP_SKELETON_STYLE_KEYS,
  ...RELATIONSHIP_COLOR_STYLE_KEYS,
];
export const MAP_SKELETON_STYLE_KEYS = [STYLE_KEYS.LINE_TAPERED];
export const MAP_COLOR_STYLE_KEYS = [
  STYLE_KEYS.MULTI_LINE_COLORS,
  STYLE_KEYS.FILL_COLOR,
];
export const MAP_STYLE_KEYS = [
  ...MAP_SKELETON_STYLE_KEYS,
  ...MAP_COLOR_STYLE_KEYS,
  STYLE_KEYS.ALLOW_OVERLAP,
  STYLE_KEYS.ALLOW_FREE_POSITION,
  STYLE_KEYS.CJK_FONT_FAMILY,
  STYLE_KEYS.GRADIENT_COLOR,
];
export const DYNAMIC_STYLE_KEYS = [
  STYLE_KEYS.BORDER_LINE_WIDTH,
  STYLE_KEYS.BORDER_LINE_COLOR,
  STYLE_KEYS.LINE_WIDTH,
  STYLE_KEYS.LINE_COLOR,
  STYLE_KEYS.FILL_COLOR,
  STYLE_KEYS.TEXT_COLOR,
  STYLE_KEYS.BORDER_LINE_PATTERN,
  STYLE_KEYS.LINE_PATTERN,
  STYLE_KEYS.ARROW_END_CLASS,
  STYLE_KEYS.ALIGNMENT_BY_LEVEL,
];
export const ALL_CSS_COLOR_STYLE_KEYS = [
  STYLE_KEYS.FILL_COLOR,
  STYLE_KEYS.TEXT_COLOR,
  STYLE_KEYS.TEXT_BACKGROUND_COLOR,
  STYLE_KEYS.LINE_COLOR,
  STYLE_KEYS.BORDER_LINE_COLOR,
  STYLE_KEYS.CALLOUT_FILL_COLOR,
  STYLE_KEYS.CALLOUT_LINE_COLOR,
  STYLE_KEYS.GRADIENT_COLOR,
];
export const PRESET_QUICK_STYLE_CLASS_TYPES = [
  CLASS_TYPE.IMPORTANT_TOPIC,
  CLASS_TYPE.MINOR_TOPIC,
  CLASS_TYPE.EXPIRED_TOPIC,
];
export const PRESET_GLOBAL_STYLE_CLASS = CLASS_TYPE.GLOBAL;
export const STYLE_VALUES = {
  SYSTEM_FONT: "$system$",
};

export const STYLE_PARENT_GROUP = {
  BEFORE_CLASS_GROUP: "beforeClassGroup",
  BEFORE_THEME_GROUP: "beforeThemeGroup",
  BEFORE_DEFAULT_GROUP: "beforeDefaultGroup",
};
export enum STYLE_LAYER {
  BEFORE_USER = "beforeUser",
  BEFORE_CLASS = "beforeClass",
  BEFORE_THEME = "beforeTheme",
  BEFORE_DEFAULT = "beforeDefault",
  BEFORE_PARENT = "beforeParent",
  DYNAMIC_PRIORITY = "dynamicPriority",
}
export const COMMON_FONT_FAMILY =
  'Helvetica, "Nunito Sans", "Microsoft JhengHei", "Microsoft Yahei", sans-serif';
export const TOPICSHAPE = {
  ROUNDEDRECT: "org.xmind.topicShape.roundedRect",
  RECT: "org.xmind.topicShape.rect",
  ELLIPSE: "org.xmind.topicShape.ellipse",
  DIAMOND: "org.xmind.topicShape.diamond",
  UNDERLINE: "org.xmind.topicShape.underline",
  NOBORDER: "org.xmind.topicShape.noBorder",
  CIRCLE: "org.xmind.topicShape.circle",
  PARALLELOGRAM: "org.xmind.topicShape.parallelogram",
  CLOUD: "org.xmind.topicShape.cloud",
  ELLIPSERECT: "org.xmind.topicShape.ellipserect",
  WATERDROP: "org.xmind.topicShape.waterdrop",
  STAR: "org.xmind.topicShape.star",
  CUTDIAMOND: "org.xmind.topicShape.cutdiamond",
  SHIELD: "org.xmind.topicShape.shield",
  FATLEFTARROW: "org.xmind.topicShape.fatLeftArrow",
  FATRIGHTARROW: "org.xmind.topicShape.fatRightArrow",
  LABEL: "org.xmind.topicShape.label",
  BOOKMARK: "org.xmind.topicShape.bookmark",
  SIMPLECLOUD: "org.xmind.topicShape.simpleCloud",
  HEART: "org.xmind.topicShape.heart",
  SQUAREBRACKET: "org.xmind.topicShape.squareBracket",
  ROUNDBRACKET: "org.xmind.topicShape.roundBracket",
  CURLYBRACKET: "org.xmind.topicShape.curlyBracket",
  SQUAREQUOTE: "org.xmind.topicShape.squareQuote",
  SINGLEBOOKQUOTE: "org.xmind.topicShape.singleBookQuote",
  DOUBLEBOOKQUOTE: "org.xmind.topicShape.doubleBookQuote",
  DOUBLEQUOTE: "org.xmind.topicShape.doubleQuote",
  // deprecated
  _ELLIPSE: "org.xmind.topicShape.callout.ellipse",
  _ROUNDEDRECT: "org.xmind.topicShape.callout.roundedRect",
  _RECT: "org.xmind.topicShape.callout.rect",
  // new shape
  HEXAGON: "org.xmind.topicShape.hexagon",
  // "PEAKRECT": "org.xmind.topicShape.peakrect",
  // "CONVEXRECT":"org.xmind.topicShape.convexrect",
  ROUNDEDHEXAGON: "org.xmind.topicShape.roundedhexagon",
  ELLIPTICRECTANGLE: "org.xmind.topicShape.ellipticrectangle",
  SINGLEBREAKANGLE: "org.xmind.topicShape.singlebreakangle",
  SINGLEBREAKANGLEWITHLINE: "org.xmind.topicShape.singlebreakanglewithline",
  DOUBLEROUNDEDANGLE: "org.xmind.topicShape.doubleroundedangle",
  DOUBLEUNDERLINE: "org.xmind.topicShape.doubleunderline",
  LEAF: "org.xmind.topicShape.leaf",
  NEWCLOUD: "org.xmind.topicShape.newcloud",
  STACK: "org.xmind.topicShape.stack",
  // private defined
  MATRIXMAIN: "org.xmind.topicShape.matrixMain",
  TREETABLEMAIN: "org.xmind.topicShape.treetable.main",
  // hand drawn
  HANDDRAWNRECT: "org.xmind.topicShape.handDrawnRect",
  HANDDRAWNROUNDEDRECT: "org.xmind.topicShape.handDrawnRoundedRect",
  HANDDRAWNUNDERLINE: "org.xmind.topicShape.handDrawnUnderline",
  HANDDRAWNELLIPSE: "org.xmind.topicShape.handDrawnEllipse",
};
export const HANDDRAWN_TOPICSHAPE = [
  TOPICSHAPE.HANDDRAWNRECT,
  TOPICSHAPE.HANDDRAWNROUNDEDRECT,
  TOPICSHAPE.HANDDRAWNELLIPSE,
  TOPICSHAPE.HANDDRAWNUNDERLINE,
];
export const PRIVATE_TOPICSHAPE = [
  TOPICSHAPE.MATRIXMAIN,
  TOPICSHAPE.TREETABLEMAIN,
];
export const PRIVATE_TOPICSHAPE_FALLBACK = {
  [TOPICSHAPE.MATRIXMAIN]: TOPICSHAPE.RECT,
  [TOPICSHAPE.TREETABLEMAIN]: TOPICSHAPE.RECT,
};
export const CALLOUTSHAPE = {
  ELLIPSE: "org.xmind.calloutTopicShape.balloon.ellipse",
  ROUNDEDRECT: "org.xmind.calloutTopicShape.balloon.roundedRect",
  RECT: "org.xmind.calloutTopicShape.balloon.rectangle",
};
export const BOUNDARYSHAPE = {
  RECT: "org.xmind.boundaryShape.rect",
  ROUNDEDRECT: "org.xmind.boundaryShape.roundedRect",
  SCALLOPS: "org.xmind.boundaryShape.scallops",
  WAVES: "org.xmind.boundaryShape.waves",
  TENSION: "org.xmind.boundaryShape.tension",
  POLYGON: "org.xmind.boundaryShape.polygon",
  ROUNDEDPOLYGON: "org.xmind.boundaryShape.roundedPolygon",
  // new boundary shapes
  NEWBOUNDARY1: "org.xmind.boundaryShape.newboundary1",
  NEWBOUNDARY2: "org.xmind.boundaryShape.newboundary2",
  NEWBOUNDARY3: "org.xmind.boundaryShape.newboundary3",
  FOCUS: "org.xmind.boundaryShape.focus",
  CROSS: "org.xmind.boundaryShape.cross",
};
export enum ARROW_CLASS {
  NONE = "org.xmind.arrowShape.none",
  NORMAL = "org.xmind.arrowShape.normal",
  SPEARHEAD = "org.xmind.arrowShape.spearhead",
  DOT = "org.xmind.arrowShape.dot",
  TRIANGLE = "org.xmind.arrowShape.triangle",
  SQUARE = "org.xmind.arrowShape.square",
  DIAMOND = "org.xmind.arrowShape.diamond",
  HERRINGBONE = "org.xmind.arrowShape.herringbone",
  RING = "org.xmind.arrowShape.ring",
  EYE = "org.xmind.arrowShape.eye",
  // "HALFTRIANGLE" = 'org.xmind.arrowShape.halftriangle',
  DOUBLEARROW = "org.xmind.arrowShape.doublearrow",
  SQUARERING = "org.xmind.arrowShape.squarering",
  // "KNOT" = 'org.xmind.arrowShape.knot',
  // "TRIANGLERING" = 'org.xmind.arrowShape.trianglering',
  ANTITRIANGLE = "org.xmind.arrowShape.antiTriangle",
  ATTACHED = "org.xmind.arrowShape.attached",
  HOOK = "org.xmind.arrowShape.hook",
}
/** @deprecated */
export const ARROWSHAPE = ARROW_CLASS;
export const RELATIONSHIPSHAPE = {
  CURVED: "org.xmind.relationshipShape.curved",
  ANGLED: "org.xmind.relationshipShape.angled",
  STRAIGHT: "org.xmind.relationshipShape.straight",
  ZIGZAG: "org.xmind.relationshipShape.zigzag",
  QUAD: "org.xmind.relationshipShape.quad",
};
export const SUMMARYCONNECTION = {
  CURLY: "org.xmind.summaryShape.curly",
  ANGLE: "org.xmind.summaryShape.angle",
  SQUARE: "org.xmind.summaryShape.square",
  ROUND: "org.xmind.summaryShape.round",
  BRACKET: "org.xmind.summaryShape.bracket",
  SHARP: "org.xmind.summaryShape.sharp",
  FOLD: "org.xmind.summaryShape.fold",
  STRAIGHT: "org.xmind.summaryShape.straight",
};
export enum BRACE_BRANCH_CONNECTION {
  BRACE = "org.xmind.branchConnection.brace",
  BRACE2 = "org.xmind.branchConnection.brace2",
  BRACE3 = "org.xmind.branchConnection.brace3",
  BRACE4 = "org.xmind.branchConnection.brace4",
  BRACE5 = "org.xmind.branchConnection.brace5",
}
export const BRANCHCONNECTION = {
  ...{
    ROUNDEDELBOW: "org.xmind.branchConnection.roundedElbow",
    STRAIGHT: "org.xmind.branchConnection.straight",
    CURVE: "org.xmind.branchConnection.curve",
    /** @deprecated */
    ARROWEDCURVE: "org.xmind.branchConnection.arrowedCurve",
    FOLD: "org.xmind.branchConnection.fold",
    FOLD2: "org.xmind.branchConnection.fold2",
    ROUNDEDFOLD: "org.xmind.branchConnection.roundedfold",
    BIGHT: "org.xmind.branchConnection.bight",
    // "SKEWELBOW": "org.xmind.branchConnection.skewElbow",
    // "SKEWELBOW2": "org.xmind.branchConnection.skewElbow2",
    // "HORN": "org.xmind.branchConnection.horn",
    // "SINUS": "org.xmind.branchConnection.sinus",
    ELBOW: "org.xmind.branchConnection.elbow",
    HORIZONTAL: "org.xmind.branchConnection.timeline.horizontal",
    NONE: "org.xmind.branchConnection.none",
  },
  ...BRACE_BRANCH_CONNECTION,
  ...{
    CALLOUTLINE: "calloutLine",
  },
};

export const SPECIAL_BRANCH_CONNECTION_LIST = [
  BRACE_BRANCH_CONNECTION.BRACE,
  BRACE_BRANCH_CONNECTION.BRACE2,
  BRACE_BRANCH_CONNECTION.BRACE3,
  BRACE_BRANCH_CONNECTION.BRACE4,
  BRACE_BRANCH_CONNECTION.BRACE5,
];
export enum NORMAL_LINE_PATTERN {
  DASH = "dash",
  DASHDOT = "dash-dot",
  DASHDOTDOT = "dash-dot-dot",
  DOT = "dot",
  ROUNDDOT = "round-dot",
  SOLID = "solid",
}
export enum HAND_DRAWN_LINE_PATTERN {
  HANDDRAWNDASH = "handdrawn-dash",
  HANDDRAWNSOLID = "handdrawn-solid",
}

export enum DASH_LINE_PATTERN {
  DASH = "dash",
  DASHDOT = "dash-dot",
  DASHDOTDOT = "dash-dot-dot",
  DOT = "dot",
  ROUNDDOT = "round-dot",
  HANDDRAWNDASH = "handdrawn-dash",
}
export enum LINE_PATTERN {
  DASH = "dash",
  DASHDOT = "dash-dot",
  DASHDOTDOT = "dash-dot-dot",
  DOT = "dot",
  SOLID = "solid",
  ROUNDDOT = "round-dot",
  HANDDRAWNDASH = "handdrawn-dash",
  HANDDRAWNSOLID = "handdrawn-solid",
}
/** @deprecated */
export const ARROWLINEPATTERN = LINE_PATTERN;
export const TEXTTRANSFORM = {
  MANUAL: "manual",
  CAPITALIZE: "capitalize",
  UPPERCASE: "uppercase",
  LOWERCASE: "lowercase",
};
export const TEXTALIGN = {
  LEFT: "left",
  CENTER: "center",
  RIGHT: "right",
};
export const LINETAPERED = {
  TAPERED: "tapered",
  NONE: "none",
};
export enum ALIGNMENT_BY_LEVEL_STATUS {
  ACTIVED = "actived",
  INACTIVED = "inactived",
}
export const FILTER_MODE_OPACITY = 0.05;
export const HAND_DRAWN_FILL_PATTERN = {
  SOLID_HAND_DRAWN: "solid-hand-drawn",
  HACHURE: "hachure",
  HACHURE_LEFT_HAND: "hachure-left-hand",
  HACHURE_THIN: "hachure-thin",
  ZIGZAG: "zigzag",
  ZIGZAG_LEFT_HAND: "zigzag-left-hand",
  CROSSING: "crossing",
  CROSSING_THIN: "crossing-thin",
};
export const FILL_PATTERN = {
  ...HAND_DRAWN_FILL_PATTERN,
  NONE: "none",
  SOLID: "solid",
};
export const COMPACT_LAYOUT_PARAMS = {
  [CLASS_TYPE.CENTRAL_TOPIC]: {
    [STYLE_KEYS.MARGIN_LEFT]: 22,
    [STYLE_KEYS.MARGIN_RIGHT]: 22,
    [STYLE_KEYS.MARGIN_TOP]: 12,
    [STYLE_KEYS.MARGIN_BOTTOM]: 12,
    [STYLE_KEYS.SPACING_MAJOR]: 28,
    [STYLE_KEYS.SPACING_MINOR]: 10,
  },
  [CLASS_TYPE.MAIN_TOPIC]: {
    [STYLE_KEYS.MARGIN_LEFT]: 12,
    [STYLE_KEYS.MARGIN_RIGHT]: 12,
    [STYLE_KEYS.MARGIN_TOP]: 6,
    [STYLE_KEYS.MARGIN_BOTTOM]: 6,
    [STYLE_KEYS.SPACING_MAJOR]: 22,
    [STYLE_KEYS.SPACING_MINOR]: 5,
  },
  [CLASS_TYPE.SUB_TOPIC]: {
    [STYLE_KEYS.MARGIN_LEFT]: 4,
    [STYLE_KEYS.MARGIN_RIGHT]: 4,
    [STYLE_KEYS.MARGIN_TOP]: 4,
    [STYLE_KEYS.MARGIN_BOTTOM]: 4,
    [STYLE_KEYS.SPACING_MAJOR]: 22,
    [STYLE_KEYS.SPACING_MINOR]: 5,
  },
  [CLASS_TYPE.FLOATING_TOPIC]: {
    [STYLE_KEYS.MARGIN_LEFT]: 9,
    [STYLE_KEYS.MARGIN_RIGHT]: 9,
    [STYLE_KEYS.MARGIN_TOP]: 9,
    [STYLE_KEYS.MARGIN_BOTTOM]: 9,
    [STYLE_KEYS.SPACING_MAJOR]: 24,
    [STYLE_KEYS.SPACING_MINOR]: 5,
  },
  [CLASS_TYPE.CALLOUT_TOPIC]: {
    [STYLE_KEYS.MARGIN_LEFT]: 4,
    [STYLE_KEYS.MARGIN_RIGHT]: 4,
    [STYLE_KEYS.MARGIN_TOP]: 4,
    [STYLE_KEYS.MARGIN_BOTTOM]: 4,
    [STYLE_KEYS.SPACING_MAJOR]: 22,
    [STYLE_KEYS.SPACING_MINOR]: 5,
  },
  [CLASS_TYPE.SUMMARY_TOPIC]: {
    [STYLE_KEYS.MARGIN_LEFT]: 8,
    [STYLE_KEYS.MARGIN_RIGHT]: 8,
    [STYLE_KEYS.MARGIN_TOP]: 4,
    [STYLE_KEYS.MARGIN_BOTTOM]: 4,
    [STYLE_KEYS.SPACING_MAJOR]: 22,
    [STYLE_KEYS.SPACING_MINOR]: 5,
  },
};
export const HAND_DRAWN_FONT_FAMILY = ["NeverMind Hand", "全瀨體"].join(",");
export const DEAFULT_FONT_FAMILT = [
  "NeverMind",
  "Microsoft YaHei",
  "PingFang SC",
  "Microsoft JhengHei",
].join(",");
export const STYLE_DESCRIPTOR_FOR_PRIVATE_STYLE_ID =
  "STYLE_DESCRIPTOR_FOR_PRIVATE_STYLE_ID";
export const STYLE_DESCRIPTOR_FOR_DEFAULT_SETTING_ID =
  "STYLE_DESCRIPTOR_FOR_DEFAULT_SETTING_ID";
export const STYLE_DESCRIPTOR_FOR_STRUCTURE_ID =
  "STYLE_DESCRIPTOR_FOR_STRUCTURE_ID";
export const STYLE_DESCRIPTOR_FOR_COMPACT_MODE_ID =
  "STYLE_DESCRIPTOR_FOR_COMPACT_MODE_ID";
export const STYLE_DESCRIPTOR_FOR_SMART_COLOR_ID =
  "STYLE_DESCRIPTOR_FOR_SMART_COLOR_ID";
export const STYLE_DESCRIPTOR_FOR_HAND_DRAWN_ID =
  "STYLE_DESCRIPTOR_FOR_HAND_DRAWN_ID";
export const VISUAL_BACK_COLOR = "#FFFFFF";

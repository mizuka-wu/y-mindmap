import {
  STYLE_LAYER,
  STYLE_KEYS,
  CLASS_TYPE,
  TOPICSHAPE,
  VIEW_TYPE,
  MAP_LIKE_STRUCTURES,
  STRUCTURECLASS,
  LOGIC_CHART_STRUCTURES,
  BRANCHCONNECTION,
  BRACE_BRANCH_CONNECTION,
  PRIVATE_TOPICSHAPE_FALLBACK,
  TEXTALIGN,
} from "../../common/constants/index";

import styleManager from "../../utils/business/stylemanager/index";

import * as utils from "../../utils/index";
import defaultStyles from "../../utils/business/stylemanager/defaultstyles";

const not = (test) => (m) => !test(m);
const and = (...args) => {
  return (m) => args.every((fn) => fn(m));
};
const or = (...args) => {
  return (m) => args.some((fn) => fn(m));
};
const isType = (type) => (target) => styleManager.getClassName(target) === type;

function isOverrideStyleTreeTableCell(target) {
  if (!Object(utils.isTreeTableCell)(target)) {
    return false;
  }
  if (Object(utils.isTreeTableHeadBranch)(target)) {
    return !(target.originBranchView ?? target).shouldCollapse();
  }
  return true;
}

const isAlignmentByLevelMode = (target) => {
  return target.getContext().isAlignmentByLevelMode();
};
const structureClassIs = (structureClass) => (target) => {
  return (
    target &&
    target.type === VIEW_TYPE.BRANCH &&
    target.getStructureClass() === structureClass
  );
};

const shouldChangeAlignInAlignmentByLevelMode = (target) => {
  // @link https://gitlab.xmind.cn/xmind/snowbrush/issues/966
  const structrueList = [
    ...MAP_LIKE_STRUCTURES,
    ...LOGIC_CHART_STRUCTURES,
    STRUCTURECLASS.BRACELEFT,
    STRUCTURECLASS.BRACERIGHT,
    STRUCTURECLASS.TREELEFT,
    STRUCTURECLASS.TREERIGHT,
  ];
  return structrueList.includes(target.getStructureClass());
};
export const structureDescriptor = {
  [STYLE_LAYER.BEFORE_USER]: [
    {
      type: STYLE_KEYS.LINE_CLASS,
      value: BRANCHCONNECTION.BRACE,
      test: and(utils.isBranch, (target) => {
        const isBraceStructure = or(
          structureClassIs(STRUCTURECLASS.BRACELEFT),
          structureClassIs(STRUCTURECLASS.BRACERIGHT),
        )(target);
        const connectionLineStyle = styleManager.getStyleValue(
          target,
          STYLE_KEYS.LINE_CLASS,
          {
            ignoreLayeredBeforeUser: true,
          },
        );
        const isBraceConnectionLine = Object.keys(BRACE_BRANCH_CONNECTION).some(
          (branchConnectionKey) => {
            // @ts-ignore
            return (
              connectionLineStyle ===
              BRACE_BRANCH_CONNECTION[branchConnectionKey]
            );
          },
        );
        return isBraceStructure && !isBraceConnectionLine;
      }),
    },
    // brace line can only be used in brace structure
    {
      type: STYLE_KEYS.LINE_CLASS,
      value: BRANCHCONNECTION.ROUNDEDELBOW,
      test: and(utils.isBranch, (target) => {
        const isBraceStructure = [
          STRUCTURECLASS.BRACELEFT,
          STRUCTURECLASS.BRACERIGHT,
        ].some((structureClass) => {
          return structureClassIs(structureClass)(target);
        });
        const connectionLineStyle = styleManager.getStyleValue(
          target,
          STYLE_KEYS.LINE_CLASS,
          {
            ignoreLayeredBeforeUser: true,
          },
        );
        const isBraceLine = Object.keys(BRACE_BRANCH_CONNECTION).some(
          (branchConnectionKey) => {
            // @ts-ignore
            return (
              connectionLineStyle ===
              BRACE_BRANCH_CONNECTION[branchConnectionKey]
            );
          },
        );
        return !isBraceStructure && isBraceLine;
      }),
    },
    // fix matrix shape in normal structure
    {
      type: STYLE_KEYS.SHAPE_CLASS,
      value: PRIVATE_TOPICSHAPE_FALLBACK[TOPICSHAPE.TREETABLEMAIN],
      test: and(utils.isBranch, (target) => {
        const shapeClass = styleManager.getStyleValue(
          target,
          STYLE_KEYS.SHAPE_CLASS,
          {
            ignoreLayeredBeforeUser: true,
          },
        );
        return (
          !isOverrideStyleTreeTableCell(target) &&
          shapeClass === TOPICSHAPE.TREETABLEMAIN
        );
      }),
    },
    {
      type: STYLE_KEYS.SHAPE_CLASS,
      value: PRIVATE_TOPICSHAPE_FALLBACK[TOPICSHAPE.MATRIXMAIN],
      test: and(utils.isBranch, (target) => {
        const shapeClass = styleManager.getStyleValue(
          target,
          STYLE_KEYS.SHAPE_CLASS,
          {
            ignoreLayeredBeforeUser: true,
          },
        );
        return (
          !Object(utils.isMatrixCell)(target) &&
          shapeClass === TOPICSHAPE.MATRIXMAIN
        );
      }),
    },
    {
      type: STYLE_KEYS.SHAPE_CLASS,
      value: TOPICSHAPE.RECT,
      test: (target) => {
        if (!target || target.type !== VIEW_TYPE.BRANCH) {
          return;
        }
        const forbiddenShapes = [
          TOPICSHAPE.STAR,
          TOPICSHAPE.HEART,
          TOPICSHAPE.FATLEFTARROW,
          TOPICSHAPE.FATRIGHTARROW,
        ];
        const shapeClass = styleManager.getStyleValue(
          target,
          STYLE_KEYS.SHAPE_CLASS,
          {
            ignoreLayeredBeforeUser: true,
          },
        );
        return (
          Object(utils.isFishBoneMainBone)(target) &&
          forbiddenShapes.includes(shapeClass)
        );
      },
    },
    {
      type: STYLE_KEYS.LINE_CLASS,
      value: BRANCHCONNECTION.STRAIGHT,
      test: structureClassIs(STRUCTURECLASS.TIMELINETHROUGHVERTICAL),
    },
  ],
  beforeParent: [],
  beforeTheme: [
    {
      type: STYLE_KEYS.MARGIN_LEFT,
      value: (branchView) => {
        const valueFromTheme = branchView
          .getContext()
          .model.theme()
          .getStyleValue(CLASS_TYPE.SUB_TOPIC, STYLE_KEYS.MARGIN_LEFT);
        const valueFromDefault = defaultStyles.getStyleValue(
          CLASS_TYPE.SUB_TOPIC,
          STYLE_KEYS.MARGIN_LEFT,
        );
        return valueFromTheme || valueFromDefault;
      },
      test: and(isOverrideStyleTreeTableCell, isType(CLASS_TYPE.MAIN_TOPIC)),
    },
    {
      type: STYLE_KEYS.MARGIN_RIGHT,
      value: (branchView) => {
        const valueFromTheme = branchView
          .getContext()
          .model.theme()
          .getStyleValue(CLASS_TYPE.SUB_TOPIC, STYLE_KEYS.MARGIN_RIGHT);
        const valueFromDefault = defaultStyles.getStyleValue(
          CLASS_TYPE.SUB_TOPIC,
          STYLE_KEYS.MARGIN_RIGHT,
        );
        return valueFromTheme || valueFromDefault;
      },
      test: and(isOverrideStyleTreeTableCell, isType(CLASS_TYPE.MAIN_TOPIC)),
    },
  ],
  beforeDefault: [
    // STRUCTURECLASS.TIMELINEVERTICAL
    {
      type: STYLE_KEYS.TEXT_ALIGN,
      value: TEXTALIGN.LEFT,
      test: and(utils.isTreeTableCell, (target) => {
        if (Object(utils.isTreeTableHeadBranch)(target)) {
          return false;
        }
        const isLastSingleCell = target.getChildrenBranchesByType().length == 0;
        const isCollapseCell = target.shouldCollapse();
        return !isLastSingleCell && !isCollapseCell;
      }),
    },
    {
      type: STYLE_KEYS.TEXT_ALIGN,
      value: TEXTALIGN.RIGHT,
      test: and(utils.isTreeTableCell, (target) => {
        if (Object(utils.isTreeTableHeadBranch)(target)) {
          return false;
        }
        const isLastSingleCell =
          target.getChildrenBranchesByType().length === 0;
        const isCollapseCell = target.shouldCollapse();
        return isLastSingleCell || isCollapseCell;
      }),
    },
    {
      type: STYLE_KEYS.TEXT_ALIGN,
      value: TEXTALIGN.RIGHT,
      test: and(
        isAlignmentByLevelMode,
        utils.isBranch,
        shouldChangeAlignInAlignmentByLevelMode,
        not(utils.isCentralBranch),
        (target) => {
          return target.getRealPosition().x < 0;
        },
      ),
    },
    {
      type: STYLE_KEYS.TEXT_ALIGN,
      value: TEXTALIGN.LEFT,
      test: and(
        isAlignmentByLevelMode,
        utils.isBranch,
        shouldChangeAlignInAlignmentByLevelMode,
        not(utils.isCentralBranch),
        (target) => {
          return target.getRealPosition().x > 0;
        },
      ),
    },
  ],
};

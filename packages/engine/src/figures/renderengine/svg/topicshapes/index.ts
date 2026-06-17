import * as constants from "../../../../common/constants/index";
import * as topicShapesUtils from "./utils";
import mommonFuncs from "../../../../mommonfuncs";
import { layoutConstant } from "../../../../utils/layoutconstant";
import * as utils from "../../../../utils/index";
import config from "../../../../common/config";
import BranchView from "../../../../view/branchview";
import * as brushes from "./brushes";

import * as common_utils from "../../../../common/utils/index";

import AbstractTopicShape from "./abstracttopicshape";

import { NoBorderTopicShape } from "./nobordertopicshape";

import { RoundedRectTopicShape } from "./roundedrecttopicshape";

import { RectTopicShape } from "./recttopicshape";

import { EllipseRectTopicShape } from "./ellipserecttopicshape";

import { EllipseTopicShape } from "./ellipsetopicshape";

import { DiamondTopicShape } from "./diamondtopicshape";

import { ShieldTopicShape } from "./shieldtopicshape";

import { FatLeftArrowTopicShape } from "./fatleftarrowtopicshape";

import { FatRightArrowTopicShape } from "./fatrightarrowtopicshape";

import { LabelTopicShape } from "./labeltopicshape";

import { BookmarkTopicShape } from "./bookmarktopicshape";

import { SimpleCloudTopicShape } from "./simplecloudtopicshape";

import { HeartTopicShape } from "./hearttopicshape";

import { SquareBracketTopicShape } from "./squarebrackettopicshape";

import { CurlyBracketTopicShape } from "./curlybrackettopicshape";

import { SquareQuoteTopicShape } from "./squarequotetopicshape";

import { SingleBookQuoteTopicShape } from "./singlebookquotetopicshape";

import { DoubleBookQuoteTopicShape } from "./doublebookquotetopicshape";

import { DoubleQuoteTopicShape } from "./doublequotetopicshape";

import { RoundBracketTopicShape } from "./roundbrackettopicshape";

import { HexagonTopicShape } from "./hexagontopicshape";

import { RoundedHexagonTopicShape } from "./roundedhexagontopicshape";

import { CircleTopicShape } from "./circletopicshape";

import { ParallelogramTopicShape } from "./parallelogramtopicshape";

import { CloudTopicShape } from "./cloudtopicshape";

import { MatrixMainTopicShape } from "./matrixmaintopicshape";

import { TreeTableMainTopicShape } from "./treetablemaintopicshape";

import { WaterdropTopicShape } from "./waterdroptopicshape";

import { StarTopicShape } from "./startopicshape";

import { UnderlineTopicShape } from "./underlinetopicshape";

import { DoubleUnderlineTopicShape } from "./doubleunderlinetopicshape";

import { EllipticRecTangleTopicShape } from "./ellipticrectangletopicshape";

import { HandDrawnEllipseTopicShape } from "./handdrawnellipsetopicshape";

import { CutDiamondTopicShape } from "./cutdiamondtopicshape";

const { STACKGAP, NEWCLOUDCORNERLEN } = layoutConstant;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const rotatedSin = Math.sin(Math.PI / 9);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const rotatedCos = Math.cos(Math.PI / 9);
const TopicShape = {
  [constants.TOPICSHAPE.RECT]: new RectTopicShape(),
  [constants.TOPICSHAPE.ROUNDEDRECT]: new RoundedRectTopicShape(),
  [constants.TOPICSHAPE.ELLIPSE]: new EllipseTopicShape(),
  [constants.TOPICSHAPE._RECT]: new RectTopicShape(),
  [constants.TOPICSHAPE._ROUNDEDRECT]: new RoundedRectTopicShape(),
  [constants.TOPICSHAPE._ELLIPSE]: new EllipseTopicShape(),
  [constants.TOPICSHAPE.ELLIPSERECT]: new EllipseRectTopicShape(),
  [constants.TOPICSHAPE.DIAMOND]: new DiamondTopicShape(),
  [constants.TOPICSHAPE.HEXAGON]: new HexagonTopicShape(),
  [constants.TOPICSHAPE.ROUNDEDHEXAGON]: new RoundedHexagonTopicShape(),
  [constants.TOPICSHAPE.ELLIPTICRECTANGLE]: new EllipticRecTangleTopicShape(),
  [constants.TOPICSHAPE.TREETABLEMAIN]: new TreeTableMainTopicShape(),
  [constants.TOPICSHAPE.SINGLEBREAKANGLE]:
    new (class extends AbstractTopicShape {
      constructor() {
        super();
        this.calcTopicShapePath = brushes.singleBreakAngle;
      }
    })(),
  [constants.TOPICSHAPE.SINGLEBREAKANGLEWITHLINE]:
    new (class extends AbstractTopicShape {
      constructor() {
        super();
        this.calcTopicShapePath = brushes.singleBreakAngleWithLine;
      }
    })(),
  [constants.TOPICSHAPE.DOUBLEROUNDEDANGLE]:
    new (class extends AbstractTopicShape {
      constructor() {
        super();
        this.calcTopicShapePath = brushes.doubleRoundedAngle;
      }
    })(),
  [constants.TOPICSHAPE.DOUBLEUNDERLINE]: new DoubleUnderlineTopicShape(),
  [constants.TOPICSHAPE.LEAF]: new (class extends AbstractTopicShape {
    type: string;
    constructor() {
      super();
      this.type = constants.TOPICSHAPE.LEAF;
      this.calcTopicShapePath = brushes.leaf;
    }
    getTopicMargins(branch, size) {
      return TopicShape[constants.TOPICSHAPE.DIAMOND].getTopicMargins(
        branch,
        size,
      );
    }
  })(),
  [constants.TOPICSHAPE.NEWCLOUD]: new (class extends AbstractTopicShape {
    type: string;
    constructor() {
      super();
      this.type = constants.TOPICSHAPE.NEWCLOUD;
      this.calcTopicShapePath = brushes.newCloud;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getTopicMargins(branch, size) {
      const { lm, rm, tm, bm, lw } = Object(topicShapesUtils.getUnits)(branch);
      const extra = NEWCLOUDCORNERLEN;
      return {
        top: tm + lw + extra,
        left: lm + lw + extra,
        bottom: bm + lw + extra,
        right: rm + lw + extra,
      };
    }
    /// it is not a good solution just for adjust newCloud shape
    _calcTopicSelectBoxPath(bound, borderWidth) {
      const width = NEWCLOUDCORNERLEN / 5;
      bound = {
        x: bound.x - width,
        y: bound.y - width,
        width: bound.width + width * 2,
        height: bound.height + width * 2,
      };
      return mommonFuncs.generateRect(bound, borderWidth);
    }
    getEndAnchorPosition(structure, branch) {
      const parent = branch.parent();
      const dir = Object(topicShapesUtils.getEndDirection)(parent, branch);
      const pos = Object(topicShapesUtils.relativePositionToRealPosition)(
        Object(topicShapesUtils.getJointPosition)(
          branch.topicView.shapeBounds,
          dir,
        ),
        branch,
      );
      return Object(topicShapesUtils.addPositionByDirection)(pos, dir, 2);
    }
  })(),
  [constants.TOPICSHAPE.STACK]: new (class extends AbstractTopicShape {
    type: string;
    constructor() {
      super();
      this.type = constants.TOPICSHAPE.STACK;
      this.calcTopicShapePath = brushes.stack;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    getTopicMargins(branch, size) {
      const { lm, rm, tm, bm, lw } = Object(topicShapesUtils.getUnits)(branch);
      const gap = STACKGAP;
      return {
        top: tm,
        left: lm,
        bottom: bm + lw + gap,
        right: rm + gap,
      };
    }
    /// TODO, it's not a good solution, calls the function "setTopicShapeFillPath" twice
    _render(topicView) {
      super._render(topicView);
      const gap = STACKGAP;
      const bounds = topicView.shapeBounds;
      const fillBounds = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width - gap,
        height: bounds.height - gap,
      };
      const d = brushes.rect(fillBounds);
      topicView.setTopicShapeFillPath(d);
      return topicView;
    }
  })(),
  [constants.TOPICSHAPE.UNDERLINE]: new UnderlineTopicShape(),
  [constants.TOPICSHAPE.CIRCLE]: new CircleTopicShape(),
  [constants.TOPICSHAPE.PARALLELOGRAM]: new ParallelogramTopicShape(),
  [constants.TOPICSHAPE.NOBORDER]: new NoBorderTopicShape(),
  // Ray TODO: CLOUD 的 bounds 和渲染的宽不一致，造成连线计算有误
  [constants.TOPICSHAPE.CLOUD]: new CloudTopicShape(),
  [constants.TOPICSHAPE.MATRIXMAIN]: new MatrixMainTopicShape(),
  [constants.TOPICSHAPE.WATERDROP]: new WaterdropTopicShape(),
  [constants.TOPICSHAPE.STAR]: new StarTopicShape(),
  [constants.TOPICSHAPE.CUTDIAMOND]: new CutDiamondTopicShape(),
  [constants.TOPICSHAPE.SHIELD]: new ShieldTopicShape(),
  [constants.TOPICSHAPE.FATLEFTARROW]: new FatLeftArrowTopicShape(),
  [constants.TOPICSHAPE.FATRIGHTARROW]: new FatRightArrowTopicShape(),
  [constants.TOPICSHAPE.LABEL]: new LabelTopicShape(),
  [constants.TOPICSHAPE.BOOKMARK]: new BookmarkTopicShape(),
  [constants.TOPICSHAPE.SIMPLECLOUD]: new SimpleCloudTopicShape(),
  [constants.TOPICSHAPE.HEART]: new HeartTopicShape(),
  [constants.TOPICSHAPE.SQUAREBRACKET]: new SquareBracketTopicShape(),
  [constants.TOPICSHAPE.ROUNDBRACKET]: new RoundBracketTopicShape(),
  [constants.TOPICSHAPE.CURLYBRACKET]: new CurlyBracketTopicShape(),
  [constants.TOPICSHAPE.SQUAREQUOTE]: new SquareQuoteTopicShape(),
  [constants.TOPICSHAPE.SINGLEBOOKQUOTE]: new SingleBookQuoteTopicShape(),
  [constants.TOPICSHAPE.DOUBLEBOOKQUOTE]: new DoubleBookQuoteTopicShape(),
  [constants.TOPICSHAPE.DOUBLEQUOTE]: new DoubleQuoteTopicShape(),
  [constants.TOPICSHAPE.HANDDRAWNRECT]: new RectTopicShape(),
  [constants.TOPICSHAPE.HANDDRAWNROUNDEDRECT]: new RoundedRectTopicShape(),
  [constants.TOPICSHAPE.HANDDRAWNUNDERLINE]: new UnderlineTopicShape(),
  [constants.TOPICSHAPE.HANDDRAWNELLIPSE]: new HandDrawnEllipseTopicShape(),
  [constants.CALLOUTSHAPE.RECT]: new (class extends AbstractTopicShape {
    type: string;
    constructor() {
      super();
      this.type = constants.CALLOUTSHAPE.RECT;
    }
    getTopicMargins(branch, size) {
      return TopicShape[constants.TOPICSHAPE.RECT].getTopicMargins(
        branch,
        size,
      );
    }
    _render(topicView) {
      return TopicShape[constants.TOPICSHAPE.RECT]._render(topicView);
    }
  })(),
  [constants.CALLOUTSHAPE.ROUNDEDRECT]:
    new (class extends RoundedRectTopicShape {
      type: string;
      constructor() {
        super();
        this.type = constants.CALLOUTSHAPE.ROUNDEDRECT;
      }
    })(),
  [constants.CALLOUTSHAPE.ELLIPSE]: new (class extends AbstractTopicShape {
    type: string;
    constructor() {
      super();
      this.type = constants.CALLOUTSHAPE.ELLIPSE;
    }
    getTopicMargins(branch, size) {
      return TopicShape[constants.TOPICSHAPE.ELLIPSE].getTopicMargins(
        branch,
        size,
      );
    }
    _render(topicView) {
      return TopicShape[constants.TOPICSHAPE.ELLIPSE]._render(topicView);
    }
  })(),
};
class PositionWrapper {
  [constants.STRUCTURECLASS.BRACERIGHT](rawEndAnchorPosition, branchView) {
    return {
      x: branchView.getRealPosition().x + branchView.bounds.x,
      y: rawEndAnchorPosition.y,
    };
  }
  [constants.STRUCTURECLASS.BRACELEFT](rawEndAnchorPosition, branchView) {
    return {
      x:
        branchView.getRealPosition().x +
        branchView.bounds.x +
        branchView.bounds.width,
      y: rawEndAnchorPosition.y,
    };
  }
  wrapTopicShapeObject(methodName) {
    return (coreFunc) => {
      Object.keys(TopicShape).forEach((shapeStyle) => {
        const method = TopicShape[shapeStyle][methodName].bind(
          TopicShape[shapeStyle],
        );
        TopicShape[shapeStyle][methodName] = (structureObject, branchView) => {
          return coreFunc()(structureObject, branchView, method);
        };
      });
    };
  }
  wrapLineEndSpacingPatch() {
    return (structureObject, endBranchView, getEndAnchorPosition) => {
      let rawEndAnchorPosition = getEndAnchorPosition(
        structureObject,
        endBranchView,
      );
      const structureClass = structureObject.STRUCTURECLASS;
      if (this[structureClass]) {
        rawEndAnchorPosition = this[structureClass](
          rawEndAnchorPosition,
          endBranchView,
        );
      }
      const parentBranchView = endBranchView.parent();
      if (parentBranchView instanceof BranchView) {
        return Object(common_utils.addPoint)(
          rawEndAnchorPosition,
          Object(utils.getLineEndSpacingPatchPoint)(
            parentBranchView,
            endBranchView,
          ),
        );
      } else {
        return rawEndAnchorPosition;
      }
    };
  }
  wrap() {
    this.wrapTopicShapeObject("getEndAnchorPosition")(
      this.wrapLineEndSpacingPatch.bind(this),
    );
  }
}
new PositionWrapper().wrap();
export function getTopicShape(key) {
  if (!TopicShape[key]) {
    config
      .get(constants.CONFIG.LOGGER)
      .warn(`Unsupported topic shape class: ${key}`);
    return TopicShape[constants.TOPICSHAPE.ROUNDEDRECT];
  }
  return TopicShape[key];
}

export default getTopicShape;

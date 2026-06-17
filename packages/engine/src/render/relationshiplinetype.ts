import { RELATIONSHIPSHAPE, CONFIG } from "../common/constants/index";
import * as boundUtils from "../utils/boundutils";
import Util from "../util";
import config from "../common/config";
import * as utils from "../utils/index";
import * as commonUtils from "../common/utils/index";
const AbstractLineType = {
  updatePath(
    relationshipView,
    startPoint,
    endPoint,
    startControlPoint,
    endControlPoint,
  ) {
    setRSPath(
      relationshipView,
      this.calcPathD(startPoint, endPoint, startControlPoint, endControlPoint),
    );
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calcPathD(sp, tp, scp, tcp) {
    throw new Error("must implement calcPathD function");
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calcBoundingBox(sp, tp, scp, tcp) {
    throw new Error("must implement calcBoundingBox function");
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  calcPathParams(sp, tp, scp, tcp) {
    throw new Error("must implement calcPathParams function");
  },
  getControlHandlerDisplayStatus() {
    return {
      controlHandlerLine1: true,
      controlHandlerPoint1: true,
      controlHandlerLine2: true,
      controlHandlerPoint2: true,
    };
  },
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getQuadCurvedPoint = (sp, tp, scp, tcp) => {
  const direction = Object(utils.normalize)(Object(utils.sub)(tp, sp));
  const directionR = Object(utils.reverse)(direction);
  const distance = Object(commonUtils.getPointDistance)(sp, tp);
  const c1 = Object(utils.add)(
    scp,
    Object(utils.normalize)(directionR, distance / 3),
  );
  const c2 = Object(utils.add)(
    scp,
    Object(utils.normalize)(direction, distance / 3),
  );
  return {
    c1,
    c2,
  };
};
const RelationshipLineType = {
  //添加virtual参数是为了区别是不是用户添加时的假relationship
  [RELATIONSHIPSHAPE.CURVED]: Object.assign({}, AbstractLineType, {
    calcPathD: function (sp, tp, scp, tcp) {
      const relationshipPath =
        "M " +
        sp.x +
        " " +
        sp.y +
        "C " +
        scp.x +
        " " +
        scp.y +
        "  " +
        tcp.x +
        " " +
        tcp.y +
        "  " +
        tp.x +
        " " +
        tp.y;
      return relationshipPath;
    },
    calcBoundingBox(sp, tp, scp, tcp) {
      return Util.calcCubicBezierBoundingBox(sp, tp, scp, tcp);
    },
  }),
  [RELATIONSHIPSHAPE.QUAD]: Object.assign({}, AbstractLineType, {
    calcPathD: function (sp, tp, scp, tcp) {
      const { c1, c2 } = getQuadCurvedPoint(sp, tp, scp, tcp);
      const relationshipPath = `
        M ${sp.x} ${sp.y}
        C ${sp.x} ${sp.y} ${c1.x} ${c1.y} ${scp.x} ${scp.y}
        C ${c2.x} ${c2.y} ${tp.x} ${tp.y} ${tp.x} ${tp.y}
      `;
      return relationshipPath;
    },
    calcBoundingBox(sp, tp, scp, tcp) {
      const { c1, c2 } = getQuadCurvedPoint(sp, tp, scp, tcp);
      const bounds1 = Util.calcCubicBezierBoundingBox(sp, scp, sp, c1);
      const bounds2 = Util.calcCubicBezierBoundingBox(scp, tp, c2, tp);
      const x = Math.min(bounds1.x, bounds2.x);
      const y = Math.min(bounds1.y, bounds2.y);
      const width =
        Math.max(bounds1.x + bounds1.width, bounds2.x + bounds2.width) - x;
      const height =
        Math.max(bounds1.y + bounds1.height, bounds2.y + bounds2.height) - y;
      return {
        x,
        y,
        width,
        height,
      };
    },
    getControlHandlerDisplayStatus() {
      return {
        controlHandlerLine1: false,
        controlHandlerPoint1: true,
        controlHandlerLine2: false,
        controlHandlerPoint2: false,
      };
    },
  }),
  [RELATIONSHIPSHAPE.STRAIGHT]: Object.assign({}, AbstractLineType, {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    calcPathD: function (sp, tp, scp, tcp) {
      const relationshipPath =
        "M " + sp.x + " " + sp.y + "L " + tp.x + " " + tp.y;
      return relationshipPath;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    calcBoundingBox(sp, tp, scp, tcp) {
      return boundUtils.getBoundingBox([sp, tp]);
    },
    getControlHandlerDisplayStatus() {
      return {
        controlHandlerLine1: false,
        controlHandlerPoint1: false,
        controlHandlerLine2: false,
        controlHandlerPoint2: false,
      };
    },
  }),
  [RELATIONSHIPSHAPE.ANGLED]: Object.assign({}, AbstractLineType, {
    getControlHandlerDisplayStatus() {
      return {
        controlHandlerLine1: false,
        controlHandlerPoint1: true,
        controlHandlerLine2: false,
        controlHandlerPoint2: true,
      };
    },
    calcPathD: function (sp, tp, scp, tcp) {
      const relationshipPath =
        "M " +
        sp.x +
        " " +
        sp.y +
        "L " +
        scp.x +
        " " +
        scp.y +
        "L " +
        tcp.x +
        " " +
        tcp.y +
        "L " +
        tp.x +
        " " +
        tp.y;
      return relationshipPath;
    },
    calcBoundingBox(sp, tp, scp, tcp) {
      return boundUtils.getBoundingBox([sp, tp, scp, tcp]);
    },
  }),
  [RELATIONSHIPSHAPE.ZIGZAG]: Object.assign({}, AbstractLineType, {
    getControlHandlerDisplayStatus() {
      return {
        controlHandlerLine1: false,
        controlHandlerPoint1: true,
        controlHandlerLine2: false,
        controlHandlerPoint2: true,
      };
    },
    calcPathParams: function (sp, tp, scp, tcp) {
      const tcp1 = {
        x: tcp.x,
        y: tcp.y,
      };
      const scp1 = {
        x: scp.x,
        y: scp.y,
      };
      if (Math.abs(tcp1.x - tp.x) <= Math.abs(tcp1.y - tp.y)) {
        //target
        tcp1.x = tp.x; // 1,3
      } else {
        tcp1.y = tp.y; // 2,4
      }
      if (Math.abs(scp1.x - sp.x) <= Math.abs(scp1.y - sp.y)) {
        //source
        scp1.x = sp.x; // 1,3
      } else {
        scp1.y = sp.y; // 2,4
      }
      if (tcp1.x === tp.x) {
        if (scp1.x === sp.x) {
          tcp1.y = scp1.y = (scp1.y + tcp1.y) / 2;
        } else if (scp1.y === sp.y) {
          tcp1.y = scp1.y = sp.y;
          scp1.x = tp.x;
        }
      } else if (tcp1.y === tp.y) {
        if (scp1.y === sp.y) {
          tcp1.x = scp1.x = (tcp1.x + scp1.x) / 2;
        } else if (scp1.x === sp.x) {
          tcp1.x = scp1.x = sp.x;
          scp1.y = tp.y;
        }
      }
      return {
        sp,
        scp: scp1,
        tcp: tcp1,
        tp,
      };
    },
    calcPathD: function (sp, tp, scp, tcp) {
      const { scp: currentScp, tcp: currentTcp } = RelationshipLineType[
        RELATIONSHIPSHAPE.ZIGZAG
      ].calcPathParams(sp, tp, scp, tcp);
      const relationshipPath =
        "M " +
        sp.x +
        " " +
        sp.y +
        "L " +
        (currentScp as any).x +
        " " +
        (currentScp as any).y +
        "L " +
        (currentTcp as any).x +
        " " +
        (currentTcp as any).y +
        "L " +
        tp.x +
        " " +
        tp.y;
      return relationshipPath;
    },
    calcBoundingBox(sp, tp, scp, tcp) {
      const tcp1 = {
        x: tcp.x,
        y: tcp.y,
      };
      const scp1 = {
        x: scp.x,
        y: scp.y,
      };
      if (Math.abs(tcp1.x - tp.x) <= Math.abs(tcp1.y - tp.y)) {
        //target
        tcp1.x = tp.x; // 1,3
      } else {
        tcp1.y = tp.y; // 2,4
      }
      if (Math.abs(scp1.x - sp.x) <= Math.abs(scp1.y - sp.y)) {
        //source
        scp1.x = sp.x; // 1,3
      } else {
        scp1.y = sp.y; // 2,4
      }
      if (tcp1.x === tp.x) {
        if (scp1.x === sp.x) {
          tcp1.y = scp1.y = (scp1.y + tcp1.y) / 2;
        } else if (scp1.y === sp.y) {
          tcp1.y = scp1.y = sp.y;
          scp1.x = tp.x;
        }
      } else if (tcp1.y === tp.y) {
        if (scp1.y === sp.y) {
          tcp1.x = scp1.x = (tcp1.x + scp1.x) / 2;
        } else if (scp1.x === sp.x) {
          tcp1.x = scp1.x = sp.x;
          scp1.y = tp.y;
        }
      }
      return boundUtils.getBoundingBox([sp, tp, scp1, tcp1]);
    },
  }),
};
function setRSPath(relationshipView, relationshipPath) {
  relationshipView.setRelationshipPath(relationshipPath);
}
export const getRelationshipLineType = (key) => {
  if (!RelationshipLineType[key]) {
    config
      .get(CONFIG.LOGGER)
      .warn(`Unsupported relationship line style: ${key}`);
    return RelationshipLineType[RELATIONSHIPSHAPE.CURVED];
  }
  return RelationshipLineType[key];
};
export default getRelationshipLineType;

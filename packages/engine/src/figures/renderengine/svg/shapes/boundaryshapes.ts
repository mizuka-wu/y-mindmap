import {
  CONFIG,
  BOUNDARYSHAPE,
  DIRECTION,
  TOPIC_TYPE,
} from "../../../../common/constants/index";
import * as brushes from "../../../renderengine/svg/topicshapes/brushes";
import config from "../../../../common/config";
import { layoutConstant } from "../../../../utils/layoutconstant";
import { getStructure } from "../../../../structures/helper/allstructures";
import Util from "../../../../util";

const setBoundaryPath = (boundary, d, fillD?) => {
  boundary.figure.setBoundaryPath(d);
  fillD = fillD || d;
  boundary.figure.setBoundaryFillPath(fillD);
};
const boundaryGap = layoutConstant.BOUNDARYGAP;
const corner = 14;
const BoundaryShape = {
  [BOUNDARYSHAPE.RECT]: function (boundary, size) {
    const minX = 0;
    const minY = 0;
    const maxX = size.width;
    const maxY = size.height;
    const d =
      "M " +
      minX +
      " " +
      minY +
      "L " +
      maxX +
      " " +
      minY +
      "L " +
      maxX +
      " " +
      maxY +
      "L " +
      minX +
      " " +
      maxY +
      "z";
    setBoundaryPath(boundary, d);
  },
  [BOUNDARYSHAPE.ROUNDEDRECT]: function (boundary, size) {
    const minX = 0;
    const minY = 0;
    const maxX = size.width;
    const maxY = size.height;
    const d =
      "M " +
      (minX + corner) +
      " " +
      minY +
      "L " +
      (maxX - corner) +
      " " +
      minY +
      "Q " +
      maxX +
      " " +
      minY +
      " " +
      maxX +
      " " +
      (minY + corner) +
      "L " +
      maxX +
      " " +
      (maxY - corner) +
      "Q " +
      maxX +
      " " +
      maxY +
      " " +
      (maxX - corner) +
      " " +
      maxY +
      "L " +
      (minX + corner) +
      " " +
      maxY +
      "Q " +
      minX +
      " " +
      maxY +
      " " +
      minX +
      " " +
      (maxY - corner) +
      "L " +
      minX +
      " " +
      (minY + corner) +
      "Q " +
      minX +
      " " +
      minY +
      " " +
      (minX + corner) +
      " " +
      minY +
      "z";
    setBoundaryPath(boundary, d);
  },
  [BOUNDARYSHAPE.SCALLOPS]: function (boundary, size) {
    const minX = 0;
    const minY = 0;
    const maxX = size.width;
    const maxY = size.height;
    const offset = boundaryGap / 2;
    const width = maxX - minX - boundaryGap;
    const height = maxY - minY - boundaryGap;
    const horizontalNumber = Math.max(1, parseInt(`${width / 40}`, 10));
    const verticalNumber = Math.max(1, parseInt(`${height / 40}`, 10));
    const hstep = width / horizontalNumber;
    const vstep = height / verticalNumber;
    let startPosX = minX + offset;
    let startPosY = minY + offset;
    let endPosX = minX + hstep + offset;
    let endPosY = minY + offset;
    let d = "";
    const horizontalRealNumber = width / hstep;
    const verticalRealNumber = height / vstep;
    let count;
    d += "M " + startPosX + " " + startPosY;
    //画上部
    for (count = 0; count < horizontalRealNumber; count++) {
      d +=
        "C " +
        (startPosX + (endPosX - startPosX) * 0.25) +
        " " +
        (endPosY - offset) +
        " " +
        (startPosX + (endPosX - startPosX) * 0.75) +
        " " +
        (endPosY - offset) +
        " " +
        endPosX +
        " " +
        endPosY;
      startPosX = endPosX;
      endPosX = startPosX + hstep;
    }
    //画右部
    endPosX = startPosX;
    endPosY = endPosY + vstep;
    for (count = 0; count < verticalRealNumber; count++) {
      d +=
        "C " +
        (startPosX + offset) +
        " " +
        (startPosY + (endPosY - startPosY) * 0.25) +
        " " +
        (startPosX + offset) +
        " " +
        (startPosY + (endPosY - startPosY) * 0.75) +
        " " +
        startPosX +
        " " +
        endPosY;
      startPosY = endPosY;
      endPosY = startPosY + vstep;
    }
    //画下部
    endPosY = startPosY;
    endPosX = startPosX - hstep;
    for (count = 0; count < horizontalRealNumber; count++) {
      d +=
        "C " +
        (startPosX - Math.abs(endPosX - startPosX) * 0.25) +
        " " +
        (endPosY + offset) +
        " " +
        (startPosX - Math.abs(endPosX - startPosX) * 0.75) +
        " " +
        (endPosY + offset) +
        " " +
        endPosX +
        " " +
        endPosY;
      startPosX = endPosX;
      endPosX = startPosX - hstep;
    }
    //画左部
    endPosX = startPosX;
    endPosY = endPosY - vstep;
    for (count = 0; count < verticalRealNumber; count++) {
      d +=
        "C " +
        (startPosX - offset) +
        " " +
        (startPosY - Math.abs(endPosY - startPosY) * 0.25) +
        " " +
        (startPosX - offset) +
        " " +
        (startPosY - Math.abs(endPosY - startPosY) * 0.75) +
        " " +
        startPosX +
        " " +
        endPosY;
      startPosY = endPosY;
      endPosY = startPosY - vstep;
    }
    d += "Z";
    setBoundaryPath(boundary, d);
  },
  [BOUNDARYSHAPE.WAVES]: function (boundary, size) {
    const minX = 0;
    const minY = 0;
    const maxX = size.width;
    const maxY = size.height;
    const offset = boundaryGap / 2;
    const width = maxX - minX - boundaryGap;
    const height = maxY - minY - boundaryGap;
    const horizontalNumber = Math.max(1, parseInt(`${width / 40}`, 10));
    const verticalNumber = Math.max(1, parseInt(`${height / 40}`, 10));
    const hstep = width / horizontalNumber;
    const vstep = height / verticalNumber;
    let startPosX = minX + offset;
    let startPosY = minY + offset;
    let endPosX = minX + hstep + offset;
    let endPosY = minY + offset;
    let d = "";
    const horizontalRealNumber = width / hstep;
    const verticalRealNumber = height / vstep;
    let count;
    d += "M " + startPosX + " " + startPosY;
    //画上部
    for (count = 0; count < horizontalRealNumber; count++) {
      d +=
        "Q " +
        (startPosX + (endPosX - startPosX) * 0.25) +
        " " +
        (endPosY - offset / 2) +
        " " +
        (startPosX + (endPosX - startPosX) * 0.5) +
        " " +
        endPosY +
        "T " +
        endPosX +
        " " +
        endPosY;
      startPosX = endPosX;
      endPosX = startPosX + hstep;
    }
    //画右部
    endPosX = startPosX;
    endPosY = endPosY + vstep;
    for (count = 0; count < verticalRealNumber; count++) {
      d +=
        "Q " +
        (startPosX + offset / 2) +
        " " +
        (startPosY + (endPosY - startPosY) * 0.25) +
        " " +
        startPosX +
        " " +
        (startPosY + (endPosY - startPosY) * 0.5) +
        "T " +
        startPosX +
        " " +
        endPosY;
      startPosY = endPosY;
      endPosY = startPosY + vstep;
    }
    //画下部
    endPosY = startPosY;
    endPosX = startPosX - hstep;
    for (count = 0; count < horizontalRealNumber; count++) {
      d +=
        "Q " +
        (startPosX - Math.abs(endPosX - startPosX) * 0.25) +
        " " +
        (endPosY + offset / 2) +
        " " +
        (startPosX - Math.abs(endPosX - startPosX) * 0.5) +
        " " +
        endPosY +
        "T " +
        endPosX +
        " " +
        endPosY;
      startPosX = endPosX;
      endPosX = startPosX - hstep;
    }
    //画左部
    endPosX = startPosX;
    endPosY = endPosY - vstep;
    for (count = 0; count < verticalRealNumber; count++) {
      d +=
        "Q " +
        (startPosX - offset / 2) +
        " " +
        (startPosY - Math.abs(endPosY - startPosY) * 0.25) +
        " " +
        startPosX +
        " " +
        (startPosY - Math.abs(endPosY - startPosY) * 0.5) +
        "T " +
        startPosX +
        " " +
        endPosY;
      startPosY = endPosY;
      endPosY = startPosY - vstep;
    }
    d += "Z";
    setBoundaryPath(boundary, d);
  },
  [BOUNDARYSHAPE.TENSION]: function (boundary, size) {
    const minX = 0;
    const minY = 0;
    const maxX = size.width;
    const maxY = size.height;
    const offset = boundaryGap / 2;
    const width = maxX - minX - boundaryGap;
    const height = maxY - minY - boundaryGap;
    const horizontalNumber = Math.max(1, parseInt(`${width / 40}`, 10));
    const verticalNumber = Math.max(1, parseInt(`${height / 40}`, 10));
    const hstep = width / horizontalNumber;
    const vstep = height / verticalNumber;
    let startPosX = minX + offset;
    let startPosY = minY + offset;
    let endPosX = minX + hstep + offset;
    let endPosY = minY + offset;
    let d = "";
    const horizontalRealNumber = width / hstep;
    const verticalRealNumber = height / vstep;
    let count;
    d += "M " + startPosX + " " + startPosY;
    //画上部
    for (count = 0; count < horizontalRealNumber; count++) {
      d +=
        "Q " +
        (startPosX + (endPosX - startPosX) * 0.5) +
        " " +
        (endPosY + offset) +
        " " +
        endPosX +
        " " +
        endPosY;
      startPosX = endPosX;
      endPosX = startPosX + hstep;
    }
    //画右部
    endPosX = startPosX;
    endPosY = endPosY + vstep;
    for (count = 0; count < verticalRealNumber; count++) {
      d +=
        "Q " +
        (startPosX - offset) +
        " " +
        (startPosY + (endPosY - startPosY) * 0.5) +
        " " +
        startPosX +
        " " +
        endPosY;
      startPosY = endPosY;
      endPosY = startPosY + vstep;
    }
    //画下部
    endPosY = startPosY;
    endPosX = startPosX - hstep;
    for (count = 0; count < horizontalRealNumber; count++) {
      d +=
        "Q " +
        (startPosX - Math.abs(endPosX - startPosX) * 0.5) +
        " " +
        (endPosY - offset) +
        " " +
        endPosX +
        " " +
        endPosY;
      startPosX = endPosX;
      endPosX = startPosX - hstep;
    }
    //画左部
    endPosX = startPosX;
    endPosY = endPosY - vstep;
    for (count = 0; count < verticalRealNumber; count++) {
      d +=
        "Q " +
        (startPosX + offset) +
        " " +
        (startPosY - Math.abs(endPosY - startPosY) * 0.5) +
        " " +
        startPosX +
        " " +
        endPosY;
      startPosY = endPosY;
      endPosY = startPosY - vstep;
    }
    d += "Z";
    setBoundaryPath(boundary, d);
  },
  [BOUNDARYSHAPE.ROUNDEDPOLYGON]: function (boundary, size) {
    drawRoundPolygon(getPolygonPoints(boundary, size), boundary);
  },
  [BOUNDARYSHAPE.POLYGON]: function (boundary, size) {
    drawPolygon(getPolygonPoints(boundary, size), boundary);
  },
  [BOUNDARYSHAPE.NEWBOUNDARY1]: function (boundary, size) {
    const minX = 0;
    const minY = 0;
    const maxX = size.width;
    const maxY = size.height;
    const largeCorner = 50;
    const smallCorner = 5;
    const d =
      "M " +
      (minX + largeCorner) +
      " " +
      minY +
      "L " +
      (maxX - smallCorner) +
      " " +
      minY +
      "Q " +
      maxX +
      " " +
      minY +
      " " +
      maxX +
      " " +
      (minY + smallCorner) +
      "L " +
      maxX +
      " " +
      (maxY - largeCorner) +
      "Q " +
      maxX +
      " " +
      maxY +
      " " +
      (maxX - largeCorner) +
      " " +
      maxY +
      "L " +
      (minX + smallCorner) +
      " " +
      maxY +
      "Q " +
      minX +
      " " +
      maxY +
      " " +
      minX +
      " " +
      (maxY - smallCorner) +
      "L " +
      minX +
      " " +
      (minY + largeCorner) +
      "Q " +
      minX +
      " " +
      minY +
      " " +
      (minX + largeCorner) +
      " " +
      minY +
      "z";
    setBoundaryPath(boundary, d);
  },
  [BOUNDARYSHAPE.NEWBOUNDARY2]: function (boundary, size) {
    // drawPolygon(getPolygonPoints(boundary, size), boundary);
    const skewOffset = 50;
    const skewedCorners = [
      {
        x: skewOffset,
        y: 0,
      },
      {
        x: size.width,
        y: size.height,
      },
      {
        x: size.width - skewOffset,
        y: size.height,
      },
      {
        x: 0,
        y: size.height,
      },
    ];
    drawRoundPolygon(skewedCorners, boundary);
  },
  [BOUNDARYSHAPE.NEWBOUNDARY3]: function (boundary, size) {
    const peak = 50;
    const points = [
      {
        x: 0,
        y: 0,
      },
      {
        x: size.width,
        y: 0,
      },
      {
        x: size.width + peak,
        y: size.height / 2,
      },
      {
        x: size.width,
        y: size.height,
      },
      {
        x: 0,
        y: size.height,
      },
    ];
    drawPolygon(points, boundary);
  },
  [BOUNDARYSHAPE.FOCUS]: function (boundary, size) {
    const width = size.width;
    const height = size.height;
    const length = Math.min(60, Math.min(height, width) / 8);
    const d = `M 0 ${length} L 0 0 L ${length} 0
              M ${width - length} 0 L ${width} 0 L ${width} ${length}
              M ${width} ${height - length} L ${width} ${height} L ${
                width - length
              } ${height}
              M 0 ${height - length} L 0 ${height} L ${length} ${height}
              `;
    const bounds = Object.assign(
      {
        x: 0,
        y: 0,
      },
      size,
    );
    const fillD = Object(brushes.rect)(bounds);
    setBoundaryPath(boundary, d, fillD);
  },
  [BOUNDARYSHAPE.CROSS]: function (boundary, size) {
    const width = size.width;
    const height = size.height;
    const length = layoutConstant.CROSSBOUNDARYLEN;
    const d = `M ${-length} 0 L ${width + length} 0
              M ${width} ${-length} L ${width} ${height + length}
              M ${-length} ${height} L ${width + length} ${height}
              M 0 ${-length} L 0 ${height + length}`;
    const bounds = Object.assign(
      {
        x: 0,
        y: 0,
      },
      size,
    );
    const fillD = Object(brushes.rect)(bounds);
    setBoundaryPath(boundary, d, fillD);
  },
};
function getPolygonPoints(boundary, size) {
  const branch = boundary.parent();
  //todo direction of master boundary
  const direction = getStructure(
    branch.getStructureClass(),
  ).getChildTargetOrientation(branch, boundary.model.rangeStart);
  const minX = 0;
  const minY = 0;
  const maxX = size.width;
  const maxY = size.height;
  const topLeft = {
    x: minX,
    y: minY,
  };
  const topRight = {
    x: maxX,
    y: minY,
  };
  const bottomLeft = {
    x: minX,
    y: maxY,
  };
  const bottomRight = {
    x: maxX,
    y: maxY,
  };
  let point1;
  let point2;
  switch (direction) {
    case DIRECTION.DOWN:
      point1 = topLeft;
      point2 = topRight;
      break;
    case DIRECTION.UP:
      point1 = bottomLeft;
      point2 = bottomRight;
      break;
    case DIRECTION.RIGHT:
      point1 = topLeft;
      point2 = bottomLeft;
      break;
    case DIRECTION.LEFT:
      point1 = topRight;
      point2 = bottomRight;
      break;
  }
  const children = branch.getChildrenBranchesByType().filter((item) => {
    return item.isPlaceHolderView !== true;
  });
  let pointArr = [];
  const pos = boundary.getRealPosition();
  if (boundary.model.get("range") === "master") {
    pointArr = pointArr.concat(
      getDescendantCornerPoints(pos, branch, direction),
    );
  } else {
    for (let i = boundary.model.rangeStart; i <= boundary.model.rangeEnd; i++) {
      if (!children[i]) {
        boundary.getContext().config(CONFIG.LOGGER).warn("empty children");
      }
      pointArr = pointArr.concat(
        getDescendantCornerPoints(pos, children[i], direction),
      );
    }
  }
  pointArr.push(point1);
  pointArr.push(point2);
  return Util.convexHull(pointArr);
}
function getDescendantCornerPoints(basePos, branch, direction) {
  const result = [];
  let attr1;
  let attr2;
  switch (direction) {
    case DIRECTION.UP:
      attr1 = "topLeft";
      attr2 = "topRight";
      break;
    case DIRECTION.DOWN:
      attr1 = "bottomLeft";
      attr2 = "bottomRight";
      break;
    case DIRECTION.LEFT:
      attr1 = "topLeft";
      attr2 = "bottomLeft";
      break;
    case DIRECTION.RIGHT:
      attr1 = "topRight";
      attr2 = "bottomRight";
  }
  _getPoints(branch);
  function _getPoints(br) {
    if (br.shouldHide()) {
      return;
    }
    const pos = br.getRealPosition();
    const deltaX = pos.x - basePos.x;
    const deltaY = pos.y - basePos.y;
    const cornerPoint = getCornerPoint(br);
    const p1 = cornerPoint[attr1];
    const p2 = cornerPoint[attr2];
    p1.x += deltaX;
    p2.x += deltaX;
    p1.y += deltaY;
    p2.y += deltaY;
    result.push(p1);
    result.push(p2);
    if (!br.collapse && !br.isPlaceHolderView) {
      const children = br.getChildrenBranchesByType([
        TOPIC_TYPE.ATTACHED,
        TOPIC_TYPE.CALLOUT,
        TOPIC_TYPE.SUMMARY,
      ]);
      children.forEach((item) => {
        _getPoints(item);
      });
    }
  }
  return result;
}
function getCornerPoint(branch) {
  const gap = boundaryGap;
  const topicBounds = branch.topicView.bounds;
  const minX = topicBounds.x - gap;
  const minY = topicBounds.y - gap;
  const maxX = topicBounds.x + topicBounds.width + gap;
  const maxY = topicBounds.y + topicBounds.height + gap;
  return {
    topLeft: {
      x: minX,
      y: minY,
    },
    topRight: {
      x: maxX,
      y: minY,
    },
    bottomLeft: {
      x: minX,
      y: maxY,
    },
    bottomRight: {
      x: maxX,
      y: maxY,
    },
  };
}
function drawRoundPolygon(pointArr, boundaryView) {
  if (pointArr.length >= 3) {
    const tmpArr = pointArr.slice();
    tmpArr[tmpArr.length] = tmpArr[0];
    let p1;
    let p2;
    let rp1;
    let rp2;
    let dis;
    let d = "";
    let firstPoint; // a point, must be non-null, because pointArr.length > 0
    for (let i = 1; i < tmpArr.length; i++) {
      p1 = tmpArr[i - 1];
      p2 = tmpArr[i];
      dis = Util.calculateDistance(p1, p2);
      if (dis > corner) {
        rp1 = {
          x: (corner * (p2.x - p1.x)) / dis + p1.x,
          y: (corner * (p2.y - p1.y)) / dis + p1.y,
        };
        rp2 = {
          x: ((dis - corner) * (p2.x - p1.x)) / dis + p1.x,
          y: ((dis - corner) * (p2.y - p1.y)) / dis + p1.y,
        };
      } else {
        rp1 = {
          x: ((dis / 2) * (p2.x - p1.x)) / dis + p1.x,
          y: ((dis / 2) * (p2.y - p1.y)) / dis + p1.y,
        };
        rp2 = {
          x: rp1.x,
          y: rp1.y,
        };
      }
      if (d === "") {
        d += "M " + rp1.x + " " + rp1.y;
        firstPoint = rp1;
      } else {
        d += " Q " + p1.x + " " + p1.y + " " + rp1.x + " " + rp1.y;
      }
      d += " L " + rp2.x + " " + rp2.y;
    }
    d +=
      " Q " +
      tmpArr[0].x +
      " " +
      tmpArr[0].y +
      " " +
      firstPoint.x +
      " " +
      firstPoint.y;
    d += " Z";
    setBoundaryPath(boundaryView, d);
  }
}
function drawPolygon(pointArr, boundaryView) {
  if (pointArr.length >= 3) {
    const p1 = pointArr.shift();
    let d = "M " + p1.x + " " + p1.y;
    pointArr.forEach((item) => {
      d += " L " + item.x + " " + item.y;
    });
    d += " Z";
    setBoundaryPath(boundaryView, d);
  }
}
/* harmony default export */
export const boundaryshapes = (key) => {
  if (!BoundaryShape[key]) {
    config.get(CONFIG.LOGGER).warn(`Unsupported boundary shape class: ${key}`);
    return BoundaryShape[BOUNDARYSHAPE.ROUNDEDRECT];
  }
  return BoundaryShape[key];
};

import jquery from "jquery";

import {
  STYLE_KEYS,
  ARROW_CLASS,
  DIRECTION,
} from "../../common/constants/index";
import * as utils from "../index";

class ArrowPathExporter {
  arrowPathView: any;
  arrowSelector: any;
  constructor() {
    this.arrowPathView = null;
    this.arrowSelector = null;
  }
  export(arrowPathView, arrowSelector) {
    this.arrowPathView = arrowPathView;
    this.arrowSelector = arrowSelector;
    return this.generateArrowExporterInfo().map((arrowExporterInfo) => {
      const { $elem, styleKey, styleValue } = arrowExporterInfo;
      const transformAttrs = this.getArrowTransformAttrs(styleKey, styleValue);
      $elem.attr("transform", transformAttrs);
      return $elem;
    });
  }
  generateArrowExporterInfo() {
    let _a;
    let _b;
    const beginArrowInfo = Object.assign(
      Object.assign(
        {},
        (_a = this.arrowSelector) === null || _a === undefined
          ? undefined
          : _a.getBeginArrowDomInfo(),
      ),
      {
        styleKey: STYLE_KEYS.ARROW_BEGIN_CLASS,
      },
    );
    const endArrowInfo = Object.assign(
      Object.assign(
        {},
        (_b = this.arrowSelector) === null || _b === undefined
          ? undefined
          : _b.getEndArrowDomInfo(),
      ),
      {
        styleKey: STYLE_KEYS.ARROW_END_CLASS,
      },
    );
    return [beginArrowInfo, endArrowInfo]
      .filter((arrowInfo) => {
        return arrowInfo.arrowClass !== ARROW_CLASS.NONE;
      })
      .map((arrowInfo) => {
        const $elem = jquery(arrowInfo.s$SVG.node.innerHTML);
        $elem.attr({
          stroke: arrowInfo.s$SVG.attr("stroke"),
          fill: arrowInfo.s$SVG.attr("fill"),
        });
        return {
          $elem: $elem,
          styleValue: arrowInfo.arrowClass,
          styleKey: arrowInfo.styleKey,
        };
      });
  }
  getArrowRef(arrowStyleKey) {
    let _a;
    let _b;
    let $arrowDom;
    if (arrowStyleKey === STYLE_KEYS.ARROW_BEGIN_CLASS) {
      $arrowDom =
        (_a = this.arrowSelector) === null || _a === undefined
          ? undefined
          : _a.getBeginArrowDomInfo().s$SVG;
    } else {
      $arrowDom =
        (_b = this.arrowSelector) === null || _b === undefined
          ? undefined
          : _b.getEndArrowDomInfo().s$SVG;
    }
    return {
      refX: parseInt($arrowDom.attr("refX")),
      refY: parseInt($arrowDom.attr("refY")),
    };
  }
  getArrowTransformAttrs(arrowStyleKey, arrowClass) {
    const scale = this.getArrowScale();
    const arrowCenter =
      utils.ArrowSelector.getArrowStaticInfo(arrowClass).arrowCenter;
    const scaleFragment = `translate(${arrowCenter} ${arrowCenter}) scale(${scale}) translate(-${arrowCenter} -${arrowCenter})`;
    const startPoint = this.getRotateStartPoint(arrowStyleKey);
    const targetPoint = this.getRotateTargetPoint(arrowStyleKey);
    const rotateValue =
      (Math.atan2(targetPoint.y - startPoint.y, targetPoint.x - startPoint.x) *
        180) /
      Math.PI;
    const rotateFragment = `rotate(${rotateValue} ${arrowCenter} ${arrowCenter})`;
    return `${this.getTranslateFragment(
      arrowStyleKey,
      arrowClass,
    )} ${rotateFragment} ${scaleFragment}`;
  }
  getArrowScale() {
    throw new Error("Method not implemented.");
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTranslateFragment(arrowStyleKey, arrowClass) {
    const { refX, refY } = this.getArrowRef(arrowStyleKey);
    const arrowRealPosition = this.getArrowRealPosition(arrowStyleKey);
    const translateFragment = `translate(${arrowRealPosition.x - refX} ${
      arrowRealPosition.y - refY
    })`;
    return translateFragment;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getArrowRealPosition(arrowStyleKey: any): any {
    throw new Error("Method not implemented.");
  }
  getRotateStartPoint(arrowStyleKey): any {
    return this.getArrowRealPosition(arrowStyleKey);
  }
  getRotateTargetPoint(arrowStyleKey): any {
    return this.getArrowTargetRealPosition(arrowStyleKey);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getArrowTargetRealPosition(arrowStyleKey: any) {
    throw new Error("Method not implemented.");
  }
}
class RelationshipArrowPathExporter extends ArrowPathExporter {
  constructor() {
    super();
    this.arrowPathView = null;
  }
  getArrowRealPosition(arrowStyleKey) {
    const arrowPathView = this.arrowPathView;
    switch (arrowStyleKey) {
      case STYLE_KEYS.ARROW_BEGIN_CLASS:
        return arrowPathView.posInfo.insectPoint1;
      case STYLE_KEYS.ARROW_END_CLASS:
        return arrowPathView.posInfo.insectPoint2;
    }
  }
  getArrowTargetRealPosition(arrowStyleKey) {
    const arrowPathView = this.arrowPathView;
    switch (arrowStyleKey) {
      case STYLE_KEYS.ARROW_BEGIN_CLASS:
        return arrowPathView.posInfo.controlPoint1;
      case STYLE_KEYS.ARROW_END_CLASS:
        return arrowPathView.posInfo.controlPoint2;
    }
  }
  getArrowScale() {
    return this.arrowPathView.figure.lineWidth;
  }
  getRotateStartPoint(arrowStyleKey) {
    switch (arrowStyleKey) {
      case STYLE_KEYS.ARROW_BEGIN_CLASS:
        return this.getArrowRealPosition(arrowStyleKey);
      case STYLE_KEYS.ARROW_END_CLASS:
        return this.getArrowTargetRealPosition(arrowStyleKey);
    }
  }
  getRotateTargetPoint(arrowStyleKey) {
    switch (arrowStyleKey) {
      case STYLE_KEYS.ARROW_BEGIN_CLASS:
        return this.getArrowTargetRealPosition(arrowStyleKey);
      case STYLE_KEYS.ARROW_END_CLASS:
        return this.getArrowRealPosition(arrowStyleKey);
    }
  }
}
class ConnectionArrowPathExporter extends ArrowPathExporter {
  constructor() {
    super();
    this.arrowPathView = null;
  }
  getArrowRealPosition(arrowStyleKey) {
    const arrowPathView = this.arrowPathView;
    switch (arrowStyleKey) {
      case STYLE_KEYS.ARROW_BEGIN_CLASS:
        return arrowPathView.figure.startPoint;
      case STYLE_KEYS.ARROW_END_CLASS:
        return arrowPathView.figure.endPoint;
    }
  }
  getChildTargetOrientation() {
    let _a;
    const endBranchView =
      (_a = this.arrowPathView) === null || _a === undefined
        ? undefined
        : _a.parent();
    const startBranchView = endBranchView.parent();
    const structureObject = startBranchView.getStructureObject();
    return structureObject.getChildTargetOrientation(
      startBranchView,
      endBranchView.branchIndex(),
    );
  }
  getArrowTargetRealPosition(arrowStyleKey) {
    const tempDistant = 10;
    const arrowTargetRealPosition = Object.assign(
      {},
      this.getArrowRealPosition(arrowStyleKey),
    );
    const direction = this.getChildTargetOrientation();
    // for full vertical brace line only
    if (arrowStyleKey === STYLE_KEYS.ARROW_BEGIN_CLASS) {
      switch (direction) {
        case DIRECTION.RIGHT: {
          arrowTargetRealPosition.x += tempDistant;
          break;
        }
        case DIRECTION.LEFT: {
          arrowTargetRealPosition.x -= tempDistant;
          break;
        }
      }
    } else {
      switch (direction) {
        case DIRECTION.RIGHT: {
          arrowTargetRealPosition.x -= tempDistant;
          break;
        }
        case DIRECTION.LEFT: {
          arrowTargetRealPosition.x += tempDistant;
          break;
        }
        case DIRECTION.DOWN: {
          arrowTargetRealPosition.y -= tempDistant;
          break;
        }
        case DIRECTION.UP: {
          arrowTargetRealPosition.y += tempDistant;
          break;
        }
      }
    }
    return arrowTargetRealPosition;
  }
  getTranslateFragment(arrowStyleKey) {
    const { refX, refY } = this.getArrowRef(arrowStyleKey);
    const arrowRealPosition = this.getArrowRealPosition(arrowStyleKey);
    let lineRefX = 0;
    let lineRefY = 0;
    const direction = this.getChildTargetOrientation();
    const lineWidth = this.arrowPathView.figure.lineWidth;
    if (direction === DIRECTION.UP || direction === DIRECTION.DOWN) {
      lineRefX = lineRefX + lineWidth;
      lineRefY = lineRefY + lineWidth;
    }
    if (arrowStyleKey === STYLE_KEYS.ARROW_BEGIN_CLASS) {
      lineRefX = lineRefX - lineWidth;
    }
    const translateFragment = `translate(${
      arrowRealPosition.x - refX - lineRefX
    } ${arrowRealPosition.y - refY - lineRefY})`;
    return translateFragment;
  }
  getArrowScale() {
    return this.arrowPathView.figure.lineWidth;
  }
}
class FishBoneMainLineArrowPathExporter extends ArrowPathExporter {
  constructor() {
    super();
    this.arrowPathView = null;
  }
  getArrowRealPosition() {
    return this.arrowPathView.figure.startPosition;
  }
  getArrowTargetRealPosition() {
    const parentBranchView = this.arrowPathView.parent();
    const arrowTargetRealPosition = Object.assign(
      {},
      parentBranchView.getRealPosition(),
    );
    if (this.isRangeGrowToDown()) {
      arrowTargetRealPosition.y += parentBranchView.topicView.bounds.height / 2;
    } else {
      arrowTargetRealPosition.y -= parentBranchView.topicView.bounds.height / 2;
    }
    return arrowTargetRealPosition;
  }
  getTranslateFragment(arrowStyleKey, arrowClass) {
    const { refX, refY } = this.getArrowRef(arrowStyleKey);
    const arrowRealPosition = this.getArrowRealPosition();
    let lineRefX = 0;
    let lineRefY = 0;
    const lineWidth = this.arrowPathView.figure.styleWidth;
    switch (arrowClass) {
      case ARROW_CLASS.HERRINGBONE:
      case ARROW_CLASS.DIAMOND:
      case ARROW_CLASS.DOUBLEARROW:
      case ARROW_CLASS.SQUARE:
      case ARROW_CLASS.TRIANGLE:
      case ARROW_CLASS.DOT:
        lineRefX = this.isDirectionToRight()
          ? lineWidth * -0.4
          : lineWidth * 0.4;
        break;
      case ARROW_CLASS.ANTITRIANGLE:
      case ARROW_CLASS.SPEARHEAD:
        lineRefX = this.isDirectionToRight()
          ? lineWidth * -0.3
          : lineWidth * 0.3;
        break;
      case ARROW_CLASS.ATTACHED:
        lineRefX = this.isDirectionToRight()
          ? lineWidth * -0.2
          : lineWidth * -0.2;
        lineRefY = this.isRangeGrowToDown() ? lineWidth * 3 : lineWidth * -3;
        break;
      case ARROW_CLASS.HOOK:
        lineRefX = this.isDirectionToRight()
          ? lineWidth * -2.6
          : lineWidth * 2.6;
        break;
    }
    return `translate(${arrowRealPosition.x - refX - lineRefX} ${
      arrowRealPosition.y - refY - lineRefY
    })`;
  }
  getArrowScale() {
    return this.arrowPathView.figure.styleWidth;
  }
  isRangeGrowToDown() {
    const parentBranchView = this.arrowPathView.parent();
    return (
      parentBranchView.getStructureObject().getRangeGrowthDirection() ===
      DIRECTION.DOWN
    );
  }
  isDirectionToRight() {
    const parentBranchView = this.arrowPathView.parent();
    return parentBranchView.getStructureObject().direction === DIRECTION.RIGHT;
  }
}

export const relationshipArrowPathExporter =
  new RelationshipArrowPathExporter();
export const connectionArrowPathExporter = new ConnectionArrowPathExporter();
export const fishBoneMainLineArrowPathExporter =
  new FishBoneMainLineArrowPathExporter();

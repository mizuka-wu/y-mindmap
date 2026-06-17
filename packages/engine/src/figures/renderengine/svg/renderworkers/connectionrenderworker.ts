import { LINE_PATTERN } from "../../../../common/constants/index";
import * as utils from "../../../../utils/index";
import * as lib from "../../../../lib/index";
import BranchView from "../../../../view/branchview";

function isConnectionSubContainerStartBranchView(branchView) {
  return (
    Object(utils.isCentralBranch)(branchView) ||
    Object(utils.isDetachedBranch)(branchView)
  );
}
function getConnectionSubContainerId(connectionView) {
  let startBranchView = connectionView.parent();
  while (!isConnectionSubContainerStartBranchView(startBranchView)) {
    if (!(startBranchView.parent() instanceof BranchView)) {
      break;
    }
    startBranchView = startBranchView.parent();
  }
  return startBranchView.model.getId();
}
export class ConnectionRenderWorker {
  figure: any;
  s$svg: any;
  connectionSelectBox: any;
  constructor(figure) {
    this.figure = figure;
    this.initSVGStructure();
  }
  initSVGStructure() {
    this.s$svg = new lib.SVG.Path()
      .data("name", "connection")
      .attr("stroke-linecap", "round");
  }
  work() {
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    const endBranchView = this.figure.viewController.parent();
    if (
      Object(utils.isDetachedBranch)(endBranchView) ||
      Object(utils.isCentralBranch)(endBranchView)
    ) {
      return;
    }
    if (this.figure.isVisible) {
      this.s$svg.show();
    } else {
      this.s$svg.hide();
    }
    if (this.figure.linePathDirty) {
      this.updateLinePattern();
      this.figure.linePathDirty = false;
    }
    if (this.figure.lineColorDirty) {
      this.s$svg.attr("stroke", this.figure.lineColor);
      this.figure.lineColorDirty = false;
    }
    if (this.figure.linePatternDirty) {
      this.updateLinePattern();
      this.figure.linePathDirty = false;
    }
    this.updateLineTaperedStyle();
    if (this.connectionSelectBox) {
      if (this.figure.isVisible) {
        this.connectionSelectBox.show();
      } else {
        this.connectionSelectBox.hide();
      }
      if (this.figure.selectBoxAttrsDirty) {
        this.connectionSelectBox.attr(this.figure.selectBoxAttrsToPack);
        this.figure.selectBoxAttrsToPack = {};
        this.figure.selectBoxAttrsDirty = false;
      }
    }
    if (this.figure.positionDirty) {
      this.s$svg.translate(this.figure.position.x, this.figure.position.y);
      if (this.connectionSelectBox) {
        this.connectionSelectBox.translate(
          this.figure.position.x,
          this.figure.position.y,
        );
      }
      this.figure.positionDirty = false;
    }
    if (this.figure.isVisibleDirty) {
      this.figure.isVisibleDirty = false;
    }
    if (this.figure.opacityDirty) {
      this.s$svg.attr("opacity", this.figure.opacity);
      this.figure.opacityDirty = false;
    }
    const options = {
      connectionSubContainerId: getConnectionSubContainerId(
        this.figure.viewController,
      ),
    };
    const sheetRenderWorker = parentFigure.renderWorker;
    sheetRenderWorker.appendChild("connection", this.s$svg, options);
    if (this.connectionSelectBox) {
      sheetRenderWorker.appendChild(
        "connection",
        this.connectionSelectBox,
        options,
      );
    }
  }
  updateLineTaperedStyle() {
    const useFill =
      this.figure.lineTapered &&
      ![LINE_PATTERN.HANDDRAWNDASH, LINE_PATTERN.HANDDRAWNSOLID].includes(
        this.figure.linePattern,
      );
    this.s$svg.attr("stroke-width", useFill ? 0 : this.figure.lineWidth);
    this.s$svg.attr("fill", useFill ? this.figure.lineColor : "none");
  }
  updateLinePattern() {
    const endBranch = this.figure.viewController.parent();
    const startBranch = endBranch.parent();
    const structureClass = startBranch.getStructureClass();
    const linePatternAttr = utils.getComplexLinePatternAttr(
      this.figure.linePattern,
      {
        lineWidth: this.figure.lineWidth,
        linePath: this.figure.linePath,
        isTaperedLine: this.figure.lineTapered,
        startBranchPosition: startBranch.getRealPosition(),
        endBranchPosition: endBranch.getRealPosition(),
        isTopicConnection: !this.figure.lineTapered,
        figure: this.figure,
        structureClass: structureClass,
      },
    );
    this.s$svg.attr(linePatternAttr);
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  appendChild(childType, childNode, options) {}
  getContent() {
    return this.s$svg;
  }
  dispose() {
    if (this.connectionSelectBox) {
      this.connectionSelectBox.remove();
      this.connectionSelectBox = null;
    }
    this.s$svg.remove();
  }
}

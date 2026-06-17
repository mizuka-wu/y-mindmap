import jquery from "jquery";

import * as lib from "../../../../lib/index";
import type { Figure } from "../../../figure";
export class SheetRenderWorker {
  connectionMaskMap: Map<any, any>;
  figure: Figure;
  svg: any;
  matrixContainer: any;
  treeTableCellContainer: any;
  connectionContainer: any;
  boundaryContainer: any;
  branchContainer: any;
  relationshipContainer: any;
  selectBoxContainer: any;
  topicSelectBoxContainer: any;
  otherContainer: any;
  _cloneG: any;
  constructor(figure: Figure) {
    this.connectionMaskMap = new Map();
    this.figure = figure;
    this.initSVGStructure();
  }
  initSVGStructure() {
    this.svg = new lib.SVG.G().data("name", "sheet");
    this.matrixContainer = this.svg.group().data("name", "matrix-container");
    this.treeTableCellContainer = this.svg
      .group()
      .data("name", "tree-map-cell-container");
    this.connectionContainer = this.svg
      .group()
      .data("name", "connection-container");
    this.boundaryContainer = this.svg
      .group()
      .data("name", "boundary-container");
    this.branchContainer = this.svg.group().data("name", "branch-container");
    this.relationshipContainer = this.svg
      .group()
      .data("name", "relationship-container");
    this.selectBoxContainer = this.svg
      .group()
      .data("name", "select-box-container");
    this.topicSelectBoxContainer = this.svg
      .group()
      .data("name", "topic-select-box-container");
    this.otherContainer = this.svg.group().data("name", "other-container");
    this._cloneG = this.svg.group().data("name", "cloneG").opacity(0.5);
  }
  work() {
    const context = this.figure.viewController.getContext();
    if (!context) {
      return;
    }
    const backgroundNode = context.getSVGView().svg.node;
    // wallpaper
    if (this.figure.wallpaperDirty) {
      jquery(backgroundNode)
        .siblings(".wallpaper")
        .css({
          "background-image": `url(${this.figure.wallpaper})`,
        });
      this.figure.wallpaperDirty = false;
    }
    // background color
    if (this.figure.backgroundColorDirty) {
      let backgroundColor = this.figure.backgroundColor;
      if (backgroundColor === "none") {
        backgroundColor = "transparent";
      }
      jquery(backgroundNode).css({
        "background-color": backgroundColor,
      });
      this.figure.backgroundColorDirty = false;
    }
    // opacity
    if (this.figure.opacityDirty) {
      jquery(backgroundNode).siblings(".wallpaper").css({
        opacity: this.figure.opacity,
      });
      this.figure.opacityDirty = false;
    }
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
  }
  appendChild(type, childNode, options) {
    switch (type) {
      case "branch":
        if (childNode.parent !== this.branchContainer) {
          this.branchContainer.add(childNode);
        }
        break;
      case "relationship":
        if (childNode.parent !== this.relationshipContainer) {
          this.relationshipContainer.add(childNode);
        }
        break;
      case "boundary":
        if (childNode.parent !== this.boundaryContainer) {
          this.boundaryContainer.add(childNode);
        }
        break;
      case "connection":
        this.appendChildNodeToTargetContainer(
          childNode,
          this.connectionContainer,
          options.connectionSubContainerId,
          (targetContainer) => {
            const connectionContainerMask = this.connectionMaskMap.get(
              options.connectionSubContainerId,
            );
            if (connectionContainerMask?.parent) {
              targetContainer.maskWith(connectionContainerMask);
            } else {
              // todo clear data while mask removed
              this.connectionMaskMap.delete(options.connectionSubContainerId);
            }
          },
        );
        break;
      case "connectionmask":
        this.appendConnectionMask(childNode, options.connectionSubContainerId);
        break;
      case "selectbox":
        if (childNode.parent !== this.selectBoxContainer) {
          this.selectBoxContainer.add(childNode);
        }
        break;
      case "topicselectbox":
        if (childNode.parent !== this.topicSelectBoxContainer) {
          this.topicSelectBoxContainer.add(childNode);
        }
        break;
      case "indicator":
        if (childNode.parent !== this.otherContainer) {
          this.otherContainer.add(childNode);
        }
        break;
      case "treetablecell":
        this.appendChildNodeToTargetContainer(
          childNode,
          this.treeTableCellContainer,
          options.treeTableHeadBranchViewId,
        );
        break;
      case "fishboneheadline":
        this.appendChildNodeToTargetContainer(
          childNode,
          this.connectionContainer,
          options.fishBoneHeadBranchViewId,
        );
        break;
      case "fishbonemainline":
        this.appendChildNodeToTargetContainer(
          childNode,
          this.connectionContainer,
          options.fishBoneHeadBranchViewId,
          () => {
            childNode.back();
          },
        );
        break;
      default:
        break;
    }
  }

  appendChildNodeToTargetContainer(
    childNode,
    targetOuterContainer,
    chidlDataId,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    afterAdd = (targetContainer) => {},
  ) {
    let targetContainer = targetOuterContainer.node.querySelector(
      `[data-id="${chidlDataId}"]`,
    )?.instance;
    if (!targetContainer) {
      targetContainer = targetOuterContainer.group().data("id", chidlDataId);
    }
    if (childNode.parent !== targetContainer) {
      targetContainer.add(childNode);
      afterAdd(targetContainer);
    }
  }
  appendConnectionMask(childNode, containerId) {
    this.connectionMaskMap.set(containerId, childNode);
    const targetContainer = this.connectionContainer.node.querySelector(
      `[data-id="${containerId}"]`,
    )?.instance;
    if (!targetContainer) {
      return;
    }
    targetContainer.maskWith(childNode);
  }
  getContent() {
    return this.svg;
  }
  dispose() {
    this.svg.remove();
  }
}

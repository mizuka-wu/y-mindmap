import * as lib from "../../../../lib/index";

const DISPLAY = {
  HOVER: "hover",
  ACTIVE: "active",
  HIDE: "hide",
};
const ANCHOR_SIZE = 16;
const ANCHOR_BTN_SIZE = 7;
const ANCHOR_BTN_MARGIN = (ANCHOR_SIZE - ANCHOR_BTN_SIZE) / 2;
export class ResizeBoxRenderWorker {
  firstActive: boolean;
  anchorSize: number;
  anchorBtnSize: number;
  anchorBtnMargin: number;
  figure: any;
  svg: any;
  box: any;
  anchors: {
    lt: any;
    lm: any;
    lb: any;
    ct: any;
    cb: any;
    rt: any;
    rm: any;
    rb: any;
  };
  anchorBtns: any;
  cloneImage: any;
  avatarContainer: any;
  avatarDisplayDirty: boolean;
  constructor(figure) {
    this.firstActive = true;
    this.anchorSize = ANCHOR_SIZE;
    this.anchorBtnSize = ANCHOR_BTN_SIZE;
    this.anchorBtnMargin = ANCHOR_BTN_MARGIN;
    this.figure = figure;
    this.svg = new lib.SVG.G().data("name", "resize-box").hide();
    this.box = this.svg.rect(0, 0).data("name", "fullBox");
    this.figure.viewController.style(this.box, "fullBox");
    const anchorCreator = (curosr) => this.svg.group().style("cursor", curosr);
    /*[anchors position]
     *   lt  ct  rt
     *   lm      rm
     *   lb  cb  rb
     */
    this.anchors = {
      lt: anchorCreator("nwse-resize"),
      lm: anchorCreator("ew-resize"),
      lb: anchorCreator("nesw-resize"),
      ct: anchorCreator("ns-resize"),
      cb: anchorCreator("ns-resize"),
      rt: anchorCreator("nesw-resize"),
      rm: anchorCreator("ew-resize"),
      rb: anchorCreator("nwse-resize"),
    };
    this.anchorBtns = {};
    Object.keys(this.anchors).forEach((key) => {
      const anchorGroup = this.anchors[key];
      // expand action area
      anchorGroup
        .rect(ANCHOR_SIZE, ANCHOR_SIZE)
        // .size(ANCHOR_SIZE, ANCHOR_SIZE)
        .opacity(0);
      // translate to center the anchorBtn, should change with actionArea
      this.anchorBtns[key] = anchorGroup
        .rect(ANCHOR_BTN_SIZE, ANCHOR_BTN_SIZE)
        // .size(ANCHOR_BTN_SIZE, ANCHOR_BTN_SIZE)
        .translate(ANCHOR_BTN_MARGIN, ANCHOR_BTN_MARGIN);
    });
    /* dom elements end */
    this.styleAnchors("anchor");
  }
  work() {
    let _a;
    let _b;
    let _d;
    let _e;
    let _f;
    const parentFigure = this.figure.getParent();
    if (!parentFigure) {
      return;
    }
    if (this.figure.lockRatioDirty) {
      Object.keys(this.anchors).forEach((key) => {
        const anchorGroup = this.anchors[key];
        if (["lm", "ct", "cb", "rm"].includes(key)) {
          anchorGroup[this.figure.lockRatio ? "hide" : "show"]();
        }
      });
      this.figure.lockRatioDirty = false;
    }
    if (this.figure.positionDirty) {
      const { x, y } = this.figure.position;
      const { width, height } = this.figure.size;
      this.svg.translate(x, y);
      if ((_a = this.cloneImage) === null || _a === undefined) {
        // do nothing
      } else {
        _a.attr("viewBox", `${x} ${y} ${width} ${height}`);
      }
      if ((_b = this.cloneImage) === null || _b === undefined) {
        // do nothing
      } else {
        _b.size(width, height).move(x, y);
      }
      this.figure.positionDirty = false;
    }
    if (this.figure.displayStateDirty) {
      switch (this.figure.displayState) {
        case DISPLAY.HOVER:
          this.svg.show();
          this.figure.viewController.style(this.box, "fullBox__show");
          break;
        case DISPLAY.ACTIVE:
          if (this.firstActive) {
            this.firstActive = false;
            this.prepareAvatar();
            this.figure.viewController.initSVGDraggable();
          }
          this.svg.show();
          this.figure.viewController.style(this.box, "fullBox__active");
          this.styleAnchors("anchor__active");
          break;
        case DISPLAY.HIDE:
          this.styleAnchors("anchor");
          this.svg.hide();
          break;
        default:
          break;
      }
      this.figure.displayStateDirty = false;
    }
    if (this.figure.sizeDirty) {
      const { width, height } = this.figure.size;
      this.box.size(width, height).move(0, 0);
      const { x = 0, y = 0 } = this.figure?.position || {};
      if ((_d = this.cloneImage) === null || _d === undefined) {
        // do nothing
      } else {
        _d.attr("viewBox", `${x} ${y} ${width} ${height}`);
      }
      if ((_e = this.cloneImage) === null || _e === undefined) {
        // do nothing
      } else {
        _e.size(width, height).move(x, y);
      }
      const pos = {
        l: 0,
        m: height / 2,
        r: width,
        t: 0,
        c: width / 2,
        b: height,
      };
      for (const k in this.anchors) {
        const x = -ANCHOR_SIZE / 2 + pos[k[0]];
        const y = -ANCHOR_SIZE / 2 + pos[k[1]];
        this.anchors[k].move(x, y);
      }
      this.figure.sizeDirty = false;
    }
    if (this.figure.avatarDisplayDirty) {
      if (this.figure.avatarDisplay) {
        this.avatarContainer.show();
        // 使avatar和imageview位置、旋转状态一致
        const realPosition =
          this.figure.viewController.refView.getRealPosition();
        this.avatarContainer.translate(realPosition.x, realPosition.y);
        // 以下代码与 rotation 有关
        // const topicView = this.figure.viewController.refView.parent()
        // const { rotation, cx, cy } = topicView.topicGroup.transform()
        // this.avatarContainer.rotate(rotation, cx + realPosition.x, cy + realPosition.y) //since in a absolute coordination, we need add branch's position.
        // this.figure.viewController.rotation = rotation
      } else {
        this.avatarContainer.hide();
      }
      this.avatarDisplayDirty = false;
    }
    if (this.figure.avatarSizeDirty) {
      const { width, height, x, y } = this.figure.avatarSize;
      this.box.size(width, height).move(x, y);
      const pos = {
        l: x,
        m: height / 2 + y,
        r: width + x,
        t: y,
        c: width / 2 + x,
        b: height + y,
      };
      for (const k in this.anchors) {
        const anchorX = -ANCHOR_SIZE / 2 + pos[k[0]];
        const anchorY = -ANCHOR_SIZE / 2 + pos[k[1]];
        this.anchors[k].move(anchorX, anchorY);
      }
      if ((_f = this.cloneImage) === null || _f === undefined) {
        // do nothing
      } else {
        _f.size(width, height).move(x, y);
      }
      this.figure.avatarSizeDirty = false;
    }
    if (this.figure.isVisibleDirty) {
      if (this.figure.isVisible) {
        this.svg.show();
      } else {
        this.svg.hide();
      }
      this.figure.isVisibleDirty = false;
    }
    parentFigure.renderWorker.appendChild("resizebox", this.svg);
  }
  getContent() {
    return this.svg;
  }
  dispose() {
    if (this.avatarContainer) {
      this.avatarContainer.remove();
    }
    this.svg.remove();
  }
  /**
   * 放在other container中，用来显示在所有图层的最上面。
   * <OtherContainer>
   *   <AvatarContainer>
   *   <CloneImage>
   *   <Use Box>
   *   <Use Anchors>
   */
  prepareAvatar() {
    this.avatarContainer = new lib.SVG.G()
      .data("name", "resize-box-avatar")
      .hide();
    this.cloneImage = this.avatarContainer.put(new lib.SVG.Nested());
    this.cloneImage.attr("preserveAspectRatio", "none");
    const originImage = this.figure.viewController.originImage;
    this.cloneImage
      .put(new lib.SVG.Use())
      .attr("href", `#${originImage.attr("id")}`);
    const { x = 0, y = 0 } = this.figure?.position || {};
    const width = originImage.attr("width");
    const height = originImage.attr("height");
    this.cloneImage.attr("viewBox", `${x} ${y} ${width} ${height}`);
    this.cloneImage.size(width, height).move(x, y);
    this.figure.viewController.style(this.cloneImage, "avatarImage");
    this.avatarContainer.use(this.box);
    for (const k in this.anchors) {
      this.avatarContainer.use(this.anchors[k]);
    }
    const sheetView = this.figure.viewController.refView.editDomain().content();
    sheetView.otherContainer.add(this.avatarContainer);
  }
  styleAnchors(cls) {
    for (const k in this.anchorBtns) {
      this.figure.viewController.style(this.anchorBtns[k], cls);
    }
  }
  appendChild() {}
}

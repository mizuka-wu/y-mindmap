import Figure from "./figure";

const DISPLAY = {
  HOVER: "hover",
  ACTIVE: "active",
  HIDE: "hide",
};
export class ResizeBoxFigure extends Figure {
  displayState: string;
  displayStateDirty: boolean;
  avatarDisplay: any;
  avatarDisplayDirty: boolean;
  avatarSizeDirty: boolean;
  avatarSize: any;
  lockRatio: any;
  lockRatioDirty: boolean;
  setHover() {
    if (this.displayState !== DISPLAY.HOVER) {
      this.displayState = DISPLAY.HOVER;
      this.displayStateDirty = true;
      this.invalidatePaint();
    }
  }
  setActive() {
    if (this.displayState !== DISPLAY.ACTIVE) {
      this.displayState = DISPLAY.ACTIVE;
      this.displayStateDirty = true;
      this.invalidatePaint();
    }
  }
  setHide() {
    if (this.displayState !== DISPLAY.HIDE) {
      this.displayState = DISPLAY.HIDE;
      this.displayStateDirty = true;
      this.invalidatePaint();
    }
  }
  setAvatarDisplay(avatarDisplay) {
    if (this.avatarDisplay !== avatarDisplay) {
      this.avatarDisplay = avatarDisplay;
      this.avatarDisplayDirty = true;
      this.invalidatePaint();
    }
  }
  setAvatarSize(avatarSize) {
    this.avatarSizeDirty = true;
    this.avatarSize = avatarSize;
    this.invalidatePaint();
  }
  setLockRatio(lock) {
    if (this.lockRatio !== lock) {
      this.lockRatio = lock;
      this.lockRatioDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
}

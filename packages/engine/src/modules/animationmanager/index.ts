import { MODULE_NAME } from "../../common/constants/index";

import { branch } from "./branch";
import { boundary } from "./boundary";
import { relationship } from "./relationship";

const allAnimation = Object.assign(
  Object.assign(Object.assign({}, branch), boundary),
  relationship,
);
export class AnimationManager {
  currentAnimationMap: any;
  static identifier: string;
  constructor() {
    this.currentAnimationMap = {};
  }
  pushAnimationHook(flag, animationHook) {
    if (!this.currentAnimationMap[flag]) {
      this.currentAnimationMap[flag] = [];
    }
    this.currentAnimationMap[flag].push(animationHook);
  }
  startAnimation(animationFlag, params) {
    const animationHook = allAnimation[animationFlag](params);
    this.pushAnimationHook(animationFlag, animationHook);
    return animationHook;
  }
  killAnimationByFlag(animationFlag) {
    const targetFlagAnimationList = this.currentAnimationMap[animationFlag];
    if (!targetFlagAnimationList) {
      return;
    }
    targetFlagAnimationList.forEach((animationHook) => {
      animationHook.kill();
    });
    this.currentAnimationMap[animationFlag] = [];
  }
  reverseAnimationByFlag(animationFlag) {
    const targetFlagAnimationList = this.currentAnimationMap[animationFlag];
    if (!targetFlagAnimationList) {
      return;
    }
    targetFlagAnimationList.forEach((animationHook) => {
      animationHook.reverse();
    });
    this.currentAnimationMap[animationFlag] = [];
  }
}
AnimationManager.identifier = MODULE_NAME.ANIMATION;

export default AnimationManager;

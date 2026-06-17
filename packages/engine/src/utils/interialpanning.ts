/** 惯性滚动函数
 * @param {number} friction resistance
 */
export class InertialPanning {
  friction: number;
  posArr: any[];
  timestampArr: any[];
  raf: any;
  cb: any;
  constructor(friction = -0.005) {
    this.friction = friction;
    this.posArr = []; //save last 4 postion, to caculate speed.
    this.timestampArr = [];
    this.raf = null;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  init(startPoint) {
    this.posArr = [];
    this.timestampArr = [];
    this.raf = null;
  }
  setMovingPos(pos) {
    this.posArr.push(pos);
    this.timestampArr.push(Date.now());
    if (this.timestampArr.length > 6) {
      this.timestampArr.shift();
      this.posArr.shift();
    }
  }
  auto(cb) {
    this.cb = cb;
    const len = this.timestampArr.length;
    if (len === 0) {
      return;
    }
    const posYoung = this.posArr[len - 1];
    const posOld = this.posArr[0];
    const deltaT = this.timestampArr[len - 1] - this.timestampArr[0];
    const deltaX = posYoung.x - posOld.x;
    const deltaY = posYoung.y - posOld.y;
    this._inertia(
      Date.now(),
      Math.abs(deltaX) / deltaT,
      deltaX > 0 ? 1 : -1,
      posYoung.x,
      Math.abs(deltaY) / deltaT,
      deltaY > 0 ? 1 : -1,
      posYoung.y,
    );
  }
  _inertia(t1, vX, dirX, x, vY, dirY, y) {
    this.raf = requestAnimationFrame(() => {
      const now = Date.now();
      // velocity: old speed + accel_over_time
      const deltaT = now - t1;
      let deltaPosX = 0;
      let deltaPosY = 0;
      let stopped = true;
      vX += this.friction * deltaT;
      vY += this.friction * deltaT;
      if (vX > 0) {
        stopped = false;
        deltaPosX = dirX * vX * deltaT;
      }
      if (vY > 0) {
        stopped = false;
        deltaPosY = dirY * vY * deltaT;
      }
      this.cb(deltaPosX, deltaPosY);
      if (!stopped && this.raf) {
        this._inertia(now, vX, dirX, x + deltaPosX, vY, dirY, y + deltaPosY);
      }
    });
  }
}
/* harmony default export */
export default InertialPanning;

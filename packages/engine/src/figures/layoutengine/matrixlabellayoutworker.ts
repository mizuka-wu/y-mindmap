import { titleLayoutWorker } from "./titlelayoutworker";
export const matrixLabelLayoutWorker = {
  work(viewController) {
    titleLayoutWorker.work(viewController);
    const textBounds = Object.assign({}, viewController.bounds);
    const { marginLeft, marginRight, marginTop, marginBottom } =
      viewController.marginInfo;
    viewController.bounds = {
      x: textBounds.x - marginLeft,
      y: textBounds.y - marginTop,
      width: marginLeft + textBounds.width + marginRight,
      height: marginTop + textBounds.height + marginBottom,
    };
  },
};

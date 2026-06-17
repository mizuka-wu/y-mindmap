const OVERLAP_SCALE = 5 / 6;

export const markersLayoutWorker = {
  work(viewController) {
    const markersView = viewController;
    const { markerIdList } = markersView;
    if (!markerIdList || markerIdList.length <= 0) {
      markersView.bounds = {
        x: 0,
        y: 0,
        width: 0,
        height: 0,
      };
      return {
        width: 0,
        height: 0,
      };
    }
    let width = 0;
    let height = 0;
    const length = markerIdList.length;
    for (let index = 0; index < length; index++) {
      const markerId = markerIdList[index];
      const view = markersView.getMarkerView(markerId);
      view.figure.setPosition({
        x: width,
        y: 0,
      });
      const iconSize = view.figure.size.width;
      const overLapSize = iconSize * OVERLAP_SCALE;
      if (index === length - 1) {
        width += iconSize;
        height = iconSize;
      } else {
        width += overLapSize;
      }
    }
    markersView.bounds = {
      x: 0,
      y: 0,
      width,
      height,
    };
    return {
      width,
      height,
    };
  },
};

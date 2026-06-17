import Figure from "./figure";

export class MarkersFigure extends Figure {
  markerIdList: any;
  markerIdListDirty: boolean;
  setMarkerIdList(markerIdList) {
    if (this.markerIdList !== markerIdList) {
      this.markerIdList = markerIdList;
      this.markerIdListDirty = true;
      this.invalidateLayout();
    }
  }
}

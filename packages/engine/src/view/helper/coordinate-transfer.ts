import * as utils from "../../utils/index";
const COORDINATE_NAME_VIEWPORT = "viewport";
const COORDINATE_NAME_VISIBLE_AREA = "visibleArea";
const COORDINATE_NAME_ENLARGED_AREA = "enlargedArea";
export class CoordinateTransfer {
  _mindMapOriginPositionGetter: any;
  _mindMapScaleGetter: any;
  constructor(mindMapCenterPositionGetter, mindMapScaleGetter) {
    this._mindMapOriginPositionGetter = mindMapCenterPositionGetter;
    this._mindMapScaleGetter = mindMapScaleGetter;
  }
  mindMapToViewport(p) {
    const mindMapCenterPositionInViewport = this._mindMapOriginPositionGetter(
      COORDINATE_NAME_VIEWPORT,
    );
    const scale = this._mindMapScaleGetter();
    return {
      x: p.x * scale + mindMapCenterPositionInViewport.x,
      y: p.y * scale + mindMapCenterPositionInViewport.y,
    };
  }
  viewportToMindMap(p) {
    const mindMapCenterPositionInViewport = this._mindMapOriginPositionGetter(
      COORDINATE_NAME_VIEWPORT,
    );
    const pInMindMap = Object(utils.relativePositionFor)(
      p,
      mindMapCenterPositionInViewport,
    );
    const scale = this._mindMapScaleGetter();
    return {
      x: pInMindMap.x / scale,
      y: pInMindMap.y / scale,
    };
  }
  mindMapToVisibleArea(p) {
    const mindMapCenterPositionInVisibleArea =
      this._mindMapOriginPositionGetter(COORDINATE_NAME_VISIBLE_AREA);
    const scale = this._mindMapScaleGetter();
    return {
      x: p.x * scale + mindMapCenterPositionInVisibleArea.x,
      y: p.y * scale + mindMapCenterPositionInVisibleArea.y,
    };
  }
  visibleAreaToMindMap(p) {
    const mindMapCenterPositionInVisibleArea =
      this._mindMapOriginPositionGetter(COORDINATE_NAME_VISIBLE_AREA);
    const pInMindMap = Object(utils.relativePositionFor)(
      p,
      mindMapCenterPositionInVisibleArea,
    );
    const scale = this._mindMapScaleGetter();
    return {
      x: pInMindMap.x / scale,
      y: pInMindMap.y / scale,
    };
  }
  mindMapToEnlargedArea(p) {
    const mindMapCenterPositionInEnlargedArea =
      this._mindMapOriginPositionGetter(COORDINATE_NAME_ENLARGED_AREA);
    const scale = this._mindMapScaleGetter();
    return {
      x: p.x * scale + mindMapCenterPositionInEnlargedArea.x,
      y: p.y * scale + mindMapCenterPositionInEnlargedArea.y,
    };
  }
  enlargedAreaToMindMap(p) {
    const mindMapCenterPositionInEnlargedArea =
      this._mindMapOriginPositionGetter(COORDINATE_NAME_ENLARGED_AREA);
    const pInMindMap = Object(utils.relativePositionFor)(
      p,
      mindMapCenterPositionInEnlargedArea,
    );
    const scale = this._mindMapScaleGetter();
    return {
      x: pInMindMap.x / scale,
      y: pInMindMap.y / scale,
    };
  }
  visibleAreaToViewport(p) {
    return this.mindMapToViewport(this.visibleAreaToMindMap(p));
  }
  viewportToVisibleArea(p) {
    return this.mindMapToVisibleArea(this.viewportToMindMap(p));
  }
}

export default CoordinateTransfer;

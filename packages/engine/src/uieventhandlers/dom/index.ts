import * as boundaryHandler from './boundaryhandler';
import * as branchHandler from './branchhandler';
import * as collapseExtendHandler from './collapseextendhandler';
import * as connectionHandler from './connectionhandler';
import * as imageHandler from './imagehandler';
import * as informationiconHandler from './informationiconhandler';
import * as labelsHandler from './labelshandler';
import * as labelUnitHandler from './labelunithandler';
import * as legendHandler from './legendhandler';
import * as legendMarkerListHandler from './legendmarkerlisthandler';
import * as matrixLabelHandler from './matrixlabelhandler';
import * as matrixCellHandler from './matrixcellhandler';
import * as matrixPlusHandler from './matrixplushandler';
import * as relationshipHandler from './relationshiphandler';
import * as mathjaxHandler from './mathjaxhandler';
import * as markerHandler from '../../uievents/uieventhandlers/dom/markerhandler';
import * as svgHandler from '../../uievents/uieventhandlers/dom/svghandler';

export const handlerList = [
  boundaryHandler,
  branchHandler,
  collapseExtendHandler,
  connectionHandler,
  imageHandler,
  informationiconHandler,
  labelsHandler,
  labelUnitHandler,
  legendHandler,
  legendMarkerListHandler,
  markerHandler,
  matrixLabelHandler,
  matrixCellHandler,
  matrixPlusHandler,
  relationshipHandler,
  svgHandler,
  mathjaxHandler,
] as const;

export default handlerList;

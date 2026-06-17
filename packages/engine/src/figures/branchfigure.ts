import Figure from "./figure";
import { action, makeObservable, observable } from "mobx";
import {
  STRUCTURECLASS,
  ALIGNMENT_BY_LEVEL_STATUS,
  LINE_PATTERN,
  ARROW_CLASS,
} from "../common/constants/index";

export class BranchFigure extends Figure {
  structureClass: string;
  alignmentByLevelSetting: string;
  alignemntByLevelSettingDirty: boolean;
  connectionMasked: boolean;
  connectionMaskDirty: boolean;
  lineWidth: number;
  lineColor: string;
  linePattern: string;
  lineShape: string;
  endArrowClass: string;
  summaryLineWidth: number;
  summaryLineColor: string;
  summaryLineShape: string;
  summaryLinePattern: string;
  folded: any;
  foldedDirty: boolean;
  minimized: any;
  minimizedDirty: boolean;
  unbalanceRightNumber: any;
  balanceRightNumber: any;
  majorSpacing: any;
  minorSpacing: any;
  constructor(viewController) {
    super(viewController);
    this.structureClass = STRUCTURECLASS.LOGICRIGHT;
    this.alignmentByLevelSetting = ALIGNMENT_BY_LEVEL_STATUS.INACTIVED;
    this.alignemntByLevelSettingDirty = false;
    this.connectionMasked = false;
    this.connectionMaskDirty = false;
    this.lineWidth = 0;
    this.lineColor = "";
    this.linePattern = LINE_PATTERN.SOLID;
    this.lineShape = "";
    this.endArrowClass = ARROW_CLASS.NONE;
    this.summaryLineWidth = 0;
    this.summaryLineColor = "";
    this.summaryLineShape = "";
    this.summaryLinePattern = LINE_PATTERN.SOLID;
    Object(makeObservable)(this, {
      lineColor: observable,
      setLineColor: action,
      lineWidth: observable,
      setLineWidth: action,
      endArrowClass: observable,
      setEndArrowClass: action,
      linePattern: observable,
      setLinePattern: action,
      lineShape: observable,
      setLineShape: action,
      summaryLineWidth: observable,
      setSummaryLineWidth: action,
      summaryLineColor: observable,
      setSummaryLineColor: action,
      summaryLineShape: observable,
      setSummaryLineShape: action,
      structureClass: observable,
      setStructureClass: action,
      summaryLinePattern: observable,
      setSummaryLinePattern: action,
    });
  }
  setStructureClass(structureClass) {
    this.structureClass = structureClass;
  }
  setFolded(folded) {
    if (this.folded !== folded) {
      this.folded = folded;
      this.foldedDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setMinimized(minimized) {
    if (this.minimized !== minimized) {
      this.minimized = minimized;
      this.minimizedDirty = true;
      this.invalidateLayout();
      this.invalidatePaint();
    }
  }
  setUnbalanceRightNumber(rightNumber) {
    if (this.unbalanceRightNumber !== rightNumber) {
      this.unbalanceRightNumber = rightNumber;
      this.invalidateLayout();
    }
  }
  setBalanceRightNumber(rightNumber) {
    if (this.balanceRightNumber !== rightNumber) {
      this.balanceRightNumber = rightNumber;
      this.invalidateLayout();
    }
  }
  isMinimized() {
    if (this.minimized) {
      return true;
    }
    const parent = this.getParent();
    if (parent instanceof BranchFigure) {
      if (parent.folded) {
        return true;
      } else {
        return parent.isMinimized();
      }
    }
    return false;
  }
  setMajorSpacing(majorSpacing) {
    if (this.majorSpacing !== majorSpacing) {
      this.majorSpacing = majorSpacing;
      this.invalidateLayout();
    }
  }
  setMinorSpacing(minorSpacing) {
    if (this.minorSpacing !== minorSpacing) {
      this.minorSpacing = minorSpacing;
      this.invalidateLayout();
    }
  }
  setAlignmentByLevelSetting(alignmentByLevelSetting) {
    if (this.alignmentByLevelSetting !== alignmentByLevelSetting) {
      this.alignmentByLevelSetting = alignmentByLevelSetting;
      this.alignemntByLevelSettingDirty = true;
      this.invalidateLayout();
    }
  }
  setConnectionMasked(connectionMasked) {
    if (this.connectionMasked !== connectionMasked) {
      this.connectionMasked = connectionMasked;
      this.invalidatePaint();
    }
  }
  updateConnectionMask() {
    this.connectionMaskDirty = true;
    this.invalidatePaint();
  }
  setLineWidth(lineWidth) {
    if (this.lineWidth !== lineWidth) {
      if (Number.isNaN(lineWidth)) {
        console.trace(lineWidth);
      }
      this.lineWidth = lineWidth;
    }
  }
  setLineColor(lineColor) {
    if (this.lineColor !== lineColor) {
      this.lineColor = lineColor;
    }
  }
  setEndArrowClass(arrowClass) {
    if (this.endArrowClass !== arrowClass) {
      this.endArrowClass = arrowClass;
    }
  }
  setLinePattern(linePattern) {
    if (this.linePattern !== linePattern) {
      this.linePattern = linePattern;
    }
  }
  setLineShape(lineShape) {
    if (this.lineShape !== lineShape) {
      this.lineShape = lineShape;
    }
  }
  setSummaryLineWidth(lineWidth) {
    if (this.summaryLineWidth !== lineWidth) {
      this.summaryLineWidth = lineWidth;
    }
  }
  setSummaryLineColor(lineColor) {
    if (this.summaryLineColor !== lineColor) {
      this.summaryLineColor = lineColor;
    }
  }
  setSummaryLineShape(lineShape) {
    if (this.summaryLineShape !== lineShape) {
      this.summaryLineShape = lineShape;
    }
  }
  setSummaryLinePattern(linePattern) {
    if (this.summaryLinePattern !== linePattern) {
      this.summaryLinePattern = linePattern;
    }
  }
}

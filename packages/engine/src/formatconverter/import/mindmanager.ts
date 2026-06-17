/* ------------------------------------------------------------------
 * Copyright (c) XMind Ltd. All rights reserved.
 * ------------------------------------------------------------------ */
import CryptoJS from "crypto-js";
import JSZip from "jszip";
import { UUID } from "../lib/utils";
import * as constants from "../../common/constants/index";

const mindmanager_M_FILE_ENTRIES = "file-entries";
const mindmanager_M_RESOURCES = "resources";
const M_PATH_CONTENT = "content.json";
const M_PATH_METADATA = "metadata.json";
const mindmanager_markerMap = {
  "urn:mindjet:SmileyHappy": "smiley-smile",
  "urn:mindjet:SmileyAngry": "smiley-angry",
  "urn:mindjet:SmileyNeutral": "smiley-boring",
  "urn:mindjet:SmileySad": "smiley-cry",
  "urn:mindjet:SmileyScreaming": "smiley-surprise",
  "urn:mindjet:FlagGreen": "flag-green",
  "urn:mindjet:FlagYellow": "flag-orange",
  "urn:mindjet:FlagPurple": "flag-purple",
  "urn:mindjet:FlagBlack": "flag-black",
  "urn:mindjet:FlagBlue": "flag-blue",
  "urn:mindjet:FlagOrange": "flag-orange",
  "urn:mindjet:FlagRed": "flag-red",
  "urn:mindjet:Calendar": "other-calendar",
  "urn:mindjet:Clock": "other-clock",
  "urn:mindjet:CoffeeCup": "other-coffee-cup",
  "urn:mindjet:Email": "other-email",
  "urn:mindjet:Mailbox": "other-email",
  "urn:mindjet:Fax": "other-fax",
  "urn:mindjet:Lightbulb": "other-lightbulb",
  "urn:mindjet:Phone": "other-phone",
  "urn:mindjet:Cellphone": "other-phone",
  "urn:mindjet:Resource1": "other-people",
  "urn:mindjet:Resource2": "other-people",
  "urn:mindjet:QuestionMark": "other-question",
  "urn:mindjet:ExclamationMark": "other-exclam",
  "0": "task-start",
  "10": "task-oct",
  "25": "task-quarter",
  "35": "task-3oct",
  "50": "task-half",
  "65": "task-5oct",
  "75": "task-3quar",
  "90": "task-7oct",
  "100": "task-done",
  "urn:mindjet:Prio1": "priority-1",
  "urn:mindjet:Prio2": "priority-2",
  "urn:mindjet:Prio3": "priority-3",
  "urn:mindjet:Prio4": "priority-4",
  "urn:mindjet:Prio5": "priority-5",
  "urn:mindjet:Prio6": "priority-6",
  "urn:mindjet:Prio7": "priority-7",
  "urn:mindjet:Prio8": "priority-8",
  "urn:mindjet:Prio9": "priority-9",
  "urn:mindjet:ArrowUp": "arrow-up",
  "urn:mindjet:ArrowDown": "arrow-down",
  "urn:mindjet:ArrowLeft": "arrow-left",
  "urn:mindjet:ArrowRight": "arrow-right",
};
const topicShapeMap = {
  "urn:mindjet:RoundedRectangle": constants.TOPICSHAPE.ROUNDEDRECT,
  "urn:mindjet:Rectangle": constants.TOPICSHAPE.RECT,
  "urn:mindjet:Line": constants.TOPICSHAPE.UNDERLINE,
  "urn:mindjet:Oval": constants.TOPICSHAPE.ELLIPSE,
  "urn:mindjet:Circle": constants.TOPICSHAPE.CIRCLE,
  "urn:mindjet:Hexagon": constants.TOPICSHAPE.ROUNDEDRECT,
  "urn:mindjet:Octagon": constants.TOPICSHAPE.ROUNDEDRECT,
  "urn:mindjet:Capsule": constants.TOPICSHAPE.ROUNDEDRECT,
  "urn:mindjet:Data": constants.TOPICSHAPE.PARALLELOGRAM,
  "urn:mindjet:Diamond": constants.TOPICSHAPE.DIAMOND,
  "urn:mindjet:None": constants.TOPICSHAPE.NOBORDER,
};
const calloutShapeMap = {
  "urn:mindjet:RectangleBalloon": constants.CALLOUTSHAPE.RECT,
  "urn:mindjet:RoundedRectangleBalloon": constants.CALLOUTSHAPE.ROUNDEDRECT,
  "urn:mindjet:OvalBalloon": constants.CALLOUTSHAPE.ELLIPSE,
};
const branchConnectionMap = {
  "urn:mindjet:None": constants.BRANCHCONNECTION.NONE,
  "urn:mindjet:Elbow": constants.BRANCHCONNECTION.ELBOW,
  "urn:mindjet:Curve": constants.BRANCHCONNECTION.CURVE,
  "urn:mindjet:Straight": constants.BRANCHCONNECTION.STRAIGHT,
  "urn:mindjet:RoundedElbow": constants.BRANCHCONNECTION.ROUNDEDELBOW,
};
const boundaryShapeMap = {
  "urn:mindjet:Rectangle": constants.BOUNDARYSHAPE.RECT,
  "urn:mindjet:CurvedRectangle": constants.BOUNDARYSHAPE.ROUNDEDRECT,
  "urn:mindjet:Scallops": constants.BOUNDARYSHAPE.SCALLOPS,
  "urn:mindjet:Waves": constants.BOUNDARYSHAPE.WAVES,
  "urn:mindjet:Zigzag": constants.BOUNDARYSHAPE.TENSION,
  "urn:mindjet:CurvedLine": constants.BOUNDARYSHAPE.ROUNDEDPOLYGON,
  "urn:mindjet:Lines": constants.BOUNDARYSHAPE.POLYGON,
};
const LINE_PATTERNMap = {
  "urn:mindjet:Solid": constants.LINE_PATTERN.SOLID,
  "urn:mindjet:Dash": constants.LINE_PATTERN.DASH,
  "urn:mindjet:RoundDot": constants.LINE_PATTERN.DOT,
  "urn:mindjet:DashDot": constants.LINE_PATTERN.DASHDOT,
  "urn:mindjet:LongDashDotDot": constants.LINE_PATTERN.DASHDOTDOT,
};
// const imageAlignMap = {
//   'urn:mindjet:TextLeftImageRight': 'right',
//   'urn:mindjet:TextBottomImageTop': 'top',
//   'urn:mindjet:TextTopImageBottom': 'bottom',
//   'urn:mindjet:TextRightImageLeft': 'left'
// }
const relationshipShapeMap = {
  "urn:mindjet:Angled": constants.RELATIONSHIPSHAPE.ANGLED,
  "urn:mindjet:Bezier": constants.RELATIONSHIPSHAPE.CURVED,
  "urn:mindjet:Straight": constants.RELATIONSHIPSHAPE.STRAIGHT,
};
const arrowShapeMap = {
  "urn:mindjet:DiamondArrow": constants.ARROW_CLASS.DIAMOND,
  "urn:mindjet:OvalArrow": constants.ARROW_CLASS.DOT,
  "urn:mindjet:StealthArrow": constants.ARROW_CLASS.SPEARHEAD,
  "urn:mindjet:OpenArrow": constants.ARROW_CLASS.NORMAL,
  "urn:mindjet:Arrow": constants.ARROW_CLASS.TRIANGLE,
  "urn:mindjet:NoArrow": constants.ARROW_CLASS.NONE,
};
const summaryConnectionMap = {
  "urn:mindjet:SummaryElbow": constants.SUMMARYCONNECTION.SQUARE,
  "urn:mindjet:SummaryShearedElbow": constants.SUMMARYCONNECTION.ANGLE,
  "urn:mindjet:SummaryArc": constants.SUMMARYCONNECTION.CURLY,
  "urn:mindjet:SummaryCurve": constants.SUMMARYCONNECTION.ROUND,
};
const numberFormatMap = {
  "1": constants.NUMBERFORMAT.ARABIC,
  i: constants.NUMBERFORMAT.ROMAN,
  I: constants.NUMBERFORMAT.ROMAN,
  A: constants.NUMBERFORMAT.UPPERCASE,
  a: constants.NUMBERFORMAT.LOWERCASE,
};
const numberSeparatorMap = {
  ",": constants.NUMBERSEPARATOR.COMMA,
  ".": constants.NUMBERSEPARATOR.DOT,
  "-": constants.NUMBERSEPARATOR.HYPHEN,
  "/": constants.NUMBERSEPARATOR.OBLIQUE,
};
// export function importMindmanager(filePath) {
//   if (filePath) {
//     return fsp.readFileAsync(filePath).then(JSZip.loadAsync).then(importFile)
//   }
// }
export async function fromMindmanager(rawBuffer) {
  const zip = await JSZip.loadAsync(rawBuffer);
  if (!zip) {
    throw new Error("Need a mindmanager file");
  }
  if (!zip.file("Document.xml")) {
    throw new Error("No content");
  }
  const resourceMap = await storeResourceFile(zip);
  let xmlString = (await zip.file("Document.xml")?.async("string")) || "";
  // Fix 'undeclared reference to namespace prefix' error
  xmlString = xmlString.replace(/ap:/gi, "");
  xmlString = xmlString.replace(/cor:/gi, "");
  xmlString = xmlString.replace(/pri:/gi, "");
  xmlString = xmlString.replace(/xsi:/gi, "");
  xmlString = xmlString.replace(/cst0:/gi, "");
  const parser = new DOMParser();
  const contentDom = parser.parseFromString(xmlString, "application/xml");
  const workbookObject = mindmanager_parseWorkbook(contentDom, resourceMap);
  if (!workbookObject) {
    throw new Error("No content");
  }
  return workbookObject;
}
function storeResourceFile(zip) {
  return new Promise((resolve) => {
    const resourcePathArray: any[] = [];
    Object.keys(zip.files).forEach((filePath) => {
      if (/^bin\//.test(filePath)) {
        resourcePathArray.push(filePath);
      }
    });
    const i = resourcePathArray.indexOf("bin/");
    if (i !== -1) {
      resourcePathArray.splice(i, 1);
    }
    if (!resourcePathArray.length) {
      return resolve(null);
    }
    let count = resourcePathArray.length;
    const resourceMap: any = {};
    resourcePathArray.forEach((path) => {
      const zipObject = zip.file(path);
      zipObject.async("uint8array").then((resourceData) => {
        const sha256 = CryptoJS.algo.SHA256.create();
        // const hash = sha256.update(CryptoJS.enc.Base64.parse(resourceData)).finalize().toString()
        const hash = sha256
          .update(CryptoJS.lib.WordArray.create(resourceData))
          .finalize()
          .toString(CryptoJS.enc.Hex);
        resourceMap[path] = {
          hash,
          resourceData,
          zipObject,
        };
        count--;
        if (count === 0) {
          resolve(resourceMap);
        }
      });
    });
  });
}
function mindmanager_parseWorkbook(contentDom, resourceMap) {
  const mapDom = childNodeWithTagName(contentDom, "Map");
  if (!mapDom) {
    return;
  }
  const sheetsArray: any[] = [];
  const newManifest = {
    [mindmanager_M_FILE_ENTRIES]: {
      [M_PATH_CONTENT]: {},
      [M_PATH_METADATA]: {},
    },
    [mindmanager_M_RESOURCES]: {},
  };
  const workbookObject = {
    workbook: {
      id: UUID(),
      sheets: sheetsArray,
      manifest: newManifest,
    },
  };
  const sheetUUID = UUID(mapDom.getAttribute("OId") as string);
  const sheetObject: any = {
    id: sheetUUID,
    title: "sheet",
  };
  sheetsArray.push(sheetObject);
  const oneTopicDom = childNodeWithTagName(mapDom, "OneTopic");
  if (!oneTopicDom) {
    return;
  }
  sheetObject.rootTopic = parseTopicDom(
    childNodeWithTagName(oneTopicDom, "Topic"),
    {
      defaultTitle: "Central Topic",
      idDetached: false,
      isRoot: true,
    },
  );
  parseRelationships(childNodeWithTagName(mapDom, "Relationships"));
  parseStyleGroup(childNodeWithTagName(mapDom, "StyleGroup"));
  function parseTopicDom(topicDom, options) {
    const { defaultTitle, isDetached, isRoot, isCallout } = options || {};
    const topicObject: any = {};
    let hasAttachedChildren = false;
    const oid = topicDom.getAttribute("OId") as string;
    topicObject.id = UUID(oid);
    const textDom = childNodeWithTagName(topicDom, "Text");
    topicObject.title =
      textDom && textDom.getAttribute("PlainText")
        ? textDom.getAttribute("PlainText")
        : defaultTitle;
    {
      // labels
      const bookmarkDom = childNodeWithTagName(topicDom, "Bookmarker");
      if (bookmarkDom) {
        topicObject.labels = [];
        topicObject.labels.push(bookmarkDom.getAttribute("Name") as string);
      }
      // notes
      const notesGroupDom = childNodeWithTagName(topicDom, "NotesGroup");
      if (notesGroupDom) {
        const notesXhtmlDataDom = childNodeWithTagName(
          notesGroupDom,
          "NotesXhtmlData",
        );
        if (notesXhtmlDataDom && notesXhtmlDataDom.textContent) {
          topicObject.notes = {};
          // plain
          topicObject.notes.plain = {
            content: notesXhtmlDataDom.textContent,
          };
          //html
        }
      }
    }
    children: {
      let index = 0;
      const subTopicsDom = childNodeWithTagName(topicDom, "SubTopics");
      if (subTopicsDom) {
        const subTopicDomList = childrenWithTagName(subTopicsDom, "Topic");
        if (subTopicDomList.length) {
          topicObject.children = {};
          topicObject.children.attached = [];
          subTopicDomList.forEach((subTopicDom) => {
            topicObject.children.attached.push(
              parseTopicDom(subTopicDom, {
                defaultTitle: isRoot ? "Main Topic" : "Subtopic",
                isDetached: false,
              }),
            );
            parseBoundary(subTopicDom, index, false);
            index++;
          });
        }
      }
      const floatingTopicsDom = childNodeWithTagName(
        topicDom,
        "FloatingTopics",
      );
      if (!floatingTopicsDom) {
        break children;
      }
      if (!topicObject.children) {
        topicObject.children = {};
      }
      const floatingTopicDomList = childrenWithTagName(
        floatingTopicsDom,
        "Topic",
      );
      if (floatingTopicDomList.length) {
        if (isRoot) {
          topicObject.children.detached = [];
          floatingTopicDomList.forEach((floatingTopicDom) => {
            topicObject.children.detached.push(
              parseTopicDom(floatingTopicDom, {
                defaultTitle: "Floating Topic",
                isDetached: true,
              }),
            );
            index++;
          });
        } else {
          topicObject.children.callout = [];
          floatingTopicDomList.forEach((floatingTopicDom) => {
            topicObject.children.callout.push(
              parseTopicDom(floatingTopicDom, {
                defaultTitle: "Callout",
                isDetached: false,
                isCallout: true,
              }),
            );
            index++;
          });
        }
      }
    }
    // hyperlink TODO
    hyperlink: {
      const hyperlinkDom = childNodeWithTagName(topicDom, "Hyperlink");
      if (!hyperlinkDom) {
        break hyperlink;
      }
      const url = hyperlinkDom.getAttribute("Url") as string;
      if (!url) {
        break hyperlink;
      }
      if (url.startsWith("#xpointer(")) {
        const reg = /@OId='([^']*)'/;
        if (reg.test(url)) {
          topicObject.href = "xmind:#" + UUID((reg.exec(url) as any)[1]);
        }
      } else if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("mailto:")
      ) {
        topicObject.href = url;
      } else {
        topicObject.href = "file://" + url;
      }
    }
    attachments: {
      const attachmentGroupDom = childNodeWithTagName(
        topicDom,
        "AttachmentGroup",
      );
      if (!attachmentGroupDom) {
        break attachments;
      }
      const attachmentDataDomArray = childrenWithTagName(
        attachmentGroupDom,
        "AttachmentData",
      );
      if (!attachmentDataDomArray.length) {
        break attachments;
      }
      if (!hasAttachedChildren) {
        ensureAttachedChildren();
      }
      attachmentDataDomArray.forEach((attachmentDataDom) => {
        const oId = attachmentDataDom.getAttribute("AttachmentId") as string;
        const fileName = attachmentDataDom.getAttribute("FileName") as string;
        const uriDom = childNodeWithTagName(attachmentDataDom, "Uri");
        if (uriDom) {
          const MMARCH = "mmarch://";
          let uri = uriDom.textContent as string;
          if (uri.startsWith(MMARCH)) {
            uri = uri.substring(MMARCH.length);
          }
          const { hash, resourceData } = resourceMap[uri] || {};
          if (hash) {
            let ext = "." + uri.split(".").pop();
            ext = ext === uri ? "" : "." + ext;
            const newFileEntryPath = `resources/${hash}${ext}`;
            newManifest[mindmanager_M_FILE_ENTRIES][newFileEntryPath] = {};
            newManifest[mindmanager_M_RESOURCES][newFileEntryPath] =
              resourceData;
            const attachmentTopicObject = {
              id: UUID(oId),
              title: fileName,
              href: "xap:" + newFileEntryPath,
            };
            topicObject.children.attached.push(attachmentTopicObject);
          }
        }
      });
    }
    markers: {
      const iconsGroupDom = childNodeWithTagName(topicDom, "IconsGroup");
      if (!iconsGroupDom) {
        break markers;
      }
      const iconsDom = childNodeWithTagName(iconsGroupDom, "Icons");
      if (!iconsDom) {
        break markers;
      }
      const iconDomArray = childrenWithTagName(iconsDom, "Icon");
      if (!iconDomArray.length) {
        break markers;
      }
      if (!topicObject.markers) {
        topicObject.markers = [];
      }
      iconDomArray.forEach((iconDom) => {
        const markerId =
          mindmanager_markerMap[iconDom.getAttribute("IconType") as string];
        if (markerId) {
          topicObject.markers.push({
            markerId,
          });
        }
      });
    }
    image: {
      const oneImageDom = childNodeWithTagName(topicDom, "OneImage");
      if (!oneImageDom) {
        break image;
      }
      const imageDom = childNodeWithTagName(oneImageDom, "Image");
      if (!imageDom) {
        break image;
      }
      const imageDataDom = childNodeWithTagName(imageDom, "ImageData");
      if (!imageDataDom) {
        break image;
      }
      const uriDom = childNodeWithTagName(imageDataDom, "Uri");
      if (!uriDom) {
        break image;
      }
      const MMARCH = "mmarch://";
      let uri = uriDom.textContent as string;
      if (uri.startsWith(MMARCH)) {
        uri = uri.substring(MMARCH.length);
      }
      const { hash, resourceData } = resourceMap[uri] || {};
      if (!hash) {
        break image;
      }
      let ext = uri.split(".").pop();
      ext = ext === uri ? "" : "." + ext;
      const newFileEntryPath = `resources/${hash}${ext}`;
      newManifest[mindmanager_M_FILE_ENTRIES][newFileEntryPath] = {};
      newManifest[mindmanager_M_RESOURCES][newFileEntryPath] = resourceData;
      const image: any = {
        src: "xap:" + newFileEntryPath,
      };
      const imageSizeDom = childNodeWithTagName(imageDom, "ImageSize");
      if (imageSizeDom) {
        const width = imageSizeDom.getAttribute("Width") as string;
        const height = imageSizeDom.getAttribute("Height") as string;
        image.width = width ? mm2Dots(width) : -1;
        image.height = height ? mm2Dots(height) : -1;
      }
      topicObject.image = image;
    }
    task: {
      const taskDom = childNodeWithTagName(topicDom, "Task");
      if (!taskDom) {
        break task;
      }
      const contentArray: any[] = [];
      const reg = /((\d+)-(\d{1,2})-(\d{1,2}))T((\d{1,2}):(\d{1,2}):(\d{1,2}))/;
      const startDate = taskDom.getAttribute("StartDate") as string;
      const startDateArray = reg.exec(startDate);
      if (startDateArray) {
        contentArray.push({
          name: "start-date",
          content: startDateArray[1] + " " + startDateArray[5],
        });
      }
      const endDate = taskDom.getAttribute("DeadlineDate") as string;
      const endDateArray = reg.exec(endDate);
      if (endDateArray) {
        contentArray.push({
          name: "end-date",
          content: endDateArray[1] + " " + endDateArray[5],
        });
      }
      const resources = taskDom.getAttribute("Resources") as string;
      if (resources) {
        contentArray.push({
          name: "assigned-to",
          content: resources,
        });
      }
      const milestone = taskDom.getAttribute("Milestonr") as string;
      if (milestone && milestone === "true") {
        contentArray.push({
          name: "check-point",
          content: true,
        });
      }
      const taskPriority = taskDom.getAttribute("TaskPriority") as string;
      const taskPercentage = taskDom.getAttribute("TaskPercentage") as string;
      if (contentArray.length) {
        topicObject.extensions = [
          {
            provider: "org.xmind.ui.taskInfo",
            content: contentArray,
          },
        ];
      }
      // with markers
      if (taskPercentage || (taskPriority && !topicObject.markers)) {
        topicObject.markers = [];
      }
      if (taskPriority && mindmanager_markerMap[taskPriority]) {
        topicObject.markers.push({
          markerId: mindmanager_markerMap[taskPriority],
        });
      }
      if (taskPercentage && mindmanager_markerMap[taskPercentage]) {
        topicObject.markers.push({
          markerId: mindmanager_markerMap[taskPercentage],
        });
      }
    }
    numbering: {
      const customDom = childNodeWithTagName(topicDom, "Custom");
      if (!customDom) {
        break numbering;
      }
      const numbering = customDom.getAttribute("Numbering") as string;
      if (!numbering) {
        break numbering;
      }
      const format = numbering.split("*")[0];
      const seprators = customDom.getAttribute("Separators") as string;
      const separtor = seprators.split(",")[0];
      topicObject.numbering = {
        numberFormat: numberFormatMap[format] || constants.NUMBERFORMAT.ARABIC,
        numberSeparator:
          numberSeparatorMap[separtor] || constants.NUMBERSEPARATOR.DOT,
      };
      const repeat = customDom.getAttribute("Repeat") as string;
      const depth = customDom.getAttribute("Depth") || "1";
      if (repeat && repeat === "0") {
        topicObject.numbering.depth = depth;
      }
      const prefix = customDom.getAttribute("Level1Text") as string;
      if (prefix) {
        topicObject.numbering.prefix = prefix;
      }
    }
    // style
    {
      const properties: any = {};
      parseColor(topicDom, properties);
      parseTopicShape(topicDom, properties, isCallout, isDetached);
      if (textDom) {
        parseFont(textDom, properties);
      }
      topicObject.style = {
        type: "topic",
        properties,
      };
    }
    // structure
    structure: {
      const subTopicsShapeDom = childNodeWithTagName(
        topicDom,
        "SubTopicsShape",
      );
      if (!subTopicsShapeDom) {
        break structure;
      }
      // branch connection
      const line =
        branchConnectionMap[
          subTopicsShapeDom.getAttribute("SubTopicsConnectionStyle") as string
        ];
      if (line) {
        topicObject.style.properties[constants.STYLE_KEYS.LINE_CLASS] = line;
      }
      const align = subTopicsShapeDom.getAttribute(
        "SubTopicsAlignment",
      ) as string;
      const growth = subTopicsShapeDom.getAttribute(
        "SubTopicsGrowth",
      ) as string;
      const growthDir = subTopicsShapeDom.getAttribute(
        "SubTopicsGrowthDirection",
      ) as string;
      let structureClass;
      if (
        align === "urn:mindjet:Center" &&
        growth === "urn:mindjet:Horizontal"
      ) {
        if (growthDir === "urn:mindjet:LeftAndRight") {
          structureClass = constants.STRUCTURECLASS.MAPCLOCKWISE;
        }
        if (growthDir === "urn:mindjet:Right") {
          structureClass = constants.STRUCTURECLASS.LOGICRIGHT;
        }
        if (growthDir === "urn:mindjet:Left") {
          structureClass = constants.STRUCTURECLASS.LOGICLEFT;
        }
      } else if (
        growth === "urn:mindjet:Vertical" &&
        subTopicsShapeDom.getAttribute("SubTopicsVerticalAlignment") ===
          "urn:mindjet:Middle"
      ) {
        const vgd = subTopicsShapeDom.getAttribute(
          "SubTopicsVerticalGrowthDirection",
        ) as string;
        if (vgd === "urn:mindjet:Down" || vgd === "urn:mindjet:UpAndDown") {
          structureClass = constants.STRUCTURECLASS.ORGCHARTDOWN;
        }
        if (vgd === "urn:mindjet:Up") {
          structureClass = constants.STRUCTURECLASS.ORGCHARTUP;
        }
      } else if (
        align === "urn:mindjet:Bottom" &&
        growth === "urn:mindjet:Horizontal"
      ) {
        if (
          growthDir === "urn:mindjet:Right" ||
          growthDir === "urn:mindjet:LeftAndRight"
        ) {
          structureClass = constants.STRUCTURECLASS.TREERIGHT;
        }
        if (growthDir === "urn:mindjet:Left") {
          structureClass = constants.STRUCTURECLASS.TREELEFT;
        }
      }
      if (structureClass) {
        topicObject.structureClass = structureClass;
      }
    }
    position: {
      const offsetDom = childNodeWithTagName(topicDom, "Offset");
      if (!offsetDom) {
        break position;
      }
      const cx = parseFloat(offsetDom.getAttribute("CX") as string);
      const cy = parseFloat(offsetDom.getAttribute("CY") as string);
      if (cx && cy) {
        topicObject.position = {
          x: mm2Dots(cx),
          y: mm2Dots(cy),
        };
      }
    }
    function ensureAttachedChildren() {
      if (!topicObject.children) {
        topicObject.children = {};
      }
      if (!topicObject.children.attached) {
        topicObject.children.attached = [];
      }
      hasAttachedChildren = true;
    }
    if (isDetached) {
      parseBoundary(topicDom, 0, true);
    }
    function parseBoundary(topicDom, index, isDetached) {
      const oneBoundaryDom = childNodeWithTagName(topicDom, "OneBoundary");
      if (!oneBoundaryDom) {
        return;
      }
      const boundaryDom = childNodeWithTagName(oneBoundaryDom, "Boundary");
      if (!boundaryDom) {
        return;
      }
      const boundaryShape = getBoundaryShape(boundaryDom) as string;
      let shape = summaryConnectionMap[boundaryShape];
      let boundaryObject;
      let summaryTopicObject;
      let summaryObject;
      if (shape && !isDetached) {
        if (!topicObject.children.summary) {
          topicObject.children.summary = [];
        }
        const topicId = UUID();
        topicObject.children.summary.push(
          (summaryTopicObject = {
            id: topicId,
            title: "Summary",
          }),
        );
        if (!topicObject.summaries) {
          topicObject.summaries = [];
        }
        topicObject.summaries.push(
          (summaryObject = {
            id: UUID(boundaryDom.getAttribute("OId") as string),
            range: `(${index},${index})`,
            topicId,
          }),
        );
      } else {
        shape = boundaryShapeMap[boundaryShape];
        if (!topicObject.boundaries) {
          topicObject.boundaries = [];
        }
        topicObject.boundaries.push(
          (boundaryObject = {
            id: UUID(boundaryDom.getAttribute("OId") as string),
            range: isDetached ? "master" : `(${index}, ${index})`,
          }),
        );
      }
      const properties = {
        [constants.STYLE_KEYS.SHAPE_CLASS]: shape,
      };
      parseColor(boundaryDom, properties);
      parseLineStyle(boundaryDom, properties);
      if (boundaryObject) {
        boundaryObject.style = {
          type: "boundary",
          properties,
        };
      } else if (summaryObject && summaryTopicObject) {
        summaryObject.style = {
          type: "summary",
          properties,
        };
        summaryTopicObject.style = {
          type: "topic",
          properties: {
            [constants.STYLE_KEYS.SHAPE_CLASS]: constants.TOPICSHAPE.NOBORDER,
          },
        };
      }
      function getBoundaryShape(boundaryDom) {
        const shapeDom = childNodeWithTagName(boundaryDom, "BoundaryShape");
        if (!shapeDom) {
          return;
        }
        return shapeDom.getAttribute("BoundaryShape") as string;
      }
    }
    function parseColor(parentDom, properties) {
      const colorDom = childNodeWithTagName(parentDom, "Color");
      if (!colorDom) {
        return;
      }
      const fillColor = colorDom.getAttribute("FillColor") as string;
      if (fillColor) {
        const opacity = fillColor.substring(0, 2);
        properties[constants.STYLE_KEYS.FILL_COLOR] =
          opacity !== "00" ? "#" + fillColor.substring(2) : "none";
      }
      const lineColor = colorDom.getAttribute("LineColor") as string;
      if (lineColor) {
        properties[constants.STYLE_KEYS.LINE_COLOR] =
          "#" + lineColor.substring(2);
      }
    }
    function parseTopicShape(topicDom, properties, isCallout, isDetached) {
      const domName = isCallout
        ? "CalloutFloatingTopicShape"
        : isDetached
          ? "LabelFloatingTopicShape"
          : "SubTopicShape";
      const attrName = isCallout
        ? "CalloutFloatingTopicShape"
        : isDetached
          ? "LabelFloatingTopicShape"
          : "SubTopicShape";
      const shapeDom = childNodeWithTagName(topicDom, domName);
      if (!shapeDom) {
        return;
      }
      let shape = shapeDom.getAttribute(attrName) as string;
      if (isCallout) {
        shape = calloutShapeMap[shape];
        if (shape) {
          properties[constants.STYLE_KEYS.CALLOUT_SHAPE_CLASS] = shape;
        }
      } else {
        shape = topicShapeMap[shape];
        if (shape) {
          properties[constants.STYLE_KEYS.SHAPE_CLASS] = shape;
        }
      }
    }
    return topicObject;
  }
  function parseRelationships(relationshipsDom) {
    if (!relationshipsDom) {
      return;
    }
    const relationshipDomArray = childrenWithTagName(
      relationshipsDom,
      "Relationship",
    );
    if (!relationshipDomArray.length) {
      return;
    }
    const relationshipArray: any[] = [];
    relationshipDomArray.forEach((relationshipDom) => {
      const connectionGroupDomArray = childrenWithTagName(
        relationshipDom,
        "ConnectionGroup",
      );
      if (connectionGroupDomArray.length === 2) {
        const connection1Dom = childNodeWithTagName(
          connectionGroupDomArray[0],
          "Connection",
        );
        const connection2Dom = childNodeWithTagName(
          connectionGroupDomArray[1],
          "Connection",
        );
        if (connection1Dom && connection2Dom) {
          const end1Dom = childNodeWithTagName(
            connection1Dom,
            "ObjectReference",
          );
          const end2Dom = childNodeWithTagName(
            connection2Dom,
            "ObjectReference",
          );
          if (end1Dom && end2Dom) {
            const relationshipObject: any = {
              id: UUID(relationshipDom.getAttribute("OId") as string),
              end1Id: UUID(end1Dom.getAttribute("OIdRef") as string),
              end2Id: UUID(end2Dom.getAttribute("OIdRef") as string),
              title: "",
            };
            const controlPoints = parseControlPoints(connectionGroupDomArray);
            if (controlPoints) {
              relationshipObject.controlPoints = controlPoints;
            }
            const properties: any = {};
            parseLineStyle(relationshipDom, properties);
            parseRelLineStyle(relationshipDom, properties);
            parseConnShape(connectionGroupDomArray, properties);
            relationshipObject.style = {
              type: "relationship",
              properties,
            };
            relationshipArray.push(relationshipObject);
          }
        }
      }
    });
    function parseControlPoints(connectionGroupDomArray) {
      const controlPoints: any = {};
      connectionGroupDomArray.forEach((connectionGroupDom, index) => {
        const connectionDom = childNodeWithTagName(
          connectionGroupDom,
          "Connection",
        );
        if (connectionDom) {
          const cx = parseFloat(connectionDom.getAttribute("CX") as string);
          const cy = parseFloat(connectionDom.getAttribute("CY") as string);
          if (cx && cy) {
            controlPoints[index] = {
              x: mm2Dots(cx),
              y: mm2Dots(cy),
            };
          }
        }
      });
      return controlPoints;
    }
    function parseRelLineStyle(relationshipDom, properties) {
      const relShapeDom = childNodeWithTagName(
        relationshipDom,
        "RelationshipLineShape",
      );
      if (!relShapeDom) {
        return;
      }
      const shape =
        relationshipShapeMap[relShapeDom.getAttribute("LineShape") as string];
      if (shape) {
        properties[constants.STYLE_KEYS.SHAPE_CLASS] = shape;
      }
    }
    function parseConnShape(connectionGroupDomArray, properties) {
      connectionGroupDomArray.forEach((connectionGroupDom, index) => {
        const connStyleDom = childNodeWithTagName(
          connectionGroupDom,
          "ConnectionStyle",
        );
        if (connStyleDom) {
          const shape =
            arrowShapeMap[
              connStyleDom.getAttribute("ConnectionShape") as string
            ];
          if (shape) {
            const styleKey =
              index === 0
                ? constants.STYLE_KEYS.ARROW_BEGIN_CLASS
                : constants.STYLE_KEYS.ARROW_END_CLASS;
            properties[styleKey] = shape;
          }
        }
      });
    }
    if (relationshipArray.length) {
      sheetObject.relationships = relationshipArray;
    }
  }
  function parseLineStyle(parentDom, properties) {
    const colorDom = childNodeWithTagName(parentDom, "Color");
    if (colorDom) {
      const color = colorDom.getAttribute("LineColor") as string;
      if (color) {
        properties[constants.STYLE_KEYS.LINE_COLOR] = "#" + color.substring(2);
      }
    }
    const lineStyleDom = childNodeWithTagName(parentDom, "LineStyle");
    if (!lineStyleDom) {
      return;
    }
    const linePattern =
      LINE_PATTERNMap[lineStyleDom.getAttribute("LineDashStyle") as string];
    if (linePattern) {
      properties[constants.STYLE_KEYS.LINE_PATTERN] = linePattern;
    }
    properties[constants.STYLE_KEYS.LINE_WIDTH] = lineStyleDom.getAttribute(
      "LineWidth",
    ) as string;
  }
  function parseStyleGroup(styleGroupDom) {
    if (!styleGroupDom) {
      return;
    }
    const theme: any = {};
    parseSheetStyle(styleGroupDom, theme);
    parseTopicTheme(styleGroupDom, theme);
    parseBoundaryTheme(styleGroupDom, theme);
    parseRelTheme(styleGroupDom, theme);
    sheetObject.theme = theme;
    function parseSheetStyle(styleGroupDom, theme) {
      const properties: any = {};
      {
        const structureDom = childNodeWithTagName(styleGroupDom, "Structure");
        if (structureDom) {
          const lineWidth = parseFloat(
            structureDom.getAttribute("MainTopicLineWidth") as string,
          );
          if (lineWidth > 3) {
            properties[constants.STYLE_KEYS.LINE_TAPERED] = "tapered";
          }
        }
        const bgFillDom = childNodeWithTagName(styleGroupDom, "BackgroundFill");
        if (bgFillDom) {
          const fillColor = bgFillDom.getAttribute("FillColor") as string;
          if (fillColor) {
            properties[constants.STYLE_KEYS.FILL_COLOR] =
              "#" + fillColor.substring(2);
          }
        }
        // TODO background image
      }
      theme.map = {
        type: "map",
        properties,
      };
    }
    function parseTopicTheme(styleGroupDom, theme) {
      const rootDom = childNodeWithTagName(
        styleGroupDom,
        "RootTopicDefaultsGroup",
      );
      if (rootDom) {
        loadTopicTheme(theme, rootDom, {
          styleFamily: "centralTopic",
        });
      }
      let deepestLevel = 0;
      let realSubDom;
      const subDomArray = childrenWithTagName(
        styleGroupDom,
        "RootSubTopicDefaultsGroup",
      );
      subDomArray.forEach((subDom) => {
        const level = parseInt(subDom.getAttribute("Level") as string);
        if (level === 0) {
          loadTopicTheme(theme, subDom, {
            styleFamily: "mainTopic",
          });
        } else if (level > 0) {
          if (level > deepestLevel) {
            deepestLevel = level;
            realSubDom = subDom;
          }
        }
        if (realSubDom) {
          loadTopicTheme(theme, realSubDom, {
            styleFamily: "subTopic",
          });
        }
        const floatingDom = childNodeWithTagName(
          styleGroupDom,
          "LabelTopicDefaultsGroup",
        );
        if (floatingDom) {
          loadTopicTheme(theme, floatingDom, {
            styleFamily: "floatingTopic",
            shapeDomName: "DefaultLabelFloatingTopicShape",
            shapeAttrName: "LabelFloatingTopicShape",
          });
        }
        const calloutDom = childNodeWithTagName(
          styleGroupDom,
          "CalloutTopicDefaultsGroup",
        );
        if (calloutDom) {
          loadTopicTheme(theme, calloutDom, {
            styleFamily: "calloutTopic",
            shapeMap: calloutShapeMap,
            shapeDomName: "DefaultCalloutFloatingTopicShape",
            shapeAttrName: "CalloutFloatingTopicShape",
          });
        }
      });
      function loadTopicTheme(theme, styleDom, options) {
        const { styleFamily, shapeMap, shapeDomName, shapeAttrName } =
          options || null;
        const properties: any = {};
        parseThemeColor(properties, styleDom, true, true);
        parseThemeTopicShape(
          properties,
          styleDom,
          shapeMap,
          shapeDomName,
          shapeAttrName,
        );
        parseThemeBranchStyle(properties, styleDom);
        parseThemeTextStyle(properties, styleDom);
        theme[styleFamily] = {
          type: "topic",
          properties,
        };
      }
      function parseThemeTopicShape(
        properties,
        styleDom,
        shapeMap = topicShapeMap,
        shapeDomName = "DefaultSubTopicShape",
        shapeAttrName = "SubTopicShape",
      ) {
        const shapeDom = childNodeWithTagName(styleDom, shapeDomName);
        if (!shapeDom) {
          return;
        }
        const shape = shapeMap[shapeDom.getAttribute(shapeAttrName) as string];
        if (shape) {
          properties[constants.STYLE_KEYS.SHAPE_CLASS] = shape;
        }
      }
      function parseThemeBranchStyle(properties, styleDom) {
        const connectionDom = childNodeWithTagName(
          styleDom,
          "DefaultSubTopicsShape",
        );
        if (!connectionDom) {
          return;
        }
        const connection =
          branchConnectionMap[
            connectionDom.getAttribute("SubTopicsConnectionStyle") as string
          ];
        if (connection) {
          properties[constants.STYLE_KEYS.LINE_CLASS] = connection;
        }
      }
      function parseThemeTextStyle(properties, styleDom) {
        const textDom = childNodeWithTagName(styleDom, "DefaultText");
        if (!textDom) {
          return;
        }
        parseFont(textDom, properties);
      }
    }
    function parseBoundaryTheme(styleGroupDom, theme) {
      const styleDom = childNodeWithTagName(
        styleGroupDom,
        "BoundaryDefaultsGroup",
      );
      if (!styleDom) {
        return;
      }
      const properties: any = {};
      parseThemeColor(properties, styleDom, true, true);
      parseThemeLineStyle(properties, styleDom);
      parseThemeBoundaryShape(properties, styleDom);
      function parseThemeBoundaryShape(properties, styleDom) {
        const shapeDom = childNodeWithTagName(styleDom, "DefaultBoundaryShape");
        if (!shapeDom) {
          return;
        }
        const shape =
          boundaryShapeMap[shapeDom.getAttribute("BoundaryShape") as string];
        if (shape) {
          properties[constants.STYLE_KEYS.SHAPE_CLASS] = shape;
        }
      }
      theme.boundary = {
        type: "boundary",
        properties,
      };
    }
    function parseRelTheme(styleGroupDom, theme) {
      const styleDom = childNodeWithTagName(
        styleGroupDom,
        "RelationshipDefaultsGroup",
      );
      if (!styleDom) {
        return;
      }
      const properties: any = {};
      parseThemeColor(properties, styleDom, false, true);
      parseThemeLineStyle(properties, styleDom);
      parseThemeArrowStyle(properties, styleDom);
      parseThemeRelShape(properties, styleDom);
      function parseThemeArrowStyle(properties, styleDom) {
        const connectionStyleDomArray = childrenWithTagName(
          styleDom,
          "DefaultConnectionStyle",
        );
        if (!connectionStyleDomArray.length) {
          return;
        }
        connectionStyleDomArray.forEach((connectionStyleDom) => {
          const index = parseInt(
            connectionStyleDom.getAttribute("Index") as string,
          );
          if (index === 0 || index === 1) {
            const shape =
              arrowShapeMap[
                connectionStyleDom.getAttribute("ConnectionShape") as string
              ];
            if (shape) {
              const styleKey =
                index === 0
                  ? constants.STYLE_KEYS.ARROW_BEGIN_CLASS
                  : constants.STYLE_KEYS.ARROW_END_CLASS;
              properties[styleKey] = shape;
            }
          }
        });
      }
      function parseThemeRelShape(properties, styleDom) {
        const shapeDom = childNodeWithTagName(
          styleDom,
          "DefaultRelationshipLineShape",
        );
        if (!shapeDom) {
          return;
        }
        const shape =
          relationshipShapeMap[shapeDom.getAttribute("LineShape") as string];
        if (shape) {
          properties[constants.STYLE_KEYS.SHAPE_CLASS] = shape;
        }
      }
      theme.relationship = {
        type: "relationship",
        properties,
      };
    }
    function parseThemeColor(properties, styleDom, fill, line) {
      const colorDom = childNodeWithTagName(styleDom, "DefaultColor");
      if (!colorDom) {
        return;
      }
      if (fill) {
        const fillColor = colorDom.getAttribute("FillColor") as string;
        const opacity = fillColor.substring(0, 2);
        properties[constants.STYLE_KEYS.FILL_COLOR] =
          opacity !== "00" ? "#" + fillColor.substring(2) : "none";
      }
      if (line) {
        const lineColor = colorDom.getAttribute("LineColor") as string;
        if (lineColor) {
          properties[constants.STYLE_KEYS.LINE_COLOR] =
            "#" + lineColor.substring(2);
        }
      }
    }
    function parseThemeLineStyle(properties, styleDom) {
      const lineStyleDom = childNodeWithTagName(styleDom, "DefaultLineStyle");
      if (!lineStyleDom) {
        return;
      }
      const linePattern =
        LINE_PATTERNMap[lineStyleDom.getAttribute("LineDashStyle") as string];
      if (linePattern) {
        properties[constants.STYLE_KEYS.LINE_PATTERN] = linePattern;
      }
      const lineWidth = parseFloat(
        lineStyleDom.getAttribute("LineWidth") as string,
      );
      if (lineWidth) {
        properties[constants.STYLE_KEYS.LINE_WIDTH] = lineWidth;
      }
    }
  }
  function parseFont(textDom, properties) {
    const align = textDom.getAttribute("TextAlignment") as string;
    if (align) {
      properties[constants.STYLE_KEYS.TEXT_ALIGN] = align.toLowerCase();
    }
    const fontDom = childNodeWithTagName(textDom, "Font");
    if (!fontDom) {
      return;
    }
    const color = fontDom.getAttribute("Color") as string;
    if (color) {
      properties[constants.STYLE_KEYS.TEXT_COLOR] = "#" + color.substring(2);
    }
    const name = fontDom.getAttribute("Name") as string;
    if (name) {
      properties[constants.STYLE_KEYS.FONT_FAMILY] = name;
    }
    const size = fontDom.getAttribute("Size") as string;
    if (size) {
      properties[constants.STYLE_KEYS.FONT_SIZE] = size;
    }
    const bold = fontDom.getAttribute("Bold") as string;
    if (bold === "true") {
      properties[constants.STYLE_KEYS.FONT_WEIGHT] = "bold";
    }
    const italic = fontDom.getAttribute("Italic") as string;
    if (italic === "true") {
      properties[constants.STYLE_KEYS.FONT_STYLE] = "italic";
    }
    const underline = fontDom.getAttribute("Underline") as string;
    const strikethrough = fontDom.getAttribute("Strikethrough") as string;
    if (underline === "true" || strikethrough === "true") {
      properties[constants.STYLE_KEYS.TEXT_DECORATION] =
        (underline === "true" ? "underline " : "") +
        (strikethrough === "true" ? "line-through" : "");
    }
  }
  function mm2Dots(mm) {
    return (mm * 72) / 25.4;
  }
  function childrenWithTagName(parent, tagName) {
    return (Array.from(parent.childNodes) as Element[]).filter(
      (item) => item.tagName && item.tagName === tagName,
    );
  }
  function childNodeWithTagName(parent, tagName) {
    const nodeArray = (Array.from(parent.childNodes) as Element[]).filter(
      (item) => item.tagName && item.tagName === tagName,
    );
    return nodeArray && nodeArray[0];
  }
  return workbookObject.workbook;
}

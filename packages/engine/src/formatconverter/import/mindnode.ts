import pathBrowserify from "path-browserify";
import CryptoJS from "crypto-js";
import JSZip from "jszip";
import { DOMParser } from "xmldom";
import {
  MANIFEST_STRUCTURAL,
  M_FILE_ENTRIES,
  M_RESOURCES,
} from "../lib/constant";

import { UUID } from "../lib/utils";

// EXTERNAL MODULE: ./formatconverter/lib/bplist-parser.ts
import bplistParser from "../lib/bplist-parser";

/* ------------------------------------------------------------------
 * Copyright (c) XMind Ltd. All rights reserved.
 * ------------------------------------------------------------------ */

const MINDNODE_MAINNODE = "mainNode";
const MINDNODE_SUBNODES = "subnodes";
const MINDNODE_LOCATION = "location";
const MINDNODE_ATTACHMENT = "attachment";
// Use vana's default theme M01
const defaultTheme = {
  id: "db791d1fe94b291056ad2839c5",
  importantTopic: {
    type: "topic",
    properties: {
      "fo:font-weight": "bold",
      "fo:color": "#FFFFFF",
      "svg:fill": "#FF4600",
    },
  },
  minorTopic: {
    type: "topic",
    properties: {
      "fo:font-weight": "bold",
      "fo:color": "#FFFFFF",
      "svg:fill": "#FF7D00",
    },
  },
  expiredTopic: {
    type: "topic",
    properties: {
      "fo:font-style": "normal",
      "fo:text-decoration": " line-through",
    },
  },
  centralTopic: {
    properties: {
      "fo:color": "#FFFFFF",
      "svg:fill": "#FF535C",
      "fo:font-weight": "600",
      "fo:font-style": "normal",
      "fo:font-size": "20pt",
      "line-color": "#434B54",
      "fo:font-family": "Nunito Sans",
      "border-line-width": "0",
    },
    styleId: "39687c955b998eedc81008bf3f",
    type: "topic",
  },
  boundary: {
    properties: {
      "fo:color": "#F0B67F",
      "fo:font-weight": "700",
      "fo:font-style": "normal",
      "fo:font-size": "14pt",
      "fo:font-family": "Nunito Sans",
      "line-color": "#F0B67F",
      "svg:fill": "#FEF1E4",
    },
    styleId: "29f9b72a43c95e2d17c1ebd6c8",
    type: "boundary",
  },
  floatingTopic: {
    properties: {
      "svg:fill": "#494A46",
      "border-line-color": "#F0B67F",
      "border-line-width": "0",
      "fo:color": "#FFFFFF",
      "fo:font-family": "Nunito Sans",
      "line-color": "#F0B67F",
      "line-class": "org.xmind.branchConnection.curve",
      "fo:font-weight": "600",
      "fo:font-style": "normal",
      "line-width": "1pt",
    },
    styleId: "8edb0655eed84223023988f896",
    type: "topic",
  },
  subTopic: {
    properties: {
      "fo:color": "#494A46",
      "fo:font-family": "Nunito Sans",
      "fo:text-align": "left",
      "fo:font-size": "11pt",
    },
    styleId: "83da5abc2c3805c13b7099fe0d",
    type: "topic",
  },
  mainTopic: {
    properties: {
      "svg:fill": "#DBE2E3",
      "border-line-width": "0",
      "fo:font-size": "14pt",
      "fo:color": "#494A46",
      "fo:font-family": "Nunito Sans",
      "line-class": "org.xmind.branchConnection.curve",
      "line-width": "1pt",
    },
    styleId: "486ba6c91609eb3e82849939f0",
    type: "topic",
  },
  calloutTopic: {
    properties: {
      "svg:fill": "#F0B67F",
      "fo:font-weight": "600",
      "fo:font-style": "normal",
      "fo:font-size": "14pt",
      "fo:font-family": "Nunito Sans",
      "border-line-width": "0",
      "fo:color": "#775D44",
    },
    styleId: "4379160bdc98a456dd60a8721d",
    type: "topic",
  },
  summary: {
    properties: {
      "line-color": "#434B54",
    },
    styleId: "14394c4b1a5b6b534182699edf",
    type: "summary",
  },
  summaryTopic: {
    properties: {
      "svg:fill": "#494A46",
      "border-line-width": "0pt",
      "border-line-color": "#434B54",
      "fo:font-weight": "600",
      "fo:font-style": "normal",
      "fo:color": "#FFFFFF",
      "fo:font-family": "Nunito Sans",
      "line-color": "#F0B67F",
      "line-class": "org.xmind.branchConnection.curve",
      "line-width": "1pt",
    },
    styleId: "963bfcbd450931f641aef94ec5",
    type: "topic",
  },
  relationship: {
    properties: {
      "line-width": "3pt",
      "line-pattern": "solid",
      "line-color": "#F0B67F",
      "fo:color": "#F0B67F",
      "fo:font-weight": "600",
      "fo:font-family": "Nunito Sans",
      "fo:font-style": "normal",
    },
    styleId: "67596f401d995d448791686b97",
    type: "relationship",
  },
};
export async function fromMindNode(
  content,
  resourceNameMap = {},
  manifest = MANIFEST_STRUCTURAL,
) {
  const contentsJSON = bplistParser.parseBuffer(content);
  if (!contentsJSON) {
    throw new Error("No contents!");
  }
  const contentJSON = contentsJSON[0];
  if (!contentJSON) {
    throw new Error("No content!");
  }
  const mindNode = new mindnode_ConvertMindNode(contentJSON, resourceNameMap);
  return {
    id: UUID(),
    sheets: mindNode.getWorkbookObject().workbook.sheets,
    manifest,
  };
}
export async function fromMindNodeZip(rawBuffer) {
  const zip = new JSZip();
  const zipContent = await zip.loadAsync(rawBuffer);
  if (!zipContent) {
    throw new Error("No content!");
  }
  const content = await zipContent.file("contents.xml");
  if (!content) {
    throw new Error("No contents.xml");
  }
  const contentBuffer = await content.async("nodebuffer");
  const resourceNameMap: any = {};
  const sha256 = CryptoJS.algo.SHA256.create();
  (zipContent as any)
    .folder("resources")
    .forEach(async (relativePath, file) => {
      if (file.dir) {
        return;
      }
      const resourceContent = await file.async("nodebuffer");
      const uint8ArrayContent = new Uint8Array(resourceContent);
      const hash = sha256
        .update(CryptoJS.lib.WordArray.create(uint8ArrayContent))
        .finalize()
        .toString(CryptoJS.enc.Hex);
      const fileName = file.name.replace(/^.*[\\/]/, "");
      const ext = fileName.split(".").pop();
      const newFileEntryPath = `${M_RESOURCES}/${hash}${ext}`;
      resourceNameMap[fileName] = newFileEntryPath;
      MANIFEST_STRUCTURAL[M_FILE_ENTRIES][newFileEntryPath] = {};
      MANIFEST_STRUCTURAL[M_RESOURCES][newFileEntryPath] = uint8ArrayContent;
    });
  return fromMindNode(contentBuffer, resourceNameMap, MANIFEST_STRUCTURAL);
}
class mindnode_ConvertMindNode {
  resourceNameMap: any;
  workbook: { sheets: any[] };
  constructor(contentJSON, resourceNameMap) {
    this.resourceNameMap = resourceNameMap;
    if (contentJSON.mindMap) {
      const workbook = this.parseMindMapJSON(contentJSON.mindMap);
      if (!workbook) {
        throw new Error("Nod mindMap or parse error!");
      }
      this.workbook = workbook;
    } else {
      const canvasJSON = contentJSON.canvas;
      if (!canvasJSON) {
        throw new Error("No canvas!");
      }
      const mindMapsJSON = canvasJSON.mindMaps;
      if (!mindMapsJSON) {
        throw new Error("No mindMaps!");
      }
      const workbook = this.parseMindMapsJSON(mindMapsJSON);
      if (!workbook) {
        throw new Error("No mindMap or parse error!");
      }
      this.workbook = workbook;
    }
  }
  getWorkbookObject() {
    return {
      workbook: this.workbook,
    };
  }
  parseMindMapJSON(mindMapJSON) {
    const sheetsArray: any[] = [];
    const sheetUUID = UUID();
    const sheetObject: any = {
      id: sheetUUID,
      title: "sheet",
    };
    const mainNodes = mindMapJSON.mainNodes;
    if (!mainNodes || !mainNodes.length) {
      return;
    }
    const rootTopic = this.parseTopic(mainNodes[0]);
    if (!rootTopic) {
      return;
    }
    if (mainNodes.length > 1) {
      const rootTopicPosition = this.parseMMLocation(
        mainNodes[0][MINDNODE_LOCATION],
      );
      if (!rootTopic.children) {
        rootTopic.children = {};
      }
      rootTopic.children.detached = [];
      for (let index = 1; index < mainNodes.length; index++) {
        const detachedTopic = this.parseTopic(mainNodes[index]);
        const detachedTopicPosition = this.parseMMLocation(
          mainNodes[index][MINDNODE_LOCATION],
        );
        detachedTopic.position = {
          x: detachedTopicPosition.x - rootTopicPosition.x,
          y: detachedTopicPosition.y - rootTopicPosition.y,
        };
        rootTopic.children.detached.push(detachedTopic);
      }
    }
    sheetObject.rootTopic = rootTopic;
    sheetObject.theme = defaultTheme;
    sheetsArray.push(sheetObject);
    return {
      sheets: sheetsArray,
    };
  }
  parseMindMapsJSON(mindMapsJSON) {
    if (!mindMapsJSON.length) {
      return;
    }
    const sheetsArray: any[] = [];
    const sheetUUID = UUID();
    const sheetObject: any = {
      id: sheetUUID,
      title: "sheet",
    };
    const rootTopic = this.parseTopic(mindMapsJSON[0][MINDNODE_MAINNODE]);
    if (!rootTopic) {
      return;
    }
    if (mindMapsJSON.length > 1) {
      const rootTopicPosition = this.parseMMLocation(
        mindMapsJSON[0][MINDNODE_MAINNODE][MINDNODE_LOCATION],
      );
      if (!rootTopic.children) {
        rootTopic.children = {};
      }
      rootTopic.children.detached = [];
      for (let index = 1; index < mindMapsJSON.length; index++) {
        const detachedTopic = this.parseTopic(
          mindMapsJSON[index][MINDNODE_MAINNODE],
        );
        const detachedTopicPosition = this.parseMMLocation(
          mindMapsJSON[index][MINDNODE_MAINNODE][MINDNODE_LOCATION],
        );
        detachedTopic.position = {
          x: detachedTopicPosition.x - rootTopicPosition.x,
          y: detachedTopicPosition.y - rootTopicPosition.y,
        };
        rootTopic.children.detached.push(detachedTopic);
      }
    }
    sheetObject.rootTopic = rootTopic;
    sheetObject.theme = defaultTheme;
    sheetsArray.push(sheetObject);
    return {
      sheets: sheetsArray,
    };
  }
  parseTopic(topicJSON): any {
    if (!topicJSON) {
      return;
    }
    const topicObject: any = {
      id: UUID(topicJSON.nodeID),
      children: {
        attached: [],
      },
    };
    this.parseTopicTitle(topicJSON.title, topicObject);
    if (topicJSON.fileLink) {
      this.parseTopicFileLink(topicJSON.fileLink, topicObject);
    }
    if (topicJSON[MINDNODE_ATTACHMENT]) {
      this.parseTopicAttachment(topicJSON[MINDNODE_ATTACHMENT], topicObject);
    }
    const properties: any = {};
    // parseTopicShapeStyle(topicJSON.shapeStyle, properties)
    // parsePathStyle(topicJSON.pathStyle, properties)
    // parseTopicTitleStyle(topicJSON.title, properties)
    topicObject.style = {
      id: UUID(),
      properties,
    };
    if (topicJSON[MINDNODE_SUBNODES] && topicJSON[MINDNODE_SUBNODES].length) {
      for (const subnodeJSON of topicJSON[MINDNODE_SUBNODES]) {
        topicObject.children.attached.push(this.parseTopic(subnodeJSON));
      }
    }
    return topicObject;
  }
  parseTopicTitle(titleJSON, topicObject) {
    if (!titleJSON || !titleJSON.text) {
      return "";
    }
    const domParser = new DOMParser();
    let textDom = domParser.parseFromString(titleJSON.text, "application/xml");
    if (!textDom) {
      return "";
    }
    if (textDom.getElementsByTagName("parsererror").length > 0) {
      // 老版本 MindNode 出现两个 dom 元素并列
      textDom = domParser.parseFromString(
        `<p>${titleJSON.text}</p>`,
        "application/xml",
      );
    }
    const aNode = textDom.getElementsByTagName("a")[0];
    if (aNode) {
      topicObject.href = aNode.getAttribute("href") as string;
    }
    topicObject.title = this.parseTopicTitleXML(textDom);
  }
  parseTopicTitleXML(textDom) {
    let title = "";
    if (textDom.childElementCount > 0) {
      for (const dom of textDom.children) {
        title += this.parseTopicTitleXML(dom);
      }
    } else {
      title += textDom.innerHTML;
    }
    return title;
  }
  parseTopicFileLink(fileLinkJSON, topicObject) {
    const absoluteFilePath = fileLinkJSON.absoluteFilePath;
    if (!absoluteFilePath) {
      return;
    }
    if (!topicObject.href) {
      topicObject.href = `file://${absoluteFilePath}`;
    } else {
      topicObject.children.attached.push({
        id: UUID(),
        title: pathBrowserify.basename(absoluteFilePath),
        href: `file://${absoluteFilePath}`,
      });
    }
  }
  parseTopicAttachment(attachmentJSON, topicObject) {
    const mmFileName = attachmentJSON.fileName;
    if (!mmFileName) {
      return;
    }
    const newFileEntryPath = this.resourceNameMap[mmFileName];
    if (!newFileEntryPath) {
      return;
    }
    // "size": "{300, 168.75}"
    // "fileName": "292A3470-53C5-4222-A6A7-6CA71AA99686.png"
    if (this.isImageFormat(mmFileName)) {
      const imageSize = this.parseMMSize(attachmentJSON.size);
      const image: any = {
        src: `xap:${newFileEntryPath}`,
      };
      if (imageSize) {
        image.width = imageSize.width;
        image.height = imageSize.height;
      }
      topicObject.image = image;
    } else if (!topicObject.href) {
      topicObject.href = `xap:${newFileEntryPath}`;
    } else {
      topicObject.children.attached.push({
        id: UUID(),
        title: mmFileName,
        href: `xap:${newFileEntryPath}`,
      });
    }
  }
  parseMMSize(mmSize) {
    if (!mmSize) {
      return;
    }
    mmSize = mmSize.substring(1, mmSize.length - 1);
    const width = parseFloat(mmSize.split(",")[0]);
    const height = parseFloat(mmSize.split(",")[1]);
    return {
      width,
      height,
    };
  }
  parseMMLocation(mindNodePosition) {
    if (!mindNodePosition) {
      return {
        x: 0,
        y: 0,
      };
    }
    mindNodePosition = mindNodePosition.substring(
      1,
      mindNodePosition.length - 1,
    );
    const x = parseFloat(mindNodePosition.split(",")[0]);
    const y = parseFloat(mindNodePosition.split(",")[1]);
    return {
      x,
      y,
    };
  }
  isImageFormat(fileName) {
    return fileName && fileName.match(/.(jpg|jpeg|png|gif)$/i);
  }
}

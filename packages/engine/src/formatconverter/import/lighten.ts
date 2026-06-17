/* ------------------------------------------------------------------
 * Copyright (c) XMind Ltd. All rights reserved.
 * ------------------------------------------------------------------ */
/* 注意， Lighten 1.x 有两种格式。
 * 1. 默认保存的是一个文件夹，包含了 content.json 和 thumbnail.png
 * 2. 导出为 lighten 单文件，是一个 zip 包，需要自行判断后，调用不同的方法 */
import * as constants from "../../common/constants/index";
import { MANIFEST_STRUCTURAL } from "../lib/constant";

import { UUID } from "../lib/utils";

const TOPIC_SHAPE = [
  constants.TOPICSHAPE.RECT,
  constants.TOPICSHAPE.ROUNDEDRECT,
  constants.TOPICSHAPE.UNDERLINE,
  constants.TOPICSHAPE.ELLIPSE,
  constants.TOPICSHAPE.PARALLELOGRAM,
  constants.TOPICSHAPE.PARALLELOGRAM,
  constants.TOPICSHAPE.CLOUD,
];
const BRANCH_CONNECTION = [
  constants.BRANCHCONNECTION.CURVE,
  constants.BRANCHCONNECTION.STRAIGHT,
  constants.BRANCHCONNECTION.ELBOW,
  constants.BRANCHCONNECTION.ROUNDEDELBOW,
  constants.BRANCHCONNECTION.ROUNDEDELBOW,
];
const idMap: any = {};
// export function importLighten(filepath) {
//   const stat = fsp.statSync(filepath)
//   if (stat.isFile()) { //single file, zip format
//     return fsp.readFileAsync(filepath).then(JSZip.loadAsync).then(importfile)
//   }
//   else { //is a package
//     return fsp.readFileAsync(path.join(filepath, 'content.json')).then(parseContentJSON)
//   }
// }
/**
 * 读取的是文件夹中的 content.json
 *
 * @export
 * @param {*} rawString
 * @returns
 */
export function fromLighten(rawString) {
  return parseContentJSON(rawString);
}
/**
 * 读取 lighten 导出的 single 文件
 *
 * @export
 * @param {*} zip
 * @returns
 */
export function fromLightenZipPromise(zip) {
  return new Promise((resolve, reject) => {
    if (!zip) {
      reject("Need a lighten file");
    }
    if (!zip.file("content.json")) {
      reject("no content");
    }
    zip
      .file("content.json")
      .async("string")
      .then((rawString) => {
        resolve(parseContentJSON(rawString));
      });
  });
}
function parseContentJSON(rawString) {
  const contentJSON = JSON.parse(rawString);
  const sheetsArray: any[] = [];
  const workbookObject = {
    workbook: {
      id: UUID(),
      sheets: sheetsArray,
      manifest: MANIFEST_STRUCTURAL,
    },
  };
  const sheetUUID = UUID(contentJSON.id);
  const sheetObject: any = {
    id: sheetUUID,
    title: "sheet",
    rootTopic: parseTopic(contentJSON.rootTopic),
    theme: parseTheme(contentJSON),
  };
  if (contentJSON.detachedTopics) {
    sheetObject.rootTopic.children.detached = [];
    for (const d of contentJSON.detachedTopics) {
      sheetObject.rootTopic.children.detached.push(parseTopic(d, true));
    }
  }
  if (contentJSON.relationships) {
    sheetObject.relationships = parseRelationship(contentJSON.relationships);
  }
  sheetsArray.push(sheetObject);
  return workbookObject.workbook;
}
function parseTopic(lightenTopic, isDetached?): any {
  const topicObject: any = {
    id: UUID(lightenTopic.id),
    title: lightenTopic.title,
    // children: {
    //   attached: [],
    //   // detached: []
    // }
  };
  if (lightenTopic.note && lightenTopic.note.text) {
    topicObject.notes = {
      plain: {
        content: lightenTopic.note.text,
      },
    };
  }
  if (isDetached && lightenTopic.position) {
    const p = lightenTopic.position.substring(
      1,
      lightenTopic.position.length - 2,
    );
    const ps = p.split(",");
    if (ps.length === 2) {
      topicObject.position = {
        x: parseFloat(ps[0]),
        y: parseFloat(ps[1]),
      };
    } else {
      topicObject.position = {
        x: 100,
        y: 0,
      };
    }
  }
  if (lightenTopic.style) {
    topicObject.style = parseStyle(lightenTopic.style);
  }
  idMap[lightenTopic.id] = topicObject.id;
  if (lightenTopic.subtopics) {
    topicObject.children = {
      attached: [],
    };
    for (const child of lightenTopic.subtopics) {
      topicObject.children.attached.push(parseTopic(child));
    }
  }
  return topicObject;
}
function parseStyle(style) {
  const properties: any = {};
  if (style.fontName) {
    properties[constants.STYLE_KEYS.FONT_FAMILY] = style.fontName;
  }
  if (style.fontWeight) {
    properties[constants.STYLE_KEYS.FONT_WEIGHT] = style.fontWeight;
  }
  if (style.fontStyle) {
    properties[constants.STYLE_KEYS.FONT_STYLE] = style.fontStyle;
  }
  if (style.fontColor) {
    properties[constants.STYLE_KEYS.TEXT_COLOR] = parseColor(style.fontColor);
  }
  if (style.fillColor) {
    properties[constants.STYLE_KEYS.FILL_COLOR] = parseColor(style.fillColor);
  }
  if (style.topicShape) {
    properties[constants.STYLE_KEYS.SHAPE_CLASS] =
      TOPIC_SHAPE[style.topicShape] || constants.TOPICSHAPE.ROUNDEDRECT;
  }
  if (style.lineColor) {
    properties[constants.STYLE_KEYS.LINE_COLOR] = parseColor(style.lineColor);
  }
  if (style.lineWidth) {
    properties[constants.STYLE_KEYS.LINE_WIDTH] = Math.min(5, style.lineWidth);
  }
  if (style.lineType) {
    properties[constants.STYLE_KEYS.LINE_CLASS] =
      BRANCH_CONNECTION[style.lineType] || constants.BRANCHCONNECTION.CURVE;
  }
  return {
    id: UUID(),
    properties,
  };
}
function parseTheme({ colorTheme, skeletonTheme }) {
  const theme: any = {
    map: {
      type: "map",
      properties: {},
    },
  };
  if (skeletonTheme.mapStyle && skeletonTheme.mapStyle.taperedLine) {
    theme.map.properties[constants.STYLE_KEYS.LINE_TAPERED] = "tapered";
  }
  if (colorTheme.mapStyle && colorTheme.mapStyle.fillColor) {
    theme.map.properties[constants.STYLE_KEYS.FILL_COLOR] = parseColor(
      colorTheme.mapStyle.fillColor,
    );
  }
  theme.centralTopic = {
    type: "topic",
    properties: {},
  };
  parseTopicStyle(
    theme.centralTopic.properties,
    merge(skeletonTheme.topicStyleForCentral, colorTheme.topicStyleForCentral),
  );
  theme.mainTopic = {
    type: "topic",
    properties: {},
  };
  parseTopicStyle(
    theme.mainTopic.properties,
    merge(skeletonTheme.topicStyleForMain, colorTheme.topicStyleForMain),
  );
  theme.subTopic = {
    type: "topic",
    properties: {},
  };
  parseTopicStyle(
    theme.subTopic.properties,
    merge(
      skeletonTheme.topicStyleForSubtopic,
      colorTheme.topicStyleForSubtopic,
    ),
  );
  theme.floatingTopic = {
    type: "topic",
    properties: {},
  };
  parseTopicStyle(
    theme.floatingTopic.properties,
    merge(
      skeletonTheme.topicStyleForFloating,
      colorTheme.topicStyleForFloating,
    ),
  );
  theme.calloutTopic = {
    type: "topic",
    properties: {},
  };
  theme.relationship = {
    type: "relationship",
    properties: {},
  };
  if (colorTheme.relationshipStyle) {
    if (colorTheme.relationshipStyle.lineColor) {
      theme.relationship.properties[constants.STYLE_KEYS.LINE_COLOR] =
        parseColor(colorTheme.relationshipStyle.lineColor);
    }
    if (colorTheme.relationshipStyle.lineWidth) {
      theme.relationship.properties[constants.STYLE_KEYS.LINE_WIDTH] = Math.min(
        5,
        colorTheme.relationshipStyle.lineWidth,
      );
    }
  }
  return theme;
}
function parseTopicStyle(themeProperties, lightenStyle) {
  if (lightenStyle.fillColor) {
    themeProperties[constants.STYLE_KEYS.FILL_COLOR] = parseColor(
      lightenStyle.fillColor,
    );
  }
  if (lightenStyle.topicShape) {
    themeProperties[constants.STYLE_KEYS.SHAPE_CLASS] =
      TOPIC_SHAPE[lightenStyle.topicShape] || constants.TOPICSHAPE.ROUNDEDRECT;
  }
  if (lightenStyle.lineColor) {
    themeProperties[constants.STYLE_KEYS.LINE_COLOR] = parseColor(
      lightenStyle.lineColor,
    );
  }
  if (lightenStyle.lineWidth) {
    themeProperties[constants.STYLE_KEYS.LINE_WIDTH] = Math.min(
      5,
      lightenStyle.lineWidth,
    );
  }
  if (lightenStyle.lineType) {
    themeProperties[constants.STYLE_KEYS.LINE_CLASS] =
      BRANCH_CONNECTION[lightenStyle.lineType] ||
      constants.BRANCHCONNECTION.CURVE;
  }
  if (lightenStyle.fontName) {
    themeProperties[constants.STYLE_KEYS.FONT_FAMILY] = lightenStyle.fontName;
  }
  if (lightenStyle.fontWeight) {
    themeProperties[constants.STYLE_KEYS.FONT_WEIGHT] = lightenStyle.fontWeight;
  }
  if (lightenStyle.fontStyle) {
    themeProperties[constants.STYLE_KEYS.FONT_STYLE] = lightenStyle.fontStyle;
  }
  if (lightenStyle.fontColor) {
    themeProperties[constants.STYLE_KEYS.TEXT_COLOR] = parseColor(
      lightenStyle.fontColor,
    );
  }
}
function parseColor(color) {
  const rgba = color.replace("{", "").replace("}", "").split(",");
  if (rgba[3] === 0) {
    return "#ffffff";
  }
  let r = "#";
  rgba.slice(0, 3).forEach((d) => {
    r += (d < 16 ? "0" : "") + Number(d).toString(16);
  });
  return r;
}
function merge(...args) {
  const o: any = {};
  if (args && args.length) {
    for (let i = 0; i < args.length; i++) {
      Object.assign(o, args[i]);
    }
  }
  return o;
}
function parseRelationship(lightenRelationships) {
  const rs: any[] = [];
  for (const lr of lightenRelationships) {
    const r = {
      id: UUID(lr.id),
      end1Id: idMap[lr.startNodeId],
      end2Id: idMap[lr.endNodeId],
      title: "",
    };
    rs.push(r);
  }
  return rs;
}

/* ------------------------------------------------------------------
 * Copyright (c) XMind Ltd. All rights reserved.
 * ------------------------------------------------------------------ */
import * as constants from "../../common/constants/index";
import { DOMParser } from "xmldom";
import { MANIFEST_STRUCTURAL } from "../lib/constant";

import { UUID, isString } from "../lib/utils";

const markerMap = {
  "full-1": "priority-1",
  "full-2": "priority-2",
  "full-3": "priority-3",
  "full-4": "priority-4",
  "full-5": "priority-5",
  "full-6": "priority-6",
  clock: "other-clock",
  desktop_new: "other-calendar",
  help: "other-question",
  idea: "other-lightbulb",
  kaddressbook: "other-phone",
  korn: "other-email",
  mail: "other-email",
  licq: "other-people",
  messagebox_warning: "other-exclam",
  ksmiletris: "smiley-smile",
  flag: "flag-red",
  yes: "other-yes",
  no: "other-no",
};
export function fromFreemind(mmContent) {
  if (!mmContent) {
    throw new Error("Need a freemind file");
  }
  const parser = new DOMParser();
  const contentDom = parser.parseFromString(mmContent, "application/xml");
  const workbookObject = parseWorkbook(contentDom);
  if (!workbookObject) {
    throw new Error("No content");
  }
  return workbookObject;
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function parseWorkbook(contentDom, filePath?) {
  const mapDom = childNodeWithTagName(contentDom, "map");
  if (!mapDom) {
    return;
  }
  const sheetsArray: any[] = [];
  const workbookObject = {
    workbook: {
      id: UUID(),
      sheets: sheetsArray,
      manifest: MANIFEST_STRUCTURAL,
    },
  };
  const sheetUUID = UUID();
  const sheetObject: any = {
    id: sheetUUID,
    title: "sheet",
  };
  sheetsArray.push(sheetObject);
  sheetObject.rootTopic = parseTopicDom(childNodeWithTagName(mapDom, "node"), {
    defaultTitle: "Central Topic",
    isRoot: true,
  });
  function parseTopicDom(nodeDom, options) {
    if (!nodeDom) {
      return;
    }
    const { defaultTitle, isRoot } = options || {};
    const topicObject: any = {
      id: UUID(nodeDom.getAttribute("ID") as string),
      title: isString(nodeDom.getAttribute("TEXT") as string)
        ? nodeDom.getAttribute("TEXT")
        : defaultTitle,
    };
    link: {
      const link = nodeDom.getAttribute("LINK") as string;
      if (!link) {
        break link;
      }
      if (link.startsWith("#ID_")) {
        topicObject.href = "xmind:#" + UUID(link.substring(1));
      } else if (/^(https?|mailto):\/\//i.test(link)) {
        topicObject.href = link;
      } else if (link.startsWith("..") || link.startsWith("/")) {
        // topicObject.href = 'file:' + path.join(filePath, '../' + link)
      }
    }
    richContent: {
      const richContentDom = childNodeWithTagName(nodeDom, "richcontent");
      if (!richContentDom) {
        break richContent;
      }
      const type = richContentDom.getAttribute("TYPE") as string;
      if (type === "NOTE") {
        const noteHtmlDom = childNodeWithTagName(richContentDom, "html");
        if (!noteHtmlDom) {
          break richContent;
        }
        const noteBodyDom = childNodeWithTagName(noteHtmlDom, "body");
        if (!noteBodyDom) {
          break richContent;
        }
        const pDomArray = childrenWithTagName(noteBodyDom, "p");
        if (!pDomArray.length) {
          break richContent;
        }
        let content;
        pDomArray.forEach((pDom) => {
          content += pDom.textContent;
        });
        if (content) {
          topicObject.notes = {};
          topicObject.notes.plain = {
            content,
          };
        }
      } else if (type === "NODE") {
        const nodeHtmlDom = childNodeWithTagName(richContentDom, "html");
        if (!nodeHtmlDom) {
          break richContent;
        }
        const nodeBodyDom = childNodeWithTagName(nodeHtmlDom, "body");
        if (!nodeBodyDom) {
          break richContent;
        }
        // Parse Long Node in Freemind
        const pDomArray = childrenWithTagName(nodeBodyDom, "p");
        const title: any[] = [];
        if (pDomArray.length) {
          pDomArray.forEach((pDom) => {
            title.push(pDom.textContent && pDom.textContent.trim());
          });
        }
        if (title.length) {
          topicObject.title = title.join("\n");
        }
        const imgDom = childNodeWithTagName(richContentDom, "img");
        if (imgDom) {
          const src = imgDom.getAttribute("src") as string;
          // TODO hash
          // src = path.join(filePath, '../' + src)
          const image = {
            src,
          };
          topicObject.image = image;
        }
      }
    }
    marker: {
      const markerDomArray = childrenWithTagName(nodeDom, "icon");
      if (!markerDomArray.length) {
        break marker;
      }
      topicObject.markers = [];
      markerDomArray.forEach((markerDom) => {
        const markerId =
          markerMap[markerDom.getAttribute("BUILTIN") as string] ||
          "other-question";
        topicObject.markers.push({
          markerId,
        });
      });
    }
    children: {
      const subNodeDomArray = childrenWithTagName(nodeDom, "node");
      if (!subNodeDomArray.length) {
        break children;
      }
      topicObject.children = {};
      topicObject.children.attached = [];
      subNodeDomArray.forEach((subNodeDom, index) => {
        topicObject.children.attached.push(
          parseTopicDom(subNodeDom, {
            defaultTitle: isRoot ? "Main Topic" : "Subtopic",
          }),
        );
        parseBoundary(subNodeDom, index);
      });
    }
    // style
    {
      const properties: any = {};
      const backgroundColor = nodeDom.getAttribute(
        "BACKGROUND_COLOR",
      ) as string;
      if (backgroundColor) {
        properties[constants.STYLE_KEYS.FILL_COLOR] = backgroundColor;
      }
      const color = nodeDom.getAttribute("COLOR") as string;
      if (color) {
        properties[constants.STYLE_KEYS.TEXT_COLOR] = color;
      }
      const fontDom = childNodeWithTagName(nodeDom, "font");
      if (fontDom) {
        const fontName = fontDom.getAttribute("NAME") as string;
        if (fontName) {
          properties[constants.STYLE_KEYS.FONT_FAMILY] = fontName;
        }
        const size = fontDom.getAttribute("SIZE") as string;
        if (size) {
          properties[constants.STYLE_KEYS.FONT_SIZE] = size;
        }
        const italic = fontDom.getAttribute("ITALIC") as string;
        if (italic === "true") {
          properties[constants.STYLE_KEYS.FONT_STYLE] = "italic";
        }
        const bold = fontDom.getAttribute("BOLD") as string;
        if (bold === "true") {
          properties[constants.STYLE_KEYS.FONT_WEIGHT] = "bold";
        }
      }
    }
    relationship: {
      const linkDom = childNodeWithTagName(nodeDom, "arrowlink");
      if (!linkDom) {
        break relationship;
      }
      const destination = linkDom.getAttribute("DESTINATION") as string;
      if (!destination) {
        break relationship;
      }
      const relationshipObject: any = {
        id: UUID(),
        end1Id: UUID(nodeDom.getAttribute("ID") as string),
        end2Id: UUID(destination),
        title: "",
      };
      const properties: any = {};
      const color = linkDom.getAttribute("COLOR") as string;
      if (color) {
        properties[constants.STYLE_KEYS.LINE_COLOR] = color;
      }
      const startArrow = linkDom.getAttribute("STARTARROW") as string;
      properties[constants.STYLE_KEYS.ARROW_BEGIN_CLASS] =
        startArrow === "Default"
          ? constants.ARROW_CLASS.NORMAL
          : constants.ARROW_CLASS.NONE;
      const endArrow = linkDom.getAttribute("ENDARROW") as string;
      properties[constants.STYLE_KEYS.ARROW_END_CLASS] =
        endArrow === "Default"
          ? constants.ARROW_CLASS.NORMAL
          : constants.ARROW_CLASS.NONE;
      relationshipObject.style = {
        type: "relationship",
        properties,
      };
      if (!sheetObject.relationships) {
        sheetObject.relationships = [];
      }
      sheetObject.relationships.push(relationshipObject);
    }
    function parseBoundary(nodeDom, index) {
      const cloudDom = childNodeWithTagName(nodeDom, "cloud");
      if (!cloudDom) {
        return;
      }
      if (!topicObject.boundaries) {
        topicObject.boundaries = [];
      }
      topicObject.boundaries.push({
        id: UUID(),
        range: `(${index}, ${index})`,
      });
    }
    return topicObject;
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

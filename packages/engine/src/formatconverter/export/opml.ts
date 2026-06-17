import * as constants from "../../common/constants/index";

import config from "../../common/config";
const export_opml_MODULE_NAME = "[export OPML]";
const opml_LINE_BREAK = "\n";
const opml_INDENT = "\t";
const OUTLINE_BASE_INDENT = 2; // => 2tabs
/**
 * rawString -> format String
 * @param {string} rawString
 * @param {object} options {indent, lineBreak}
 * @return {string}
 */
function decorateRow(rawString = "", options: any = {}) {
  const { indent = 0, lineBreak = opml_LINE_BREAK } = options;
  return `${opml_INDENT.repeat(indent)}${rawString}${lineBreak}`;
}
/**
 * Escape some ampersand characters, refer https://www.w3.org/TR/xml/#syntax
 * @param {string} rawString
 */
function escapeAmpersand(rawString = "") {
  return rawString
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
/**
 * topic -> outline element string
 * @param {object} topic
 * @return outline element string
 */
function opml_parseTopic(topic) {
  let outlineText = "";
  const attributes: any[] = [];
  // title
  const title = topic.attributes.title || topic.title;
  attributes.push(`text="${escapeAmpersand(title)}"`); // no matter title is empty or not
  // notes
  const notes = topic.getNotes() || topic.notes;
  const notesPlainText = notes && notes.plain && notes.plain.content;
  if (notesPlainText) {
    attributes.push(
      `_note="${escapeAmpersand(notesPlainText).replace(/\n/gi, "&#10;")}"`,
    );
  }
  // hyperlink
  const href = topic.getHref() || topic.href;
  const isHyperlink = typeof href === "string" && href.startsWith("http");
  if (isHyperlink) {
    attributes.push(`type="link" _url="${escapeAmpersand(href)}"`);
  }
  const layer = topic.getLayer();
  const indent = OUTLINE_BASE_INDENT + (layer - 1);
  const childrenKinds = ["attached", "detached"];
  const childReceiver: any[] = [];
  childrenKinds.map((childrenKind) => {
    const children = topic.children(childrenKind);
    if (Array.isArray(children)) {
      childReceiver.push(...children);
    }
  });
  if (childReceiver.length) {
    outlineText += decorateRow(`<outline ${attributes.join(" ")}>`, {
      indent: indent,
    });
    childReceiver.map((child) => {
      outlineText += opml_parseTopic(child);
    });
    outlineText += decorateRow("</outline>", {
      indent: indent,
    });
  } else {
    outlineText += decorateRow(`<outline ${attributes.join(" ")}></outline>`, {
      indent: indent,
    });
  }
  return outlineText;
}
/**
 * sheetModle.rootTopic -> OPMLText
 * @param {object} workbook
 * @param {object} options {textWatermark(something like watermark)}
 * @return {string} - OPMLText
 */
export async function toOPML(workbook, options) {
  const { sheets } = workbook;
  const { textWatermark } = options;
  // only support one sheet now
  if (!Array.isArray(sheets) || !sheets[0]) {
    config.get(constants.CONFIG.LOGGER).error({
      [export_opml_MODULE_NAME]: "fail to load first sheets",
    });
    throw new Error("fail to load first shees");
  }
  const rootTopic = sheets[0].rootTopic();
  if (!rootTopic) {
    config.get(constants.CONFIG.LOGGER).error({
      [export_opml_MODULE_NAME]: "fail to load rootTopic",
    });
    throw new Error("fail to load rootTopi");
  }
  let OPMLReceiver = "";
  OPMLReceiver += decorateRow('<?xml version="1.0" encoding="UTF-8"?>');
  OPMLReceiver += decorateRow('<opml version="1.0">');
  OPMLReceiver += decorateRow("<head>", {
    indent: 1,
  });
  OPMLReceiver += decorateRow(`<dateCreated>${new Date()}</dateCreated>`, {
    indent: 2,
  });
  OPMLReceiver += decorateRow(`<dateModified>${new Date()}</dateModified>`, {
    indent: 2,
  });
  OPMLReceiver += decorateRow("</head>", {
    indent: 1,
  });
  OPMLReceiver += decorateRow("<body>", {
    indent: 1,
  });
  OPMLReceiver += opml_parseTopic(rootTopic);
  if (textWatermark) {
    OPMLReceiver += decorateRow(`<outline text="${textWatermark}"></outline>`, {
      indent: OUTLINE_BASE_INDENT,
    });
  }
  OPMLReceiver += decorateRow("</body>", {
    indent: 1,
  });
  OPMLReceiver += decorateRow("</opml>");
  return OPMLReceiver;
}

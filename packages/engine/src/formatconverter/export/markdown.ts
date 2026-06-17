import JSZip from "jszip";
import styleManager from "../../utils/business/stylemanager/index";
import { isFileProtocol, isXapResource } from "../lib/utils";
import {
  TEXT_BUNDLE_ASSETS,
  TEXT_BUNDLE_CONTENT,
  TEXT_BUNDLE_INFO,
} from "../lib/constant";

import * as constants from "../../common/constants/index";

import config from "../../common/config";

const markdown_MODULE_NAME = "[export markdown]";
const EXPORT_MODE_TEXT_BUNDLE = "textBundle";
const XAP_PREFIX = "xap:resources/";
const HEADING_PREFIX = "#";
const LIST_PREFIX = "-";
const LINE_BREAK = "\n";
const INDENT = "\t";
const SPACE = " ";
function wrapStrBy(str, style) {
  if (!str) {
    return "";
  }
  switch (style) {
    case "italic":
      return `*${str}*`;
    case "bold":
      return `**${str}**`;
    case "line-through":
      return `~~${str}~~`;
    default:
      return str;
  }
}
function getParsedTitle(topic) {
  const title = topic.attributes.title;
  const { fontWeight, fontStyle, textDecoration } =
    styleManager.getTitleTextStyle(topic);
  return [fontWeight, fontStyle, textDecoration].reduce(
    (str, style) => wrapStrBy(str, style),
    title,
  );
}
/**
 * topic -> md tag string
 * @param {object} topic
 * @param {object} options {exportMode}
 * @return md tag string
 */
function markdown_parseTopic(topic, options: any = {}) {
  const { exportMode } = options;
  let mdText = "";
  let topicPrefix = "";
  let paragraphPrefix = "";
  const layer = topic.getLayer();
  if (layer >= 1 && layer <= 3) {
    topicPrefix = `${HEADING_PREFIX.repeat(layer)}${SPACE}`;
  } else if (layer > 3) {
    const totalIndent = `${INDENT.repeat(layer - 4)}`;
    topicPrefix = `${totalIndent}${LIST_PREFIX}${SPACE}`;
    paragraphPrefix = `${totalIndent}${SPACE.repeat(2)}`;
  } else {
    config.get(constants.CONFIG.LOGGER).error({
      [markdown_MODULE_NAME]: `fail to parse ${layer} level topic`,
    });
    return "";
  }
  const title = getParsedTitle(topic);
  const notes = topic.getNotes();
  const notesPlainText = notes && notes.plain && notes.plain.content;
  const audioNotes = topic.getAudioNotes();
  const audioHrefs = audioNotes && audioNotes.resourceRefs;
  const imageModel = topic.getImageModel();
  const imageData = imageModel && imageModel.toJSON();
  const imageHref = imageData && imageData.src;
  const href = topic.getHref();
  const mathjax = topic.getMathJaxText();
  const isHyperlink = typeof href === "string" && href.startsWith("http");
  const isHrefXapResource = isXapResource(href);
  const isHrefFileOrDirPath = isFileProtocol(href);
  // topic title
  if (title !== undefined && title !== null) {
    mdText += topicPrefix;
    if (exportMode === EXPORT_MODE_TEXT_BUNDLE) {
      if (isHyperlink || isHrefFileOrDirPath) {
        mdText += `[${title}](${href})`;
      } else if (isHrefXapResource) {
        mdText += `[${title}](${TEXT_BUNDLE_ASSETS}${href.replace(
          XAP_PREFIX,
          "",
        )})`;
      } else {
        mdText += title;
      }
      if (imageHref) {
        // sticker or image
        mdText += "\n";
        mdText += `![image](${TEXT_BUNDLE_ASSETS}${imageHref.replace(
          XAP_PREFIX,
          "",
        )})`;
      }
      // AudioNotes
      if (audioHrefs) {
        audioHrefs.map((href) => {
          mdText += `[](${TEXT_BUNDLE_ASSETS}${href.replace(XAP_PREFIX, "")})`;
        });
      }
    }
    // for markdown
    else if (isHyperlink || isHrefFileOrDirPath) {
      mdText += `[${title}](${href})`;
    } else {
      mdText += title;
    }
    if (mathjax) {
      mdText += `\n\n$$\n${mathjax.replace("\n", " ")}\n$$`;
    }
    const parent = topic.parent();
    let sameKindSiblings: any[] = [];
    let haveSiblings = false;
    let haveChildren = false;
    const index = topic.getIndexInParent();
    let isLastOneChild = false;
    if (topic.type() !== "root") {
      sameKindSiblings = parent.children(topic.type());
      isLastOneChild = index === sameKindSiblings.length - 1;
      haveSiblings = parent.children().length > 1;
      haveChildren = topic.children().length > 0;
    }
    if (
      !notesPlainText &&
      !isHyperlink &&
      layer > 3 &&
      haveSiblings &&
      !haveChildren &&
      !isLastOneChild
    ) {
      // more than 4 or 4 layer topic if haven't notes、hyperlink、children
      mdText += `${LINE_BREAK}`;
    } else {
      mdText += `${LINE_BREAK.repeat(2)}`;
    }
  }
  // notes
  if (notesPlainText) {
    notesPlainText.split(LINE_BREAK).forEach((paragraph) => {
      mdText += `${paragraphPrefix}${paragraph}${LINE_BREAK}`;
    });
  }
  return mdText;
}
/**
 *
 * @param {object} workbook
 * @param {object} options {textWatermark(something like watermark), exportMode}
 * @return {string}
 */
export async function toMarkdown(workbook: any = {}, options: any = {}) {
  const { targetBranch, sheets } = workbook;
  const { textWatermark, exportMode } = options;
  // only support one sheet now
  if (!targetBranch && (!Array.isArray(sheets) || !sheets[0])) {
    config.get(constants.CONFIG.LOGGER).error({
      [markdown_MODULE_NAME]: "fail to load first sheet or targetBranch",
    });
    throw new Error("fail to load first sheet or targetBranch");
  }
  const rootTopic = targetBranch || sheets[0].rootTopic();
  if (!rootTopic) {
    config.get(constants.CONFIG.LOGGER).error({
      [markdown_MODULE_NAME]: "fail to load rootTopic",
    });
    throw new Error("fail to load rootTopic");
  }
  const topicStack: any[] = [];
  let mdReceiver = "";
  topicStack.push(rootTopic);
  while (topicStack.length) {
    const topic = topicStack.pop();
    mdReceiver += markdown_parseTopic(topic, {
      exportMode,
    });
    const childrenKinds = ["detached", "attached"];
    childrenKinds.map((childrenKind) => {
      const children = topic.children(childrenKind);
      if (!Array.isArray(children)) {
        return;
      }
      for (let iterator = children.length - 1; iterator >= 0; iterator--) {
        const child = children[iterator];
        topicStack.push(child);
      }
    });
  }
  if (textWatermark) {
    mdReceiver += textWatermark;
  }
  return mdReceiver;
}
/**
 *
 * @param {object} workbook
 * @param {object} options
 *                 textWatermark<string> - something like watermark
 *                 infoJson<object> - see http://textbundle.org/spec/
 * @return {Promise} resolve(uint8array)
 */
export async function toTextBundlePack(workbook: any = {}, options: any = {}) {
  const zip = new JSZip();
  const { manifest } = workbook;
  const textBundleFolder = "Textbundle.textbundle/"; // textobundlepack mode
  const { mdText, infoJson } = await toTextBundle(workbook, options);
  // text.md
  zip.file(`${textBundleFolder}${TEXT_BUNDLE_CONTENT}`, mdText);
  // assets/
  if (manifest && typeof manifest.resources === "object") {
    for (const [xapUrl, data] of Object.entries(manifest.resources)) {
      if (isXapResource(xapUrl)) {
        zip.file(
          `${textBundleFolder}${TEXT_BUNDLE_ASSETS}${xapUrl.replace(
            XAP_PREFIX,
            "",
          )}`,
          data as any,
        );
      }
    }
  }
  // info.json
  zip.file(`${textBundleFolder}${TEXT_BUNDLE_INFO}`, infoJson);
  return zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
  });
}
/**
 *
 * @param {object} workbook
 * @param {object} options
 *                 textWatermark<string> - something like watermark
 *                 infoJson<object> - see http://textbundle.org/spec/
 * @return {Object} {mdText<string>, infoJson<string>}
 */
export async function toTextBundle(workbook: any = {}, options: any = {}) {
  let { infoJson = {} } = options;
  const mdText = await toMarkdown(
    workbook,
    Object.assign(options, {
      exportMode: EXPORT_MODE_TEXT_BUNDLE,
    }),
  );
  // info.json
  // see http://textbundle.org/spec/
  const infoDefault = {
    version: 2,
    type: "net.daringfireball.markdown",
  };
  infoJson = JSON.stringify(
    Object.assign(Object.assign({}, infoDefault), infoJson),
  );
  return {
    mdText,
    infoJson,
  };
}

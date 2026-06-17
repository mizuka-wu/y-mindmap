import * as commonmark from "commonmark";
import CryptoJS from "crypto-js";
import JSZip from "jszip";
import * as constants from "../../common/constants/index";
import config from "../../common/config";

import {
  MANIFEST_STRUCTURAL,
  M_FILE_ENTRIES,
  M_RESOURCES,
  FLOAT_X_COORDINATE_INCREASE,
  TEXT_BUNDLE_ASSETS,
  FLOAT_Y_COORDINATE_INCREASE,
  TEXT_BUNDLE_CONTENT,
} from "../lib/constant";

import { UUID } from "../lib/utils";

const MODULE_NAME = "[import markdown]";
// see commonmark.js https://github.com/commonmark/commonmark.js
const reader = new commonmark.Parser();
// commmark node
const COMMONMARK_NODE_TYPE = {
  TEXT: "text",
  SOFTBREAK: "softbreak",
  LINEBREAK: "linebreak",
  EMPH: "emph",
  STRONG: "strong",
  HTML_INLINE: "html_inline",
  LINK: "link",
  IMAGE: "image",
  CODE: "code",
  DOCUMENT: "document",
  PARAGRAPH: "paragraph",
  BLOCK_QUOTE: "block_quote",
  ITEM: "item",
  LIST: "list",
  HEADING: "heading",
  CODE_BLOCK: "code_block",
  HTML_BLOCK: "html_block",
  THEMATIC_BREAK: "thematic_break",
};
const CUSTOMER_NODE_TYPE = {
  FORMTEXT: "from_text",
};
// textbundle
const PARSE_MODE_TEXT_BUNDLE = "textBundle";
const MANIFEST = "MANIFEST_STRUCTURAL";
/**
  'nodeType': [
      blockType (2 means block, 3 means inline),
      toXMindType (2 means topic, 3 means text),
  ] **/
const MdNodeType = {
  [COMMONMARK_NODE_TYPE.TEXT]: [3, 3],
  [COMMONMARK_NODE_TYPE.SOFTBREAK]: [3, 3],
  [COMMONMARK_NODE_TYPE.LINEBREAK]: [3, 3],
  [COMMONMARK_NODE_TYPE.EMPH]: [3, 3],
  [COMMONMARK_NODE_TYPE.STRONG]: [3, 3],
  [COMMONMARK_NODE_TYPE.HTML_INLINE]: [3, 3],
  [COMMONMARK_NODE_TYPE.LINK]: [3, 3],
  [COMMONMARK_NODE_TYPE.IMAGE]: [3, 3],
  [COMMONMARK_NODE_TYPE.CODE]: [3, 3],
  [COMMONMARK_NODE_TYPE.DOCUMENT]: [2, 3],
  [COMMONMARK_NODE_TYPE.PARAGRAPH]: [2, 3],
  [COMMONMARK_NODE_TYPE.BLOCK_QUOTE]: [2, 3],
  [COMMONMARK_NODE_TYPE.ITEM]: [2, 2],
  [COMMONMARK_NODE_TYPE.LIST]: [2, 2],
  [COMMONMARK_NODE_TYPE.HEADING]: [2, 2],
  [COMMONMARK_NODE_TYPE.CODE_BLOCK]: [2, 3],
  [COMMONMARK_NODE_TYPE.HTML_BLOCK]: [2, 3],
  [COMMONMARK_NODE_TYPE.THEMATIC_BREAK]: [2, 3],
  [CUSTOMER_NODE_TYPE.FORMTEXT]: [2, 2],
};
const LIST_ITEM_BASE_LEVEL = 100;
const ROOT_TOPIC_FROM_TEXT_TITLE_LENGTH = 9;
function isTopic(node) {
  return MdNodeType[node.type][1] === 2;
}
function isText(node) {
  return MdNodeType[node.type][1] === 3;
}
function parentNode(node, parentLevel?) {
  parentLevel = parentLevel || 1;
  let res = node;
  while (parentLevel > 0) {
    res = res?.parent || null;
    if (!res) {
      return null;
    }
    parentLevel -= 1;
  }
  return res || null;
}
function isNote(node) {
  switch (node.type) {
    case COMMONMARK_NODE_TYPE.LINK:
      if (
        parentNode(node)?.type === COMMONMARK_NODE_TYPE.HEADING ||
        (parentNode(node)?.type === COMMONMARK_NODE_TYPE.PARAGRAPH &&
          parentNode(node, 2)?.type === COMMONMARK_NODE_TYPE.ITEM)
      ) {
        // e.g. ## Heading [text](a.b.com)
        // e.g. - List item [text](a.b.com)
        return true;
      }
      break;
    case COMMONMARK_NODE_TYPE.TEXT:
      if (node.parent?.type === COMMONMARK_NODE_TYPE.LINK) {
        // e.g. ## Heading [text](a.b.com)
        return true;
      }
      if (
        (parentNode(node)?.type === COMMONMARK_NODE_TYPE.EMPH ||
          parentNode(node)?.type === COMMONMARK_NODE_TYPE.STRONG) &&
        parentNode(node, 2)?.type === COMMONMARK_NODE_TYPE.LINK &&
        (parentNode(node, 3)?.type === COMMONMARK_NODE_TYPE.HEADING ||
          (parentNode(node, 3)?.type === COMMONMARK_NODE_TYPE.PARAGRAPH &&
            parentNode(node, 4)?.type === COMMONMARK_NODE_TYPE.ITEM))
      ) {
        // e.g. ## Heading [*text*](a.b.com)
        // e.g. ## Heading [**text**](a.b.com)
        // e.g. - List item [*text*](a.b.com)
        // e.g. - List item [**text**](a.b.com)
        return true;
      }
      if (
        parentNode(node)?.type === COMMONMARK_NODE_TYPE.STRONG &&
        parentNode(node, 2)?.type === COMMONMARK_NODE_TYPE.EMPH &&
        parentNode(node, 3)?.type === COMMONMARK_NODE_TYPE.LINK &&
        (parentNode(node, 4)?.type === COMMONMARK_NODE_TYPE.HEADING ||
          (parentNode(node, 4)?.type === COMMONMARK_NODE_TYPE.PARAGRAPH &&
            parentNode(node, 5)?.type === COMMONMARK_NODE_TYPE.ITEM))
      ) {
        // e.g. ## Heading [***text***](a.b.com)
        // e.g. - List item [***text***](a.b.com)
        return true;
      }
      break;
    case COMMONMARK_NODE_TYPE.EMPH:
    case COMMONMARK_NODE_TYPE.STRONG:
      if (
        parentNode(node)?.type === COMMONMARK_NODE_TYPE.LINK &&
        (parentNode(node, 2)?.type === COMMONMARK_NODE_TYPE.HEADING ||
          (parentNode(node, 2)?.type === COMMONMARK_NODE_TYPE.PARAGRAPH &&
            parentNode(node, 3)?.type === COMMONMARK_NODE_TYPE.ITEM))
      ) {
        // e.g. ## Heading [*text*](a.b.com)
        // e.g. ## Heading [**text**](a.b.com)
        // e.g. - List item [*text*](a.b.com)
        // e.g. - List item [**text**](a.b.com)
        return true;
      }
      if (
        parentNode(node)?.type === COMMONMARK_NODE_TYPE.EMPH &&
        parentNode(node, 2)?.type === COMMONMARK_NODE_TYPE.LINK &&
        (parentNode(node, 3)?.type === COMMONMARK_NODE_TYPE.HEADING ||
          (parentNode(node, 3)?.type === COMMONMARK_NODE_TYPE.PARAGRAPH &&
            parentNode(node, 4)?.type === COMMONMARK_NODE_TYPE.ITEM))
      ) {
        // e.g. ## Heading [***text***](a.b.com)
        // e.g. - List item [***text***](a.b.com)
        return true;
      }
  }
  let parent = node;
  while (parent) {
    if (isTopic(parent)) {
      return false;
    }
    parent = parent.parent;
  }
  return true;
}
function findParent(leafNode, maxLevel) {
  let parent = leafNode;
  while (parent) {
    if (parent.level < maxLevel) {
      break;
    }
    parent = parent.parent;
  }
  return parent || null;
}
/**
 * get all text type child from a commonmark node
 * @param {object} node commonmark node
 */
function extractText(node) {
  let text = "";
  let textFragmentCount = 0;
  let cursor = node.firstChild;
  while (cursor) {
    if (cursor.type === COMMONMARK_NODE_TYPE.TEXT && cursor.literal) {
      textFragmentCount += 1;
      text += cursor.literal;
    }
    cursor = cursor.next;
  }
  return {
    text,
    textFragmentCount,
  };
}
/**
 *
 * @param {string} url
 * @param {object} zip
 * @return {object}
 */
async function genAttachmentFromZip(url, zip) {
  const assetsRegExp = new RegExp(`^/?${TEXT_BUNDLE_ASSETS}`);
  if (!assetsRegExp.test(url)) {
    return null;
  }
  const urlRegExp = new RegExp(`/?${url}`);
  const attachmentZipObject = zip.file(urlRegExp)[0];
  if (!attachmentZipObject) {
    return null;
  }
  const content = await attachmentZipObject.async("uint8array");
  if (!content) {
    return null;
  }
  const sha256 = CryptoJS.algo.SHA256.create();
  const hash = sha256
    .update(CryptoJS.lib.WordArray.create(content))
    .finalize()
    .toString(CryptoJS.enc.Hex);
  let ext = url.split(".").pop();
  ext = ext === url ? "" : `.${ext}`;
  return {
    src: `xap:resources/${hash}${ext}`,
    fileEntry: `resources/${hash}${ext}`,
    content: content,
  };
}
/**
 * With effect of ConvertableStringBuffer, before any string
 * has been pushed:
 *
 * 1. It will be convert into different string in different
 *    type of mind map content (such as normal title, note)
 *    if it should be.
 * 2. Special nodes (like equation or other custom syntax)
 *    which can not parsed by parser will be found out and
 *    apply convertion rules.
 */
class ConvertableStringBuffer {
  _buffer: any[];
  _inEquationBlock: boolean;
  _docNode: any;
  _context: any;
  static CONVERT_PATTERNS: any;
  constructor(parent) {
    this._buffer = [];
    this._inEquationBlock = false;
    this._docNode = parent;
  }
  mount(context) {
    this._context = context;
  }
  unmount() {
    this._context = undefined;
  }
  push(content) {
    const contentToPush = this.applyConvertPatterns(content);
    return this._buffer.push(contentToPush);
  }
  toArray() {
    return Array.from(this._buffer);
  }
  join(separator) {
    return this.toArray().join(separator);
  }
  hasEquation(node) {
    const content = node.literal || "";
    const hasInlineEquation = /\$(.*?)\$/.test(content);
    const inHeading = parentNode(node)?.type === COMMONMARK_NODE_TYPE.HEADING;
    if (hasInlineEquation && inHeading) {
      return true;
    }
    const inListItem =
      parentNode(node)?.type === COMMONMARK_NODE_TYPE.PARAGRAPH &&
      parentNode(node, 2)?.type === COMMONMARK_NODE_TYPE.ITEM;
    if (hasInlineEquation && inListItem) {
      return true;
    }
    const inFirstPlaceParagraph =
      parentNode(node)?.type === COMMONMARK_NODE_TYPE.PARAGRAPH &&
      parentNode(node)?.prev?.type !== COMMONMARK_NODE_TYPE.PARAGRAPH;
    if (inFirstPlaceParagraph) {
      return true;
    }
    return false;
  }
  preProcessEquation(content) {
    let _a;
    if (content === "$$") {
      this._inEquationBlock = !this._inEquationBlock;
      return "";
    }
    if (this._inEquationBlock) {
      this._docNode.equations.push(content);
      return "";
    } else {
      // '$1$ content $2$ $$' => ['1', '2']
      const equations =
        (_a = content.match(/\$(.*?)\$/g)) === null || _a === undefined
          ? undefined
          : _a.map((s) => s.replace(/\$/g, "")).filter((s) => s !== "");
      if (equations && equations.length > 0) {
        equations.forEach((v) => this._docNode.equations.push(v));
        // '$1$ content $2$' => ' a '
        content = content.replace(/\$(.*?)\$/g, "");
      }
    }
    return content;
  }
  applyConvertPatterns(content) {
    const c = this._context;
    if (this.hasEquation(c.node)) {
      content = this.preProcessEquation(content);
    }
    if (content === "") {
      return content;
    }
    const output = ConvertableStringBuffer.CONVERT_PATTERNS.reduce(
      (res, pattern) => {
        const { from, to } = pattern;
        if (typeof to === "string") {
          return res.replace(from, to);
        } else if (!c) {
          return res;
        } else if (isNote(c.node) && to.note !== undefined) {
          // For note node
          if (typeof to.note === "string") {
            return res.replace(from, to.note);
          } else {
            return res.replace(
              from,
              c.entering ? to.note.isEntering : to.note.notEntering,
            );
          }
        } else if (isText(c.node) && to.text !== undefined) {
          // For text node
          if (typeof to.text === "string") {
            return res.replace(from, to.text);
          } else {
            return res.replace(
              from,
              c.entering ? to.text.isEntering : to.text.notEntering,
            );
          }
        } else {
          // Unknown or unsupported node, not apply any pattern, just return origin content
          return res;
        }
      },
      content,
    );
    return output;
  }
}
ConvertableStringBuffer.CONVERT_PATTERNS = [
  {
    from: /<!--[^>]*-->/,
    to: "",
  },
  {
    from: "<br>",
    to: {
      note: "<br>",
      text: "\n",
    },
  },
  {
    from: "  \n",
    to: {
      note: "<br>",
      text: "\n",
    },
  },
  {
    from: "\n\n",
    to: {
      note: "<br>",
      text: "\n",
    },
  },
  {
    from: "\r\n",
    to: {
      note: "<br>",
      text: "\n",
    },
  },
  {
    from: "&nbsp",
    to: {
      note: "&nbsp",
      text: " ",
    },
  },
  {
    from: "> ",
    to: {
      note: "",
    },
  },
  {
    from: "***",
    to: {
      note: {
        isEntering: "<i><b>",
        notEntering: "</b></i>",
      },
      text: "***",
    },
  },
  {
    from: "**",
    to: {
      note: {
        isEntering: "<b>",
        notEntering: "</b>",
      },
      text: "**",
    },
  },
  {
    from: "*",
    to: {
      note: {
        isEntering: "<i>",
        notEntering: "</i>",
      },
      text: "*",
    },
  },
];
class markdown_XMindDocNode {
  contents: ConvertableStringBuffer;
  notes: ConvertableStringBuffer;
  equations: any[];
  children: any[];
  floatTopics: any[];
  listDelimiter: number;
  _parent: null;
  level: number;
  type: string;
  isFloating: boolean;
  floatCoordinate: { x: number; y: number };
  listNestedLevel: number;
  image: null;
  href: null;
  constructor(level = -1, type = "heading") {
    this.contents = new ConvertableStringBuffer(this); // topic's title
    this.notes = new ConvertableStringBuffer(this); // topic's notes
    this.equations = []; // topic's equation
    this.children = []; // topic attached
    this.floatTopics = []; // detached in topic
    this.listDelimiter = 0; // eg: "1. item1", listDelimiter is 1
    this._parent = null;
    this.level = level; // topic level
    this.type = type; // commonmarkNodeType
    this.isFloating = false; // only floating topic be true
    this.floatCoordinate = {
      x: 0,
      y: 0,
    };
    this.listNestedLevel = 0; // list nested level in a nested list
    this.image = null; // image
    this.href = null; // hyperlink or attachment href
  }
  get parent() {
    return this._parent;
  }
  set parent(node: any) {
    if (!node) {
      return;
    }
    this._parent = node;
    node.children.push(this);
  }
  toJSON() {
    let title = this.contents.join("");
    if (this.listDelimiter) {
      title = `${this.listDelimiter}. ${title}`;
    }
    const obj: any = {
      id: UUID(),
      title: title,
    };
    // notes
    const notesContent = this.notes.join("");
    if (notesContent) {
      const notes = this.notes.join("");
      obj.notes = {
        plain: {
          content: notes,
        },
        realHTML: {
          content: notes,
        },
        ops: {
          ops: [
            {
              insert: `${notes}\n`,
            },
          ],
        },
        html: {
          content: {
            paragraph: notes
              .replace("\n\n", " ")
              .split(" ")
              .map((text) => ({
                span: [
                  {
                    text: text === " " ? "" : text,
                  },
                ],
              })),
          },
        },
      };
    }
    // equations
    const filteredEquations = this.equations.filter((v) => v !== "");
    const equationContent =
      filteredEquations.length > 0
        ? `\\displaylines{${filteredEquations.join("\\\\")}}`
        : this.equations.join("\n");
    if (equationContent) {
      obj.extensions = [
        {
          provider: constants.EXTENSION_PROVIDER.MATH_JAX,
          content: {
            content: equationContent,
          },
        },
      ];
    }
    // href
    if (this.href) {
      obj.href = this.href;
    }
    // image
    if (this.image) {
      obj.image = this.image;
    }
    // floating topoic
    if (this.isFloating) {
      obj.position = this.floatCoordinate;
    }
    obj.children = {
      attached: this.children.map((child) => child.toJSON()),
    };
    if (this.floatTopics.length) {
      obj.children.detached = this.floatTopics.map((child) => child.toJSON());
    }
    return obj;
  }
}
function makeSheetContent(XMindNode) {
  const sheetObj = {
    id: UUID(),
    title: "sheet",
    rootTopic: XMindNode.toJSON(),
  };
  return sheetObj;
}
function makeWorkbook(sheetContent, manifest) {
  const workbookObject = {
    id: UUID(),
    sheets: [sheetContent],
    manifest: manifest,
  };
  return workbookObject;
}
/**
 * markdown text -> workbook object
 * @param {string | object} resource - markdowntext or textBundle zip
 * @return {promis} - workbook object | errMsg
 */
export async function fromMarkdown(resource) {
  let rawString = ""; // markdownText
  let parseMode = ""; // support markdown or textBundle
  if (resource instanceof JSZip) {
    // textBundle
    // see http://textbundle.org/spec/
    const contentRegExp = new RegExp("text.[^./]+$");
    const contentFile = resource.filter((relativePath) =>
      contentRegExp.test(relativePath),
    )[0];
    if (!contentFile) {
      throw new Error("No content");
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    rawString = await contentFile.async("string").catch((_) => {
      throw new Error("No content");
    });
    parseMode = PARSE_MODE_TEXT_BUNDLE;
  } else if (typeof resource === "string") {
    rawString = resource;
  }
  const parsed = reader.parse(rawString);
  const walker = parsed.walker();
  const manifest = {
    MANIFEST_STRUCTURAL: MANIFEST_STRUCTURAL,
    attachmentsMap: {},
  };
  //build
  let rootTopic: any = null;
  let currentTopic: any = null;
  let rootTopicFromText = false;
  let accumulateXCoordinate = -50;
  let accumulateYCoordinate = 0;
  let contentReceiver;
  const floatTopics: any[] = [];
  const listCounter: any[] = []; // list count in a nested list
  for (let event = walker.next(); event; event = walker.next()) {
    const node = event.node;
    if (node.type === COMMONMARK_NODE_TYPE.DOCUMENT) {
      continue;
    }
    if (event.entering) {
      if (isTopic(node)) {
        switch (node.type) {
          case COMMONMARK_NODE_TYPE.HEADING: {
            const newTopic = new markdown_XMindDocNode(node.level, node.type);
            if (rootTopic) {
              if (!currentTopic) {
                config.get(constants.CONFIG.LOGGER).error({
                  [MODULE_NAME]: "currentTopic cursor exception",
                });
              } else if (
                currentTopic.type === COMMONMARK_NODE_TYPE.HEADING ||
                currentTopic.type === COMMONMARK_NODE_TYPE.ITEM ||
                currentTopic.type === CUSTOMER_NODE_TYPE.FORMTEXT
              ) {
                const parent = findParent(currentTopic, newTopic.level);
                if (parent) {
                  newTopic.parent = parent;
                } else {
                  newTopic.isFloating = true;
                  newTopic.floatCoordinate = {
                    x: (accumulateXCoordinate += FLOAT_X_COORDINATE_INCREASE),
                    y: (accumulateYCoordinate += FLOAT_Y_COORDINATE_INCREASE),
                  };
                  floatTopics.push(newTopic);
                }
              } else {
                config.get(constants.CONFIG.LOGGER).error({
                  [MODULE_NAME]: "currentTopic has Invalid type",
                });
              }
            } else {
              rootTopic = newTopic;
            }
            currentTopic = newTopic;
            break;
          }
          case COMMONMARK_NODE_TYPE.LIST: {
            if (node.listType === "bullet") {
              listCounter.push(0);
            }
            if (node.listType === "ordered") {
              listCounter.push(node.listStart);
            }
            break;
          }
          case COMMONMARK_NODE_TYPE.ITEM: {
            const newTopic = new markdown_XMindDocNode(
              LIST_ITEM_BASE_LEVEL,
              node.type,
            );
            const lastCount = listCounter[listCounter.length - 1];
            if (lastCount) {
              newTopic.listDelimiter = lastCount;
              listCounter[listCounter.length - 1] = lastCount + 1; // eg: [0, 1] means a bullet list nest a ordered list, and current item's delimiter is '1'
            }
            if (rootTopic) {
              if (!currentTopic) {
                config.get(constants.CONFIG.LOGGER).error({
                  [MODULE_NAME]: "currentTopic cursor exception",
                });
              }
              const listNestedLevel = listCounter.length;
              newTopic.listNestedLevel = listNestedLevel;
              if (
                currentTopic.type === COMMONMARK_NODE_TYPE.HEADING ||
                currentTopic.type === CUSTOMER_NODE_TYPE.FORMTEXT
              ) {
                newTopic.parent = currentTopic;
              } else if (currentTopic.type === COMMONMARK_NODE_TYPE.ITEM) {
                newTopic.level =
                  currentTopic.level +
                  (listNestedLevel - currentTopic.listNestedLevel);
                const parent = findParent(currentTopic, newTopic.level);
                if (parent) {
                  newTopic.parent = parent;
                } else {
                  newTopic.isFloating = true;
                  newTopic.floatCoordinate = {
                    x: (accumulateXCoordinate += FLOAT_X_COORDINATE_INCREASE),
                    y: (accumulateYCoordinate += FLOAT_Y_COORDINATE_INCREASE),
                  };
                  floatTopics.push(newTopic);
                }
              } else {
                config.get(constants.CONFIG.LOGGER).error({
                  [MODULE_NAME]: "currentTopic has Invalid type",
                });
              }
            } else {
              rootTopic = newTopic;
            }
            currentTopic = newTopic;
            break;
          }
        } // switch end
      } else if (isText(node)) {
        // block end
        if (!rootTopic) {
          currentTopic = rootTopic = new markdown_XMindDocNode(
            1,
            CUSTOMER_NODE_TYPE.FORMTEXT,
          ); // 'fromText' type topic's level equal to Heading 1
          rootTopicFromText = true;
        }
        contentReceiver = isNote(node)
          ? currentTopic.notes
          : currentTopic.contents;
        contentReceiver.mount(event);
        switch (node.type) {
          case COMMONMARK_NODE_TYPE.SOFTBREAK:
          case COMMONMARK_NODE_TYPE.LINEBREAK: {
            contentReceiver.push("\n");
            break;
          }
          case COMMONMARK_NODE_TYPE.LINK: {
            if (parseMode === PARSE_MODE_TEXT_BUNDLE) {
              if (isNote(node)) {
                contentReceiver.push("[");
              } else if (/^https?:\/\//.test(node.destination)) {
                // hyperlink
                currentTopic.href = node.destination;
              } else if (manifest.attachmentsMap[node.destination]) {
                currentTopic.href =
                  manifest.attachmentsMap[node.destination].src; // use cache
              } else {
                const attachment = await genAttachmentFromZip(
                  node.destination,
                  resource,
                );
                if (attachment) {
                  currentTopic.href = attachment.src;
                  manifest.attachmentsMap[node.destination] = attachment; // cache
                  manifest[MANIFEST][M_FILE_ENTRIES][attachment.fileEntry] = {};
                  manifest[MANIFEST][M_RESOURCES][attachment.fileEntry] =
                    attachment.content;
                } else {
                  contentReceiver.push("[");
                }
              }
            } else if (!isNote(node)) {
              contentReceiver.push("[");
            }
            // if link content exist and href attributes validate
            if (parseMode === PARSE_MODE_TEXT_BUNDLE && currentTopic.href) {
              const { text, textFragmentCount } = extractText(node);
              contentReceiver.push(text);
              let fragmentCount = textFragmentCount;
              while (fragmentCount) {
                // skip text
                event = walker.next();
                fragmentCount -= 1;
              }
              event = walker.next(); // skip end tag
            }
            break;
          }
          case COMMONMARK_NODE_TYPE.IMAGE: {
            if (parseMode === PARSE_MODE_TEXT_BUNDLE) {
              if (isNote(node)) {
                contentReceiver.push("![");
              } else if (manifest.attachmentsMap[node.destination]) {
                currentTopic.image = {
                  src: manifest.attachmentsMap[node.destination].src,
                }; // use cache
              } else {
                const image = await genAttachmentFromZip(
                  node.destination,
                  resource,
                );
                if (image) {
                  currentTopic.image = {
                    src: image.src,
                  };
                  manifest.attachmentsMap[node.destination] = image; // cache
                  manifest[MANIFEST][M_FILE_ENTRIES][image.fileEntry] = {};
                  manifest[MANIFEST][M_RESOURCES][image.fileEntry] =
                    image.content;
                } else {
                  contentReceiver.push("![");
                }
              }
            } else {
              contentReceiver.push("![");
            }
            // if image content exist and image attributes validate
            if (parseMode === PARSE_MODE_TEXT_BUNDLE && currentTopic.image) {
              const { text, textFragmentCount } = extractText(node);
              contentReceiver.push(text);
              let fragmentCount = textFragmentCount;
              while (fragmentCount) {
                // skip text
                event = walker.next();
                fragmentCount -= 1;
              }
              event = walker.next(); // skip end tag
            }
            break;
          }
          case COMMONMARK_NODE_TYPE.BLOCK_QUOTE: {
            contentReceiver.push("> ");
            break;
          }
          case COMMONMARK_NODE_TYPE.THEMATIC_BREAK: {
            contentReceiver.push("---");
            break;
          }
          case COMMONMARK_NODE_TYPE.STRONG: {
            contentReceiver.push("**");
            break;
          }
          case COMMONMARK_NODE_TYPE.EMPH: {
            contentReceiver.push("*");
            break;
          }
          case COMMONMARK_NODE_TYPE.CODE_BLOCK: {
            // code_block type node has no end tag
            contentReceiver.push(`\`\`\` ${node.info}\n`);
            contentReceiver.push(node.literal);
            contentReceiver.push("```\n\n");
            break;
          }
          case COMMONMARK_NODE_TYPE.CODE: {
            // code type node has no end tag
            contentReceiver.push(`\`${node.literal}\``);
            break;
          }
          default: {
            if (node.literal) {
              if (rootTopicFromText) {
                let nodeString = node.literal;
                if (node.literal.length > 9) {
                  nodeString = `${nodeString.substring(
                    0,
                    ROOT_TOPIC_FROM_TEXT_TITLE_LENGTH,
                  )}...`;
                }
                rootTopic.contents.mount(event);
                rootTopic.contents.push(nodeString);
                rootTopic.contents.unmount();
                contentReceiver.push(node.literal);
                rootTopicFromText = false;
              } else {
                contentReceiver.push(node.literal);
              }
            }
          }
        }
        contentReceiver.unmount();
      } // inline end
    } else {
      // not entering
      contentReceiver = isNote(node)
        ? currentTopic.notes
        : currentTopic.contents;
      contentReceiver.mount(event);
      switch (node.type) {
        case COMMONMARK_NODE_TYPE.LINK: {
          contentReceiver.push(` ${node.destination}\n`);
          break;
        }
        case COMMONMARK_NODE_TYPE.IMAGE: {
          contentReceiver.push("]");
          contentReceiver.push(`(${node.destination})`);
          break;
        }
        case COMMONMARK_NODE_TYPE.PARAGRAPH: {
          if (isNote(node)) {
            contentReceiver.push("\n\n");
          }
          break;
        }
        case COMMONMARK_NODE_TYPE.STRONG: {
          contentReceiver.push("**");
          break;
        }
        case COMMONMARK_NODE_TYPE.EMPH: {
          contentReceiver.push("*");
          break;
        }
        case COMMONMARK_NODE_TYPE.LIST: {
          listCounter.pop();
        }
      }
      contentReceiver.unmount();
    }
  }
  if (rootTopic) {
    rootTopic.floatTopics = floatTopics; // mount floatTopics
  } else {
    throw new Error("No content");
  }
  return makeWorkbook(makeSheetContent(rootTopic), manifest[MANIFEST]);
}
/**
 * buffer -> workbook object
 * @param {object} rawBuffer
 */
export async function fromTextBundlePack(rawBuffer) {
  const zip = new JSZip();
  return zip.loadAsync(rawBuffer).then(fromMarkdown);
}
/**
 * package -> workbook object
 * @param {string} rawString content buffer<Uint8Array>
 * @param {object} resourceNameMap {attachmentName: attachmentBuffer<Uint8Array>}
 */
export function fromTextBundle(rawString, resourceNameMap) {
  if (!rawString) {
    throw new Error("No content");
  }
  const zip = new JSZip();
  zip.file(TEXT_BUNDLE_CONTENT, rawString);
  if (typeof resourceNameMap === "object") {
    for (const [name, data] of Object.entries(resourceNameMap)) {
      zip.file(`${TEXT_BUNDLE_ASSETS}${name}`, data as string);
    }
  }
  return fromMarkdown(zip);
}

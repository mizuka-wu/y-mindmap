import { DOMParser } from "xmldom";

import {
  MANIFEST_STRUCTURAL,
  FLOAT_X_COORDINATE_INCREASE,
  FLOAT_Y_COORDINATE_INCREASE,
} from "../lib/constant";

import { UUID, isString } from "../lib/utils";

import * as constants from "../../common/constants/index";

import config from "../../common/config";

const opml_MODULE_NAME = "[import OPML]";
const floatOutlines = Symbol("floatOutlines"); // prevent conflict key
const floatPosition = Symbol("floatPosition");
function checkOutlineValidity(outlineDom) {
  if (
    outlineDom.nodeType === 1 &&
    outlineDom.tagName &&
    outlineDom.tagName.toLowerCase() === "outline" &&
    (isString(outlineDom.getAttribute("text") as string) ||
      isString(outlineDom.getAttribute("_text") as string))
  ) {
    return true;
  } else {
    return false;
  }
}
/**
 * @desc outlineDom -> topic object
 * @param {object} outlineDom
 * @return {object} topic object
 */
function parseOutline(outlineDom) {
  const topicObj: any = {
    id: UUID(),
    title: "",
  };
  const children: any = {};
  // title
  const text = isString(outlineDom.getAttribute("text") as string)
    ? outlineDom.getAttribute("text")
    : (outlineDom.getAttribute("_text") as string);
  if (isString(text)) {
    topicObj.title = text;
  } else {
    config.get(constants.CONFIG.LOGGER).info({
      [opml_MODULE_NAME]:
        "outline element with no text attribute will been ignored",
    });
    return;
  }
  // note
  const _note = outlineDom.getAttribute("_note") as string;
  if (_note) {
    topicObj.notes = {
      plain: {
        content: _note,
      },
      ops: {
        ops: [
          {
            insert: `${_note}\n`,
          },
        ],
      },
    };
  }
  // link
  const type = outlineDom.getAttribute("type") as string;
  if (type === "link") {
    let _url = outlineDom.getAttribute("_url") as string;
    if (_url) {
      if (!/^\w+:\/\//gi.test(_url)) {
        // supplement protocol
        _url += "http://";
      }
      topicObj.href = _url;
    }
  }
  // callout
  const _callout = outlineDom.getAttribute("_callout") as string;
  if (_callout) {
    children.callout = [
      {
        id: UUID(),
        title: _callout,
      },
    ];
  }
  // label
  const _label = outlineDom.getAttribute("_label") as string;
  if (_label) {
    topicObj.labels = _label.split(",").map((label) => label.trim());
  }
  const subOutlines = (Array.from(outlineDom.childNodes) as Element[]).filter(
    (item) => checkOutlineValidity(item),
  );
  if (subOutlines.length) {
    children.attached = Array.from(subOutlines).map((subOutline) =>
      parseOutline(subOutline),
    );
  }
  // mount detached topics
  if (outlineDom[floatOutlines] && outlineDom[floatOutlines].length) {
    children.detached = Array.from(outlineDom[floatOutlines]).map(
      (floatOutline) => parseOutline(floatOutline),
    );
  }
  if (outlineDom[floatPosition]) {
    topicObj.position = outlineDom[floatPosition];
  }
  // mount children
  if (Object.keys(children).length) {
    topicObj.children = children;
  }
  return topicObj;
}
/**
 * xml string -> workbook object
 * @param {string} rawString xml string
 * @return {object} workbook object
 */
export async function fromOPML(rawString) {
  const domParser = new DOMParser({
    errorHandler: {
      fatalError: (errMsg) => {
        throw new Error(errMsg);
      },
    },
  });
  const dom = domParser.parseFromString(rawString, "text/xml");
  // OPML format, see http://dev.opml.org/spec2.html
  const rootElement =
    dom.getElementsByTagName("opml") && dom.getElementsByTagName("opml")[0];
  if (
    !rootElement ||
    !rootElement.getAttribute("version") ||
    !rootElement.getElementsByTagName("head") ||
    !rootElement.getElementsByTagName("head")[0] ||
    !rootElement.getElementsByTagName("body") ||
    !rootElement.getElementsByTagName("body")[0]
  ) {
    throw new Error("Invaild OPML Format");
  }
  const body = rootElement.getElementsByTagName("body")[0];
  const outlinesDom = (Array.from(body.childNodes) as Element[]).filter(
    (item) => checkOutlineValidity(item),
  );
  const firstOutlineDom = outlinesDom.shift();
  if (!firstOutlineDom) {
    throw new Error("Invaild OPML Format");
  }
  // extends firstOutlineDom
  let accumulateXCoordinate = -50;
  let accumulateYCoordinate = 0;
  firstOutlineDom[floatOutlines] = Array.from(outlinesDom).map(
    (floatOutlineDom) => {
      floatOutlineDom[floatPosition] = {
        x: (accumulateXCoordinate += FLOAT_X_COORDINATE_INCREASE),
        y: (accumulateYCoordinate += FLOAT_Y_COORDINATE_INCREASE),
      };
      return floatOutlineDom;
    },
  );
  const rootTopic = parseOutline(firstOutlineDom);
  if (!rootTopic) {
    throw new Error("Invaild OPML Format");
  }
  return {
    id: UUID(),
    sheets: [
      {
        id: UUID(),
        title: "sheet",
        rootTopic: rootTopic,
      },
    ],
    manifest: MANIFEST_STRUCTURAL,
  };
}

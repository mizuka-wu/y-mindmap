import {
  generateOptions,
  encryptContent,
  wordToUint8Array,
  base64ToUint8Array,
  decrypt,
  decryptContent,
} from "./lib/utils";

import { fromXMind, isFileEncrypted } from "./import/xmind";
import { fromFreemind } from "./import/freemind";
import { fromLighten, fromLightenZipPromise } from "./import/lighten";
import { fromMindmanager } from "./import/mindmanager";
import {
  fromTextBundle,
  fromTextBundlePack,
  fromMarkdown,
} from "./import/markdown";
import { fromMindNode, fromMindNodeZip } from "./import/mindnode";
import { fromOPML } from "./import/opml";

import { toXMind } from "./export/xmind";
import { toTextBundlePack, toMarkdown, toTextBundle } from "./export/markdown";
import { toOPML } from "./export/opml";

export const formatconverter = {
  fromXMind: fromXMind,
  toXMind: toXMind,
  fromFreemind: fromFreemind,
  fromLighten: fromLighten,
  fromLightenZipPromise: fromLightenZipPromise,
  fromMindmanager: fromMindmanager,
  fromMarkdown: fromMarkdown,
  fromTextBundlePack: fromTextBundlePack,
  fromTextBundle: fromTextBundle,
  toMarkdown: toMarkdown,
  toTextBundlePack: toTextBundlePack,
  toTextBundle: toTextBundle,
  fromOPML: fromOPML,
  toOPML: toOPML,
  fromMindNode: fromMindNode,
  fromMindNodeZip: fromMindNodeZip,
  isFileEncrypted: isFileEncrypted,
  encryptContent: encryptContent,
  decryptContent: decryptContent,
  wordToUint8Array: wordToUint8Array,
  base64ToUint8Array: base64ToUint8Array,
  generateOptions: generateOptions,
  decrypt: decrypt,
};

export default formatconverter;

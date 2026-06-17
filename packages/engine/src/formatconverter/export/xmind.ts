/* eslint-disable @typescript-eslint/no-unused-vars */
import CryptoJS from "crypto-js";
import JSZip from "jszip";
import { DOMParser, XMLSerializer } from "xmldom";
import {
  M_ENCRYPTION_DATA,
  M_FILE_ENTRIES,
  M_PASSWORD_HINT,
  ZEN_PATH_CONTENT,
  ZEN_PATH_CONTENT_FOR_OLD_XMIND_VERSION,
  ZEN_PATH_MANIFEST,
  ZEN_PATH_METADATA,
  OLD_XMIND_CONTENT_IN_ZEN,
  XMIND_PATH_COMMNETS,
  XMIND_PATH_CONTENT,
  XMIND_PATH_MANIFEST,
  XMIND_PATH_META,
  XMIND_PATH_STYLES,
  XMIND_PATH_THUMBNAIL,
} from "../lib/constant";

import {
  generateEncryptData,
  generateOptions,
  encrypt,
  UUID,
  wordToByteArray,
  wordToUint8Array,
  deepEqual,
  byteArrayToWord,
  uint8ArrayToWordArray,
} from "../lib/utils";

function encodeString(text, tag) {
  const domstr = "<" + tag + ">" + text + "</" + tag + ">";
  const dom = new DOMParser().parseFromString(domstr, "application/xml");
  const s = new XMLSerializer();
  return s.serializeToString(dom);
}
function generateChecksum(rawData) {
  return CryptoJS.MD5(rawData).toString(CryptoJS.enc.Base64);
}
function toJSON(workbook, options: any = {}) {
  return new Promise((resolve, reject) => {
    if (
      !workbook ||
      !workbook.manifest ||
      !workbook.metadata ||
      !workbook.sheets
    ) {
      return reject("MUST have a valid workbook.");
    }
    const zip = options.zip || new JSZip();
    const password = options.password;
    // manifest.json
    const manifest = workbook.manifest;
    const newManifest = {
      [M_FILE_ENTRIES]: {
        [ZEN_PATH_CONTENT]: {},
        [ZEN_PATH_METADATA]: {},
      },
    };
    const mPasswordHint = options.passwordHint || manifest[M_PASSWORD_HINT];
    if (mPasswordHint) {
      newManifest[M_PASSWORD_HINT] = mPasswordHint;
    }
    const fileEntries = manifest[M_FILE_ENTRIES];
    // include resources and thumbnail
    if (manifest.resources) {
      for (const resourcePath in manifest.resources) {
        const resourceMeta = fileEntries[resourcePath];
        let content = manifest.resources[resourcePath];
        newManifest[M_FILE_ENTRIES][resourcePath] = newManifest[M_FILE_ENTRIES][
          resourcePath
        ]
          ? newManifest[M_FILE_ENTRIES][resourcePath]
          : {};
        if (resourceMeta) {
          if (password && !resourceMeta.skipEncrypt) {
            const options = generateOptions(
              password,
              resourceMeta[M_ENCRYPTION_DATA],
            );
            const contentInWords = uint8ArrayToWordArray(content);
            content = wordToUint8Array(
              encrypt(contentInWords, options).ciphertext,
            );
            // content = encrypt(content, options)
            newManifest[M_FILE_ENTRIES][resourcePath][M_ENCRYPTION_DATA] =
              generateEncryptData(options);
          }
        }
        zip.file(resourcePath, content);
      }
    }
    // metadata.json
    let metadata: any = JSON.stringify(workbook.metadata || {});
    newManifest[M_FILE_ENTRIES][ZEN_PATH_METADATA] = newManifest[
      M_FILE_ENTRIES
    ][ZEN_PATH_METADATA]
      ? newManifest[M_FILE_ENTRIES][ZEN_PATH_METADATA]
      : {};
    if (password) {
      const metadataEncrptOptions = generateOptions(
        password,
        fileEntries[ZEN_PATH_METADATA] &&
          fileEntries[ZEN_PATH_METADATA][M_ENCRYPTION_DATA],
      );
      metadata = wordToUint8Array(
        encrypt(metadata, metadataEncrptOptions).ciphertext,
      );
      newManifest[M_FILE_ENTRIES][ZEN_PATH_METADATA][M_ENCRYPTION_DATA] =
        generateEncryptData(metadataEncrptOptions);
    }
    zip.file(ZEN_PATH_METADATA, metadata);
    // content.json
    let content: any = JSON.stringify(workbook.sheets); //circular?
    newManifest[M_FILE_ENTRIES][ZEN_PATH_CONTENT] = newManifest[M_FILE_ENTRIES][
      ZEN_PATH_CONTENT
    ]
      ? newManifest[M_FILE_ENTRIES][ZEN_PATH_CONTENT]
      : {};
    if (password) {
      const contentEncrptOptions = generateOptions(
        password,
        fileEntries[ZEN_PATH_CONTENT] &&
          fileEntries[ZEN_PATH_CONTENT][M_ENCRYPTION_DATA],
      );
      content = wordToUint8Array(
        encrypt(content, contentEncrptOptions).ciphertext,
      );
      newManifest[M_FILE_ENTRIES][ZEN_PATH_CONTENT][M_ENCRYPTION_DATA] =
        generateEncryptData(contentEncrptOptions);
    }
    zip.file(ZEN_PATH_CONTENT, content);
    // content.xml for old xmind version
    zip.file(ZEN_PATH_CONTENT_FOR_OLD_XMIND_VERSION, OLD_XMIND_CONTENT_IN_ZEN);
    // revisions TODO
    zip.file(ZEN_PATH_MANIFEST, JSON.stringify(newManifest));
    resolve(zip);
  });
}
function generateXMindFile({ workbook, zip, options }) {
  const workbookJSON = workbook;
  const sheetJSONArray = workbook.sheets;
  const meta = workbook.metadata || {}; //TODO:share, thumbnails
  const {
    thumbanil = {
      x: 53,
      y: 44,
    },
    share = {
      privacy: "",
      lang: "en",
      url: "",
    },
  } = meta;
  meta.thumbnail = thumbanil;
  meta.share = share;
  const material: any = {};
  if (options) {
    if (options.password) {
      material.password = options.password;
      if (options.passwordHint) {
        material.passwordHint = options.passwordHint;
      }
    }
  }
  const modifiedBy = ""; //TODO
  const modifiedTime = Date.now();
  const commentsMap: any = {};
  const userStylesMap: any = {};
  const themeStylesMap: any = {};
  const XMindUUID = (jsonUUID?: any) => UUID(jsonUUID);
  function findSameStyleId(style) {
    let resultId;
    Object.keys(userStylesMap).some((styleId) => {
      if (deepEqual(style, userStylesMap[styleId])) {
        resultId = styleId;
        return true;
      }
    });
    return resultId;
  }
  // todo settings
  let contentXMLString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?><xmap-content xmlns="urn:xmind:xmap:xmlns:content:2.0" xmlns:fo="http://www.w3.org/1999/XSL/Format" xmlns:svg="http://www.w3.org/2000/svg" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:xlink="http://www.w3.org/1999/xlink" modified-by="${modifiedBy}" timestamp="${modifiedTime}" version="2.0">{{sheetsString}}</xmap-content>`;
  // fill contentXMLString
  {
    const sheetsString = sheetJSONArray.reduce((pre, cur) => {
      return pre + generateSheetXMLString(cur);
    }, "");
    contentXMLString = contentXMLString.replace(
      "{{sheetsString}}",
      sheetsString,
    );
  }
  function generateSheetXMLString(sheetSource) {
    const sheetId = XMindUUID(sheetSource.id);
    const theme = sheetSource.theme;
    let themeId = XMindUUID();
    Object.keys(themeStylesMap).some((otherThemeId) => {
      if (deepEqual(theme, themeStylesMap[otherThemeId])) {
        themeId = otherThemeId;
        return true;
      }
    });
    themeStylesMap[themeId] = theme;
    // title
    let title = "";
    workbookJSON.sheets.some((sheetInfo) => {
      if (sheetInfo.id === sheetSource.id) {
        title = sheetInfo.title;
        return true;
      }
    });
    return `<sheet id="${sheetId}" theme="${themeId}">${encodeString(
      title,
      "title",
    )}${generateTopicXMLString()}${generateRelationshipsXMLString()}${generateSheetSettingsXMLString()}${generateLegendXMLString()}</sheet>`;
    function generateTopicXMLString(topicInfo = sheetSource.rootTopic) {
      const id = XMindUUID(topicInfo.id);
      // todo title:width notes:html
      const structureClassAttr = topicInfo.structureClass
        ? `structure-class="${topicInfo.structureClass}"`
        : "";
      let hrefAttr = "";
      if (topicInfo.href) {
        let href = topicInfo.href;
        if (/^xmind:/i.test(href)) {
          href = "xmind:#" + XMindUUID(href.replace("xmind:#", ""));
        }
        if (href.startsWith("xap:")) {
          href = href.replace("resources/", "attachments/");
        }
        hrefAttr = `xlink:href="${href}"`;
      }
      const style = topicInfo.style;
      let styleIdAttr = "";
      if (style) {
        const sameStyleId = findSameStyleId(style);
        const styleId = sameStyleId || XMindUUID();
        style.type = "topic";
        userStylesMap[styleId] = style;
        styleIdAttr = `style-id="${styleId}"`;
      }
      const resultString = `<topic id="${id}" modified-by="${modifiedBy}" ${structureClassAttr} ${hrefAttr} ${styleIdAttr}>${encodeString(
        topicInfo.title,
        "title",
      )}${generatePositionXMLString()}${generateNumberingXMLString()}${generateImageXMLString()}${generateExtensionsXMLString()}${generateMarkersXMLString()}${generateSummariesXMLString()}${generateBoundaryXMLString()}${generateNotesXMLString()}${generateLabelsXMLString()}${generateChildrenXMLString()}</topic>`;
      // if has comments, store it
      const comments = topicInfo.comments;
      if (comments && comments.length) {
        commentsMap[id] = comments;
      }
      return resultString;
      function generatePositionXMLString() {
        const position = topicInfo.position;
        if (position) {
          return `<position svg:x="${position.x}" svg:y="${position.y}"/>`;
        } else {
          return "";
        }
      }
      function generateNumberingXMLString() {
        const numbering = topicInfo.numbering;
        if (numbering) {
          return `<numbering number-format="${numbering.numberFormat}"/>`;
        } else {
          return "";
        }
      }
      function generateImageXMLString() {
        const imageInfo = topicInfo.image;
        if (imageInfo) {
          return `<xhtml:img svg:height="${imageInfo.height}" svg:width="${
            imageInfo.width
          }" xhtml:src="${
            imageInfo.src.startsWith("xap:")
              ? imageInfo.src.replace("resources/", "attachments/")
              : imageInfo.src
          }"/>`;
        } else {
          return "";
        }
      }
      function generateExtensionsXMLString() {
        const extensions = topicInfo.extensions;
        if (!extensions || !extensions.length) {
          return "";
        }
        let resultString = "";
        extensions.forEach((info) => {
          resultString += `<extension provider="${
            info.provider
          }">${generateResourceXMLString(
            info.resourceRefs,
          )}${generateContentXMLString(info.content)}</extension>`;
        });
        return `<extensions>${resultString}</extensions>`;
        function generateContentXMLString(contentInfo) {
          if (!contentInfo || !contentInfo.length) {
            return "";
          }
          let resultString = "";
          contentInfo.forEach((info) => {
            resultString += `<${info.name}>${info.content}</${info.name}>`;
          });
          return `<content>${resultString}</content>`;
        }
        function generateResourceXMLString(resourceInfo) {
          if (!resourceInfo || !resourceInfo.length) {
            return "";
          }
          let resultString = "";
          resourceInfo.forEach((info) => {
            resultString += `<resource-ref resource-id="${info}" type="file-entry"/>`;
          });
          return `<resource-refs>${resultString}</resource-refs>`;
        }
      }
      function generateMarkersXMLString() {
        const markers = topicInfo.markers;
        if (!markers || !markers.length) {
          return "";
        }
        let resultString = "";
        markers.forEach((info) => {
          resultString += `<marker-ref marker-id="${info.markerId}"/>`;
        });
        return `<marker-refs>${resultString}</marker-refs>`;
      }
      function generateSummariesXMLString() {
        const summaries = topicInfo.summaries;
        if (!summaries || !summaries.length) {
          return "";
        }
        let resultString = "";
        summaries.forEach((info) => {
          const id = XMindUUID(info.id);
          const topicId = XMindUUID(info.topicId);
          resultString += `<summary id="${id}" modified-by="${modifiedBy}" topic-id="${topicId}" range="${info.range}"/>`;
        });
        return `<summaries>${resultString}</summaries>`;
      }
      function generateBoundaryXMLString() {
        const boundaries = topicInfo.boundaries;
        if (!boundaries || !boundaries.length) {
          return "";
        }
        let resultString = "";
        boundaries.forEach((info) => {
          const id = XMindUUID(info.id);
          const style = info.style;
          let styleIdAttr = "";
          if (style) {
            const sameStyleId = findSameStyleId(style);
            const styleId = sameStyleId || XMindUUID();
            style.type = "boundary";
            userStylesMap[styleId] = style;
            styleIdAttr = `style-id="${styleId}"`;
          }
          resultString += `<boundary id="${id}" modified-by="${modifiedBy}" range="${
            info.range
          }" ${styleIdAttr}>${
            info.title ? `${encodeString(info.title, "title")}` : ""
          }</boundary>`;
        });
        return `<boundaries>${resultString}</boundaries>`;
      }
      function generateNotesXMLString() {
        const notes = topicInfo.notes;
        if (!notes) {
          return "";
        }
        // plain
        let plainString = "";
        if (notes.plain) {
          plainString = `${encodeString(notes.plain.content, "plain")}`;
        }
        // todo html
        return `<notes>${plainString}</notes>`;
      }
      function generateLabelsXMLString() {
        const labels = topicInfo.labels;
        if (!labels || !labels.length) {
          return "";
        }
        let resultString = "";
        labels.forEach((info) => {
          resultString += `${encodeString(info, "label")}`;
        });
        return `<labels>${resultString}</labels>`;
      }
      function generateChildrenXMLString() {
        if (!topicInfo.children || !Object.keys(topicInfo.children).length) {
          return "";
        }
        return (
          "<children>" +
          generateTypeXMLString("attached") +
          generateTypeXMLString("detached") +
          generateTypeXMLString("summary") +
          generateTypeXMLString("callout") +
          "</children>"
        );
        function generateTypeXMLString(type) {
          const typeChildren = topicInfo.children[type];
          if (!typeChildren || !typeChildren.length) {
            return "";
          }
          let resultString = "";
          typeChildren.forEach((info) => {
            resultString += generateTopicXMLString(info);
          });
          return `<topics type="${type}">${resultString}</topics>`;
        }
      }
    }
    function generateRelationshipsXMLString() {
      const relationships = sheetSource.relationships();
      if (!relationships) {
        return "";
      }
      let resultString = "";
      relationships.forEach((info) => {
        const end1Id = XMindUUID(info.end1Id);
        const end2Id = XMindUUID(info.end2Id);
        const id = XMindUUID(info.id);
        const controlPoints = info.controlPoints;
        const cp0 = controlPoints && controlPoints[0];
        const cp1 = controlPoints && controlPoints[1];
        resultString += `<relationship end1="${end1Id}" end2="${end2Id}" id="${id}">${encodeString(
          info.title,
          "title",
        )}<control-points>${generateControlPointXMLString()}</control-points></relationship>`;
        function generateControlPointXMLString() {
          if (!cp0 && !cp1) {
            return "";
          }
          let resultString = "";
          [cp0, cp1].forEach((cpInfo, index) => {
            if (cpInfo) {
              resultString += `<control-point amount="${cpInfo.amount}" angle="${cpInfo.angle}" index="${index}">`;
              if (cpInfo.x && cpInfo.y) {
                resultString += `<position svg:x="${cpInfo.x}" svg:y="${cpInfo.y}"/>`;
              }
              resultString += "</control-point>";
            }
          });
          return resultString;
        }
      });
      return `<relationships>${resultString}</relationships>`;
    }
    function generateSheetSettingsXMLString() {
      const settings = sheetSource.settings;
      if (!settings) {
        return "";
      }
      return (
        "<sheet-settings>" + generateInfoItemXMLString() + "</sheet-settings>"
      );
      // info-items/info-item 复杂性是由于要考虑兼容
      function generateInfoItemXMLString() {
        const keyNameMap = {
          "infoItems/infoItem": {
            childNodeName: "infoItem",
            parentNodeName: "infoItems",
          },
          "info-items/info-item": {
            childNodeName: "info-item",
            parentNodeName: "info-items",
          },
        };
        let resultString = "";
        ["infoItems/infoItem", "info-items/info-item"].forEach((keyName) => {
          if (!settings[keyName]) {
            return;
          }
          const cKeyMap = keyNameMap[keyName];
          let childNodeString = "";
          settings[keyName].forEach((info) => {
            childNodeString += `<${cKeyMap.childNodeName} mode="${info.mode}" type="${info.type}"/>`;
          });
          resultString += `<${cKeyMap.parentNodeName}>${childNodeString}</${cKeyMap.parentNodeName}>`;
        });
        // if there is not info-items/info-item, but infoItems/infoItem, generate one
        if (
          settings["infoItems/infoItem"] &&
          !settings["info-items/info-item"]
        ) {
          const typeMap = {
            label: "org.xmind.ui.infoItem.label",
            href: "org.xmind.ui.infoItem.hyperlink",
            note: "org.xmind.ui.infoItem.notes",
            audio: "org.xmind.ui.infoItem.AudioNotes",
            task: "org.xmind.ui.infoItem.taskInfo",
          };
          let childNodeString = "";
          settings["infoItems/infoItem"].forEach((settingInfo) => {
            childNodeString += `<info-item mode="${settingInfo.mode}" type="${
              typeMap[settingInfo.type]
            }"/>`;
          });
          resultString += `<info-items>${childNodeString}</info-items>`;
        }
        return resultString;
      }
    }
    function generateLegendXMLString() {
      const legend = sheetSource.legend;
      if (!legend) {
        return "";
      }
      return `<legend visibility="${
        legend.visibility || false
      }">${generatePositionXMLString()}${generateMarkerDescXMLString()}</legend>`;
      function generatePositionXMLString() {
        const position = legend.position;
        if (!position) {
          return "";
        }
        return `<position svg:x="${position.x}" svg:y="${position.y}"/>`;
      }
      function generateMarkerDescXMLString() {
        const markerDesc = legend.markers;
        if (!markerDesc) {
          return "";
        }
        let resultString = "";
        Object.keys(markerDesc).forEach((markerId) => {
          resultString += `<marker-description description="${markerDesc[markerId].name}" marker-id="${markerId}"/>`;
        });
        return `<marker-descriptions>${resultString}</marker-descriptions>`;
      }
    }
  }
  let commentsXMLString =
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?><comments xmlns="urn:xmind:xmap:xmlns:comments:2.0" version="2.0">{{commentsString}}</comments>';
  // fill commentsXMLString
  {
    let commentsString = "";
    Object.keys(commentsMap).forEach((objectId) => {
      commentsMap[objectId].forEach((info) => {
        commentsString += generateCommentXMLString(info, objectId);
      });
    });
    commentsXMLString = commentsXMLString.replace(
      "{{commentsString}}",
      commentsString,
    );
  }
  function generateCommentXMLString(info, objectId) {
    return `<comment author="${info.author}" time="${
      info.creationTime
    }" object-id="${objectId}">${encodeString(
      info.content,
      "content",
    )}</comment>`;
  }
  let stylesXMLString =
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?><xmap-styles xmlns="urn:xmind:xmap:xmlns:style:2.0" xmlns:fo="http://www.w3.org/1999/XSL/Format" xmlns:svg="http://www.w3.org/2000/svg" version="2.0">{{automaticStylesString}}{{masterStylesString}}{{userStylesString}}</xmap-styles>';
  // fill stylesXMLString
  {
    const { masterStylesString, automaticStylesString } =
      generateThemeStyleXMLString();
    stylesXMLString = stylesXMLString
      .replace("{{userStylesString}}", generateUserStyleXMLString())
      .replace("{{automaticStylesString}}", automaticStylesString)
      .replace("{{masterStylesString}}", masterStylesString);
  }
  function generateThemeStyleXMLString() {
    let automaticStylesString =
      "<automatic-styles>{{allAutomaticStyle}}</automatic-styles>";
    let masterStylesString =
      "<master-styles>{{allMasterStyle}}</master-styles>";
    let allMasterStyleString = "";
    let allAutomaticStyle = "";
    Object.keys(themeStylesMap).forEach((themeId) => {
      const themeInfo = themeStylesMap[themeId];
      let defaultStyleString = "";
      Object.keys(themeInfo).forEach((styleUnitName) => {
        const styleUnitInfo = themeInfo[styleUnitName];
        if (typeof styleUnitInfo !== "object") {
          return;
        }
        const styleId = XMindUUID();
        let type = styleUnitInfo.type;
        if (type.endsWith("topic")) {
          type = "topic";
        }
        defaultStyleString += `<default-style style-family="${styleUnitName}" style-id="${styleId}"/>`;
        let styleUnitAttrString = "";
        Object.keys(styleUnitInfo.properties).forEach((keyName) => {
          styleUnitAttrString += `${keyName}="${styleUnitInfo.properties[keyName]}" `;
        });
        styleUnitAttrString = styleUnitAttrString.trim();
        allAutomaticStyle += `<style id="${styleId}" name="" type="${type}"><${type}-properties ${styleUnitAttrString}/></style>`;
      });
      allMasterStyleString += `<style id="${themeId}" type="theme"><theme-properties>${defaultStyleString}</theme-properties></style>`;
    });
    automaticStylesString = automaticStylesString.replace(
      "{{allAutomaticStyle}}",
      allAutomaticStyle,
    );
    masterStylesString = masterStylesString.replace(
      "{{allMasterStyle}}",
      allMasterStyleString,
    );
    return {
      masterStylesString,
      automaticStylesString,
    };
  }
  // userStyleString
  function generateUserStyleXMLString() {
    let resultString = "";
    Object.keys(userStylesMap).forEach((styleId) => {
      let type = userStylesMap[styleId].type;
      if (type.endsWith("topic")) {
        type = "topic";
      }
      const properties = userStylesMap[styleId].properties;
      let attrString = "";
      Object.keys(properties).forEach((keyName) => {
        attrString += `${keyName}="${properties[keyName]}" `;
      });
      resultString += `<style id="${styleId}" type="${type}"><${type}-properties ${attrString}/></style>`;
    });
    return resultString && `<styles>${resultString}</styles>`;
  }
  // TODO complete meta xml
  const metaXMLString = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
        <meta xmlns="urn:xmind:xmap:xmlns:meta:2.0" version="2.0">
          <Author><Name></Name><Email/><Org/></Author>
          <Create><Time></Time></Create>
          <Creator><Name>XMind</Name><Version>R3.7.1.201612151837</Version></Creator><Description/>
          <Thumbnail>
            <X>0</X><Y>0</Y><Scale>0.5</Scale>
            <Origin>
              <X>${parseInt(meta.thumbnail.x)}</X>
              <Y>${parseInt(meta.thumbnail.y)}</Y>
            </Origin>
            <BackgroundColor>#FFFFFF</BackgroundColor>
          </Thumbnail>
          <Share>
            <Privacy>${meta.share.privacy}</Privacy>
            <Downloadable>1</Downloadable>
            <LanguageChannel>${meta.share.lang}</LanguageChannel>
            <SourceUrl>${meta.share.url}</SourceUrl>
          </Share>
        </meta>`;
  let manifestXMLString =
    '<?xml version="1.0" encoding="UTF-8" standalone="no"?>' +
    (material && material.passwordHint
      ? `<manifest xmlns="urn:xmind:xmap:xmlns:manifest:1.0" password-hint="${material.passwordHint}">`
      : '<manifest xmlns="urn:xmind:xmap:xmlns:manifest:1.0">') +
    "{{fileEntriesString}}</manifest>";
  // fill manifestXMLString
  let fileEntriesString = "";
  //constants for encryption
  const iterationCount = 1024;
  const keyLength = 128; //size
  const algorithm = "AES/CBC/PKCS5Padding";
  const keyDerivationName = "PBKDF2WithHmacSHA512";
  const checksumType = "MD5";
  function addFileEntry(fullPath, mediaType = "", rawString?) {
    function encryptSync(key, iv) {
      const res = CryptoJS.AES.encrypt(rawString, key, {
        iv,
      });
      return wordToByteArray(res.ciphertext.words);
    }
    if (material && rawString) {
      const salt = CryptoJS.enc.Base64.parse("").random(8);
      const key = CryptoJS.PBKDF2(material.password, salt, {
        keySize: keyLength / 32,
        hasher: CryptoJS.algo.SHA512,
        iterations: iterationCount,
      });
      const iv = CryptoJS.enc.Base64.parse("").random(16);
      fileEntriesString += `<file-entry full-path="${fullPath}" media-type="${mediaType}">`;
      fileEntriesString += `<encryption-data checksum="${generateChecksum(
        rawString,
      )}" checksum-type="${checksumType}"><algorithm algorithm-name="${algorithm}"><algorithm-name/></algorithm><key-derivation iteration-count="${iterationCount}" iv="${CryptoJS.enc.Base64.stringify(
        iv,
      )}" key-derivation-name="${keyDerivationName}" salt="${CryptoJS.enc.Base64.stringify(
        salt,
      )}" size="${keyLength}"><key-derivation-name/><salt/><iteration-count/><size/><iv/></key-derivation><checksum-type/><checksum/></encryption-data>`;
      fileEntriesString += "</file-entry>";
      zip.file(fullPath, encryptSync(key, iv));
    } else {
      fileEntriesString += `<file-entry full-path="${fullPath}" media-type="${mediaType}" />`;
      if (rawString) {
        zip.file(fullPath, rawString);
      }
    }
  }
  addFileEntry.XML_TYPE = "text/xml";
  addFileEntry(XMIND_PATH_CONTENT, addFileEntry.XML_TYPE, contentXMLString);
  addFileEntry(XMIND_PATH_META, addFileEntry.XML_TYPE, metaXMLString);
  // todo 不存在comments的情况需要考虑
  addFileEntry(XMIND_PATH_COMMNETS, addFileEntry.XML_TYPE, commentsXMLString);
  addFileEntry(XMIND_PATH_STYLES, addFileEntry.XML_TYPE, stylesXMLString);
  addFileEntry(XMIND_PATH_THUMBNAIL, "image/png");
  //resources file
  for (const fileEntry in workbook.manifest[M_FILE_ENTRIES]) {
    const bytesData = workbook.manifest.resources[fileEntry];
    if (!bytesData) {
      continue;
    }
    const wordData = CryptoJS.lib.WordArray.create(byteArrayToWord(bytesData));
    addFileEntry(
      fileEntry.replace("resources/", "attachments/"),
      "",
      material ? wordData : bytesData,
    );
  }
  // TODO reversions file
  // TODO thumbnails file
  // 所有文件处理完毕后, 处理manifest
  addFileEntry(XMIND_PATH_MANIFEST, addFileEntry.XML_TYPE);
  manifestXMLString = manifestXMLString.replace(
    "{{fileEntriesString}}",
    fileEntriesString,
  );
  zip.file(XMIND_PATH_MANIFEST, manifestXMLString);
  return new Promise((resolve, reject) => {
    // zip.generateAsync({ type: 'blob' }).then(function (content) {
    //   return resolve(content)
    // })
    resolve(zip);
  });
}
function toXML(workbook, options: any = {}) {
  return new Promise((resolve, reject) => {
    const zip = options.zip || new JSZip();
    generateXMindFile({
      workbook,
      zip,
      options,
    })
      .then((result) => resolve(result))
      .catch((err) => {
        console.error(err);
        return reject(new Error("Fail to  generate xmind file"));
      });
  });
}
export function toXMind(workbook, options = {}) {
  return toJSON(workbook, options);
}

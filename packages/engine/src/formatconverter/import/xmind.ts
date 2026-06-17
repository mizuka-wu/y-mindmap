/*
 * ============================
 * Zen
 * ============================
 */
import CryptoJS from "crypto-js";

import {
  M_ALGORITHM,
  M_ALGORITHM_NAME,
  M_CHECKSUM,
  M_CHECKSUM_TYPE,
  M_ENCRYPTION_DATA,
  M_FILE_ENTRIES,
  M_FIle_ENTRY,
  M_FULL_PATH,
  M_ITERATION_COUNT,
  M_KEY_DERIVATION_NAME,
  M_IV,
  M_KEY_DERIVATION,
  M_KEY_SIZE,
  M_SALT,
  M_PASSWORD_HINT,
  M_RESOURCES,
  M_THUMBNAIL,
  ZEN_PATH_CONTENT,
  ZEN_PATH_CONTENT_S,
  ZEN_PATH_MANIFEST,
  ZEN_PATH_MANIFEST_S,
  ZEN_PATH_METADATA,
  ZEN_PATH_METADATA_S,
  XMIND_PATH_COMMNETS,
  XMIND_PATH_COMMNETS_S,
  XMIND_PATH_CONTENT,
  XMIND_PATH_CONTENT_S,
  XMIND_PATH_MANIFEST,
  XMIND_PATH_MANIFEST_S,
  XMIND_PATH_MARKERS,
  XMIND_PATH_MARKERS_S,
  XMIND_PATH_META,
  XMIND_PATH_STYLES,
  XMIND_PATH_STYLES_S,
  XMIND_PATH_THUMBNAIL,
  XMIND_PATH_THUMBNAIL_S,
} from "../lib/constant";

import { generateOptions, UUID, wordToUint8Array, decrypt } from "../lib/utils";

function hasFile(zip, path1, path2) {
  return path1 in zip.files || path2 in zip.files;
}
function xmind_file(zip, path1, path2) {
  return zip.file(path1) || zip.file(path2);
}
function parseManifestDom(manifestDOM) {
  const manifestJSON = {
    [M_FILE_ENTRIES]: {},
    [M_PASSWORD_HINT]: "",
  };
  // password-hint
  const passwordHint = manifestDOM
    .getElementsByTagName("manifest")[0]
    .getAttribute(M_PASSWORD_HINT);
  manifestJSON[M_PASSWORD_HINT] = passwordHint;
  // all file-entry
  const fileEntries: any[] = manifestDOM.getElementsByTagName(M_FIle_ENTRY);
  for (const fileEntry of Array.from(fileEntries)) {
    const fullPath = fileEntry.getAttribute(M_FULL_PATH);
    manifestJSON[M_FILE_ENTRIES][fullPath] = {};
    const encryptionData =
      fileEntry.getElementsByTagName(M_ENCRYPTION_DATA) &&
      fileEntry.getElementsByTagName(M_ENCRYPTION_DATA)[0];
    if (encryptionData) {
      manifestJSON[M_FILE_ENTRIES][fullPath][M_ENCRYPTION_DATA] = {};
      manifestJSON[M_FILE_ENTRIES][fullPath][M_ENCRYPTION_DATA][M_CHECKSUM] =
        encryptionData.getAttribute(M_CHECKSUM);
      manifestJSON[M_FILE_ENTRIES][fullPath][M_ENCRYPTION_DATA][
        M_CHECKSUM_TYPE
      ] = encryptionData.getAttribute(M_CHECKSUM_TYPE);
      manifestJSON[M_FILE_ENTRIES][fullPath][M_ENCRYPTION_DATA][
        M_ALGORITHM_NAME
      ] = encryptionData
        .getElementsByTagName(M_ALGORITHM)[0]
        .getAttribute(M_ALGORITHM_NAME);
      const keyDerivation =
        encryptionData.getElementsByTagName(M_KEY_DERIVATION) &&
        encryptionData.getElementsByTagName(M_KEY_DERIVATION)[0];
      manifestJSON[M_FILE_ENTRIES][fullPath][M_ENCRYPTION_DATA][
        M_KEY_DERIVATION_NAME
      ] = keyDerivation.getAttribute(M_KEY_DERIVATION_NAME);
      manifestJSON[M_FILE_ENTRIES][fullPath][M_ENCRYPTION_DATA][
        M_ITERATION_COUNT
      ] = keyDerivation.getAttribute(M_ITERATION_COUNT);
      manifestJSON[M_FILE_ENTRIES][fullPath][M_ENCRYPTION_DATA][M_SALT] =
        keyDerivation.getAttribute(M_SALT);
      manifestJSON[M_FILE_ENTRIES][fullPath][M_ENCRYPTION_DATA][M_IV] =
        keyDerivation.getAttribute(M_IV);
      manifestJSON[M_FILE_ENTRIES][fullPath][M_ENCRYPTION_DATA][M_KEY_SIZE] =
        keyDerivation.getAttribute(M_KEY_SIZE);
    }
  }
  return manifestJSON;
}
function parseSheetDOM(sheetDOM, options) {
  const {
    stylesDOM,
    markersDOM,
    commentsDOM,
    sheetsArray,
    manifest,
    newManifest,
    zip,
    password,
  } = options;
  const sheetTitleDomArray = (
    Array.from(sheetDOM.childNodes) as Element[]
  ).filter(
    (item: any) => item.tagName && item.tagName.toLowerCase() === "title",
  );
  const sheetTitleDom: any = sheetTitleDomArray && sheetTitleDomArray[0];
  const sheetJSON: any = {
    id: UUID(),
    title:
      sheetTitleDom && sheetTitleDom.firstChild
        ? sheetTitleDom.firstChild.nodeValue
        : "Missing Sheet Title",
  };
  sheetsArray.push(sheetJSON);
  fillRelationShip();
  fillSettings();
  fillStyle();
  fillTheme();
  return new Promise((resolve) => {
    Promise.all([fillLegend(), fillTopic()]).then(resolve);
  });
  function fillRelationShip() {
    if (
      sheetDOM.getElementsByTagName("relationships") &&
      sheetDOM.getElementsByTagName("relationships").length
    ) {
      const resultArray: any[] = [];
      (
        Array.from(sheetDOM.getElementsByTagName("relationship")) as Element[]
      ).forEach((relationShipDom: any) => {
        const titleDom =
          relationShipDom.getElementsByTagName("title") &&
          relationShipDom.getElementsByTagName("title")[0];
        const relationShipInfo: any = {
          end1Id: relationShipDom.getAttribute("end1"),
          end2Id: relationShipDom.getAttribute("end2"),
          id: relationShipDom.getAttribute("id"),
          title: titleDom ? titleDom.textContent : "",
        };
        const controlPoints: any = {};
        (
          Array.from(
            relationShipDom.getElementsByTagName("control-point"),
          ) as Element[]
        ).forEach((controlPointDom: any) => {
          const index = controlPointDom.getAttribute("index") as string;
          const amount = Number(
            controlPointDom.getAttribute("amount") as string,
          );
          const angle = Number(controlPointDom.getAttribute("angle") as string);
          controlPoints[index] = {
            amount,
            angle,
          };
          const positionDom =
            controlPointDom.getElementsByTagName("position") &&
            controlPointDom.getElementsByTagName("position")[0];
          if (positionDom) {
            const x = Number(positionDom.getAttribute("svg:x"));
            const y = Number(positionDom.getAttribute("svg:y"));
            Object.assign(controlPoints[index], {
              x,
              y,
            });
          }
        });
        relationShipInfo.controlPoints = controlPoints;
        const userStylesContainer =
          stylesDOM &&
          stylesDOM.getElementsByTagName("xmap-styles") &&
          stylesDOM.getElementsByTagName("xmap-styles")[0];
        if (userStylesContainer) {
          const styleId = relationShipDom.getAttribute("style-id");
          if (styleId) {
            const styleDomWithId = (
              Array.from(
                userStylesContainer.getElementsByTagName("style"),
              ) as Element[]
            ).filter((item) => item.getAttribute("id") === styleId);
            const relationshipStyleDom =
              styleDomWithId &&
              styleDomWithId[0] &&
              styleDomWithId[0].getElementsByTagName(
                "relationship-properties",
              ) &&
              styleDomWithId[0].getElementsByTagName(
                "relationship-properties",
              )[0];
            if (relationshipStyleDom) {
              const properties: any = {};
              (Array.from(relationshipStyleDom.attributes) as any[]).forEach(
                (attrNode) => {
                  properties[attrNode.name] = attrNode.value;
                },
              );
              relationShipInfo.style = {
                properties,
              };
            }
          }
        }
        resultArray.push(relationShipInfo);
      });
      sheetJSON.relationships = resultArray;
    }
  }
  function fillSettings() {
    const settingDom =
      sheetDOM.getElementsByTagName("sheet-settings") &&
      sheetDOM.getElementsByTagName("sheet-settings")[0];
    if (!settingDom) {
      return false;
    }
    sheetJSON.settings = {};
    // infoItems setting start
    const keyNameMap = {
      infoItems: {
        childNodeName: "infoItem",
        keyName: "infoItems/infoItem",
      },
      "info-items": {
        childNodeName: "info-item",
        keyName: "info-items/info-item",
      },
    };
    Object.keys(keyNameMap).forEach((nodeName) => {
      const resultArray: any[] = [];
      const infoItemsContainer =
        settingDom.getElementsByTagName(nodeName) &&
        settingDom.getElementsByTagName(nodeName)[0];
      if (infoItemsContainer) {
        const itemsNodeName = keyNameMap[nodeName].childNodeName;
        const itemsDomArray = Array.from(
          infoItemsContainer.getElementsByTagName(itemsNodeName),
        ) as Element[];
        itemsDomArray.forEach((itemDom) => {
          resultArray.push({
            mode: itemDom.getAttribute("mode"),
            type: itemDom.getAttribute("type"),
          });
        });
        sheetJSON.settings[keyNameMap[nodeName].keyName] = resultArray;
      }
    });
    // infoItems setting end
  }
  function fillLegend() {
    return new Promise((resolve) => {
      const legend: any = {
        groups: {},
        markers: {},
      };
      const legendDom =
        sheetDOM.getElementsByTagName("legend") &&
        sheetDOM.getElementsByTagName("legend")[0];
      if (legendDom) {
        legend.visibility = legendDom.getAttribute("visibility") as string;
        const positionDom =
          legendDom.getElementsByTagName("position") &&
          legendDom.getElementsByTagName("position")[0];
        if (positionDom) {
          legend.position = {
            x: Number(positionDom.getAttribute("svg:x")),
            y: Number(positionDom.getAttribute("svg:y")),
          };
        }
        const markerDescriptionsDom = legendDom.getElementsByTagName(
          "marker-descriptions",
        );
        if (markerDescriptionsDom && markerDescriptionsDom[0]) {
          Array.from(
            markerDescriptionsDom[0].getElementsByTagName("marker-description"),
          ).forEach((markerDescriptionDom: any) => {
            const markerId = markerDescriptionDom.getAttribute("marker-id");
            const markerDesc = markerDescriptionDom.getAttribute(
              "description",
            ) as string;
            if (markerId) {
              legend.markers[markerId] = {
                name: markerDesc,
              };
            }
          });
        }
      }
      const promises: any[] = [];
      if (markersDOM) {
        (
          Array.from(
            markersDOM.getElementsByTagName("marker-group"),
          ) as Element[]
        ).forEach((markerGroupDom) => {
          const groupId = markerGroupDom.getAttribute("id") as string;
          const groupName = markerGroupDom.getAttribute("name") as string;
          const groupSingleton = markerGroupDom.getAttribute(
            "singleton",
          ) as string;
          const markersDom = markerGroupDom.getElementsByTagName("marker");
          if (!markersDom || !markersDom.length) {
            return;
          }
          const markerIds = Array.from(markersDom).map(
            (markerDom) => markerDom.getAttribute("id") as string,
          );
          legend.groups[groupId] = {
            name: groupName,
            singleton: groupSingleton,
            markers: markerIds,
          };
          Array.from(markersDom).forEach((markerDom) => {
            const markerId = markerDom.getAttribute("id") as string;
            const markerPath = markerDom.getAttribute("resource") as string;
            const markerFileEntry =
              manifest[M_FILE_ENTRIES]["markers/" + markerPath];
            const markerZipObject = zip.file("markers/" + markerPath);
            if (markerZipObject && markerFileEntry) {
              const marker: any = {};
              const markerEncryptionData =
                manifest[M_FILE_ENTRIES]["markers/" + markerPath][
                  M_ENCRYPTION_DATA
                ];
              promises.push(
                markerZipObject
                  .async(markerEncryptionData ? "base64" : "uint8array")
                  .then((markerData) => {
                    if (markerEncryptionData) {
                      const decryptOptions = generateOptions(
                        password,
                        markerEncryptionData,
                      );
                      markerData = wordToUint8Array(
                        decrypt(markerData, decryptOptions),
                      );
                      // markerData = decrypt(markerData, decryptOptions).toString(CryptoJS.enc.Utf8)
                    }
                    try {
                      const sha256 = CryptoJS.algo.SHA256.create();
                      const hash = sha256
                        .update(CryptoJS.lib.WordArray.create(markerData))
                        .finalize()
                        .toString(CryptoJS.enc.Hex);
                      let ext = markerPath.split(".").pop();
                      ext = ext === markerPath ? "" : "." + ext;
                      const newFileEntryPath = "resources/" + hash + ext;
                      newManifest[M_FILE_ENTRIES][newFileEntryPath] = {
                        [M_ENCRYPTION_DATA]: markerEncryptionData,
                      };
                      newManifest[M_RESOURCES][newFileEntryPath] = markerData;
                      marker.resource = "xap:" + newFileEntryPath;
                      marker.name = markerDom.getAttribute("name") as string;
                    } catch {
                      //
                    }
                  }),
              );
              legend.markers[markerId] = marker;
            }
          });
        });
      }
      Promise.all(promises).then(() => {
        sheetJSON.legend = legend;
        resolve(undefined);
      });
    });
  }
  function fillTopic() {
    return new Promise((resolve) => {
      const userStylesContainer =
        stylesDOM &&
        stylesDOM.getElementsByTagName("xmap-styles") &&
        stylesDOM.getElementsByTagName("xmap-styles")[0];
      parseTopicDom(
        sheetDOM.getElementsByTagName("topic") &&
          sheetDOM.getElementsByTagName("topic")[0],
      ).then((topicInfo) => {
        sheetJSON.rootTopic = topicInfo;
        resolve(undefined);
      });
      function parseTopicDom(topicDom) {
        return new Promise((resolve) => {
          const topicInfo: any = {};
          const promises: any[] = [];
          // normal attributes
          {
            // id
            topicInfo.id = topicDom.getAttribute("id") as string;
            const styleClass = topicDom.getAttribute("class") as string;
            if (styleClass) {
              topicInfo.class = styleClass;
            }
            // branch
            const branch = topicDom.getAttribute("branch") as string;
            if (branch) {
              topicInfo.branch = branch;
            }
            // structureClass
            const structureClass = topicDom.getAttribute("structure-class");
            if (structureClass) {
              topicInfo.structureClass = structureClass;
            }
            // title & title width
            const titleDomArray = (
              Array.from(topicDom.childNodes) as Element[]
            ).filter(
              (item) => item.tagName && item.tagName.toLowerCase() === "title",
            );
            const titleDom = titleDomArray && titleDomArray[0];
            if (titleDom && titleDom.firstChild) {
              const title = titleDom.firstChild.nodeValue;
              if (title) {
                topicInfo.title = title.replace(/\r/g, "");
              }
              const titleWidth = Number(titleDom.getAttribute("svg:width"));
              if (titleWidth) {
                topicInfo.width = titleWidth;
              }
            }
            // position (floating topic and callout)
            const positionDomArray = (
              Array.from(topicDom.childNodes) as Element[]
            ).filter(
              (item) =>
                item.tagName && item.tagName.toLowerCase() === "position",
            );
            const positionDom = positionDomArray && positionDomArray[0];
            if (positionDom) {
              topicInfo.position = {
                x: Number(positionDom.getAttribute("svg:x")),
                y: Number(positionDom.getAttribute("svg:y")),
              };
            }
            // image xhtml:img
            for (const child of Array.from(topicDom.childNodes) as Element[]) {
              if (
                child.tagName &&
                child.tagName.toLowerCase() === "xhtml:img"
              ) {
                const imageDom = child;
                const src = imageDom.getAttribute("xhtml:src") || "";
                const imagePath = src.split(":").pop() || "";
                const imageFileEntry = manifest[M_FILE_ENTRIES][imagePath];
                const imageZipObject = zip.file(imagePath);
                if (imageFileEntry && imageZipObject) {
                  const imageEncryptionData = imageFileEntry[M_ENCRYPTION_DATA];
                  promises.push(
                    imageZipObject
                      .async(imageEncryptionData ? "base64" : "uint8array")
                      .then((imageData) => {
                        try {
                          if (imageEncryptionData) {
                            const decryptOptions = generateOptions(
                              password,
                              imageEncryptionData,
                            );
                            imageData = wordToUint8Array(
                              decrypt(imageData, decryptOptions),
                            );
                            // imageData = decrypt(imageData, decryptOptions).toString(CryptoJS.enc.Utf8)
                          }
                          const sha256 = CryptoJS.algo.SHA256.create();
                          // let hash = sha256.update(origin).finalize().toString()
                          const hash = sha256
                            .update(CryptoJS.lib.WordArray.create(imageData))
                            .finalize()
                            .toString(CryptoJS.enc.Hex);
                          let ext = imagePath.split(".").pop();
                          ext = ext === imagePath ? "" : "." + ext;
                          const newFileEntryPath = "resources/" + hash + ext;
                          newManifest[M_FILE_ENTRIES][newFileEntryPath] = {
                            [M_ENCRYPTION_DATA]: imageEncryptionData,
                          };
                          newManifest[M_RESOURCES][newFileEntryPath] =
                            imageData;
                          topicInfo.image = {
                            src: "xap:" + newFileEntryPath,
                          };
                          const imageAlign = imageDom.getAttribute(
                            "align",
                          ) as string;
                          if (imageAlign) {
                            topicInfo.image.align = imageAlign;
                          }
                          const imageWidth = Number(
                            imageDom.getAttribute("svg:width"),
                          );
                          if (imageWidth) {
                            topicInfo.image.width = imageWidth;
                          }
                          const imageHeight = Number(
                            imageDom.getAttribute("svg:height"),
                          );
                          if (imageHeight) {
                            topicInfo.image.height = imageHeight;
                          }
                        } catch {
                          //
                        }
                      }),
                  );
                }
                const protocol = src.split(":")[0];
                if (protocol.startsWith("http")) {
                  topicInfo.image = {
                    src,
                  };
                  const imageAlign = imageDom.getAttribute("align") as string;
                  if (imageAlign) {
                    topicInfo.image.align = imageAlign;
                  }
                  const imageWidth = Number(imageDom.getAttribute("svg:width"));
                  if (imageWidth) {
                    topicInfo.image.width = imageWidth;
                  }
                  const imageHeight = Number(
                    imageDom.getAttribute("svg:height"),
                  );
                  if (imageHeight) {
                    topicInfo.image.height = imageHeight;
                  }
                }
              }
            }
            // numbering (summary)
            const numberingDomArray = (
              Array.from(topicDom.childNodes) as Element[]
            ).filter(
              (item) =>
                item.tagName && item.tagName.toLowerCase() === "numbering",
            );
            const numberingDom = numberingDomArray && numberingDomArray[0];
            if (numberingDom) {
              topicInfo.numbering = {
                numberFormat: numberingDom.getAttribute("number-format"),
                numberDepth: numberingDom.getAttribute("number-depth"),
                numberSeparator: numberingDom.getAttribute("number-separator"),
                prependingNumbers:
                  numberingDom.getAttribute("prepending-numbers"),
              };
              const numberingPrefixDom =
                numberingDom.getElementsByTagName("prefix") &&
                numberingDom.getElementsByTagName("prefix")[0];
              if (numberingPrefixDom && numberingPrefixDom.firstChild) {
                topicInfo.numbering.prefix =
                  numberingPrefixDom.firstChild.nodeValue;
              }
              const numberingSuffixDom =
                numberingDom.getElementsByTagName("suffix") &&
                numberingDom.getElementsByTagName("suffix")[0];
              if (numberingSuffixDom && numberingSuffixDom.firstChild) {
                topicInfo.numbering.suffix =
                  numberingSuffixDom.firstChild.nodeValue;
              }
            }
          }
          // info item attributes
          {
            // href
            const href = topicDom.getAttribute("xlink:href");
            if (href) {
              if (href.startsWith("xap:")) {
                const attachmentPath = href.substr(4);
                const attachmentFileEntry =
                  manifest[M_FILE_ENTRIES][attachmentPath];
                const attachmentZipObject = zip.file(attachmentPath);
                if (attachmentFileEntry && attachmentZipObject) {
                  const attachmentEncryptionData =
                    attachmentFileEntry[M_ENCRYPTION_DATA];
                  promises.push(
                    attachmentZipObject
                      .async(attachmentEncryptionData ? "base64" : "uint8array")
                      .then((attachmentData) => {
                        try {
                          if (attachmentEncryptionData) {
                            const decryptOptions = generateOptions(
                              password,
                              attachmentEncryptionData,
                            );
                            attachmentData = wordToUint8Array(
                              decrypt(attachmentData, decryptOptions),
                            );
                          }
                          const sha256 = CryptoJS.algo.SHA256.create();
                          const hash = sha256
                            .update(
                              CryptoJS.lib.WordArray.create(attachmentData),
                            )
                            .finalize()
                            .toString(CryptoJS.enc.Hex);
                          let ext = attachmentPath.split(".").pop();
                          ext = ext === attachmentPath ? "" : "." + ext;
                          const newFileEntryPath = "resources/" + hash + ext;
                          newManifest[M_FILE_ENTRIES][newFileEntryPath] = {
                            [M_ENCRYPTION_DATA]: attachmentEncryptionData,
                          };
                          newManifest[M_RESOURCES][newFileEntryPath] =
                            attachmentData;
                          topicInfo.href = "xap:" + newFileEntryPath;
                        } catch {
                          //
                        }
                      }),
                  );
                }
              } else {
                topicInfo.href = href;
              }
            }
            // notes
            const notesDomArray = (
              Array.from(topicDom.childNodes) as Element[]
            ).filter(
              (item) => item.tagName && item.tagName.toLowerCase() === "notes",
            );
            const notesDom = notesDomArray && notesDomArray[0];
            if (notesDom) {
              topicInfo.notes = {};
              // plain
              const plainDom =
                notesDom.getElementsByTagName("plain") &&
                notesDom.getElementsByTagName("plain")[0];
              if (plainDom && plainDom.firstChild) {
                topicInfo.notes.plain = {
                  content: plainDom.firstChild.nodeValue,
                };
              }
              // html
              const htmlDom =
                notesDom.getElementsByTagName("html") &&
                notesDom.getElementsByTagName("html")[0];
              if (htmlDom) {
                let p = Promise.resolve();
                topicInfo.notes.html = {
                  content: {
                    paragraphs: [],
                  },
                };
                for (const pEl of (
                  Array.from(htmlDom.childNodes) as Element[]
                ).filter((item) => item.childNodes && item.childNodes.length)) {
                  const spans: any[] = [];
                  const paraStyle: any = {};
                  const paraStyleId = pEl.getAttribute("style-id");
                  const paraStyleDom = stylesDOM
                    ? stylesDOM.getElementById(paraStyleId)
                    : null;
                  if (paraStyleDom) {
                    const sType = paraStyleDom.getAttribute("type") as string;
                    if (sType) {
                      const propertiesDom =
                        paraStyleDom.getElementsByTagName(
                          sType + "-properties",
                        ) &&
                        paraStyleDom.getElementsByTagName(
                          sType + "-properties",
                        )[0];
                      if (propertiesDom && propertiesDom.attributes) {
                        const propertiesJson: any = {};
                        for (const attr of Array.from(
                          propertiesDom.attributes,
                        ) as any[]) {
                          propertiesJson[attr.nodeName] = attr.nodeValue;
                        }
                        paraStyle.properties = propertiesJson;
                      }
                      paraStyle.type = sType;
                    }
                  }
                  const pElChildren = Array.from(pEl.childNodes) as Element[];
                  for (const cIndex in pElChildren) {
                    const c = pElChildren[cIndex];
                    if (c.nodeType === 1) {
                      if (c.nodeName === "xhtml:img") {
                        p = p.then(() => {
                          return new Promise((resolve) => {
                            const src = c.getAttribute("xhtml:src") || "";
                            const imgpath = src.substr(4) || "";
                            const imgFileEntry =
                              manifest[M_FILE_ENTRIES][imgpath];
                            const imgFileObject = zip.file(imgpath);
                            if (imgFileEntry && imgFileObject) {
                              const imgEncryptionData =
                                imgFileEntry[M_ENCRYPTION_DATA];
                              imgFileObject
                                .async(
                                  imgEncryptionData ? "base64" : "uint8array",
                                )
                                .then((imgData) => {
                                  try {
                                    if (imgEncryptionData) {
                                      const decryptOptions = generateOptions(
                                        password,
                                        imgEncryptionData,
                                      );
                                      imgData = wordToUint8Array(
                                        decrypt(imgData, decryptOptions),
                                      );
                                    }
                                    const sha256 =
                                      CryptoJS.algo.SHA256.create();
                                    const hash = sha256
                                      .update(
                                        CryptoJS.lib.WordArray.create(imgData),
                                      )
                                      .finalize()
                                      .toString(CryptoJS.enc.Hex);
                                    let ext = imgpath.split(".").pop();
                                    ext = ext === imgpath ? "" : "." + ext;
                                    const newFileEntryPath =
                                      "resources/" + hash + ext;
                                    newManifest[M_FILE_ENTRIES][
                                      newFileEntryPath
                                    ] = {
                                      [M_ENCRYPTION_DATA]: imgEncryptionData,
                                    };
                                    newManifest[M_RESOURCES][newFileEntryPath] =
                                      imgData;
                                    spans[cIndex] = {
                                      image: "xap:" + newFileEntryPath,
                                    };
                                    resolve();
                                  } catch {
                                    //
                                  }
                                });
                            } else {
                              resolve();
                            }
                          });
                        });
                      } else if (c.nodeName === "xhtml:span") {
                        p = p.then(() => {
                          const styleid = c.getAttribute("style-id");
                          if (styleid) {
                            const notesStyle = stylesDOM
                              ? stylesDOM.getElementById(styleid)
                              : null;
                            if (notesStyle) {
                              const sType = notesStyle.getAttribute(
                                "type",
                              ) as string;
                              if (sType) {
                                const propertiesDom =
                                  notesStyle.getElementsByTagName(
                                    sType + "-properties",
                                  ) &&
                                  notesStyle.getElementsByTagName(
                                    sType + "-properties",
                                  )[0];
                                if (propertiesDom) {
                                  const propertiesJson: any = {};
                                  for (const attr of Array.from(
                                    propertiesDom.attributes,
                                  ) as any[]) {
                                    propertiesJson[attr.nodeName] =
                                      attr.nodeValue;
                                  }
                                  spans[cIndex] = {
                                    style: {
                                      type: sType,
                                      properties: propertiesJson,
                                    },
                                    text: c.textContent,
                                  };
                                }
                              }
                            }
                          }
                        });
                      } else if (c.nodeName === "xhtml:a") {
                        p = p.then(() => {
                          return new Promise((resolve) => {
                            const aSpans: any[] = [];
                            for (const ac of Array.from(
                              c.childNodes,
                            ) as Element[]) {
                              if (ac.nodeType === 3) {
                                aSpans.push({
                                  text: ac.textContent,
                                });
                              } else if (ac.nodeName === "xhtml:span") {
                                const styleid = ac.getAttribute("style-id");
                                if (styleid) {
                                  const notesStyle =
                                    stylesDOM.getElementById(styleid);
                                  if (notesStyle) {
                                    const sType = notesStyle.getAttribute(
                                      "type",
                                    ) as string;
                                    if (sType) {
                                      const propertiesDom =
                                        notesStyle.getElementsByTagName(
                                          sType + "-properties",
                                        ) &&
                                        notesStyle.getElementsByTagName(
                                          sType + "-properties",
                                        )[0];
                                      if (propertiesDom) {
                                        const propertiesJson: any = {};
                                        for (const attr of Array.from(
                                          propertiesDom.attributes,
                                        ) as any[]) {
                                          propertiesJson[attr.nodeName] =
                                            attr.nodeValue;
                                        }
                                        aSpans.push({
                                          style: {
                                            type: sType,
                                            properties: propertiesJson,
                                          },
                                          text: ac.textContent,
                                        });
                                      }
                                    }
                                  }
                                }
                              }
                            }
                            const xlinkRef = c.getAttribute("xlink:href");
                            if (xlinkRef && xlinkRef.startsWith("xap:")) {
                              const attachmentPath =
                                (c.getAttribute("xlink:href") || "").substr(
                                  4,
                                ) || "";
                              const attachmentFileEntry =
                                manifest[M_FILE_ENTRIES][attachmentPath];
                              const attachmentFileObject =
                                zip.file(attachmentPath);
                              if (attachmentFileEntry && attachmentFileObject) {
                                const attachmentEncryptionData =
                                  attachmentFileEntry[M_ENCRYPTION_DATA];
                                attachmentFileObject
                                  .async(
                                    attachmentEncryptionData
                                      ? "base64"
                                      : "uint8array",
                                  )
                                  .then((imgData) => {
                                    try {
                                      if (attachmentEncryptionData) {
                                        const decryptOptions = generateOptions(
                                          password,
                                          attachmentEncryptionData,
                                        );
                                        imgData = wordToUint8Array(
                                          decrypt(imgData, decryptOptions),
                                        );
                                      }
                                      const sha256 =
                                        CryptoJS.algo.SHA256.create();
                                      const hash = sha256
                                        .update(
                                          CryptoJS.lib.WordArray.create(
                                            imgData,
                                          ),
                                        )
                                        .finalize()
                                        .toString(CryptoJS.enc.Hex);
                                      let ext = attachmentPath.split(".").pop();
                                      ext =
                                        ext === attachmentPath ? "" : "." + ext;
                                      const newFileEntryPath =
                                        "resources/" + hash + ext;
                                      newManifest[M_FILE_ENTRIES][
                                        newFileEntryPath
                                      ] = {
                                        [M_ENCRYPTION_DATA]:
                                          attachmentEncryptionData,
                                      };
                                      newManifest[M_RESOURCES][
                                        newFileEntryPath
                                      ] = imgData;
                                      spans[cIndex] = {
                                        image: "xap:" + newFileEntryPath,
                                      };
                                      resolve();
                                    } catch {
                                      //
                                    }
                                  });
                              } else {
                                resolve();
                              }
                            } else {
                              spans[cIndex] = {
                                spans: aSpans,
                                href: xlinkRef,
                              };
                              resolve();
                            }
                          });
                        });
                      }
                    } else if (c.nodeType === 3) {
                      p = p.then(() => {
                        spans[cIndex] = {
                          text: c.textContent,
                        };
                      });
                    }
                  }
                  p = p.then(() => {
                    topicInfo.notes.html.content.paragraphs.push({
                      spans,
                      style: paraStyle,
                    });
                  });
                }
                promises.push(p);
              }
            }
            // labels
            const labelsDomContainerArray = (
              Array.from(topicDom.childNodes) as Element[]
            ).filter(
              (item) => item.tagName && item.tagName.toLowerCase() === "labels",
            );
            const labelsDomContainer =
              labelsDomContainerArray && labelsDomContainerArray[0];
            if (labelsDomContainer) {
              const labelDomArray = Array.from(
                labelsDomContainer.getElementsByTagName("label"),
              ) as Element[];
              if (labelDomArray) {
                topicInfo.labels = [];
                labelDomArray.forEach((labelDom) => {
                  if (labelDom && labelDom.firstChild) {
                    topicInfo.labels.push(labelDom.firstChild.nodeValue);
                  }
                });
              }
            }
          }
          style: {
            if (!stylesDOM) {
              break style;
            }
            const styleId = topicDom.getAttribute("style-id");
            if (!styleId) {
              break style;
            }
            const userStyleDom =
              //userStylesContainer
              stylesDOM.getElementById(styleId);
            if (!userStyleDom) {
              break style;
            }
            const stylePropertiesDom =
              userStyleDom.getElementsByTagName("topic-properties") &&
              userStyleDom.getElementsByTagName("topic-properties")[0];
            if (!stylePropertiesDom) {
              break style;
            }
            topicInfo.style = {
              type: "topic",
            };
            const properties: any = {};
            (Array.from(stylePropertiesDom.attributes) as any[]).forEach(
              (attrNode) => {
                properties[attrNode.name] = attrNode.value;
              },
            );
            topicInfo.style.properties = properties;
          }
          // markers
          markers: {
            const markersDomContainerArray = (
              Array.from(topicDom.childNodes) as Element[]
            ).filter(
              (item) =>
                item.tagName && item.tagName.toLowerCase() === "marker-refs",
            );
            const markersDomContainer =
              markersDomContainerArray && markersDomContainerArray[0];
            if (!markersDomContainer) {
              break markers;
            }
            const markerDomArray =
              markersDomContainer.getElementsByTagName("marker-ref");
            if (markerDomArray && markerDomArray.length) {
              topicInfo.markers = [];
              Array.from(markerDomArray).forEach((markerDom) => {
                topicInfo.markers.push({
                  markerId: markerDom.getAttribute("marker-id"),
                });
              });
            }
          }
          // comments
          comments: {
            if (!commentsDOM) {
              break comments;
            }
            const commentDomArray = Array.from(
              commentsDOM.getElementsByTagName("comment"),
            ) as Element[];
            if (!commentDomArray.length) {
              break comments;
            }
            const arrayCopy = Array.from(commentDomArray);
            arrayCopy.forEach((commentDom, index) => {
              if (commentDom.getAttribute("object-id") === topicInfo.id) {
                if (!topicInfo.comments) {
                  topicInfo.comments = [];
                }
                const contendDom =
                  commentDom.getElementsByTagName("content") &&
                  commentDom.getElementsByTagName("content")[0];
                if (contendDom && contendDom.firstChild) {
                  topicInfo.comments.push({
                    creationTime: Number(
                      commentDom.getAttribute("time") as string,
                    ),
                    author: commentDom.getAttribute("author"),
                    content: contendDom.firstChild.nodeValue,
                  });
                }
                commentDomArray.splice(index, 1);
              }
            });
          }
          function parseExtensionContent(extensionContentDom) {
            const getAttrs = (dom) => {
              const attrs: any = {};
              for (const attr of Array.from(dom.attributes) as any[]) {
                attrs[attr.name] = attr.value;
              }
              if (Object.keys(attrs)) {
                return attrs;
              }
              return null;
            };
            let content;
            const extensionChildrenDom = (
              Array.from(extensionContentDom.childNodes) as Element[]
            ).filter((item) => item.tagName);
            if (extensionChildrenDom && extensionChildrenDom.length) {
              content = [];
              extensionChildrenDom.forEach((childDom) => {
                const obj: any = {
                  name: childDom.nodeName,
                };
                //childDom.tagName && childDom.tagName.toLowerCase()
                obj.content = parseExtensionContent(childDom);
                const attrs = getAttrs(childDom);
                if (attrs) {
                  obj.attrs = attrs;
                }
                //resourceRefs
                content.push(obj);
              });
            } else if (extensionContentDom.firstChild) {
              content = extensionContentDom.firstChild.nodeValue;
            }
            return content;
          }
          // extensions
          extensions: {
            const extensionsContainerArray = (
              Array.from(topicDom.childNodes) as Element[]
            ).filter(
              (item) =>
                item.tagName && item.tagName.toLowerCase() === "extensions",
            );
            const extensionsContainer =
              extensionsContainerArray && extensionsContainerArray[0];
            if (!extensionsContainer) {
              break extensions;
            }
            const extensionDomArray =
              extensionsContainer.getElementsByTagName("extension");
            if (!extensionDomArray) {
              break extensions;
            }
            const extensionsResult: any[] = [];
            Array.from(extensionDomArray).forEach((extensionDom) => {
              const extensionInfo: any = {};
              extensionInfo.provider = extensionDom.getAttribute(
                "provider",
              ) as string;
              // content
              const contentsContainer =
                extensionDom.getElementsByTagName("content") &&
                extensionDom.getElementsByTagName("content")[0];
              const contentDomArray = (
                Array.from(contentsContainer.childNodes) as Element[]
              ).filter((item) => item.tagName);
              const contentResult: any[] = [];
              contentDomArray.forEach((contentDom) => {
                contentResult.push({
                  name: contentDom.nodeName,
                  content: parseExtensionContent(contentDom),
                });
              });
              extensionInfo.content = contentResult;
              // resource-refs
              const resourceRefsContainer =
                extensionDom.getElementsByTagName("resource-refs") &&
                extensionDom.getElementsByTagName("resource-refs")[0];
              if (resourceRefsContainer) {
                const resourceRefDomArray = Array.from(
                  resourceRefsContainer.getElementsByTagName("resource-ref"),
                ) as Element[];
                const resourceRefResult: any[] = [];
                resourceRefDomArray.forEach((resourceRefDom) => {
                  const resourceId =
                    resourceRefDom.getAttribute("resource-id") || "";
                  const resourceZipObject = zip.file(resourceId);
                  const resourceFileEntry =
                    manifest[M_FILE_ENTRIES][resourceId || ""];
                  if (resourceFileEntry && resourceZipObject) {
                    const resourceEncryptionData =
                      resourceFileEntry[M_ENCRYPTION_DATA];
                    promises.push(
                      resourceZipObject
                        .async(resourceEncryptionData ? "base64" : "uint8array")
                        .then((resourceData) => {
                          try {
                            if (resourceEncryptionData) {
                              const decryptOptions = generateOptions(
                                password,
                                resourceEncryptionData,
                              );
                              resourceData = wordToUint8Array(
                                decrypt(resourceData, decryptOptions),
                              );
                            }
                            const sha256 = CryptoJS.algo.SHA256.create();
                            // let hash = sha256.update(origin).finalize().toString()
                            const hash = sha256
                              .update(
                                CryptoJS.lib.WordArray.create(resourceData),
                              )
                              .finalize()
                              .toString(CryptoJS.enc.Hex);
                            let ext = resourceId.split(".").pop();
                            ext = ext === resourceId ? "" : "." + ext;
                            const newFileEntryPath = "resources/" + hash + ext;
                            newManifest[M_FILE_ENTRIES][newFileEntryPath] = {
                              [M_ENCRYPTION_DATA]: resourceEncryptionData,
                            };
                            newManifest[M_RESOURCES][newFileEntryPath] =
                              resourceData;
                            const xapNewFileEntryPath =
                              "xap:resources/" + hash + ext;
                            resourceRefResult.push(xapNewFileEntryPath);
                          } catch {
                            //
                          }
                        }),
                    );
                  }
                });
                extensionInfo.resourceRefs = resourceRefResult;
              }
              extensionsResult.push(extensionInfo);
            });
            topicInfo.extensions = extensionsResult;
          }
          // boundaries has styles
          boundaries: {
            const boundariesContainer = (
              Array.from(topicDom.childNodes) as Element[]
            ).find(
              (item) =>
                item.tagName && item.tagName.toLowerCase() === "boundaries",
            );
            if (!boundariesContainer) {
              break boundaries;
            }
            const boundaryDomArray =
              boundariesContainer.getElementsByTagName("boundary");
            if (!boundaryDomArray || !boundaryDomArray.length) {
              break boundaries;
            }
            const boundariesResult: any[] = [];
            Array.from(boundaryDomArray).forEach((boundaryDom) => {
              const boundaryInfo: any = {
                id: boundaryDom.getAttribute("id"),
                range: boundaryDom.getAttribute("range"),
              };
              const titleDom =
                boundaryDom.getElementsByTagName("title") &&
                boundaryDom.getElementsByTagName("title")[0];
              if (titleDom && titleDom.firstChild) {
                const title = titleDom.firstChild.nodeValue;
                if (title) {
                  boundaryInfo.title = title.replace(/\r/g, "");
                }
              }
              // styles
              if (userStylesContainer) {
                const boundaryStyleId = boundaryDom.getAttribute("style-id");
                if (stylesDOM && boundaryStyleId) {
                  const userStyleDom =
                    stylesDOM.getElementById(boundaryStyleId);
                  if (userStyleDom) {
                    const stylePropertiesDom =
                      userStyleDom.getElementsByTagName(
                        "boundary-properties",
                      ) &&
                      userStyleDom.getElementsByTagName(
                        "boundary-properties",
                      )[0];
                    if (stylePropertiesDom && stylePropertiesDom.attributes) {
                      boundaryInfo.style = {
                        type: "boundary",
                      };
                      const properties: any = {};
                      (
                        Array.from(stylePropertiesDom.attributes) as any[]
                      ).forEach((attrNode) => {
                        properties[attrNode.name] = attrNode.value;
                      });
                      boundaryInfo.style.properties = properties;
                    }
                  }
                }
              }
              boundariesResult.push(boundaryInfo);
            });
            topicInfo.boundaries = boundariesResult;
          }
          // summaries
          summaries: {
            const summariesContainer = (
              Array.from(topicDom.childNodes) as Element[]
            ).find(
              (item) =>
                item.tagName && item.tagName.toLowerCase() === "summaries",
            );
            if (!summariesContainer) {
              break summaries;
            }
            const summaryDomArray =
              summariesContainer.getElementsByTagName("summary");
            if (!summaryDomArray) {
              break summaries;
            }
            const summaryResult: any[] = [];
            Array.from(summaryDomArray).forEach((summaryDom) => {
              summaryResult.push({
                id: summaryDom.getAttribute("id"),
                range: summaryDom.getAttribute("range"),
                topicId: summaryDom.getAttribute("topic-id"),
              });
            });
            topicInfo.summaries = summaryResult;
          }
          // children
          children: {
            topicInfo.children = {};
            const $childrenDom = (
              Array.from(topicDom.childNodes) as Element[]
            ).filter(
              (item) =>
                item.tagName && item.tagName.toLowerCase() === "children",
            );
            if (!$childrenDom[0]) {
              break children;
            }
            // attached detached summary callout
            const parseChildDom = (type) => {
              const $cTypeChildrenDom = Array.from(
                $childrenDom[0].childNodes,
              ).find((item: any) => {
                return (
                  item.tagName &&
                  item.tagName.toLowerCase() === "topics" &&
                  item.getAttribute("type") === type
                );
              });
              if ($cTypeChildrenDom) {
                topicInfo.children[type] = [];
                const childDomArray = Array.from(
                  $cTypeChildrenDom.childNodes,
                ).filter(
                  (item: any) =>
                    item.tagName && item.tagName.toLowerCase() === "topic",
                );
                for (const index in childDomArray) {
                  const childDom = childDomArray[index];
                  promises.push(
                    parseTopicDom(childDom).then((childTopicInfo) => {
                      topicInfo.children[type][index] = childTopicInfo;
                    }),
                  );
                }
              }
            };
            // attached children
            parseChildDom("attached");
            // detached children
            parseChildDom("detached");
            // summary children
            parseChildDom("summary");
            // callout children
            parseChildDom("callout");
          }
          Promise.all(promises).then(() => {
            resolve(topicInfo);
          });
        });
      }
    });
  }
  function fillStyle() {
    if (!stylesDOM) {
      return false;
    }
    const userStylesContainer =
      stylesDOM.getElementsByTagName("xmap-styles") &&
      stylesDOM.getElementsByTagName("xmap-styles")[0];
    if (!userStylesContainer) {
      return false;
    }
    const sheetStyleId = sheetDOM.getAttribute("style-id");
    if (!sheetStyleId) {
      return false;
    }
    const styleDom = stylesDOM.getElementById(sheetStyleId);
    if (!styleDom) {
      return false;
    }
    const type = styleDom.getAttribute("type") as string;
    sheetJSON.style = {
      type: type,
    };
    const propertiesDom =
      styleDom.getElementsByTagName(type + "-properties") &&
      styleDom.getElementsByTagName(type + "-properties")[0];
    if (!propertiesDom) {
      return false;
    }
    const properties: any = {};
    (Array.from(propertiesDom.attributes) as any[]).forEach((attrNode) => {
      properties[attrNode.name] = attrNode.value;
    });
    sheetJSON.style.properties = properties;
  }
  function fillTheme() {
    if (!sheetDOM || !stylesDOM) {
      return;
    }
    const sheetThemeId = sheetDOM.getAttribute("theme") as string;
    if (!sheetThemeId) {
      return;
    }
    const masterStylesContainer = stylesDOM.getElementById(sheetThemeId);
    if (!masterStylesContainer) {
      return;
    }
    const theme: any = {};
    const defaultStyleDomArray = Array.from(
      masterStylesContainer.getElementsByTagName("default-style"),
    ) as Element[];
    defaultStyleDomArray.forEach((dsDom) => {
      const styleId = dsDom.getAttribute("style-id");
      const styleFamily = dsDom.getAttribute("style-family") as string;
      if (!stylesDOM || !styleId) {
        return;
      }
      const amStyleDom = stylesDOM.getElementById(styleId);
      if (!amStyleDom) {
        return;
      }
      const type = amStyleDom.getAttribute("type") as string;
      theme[styleFamily] = {
        type,
        properties: {},
      };
      if (
        amStyleDom.getElementsByTagName(type + "-properties") &&
        amStyleDom.getElementsByTagName(type + "-properties")[0]
      ) {
        Array.from(
          amStyleDom.getElementsByTagName(type + "-properties")[0].attributes,
        ).forEach((attrNode: any) => {
          theme[styleFamily].properties[attrNode.name] = attrNode.value;
        });
      }
    });
    sheetJSON.theme = theme;
  }
}
function fixXapResourceUrls(content, resources) {
  function search(obj, key, value) {
    if (isArray(value) || isObject(value)) {
      for (const k in value) {
        search(value, k, value[k]);
      }
    } else if (
      typeof value === "string" &&
      (value.startsWith("xap:resources") || value.startsWith("xap:attachments"))
    ) {
      if (!resources.includes(value)) {
        delete obj[key];
      }
    }
  }
  function isArray(arr) {
    return (
      Array.isArray(arr) ||
      Object.prototype.toString.call(arr) === "[object Array]"
    );
  }
  function isObject(obj) {
    const type = typeof obj;
    return type === "function" || (type === "object" && !!obj);
  }
  for (const k in content) {
    search(content, k, content[k]);
  }
}
function fromJSON(zip, options: any = {}) {
  return new Promise((resolve, reject) => {
    if (!zip) {
      return reject("MUST have a valid zen file.");
    }
    const { password = "" } = options;
    const manifestZipObject = xmind_file(
      zip,
      ZEN_PATH_MANIFEST,
      ZEN_PATH_MANIFEST_S,
    );
    if (!manifestZipObject) {
      return reject("MUST have a manifest.json file.");
    }
    manifestZipObject
      .async("string")
      .then((jsonString) => {
        return JSON.parse(jsonString);
      })
      .then((manifest) => {
        const jobs: any[] = [];
        jobs.push(Promise.resolve(manifest));
        // metadata.json
        const metadataZipObject = xmind_file(
          zip,
          ZEN_PATH_METADATA,
          ZEN_PATH_METADATA_S,
        );
        if (!metadataZipObject) {
          return reject("MUST have a metadata.json file.");
        }
        const metadataEncryptionData =
          manifest[M_FILE_ENTRIES][ZEN_PATH_METADATA] &&
          manifest[M_FILE_ENTRIES][ZEN_PATH_METADATA][M_ENCRYPTION_DATA];
        jobs.push(
          metadataZipObject
            .async(metadataEncryptionData ? "base64" : "string")
            .then((origin) => {
              if (metadataEncryptionData) {
                const decryptOptions = generateOptions(
                  password,
                  metadataEncryptionData,
                );
                const decryptedString = decrypt(
                  origin,
                  decryptOptions,
                ).toString(CryptoJS.enc.Utf8);
                origin = decryptedString;
              }
              return JSON.parse(origin);
            }),
        );
        // content.json
        const contentZipObject = xmind_file(
          zip,
          ZEN_PATH_CONTENT,
          ZEN_PATH_CONTENT_S,
        );
        if (!contentZipObject) {
          return reject("MUST have a content.json file");
        }
        const contentEncryptionData =
          manifest[M_FILE_ENTRIES][ZEN_PATH_CONTENT] &&
          manifest[M_FILE_ENTRIES][ZEN_PATH_CONTENT][M_ENCRYPTION_DATA];
        jobs.push(
          contentZipObject
            .async(contentEncryptionData ? "base64" : "string")
            .then((origin) => {
              if (contentEncryptionData) {
                const decryptOptions = generateOptions(
                  password,
                  contentEncryptionData,
                );
                const decryptedString = decrypt(
                  origin,
                  decryptOptions,
                ).toString(CryptoJS.enc.Utf8);
                origin = decryptedString;
              }
              return JSON.parse(origin);
            }),
        );
        manifest[M_RESOURCES] = manifest[M_RESOURCES]
          ? manifest[M_RESOURCES]
          : {};
        for (const fe in manifest[M_FILE_ENTRIES]) {
          if (fe.includes(M_THUMBNAIL) || fe.match(/resources\//)) {
            const fileEntryZipObject = zip.file(fe);
            if (fileEntryZipObject) {
              const feEncryptionData =
                manifest[M_FILE_ENTRIES][fe][M_ENCRYPTION_DATA];
              jobs.push(
                fileEntryZipObject
                  .async(feEncryptionData ? "base64" : "uint8array")
                  .then((origin) => {
                    if (feEncryptionData) {
                      const decryptOptions = generateOptions(
                        password,
                        feEncryptionData,
                      );
                      origin = wordToUint8Array(
                        decrypt(origin, decryptOptions),
                      );
                    }
                    return (manifest[M_RESOURCES][fe] = origin);
                  }),
              );
            }
          }
        }
        Promise.all(jobs)
          .then(([manifest, metadata, sheetsJSON]) => {
            if (!manifest[M_FILE_ENTRIES][ZEN_PATH_CONTENT]) {
              manifest[M_FILE_ENTRIES][ZEN_PATH_CONTENT] = {};
            }
            if (!manifest[M_FILE_ENTRIES][ZEN_PATH_METADATA]) {
              manifest[M_FILE_ENTRIES][ZEN_PATH_METADATA] = {};
            }
            // last time to fix resource
            fixXapResourceUrls(
              sheetsJSON,
              Object.keys(manifest[M_RESOURCES]).map((fp) => "xap:" + fp),
            );
            resolve({
              metadata: metadata,
              sheets: sheetsJSON,
              manifest: manifest,
            });
          })
          .catch((e) => {
            reject(e);
          });
      });
  });
}
/*
 * ============================
 * XMind
 * ============================
 */
function fromXML(zip, options: any = {}) {
  return new Promise((resolve, reject) => {
    if (!zip) {
      return reject("MUST have a valid xmind file.");
    }
    const manifestZipObject = xmind_file(
      zip,
      XMIND_PATH_MANIFEST,
      XMIND_PATH_MANIFEST_S,
    );
    if (!manifestZipObject) {
      return reject("MUST have a manifest.xml file");
    }
    const { password } = options;
    const domParser = new DOMParser();
    manifestZipObject
      .async("string")
      .then((xmlString) => {
        const dom = domParser.parseFromString(xmlString, "application/xml");
        return parseManifestDom(dom);
      })
      .then((manifest) => {
        const jobs: any[] = [];
        jobs.push(Promise.resolve(manifest));
        // content.xml
        const contentZipObject = xmind_file(
          zip,
          XMIND_PATH_CONTENT,
          XMIND_PATH_CONTENT_S,
        );
        const contentFileEntry = manifest[M_FILE_ENTRIES][XMIND_PATH_CONTENT];
        if (!contentZipObject) {
          return reject("MUST have a content.xml file.");
        }
        jobs.push(
          contentZipObject
            .async(
              contentFileEntry && contentFileEntry[M_ENCRYPTION_DATA]
                ? "base64"
                : "string",
            )
            .then((origin) => {
              const contentEncryptionData = contentFileEntry
                ? contentFileEntry[M_ENCRYPTION_DATA]
                : null;
              if (contentEncryptionData) {
                const decryptOptions = generateOptions(
                  password,
                  contentEncryptionData,
                );
                const decryptedString = decrypt(
                  origin,
                  decryptOptions,
                ).toString(CryptoJS.enc.Utf8);
                origin = decryptedString;
              }
              return domParser.parseFromString(origin, "application/xml");
            }),
        );
        // styles and themes
        const styleZipObject = xmind_file(
          zip,
          XMIND_PATH_STYLES,
          XMIND_PATH_STYLES_S,
        );
        const styleFileEntry = manifest[M_FILE_ENTRIES][XMIND_PATH_STYLES];
        if (styleZipObject) {
          jobs.push(
            styleZipObject
              .async(
                styleFileEntry && styleFileEntry[M_ENCRYPTION_DATA]
                  ? "base64"
                  : "string",
              )
              .then((origin) => {
                if (manifest[M_FILE_ENTRIES][XMIND_PATH_STYLES]) {
                  const stylesEncryptionData =
                    manifest[M_FILE_ENTRIES][XMIND_PATH_STYLES][
                      M_ENCRYPTION_DATA
                    ];
                  if (stylesEncryptionData) {
                    const decryptOptions = generateOptions(
                      password,
                      stylesEncryptionData,
                    );
                    const decryptedString = decrypt(
                      origin,
                      decryptOptions,
                    ).toString(CryptoJS.enc.Utf8);
                    origin = decryptedString;
                  }
                  return domParser.parseFromString(origin, "application/xml");
                } else {
                  return null;
                }
              }),
          );
        } else {
          jobs.push(Promise.resolve(null));
        }
        // markers xml
        const markerZipObject = xmind_file(
          zip,
          XMIND_PATH_MARKERS,
          XMIND_PATH_MARKERS_S,
        );
        const markerFileEntry = manifest[M_FILE_ENTRIES][XMIND_PATH_MARKERS];
        if (markerZipObject) {
          jobs.push(
            markerZipObject
              .async(
                markerFileEntry && markerFileEntry[M_ENCRYPTION_DATA]
                  ? "base64"
                  : "string",
              )
              .then((origin) => {
                if (manifest[M_FILE_ENTRIES][XMIND_PATH_MARKERS]) {
                  const markersEncryptionData =
                    manifest[M_FILE_ENTRIES][XMIND_PATH_MARKERS][
                      M_ENCRYPTION_DATA
                    ];
                  if (markersEncryptionData) {
                    const decryptOptions = generateOptions(
                      password,
                      markersEncryptionData,
                    );
                    origin = decrypt(origin, decryptOptions).toString(
                      CryptoJS.enc.Utf8,
                    );
                  }
                  return domParser.parseFromString(origin, "application/xml");
                } else {
                  return null;
                }
              }),
          );
        } else {
          jobs.push(Promise.resolve(null));
        }
        // comments.xml
        const commnetsZipObject = xmind_file(
          zip,
          XMIND_PATH_COMMNETS,
          XMIND_PATH_COMMNETS_S,
        );
        const commentFileEntry = manifest[M_FILE_ENTRIES][XMIND_PATH_COMMNETS];
        if (commnetsZipObject) {
          jobs.push(
            commnetsZipObject
              .async(
                commentFileEntry && commentFileEntry[M_ENCRYPTION_DATA]
                  ? "base64"
                  : "string",
              )
              .then((origin) => {
                if (manifest[M_FILE_ENTRIES][XMIND_PATH_COMMNETS]) {
                  const commentsEncryptionData =
                    manifest[M_FILE_ENTRIES][XMIND_PATH_COMMNETS][
                      M_ENCRYPTION_DATA
                    ];
                  if (commentsEncryptionData) {
                    const decryptOptions = generateOptions(
                      password,
                      commentsEncryptionData,
                    );
                    origin = decrypt(origin, decryptOptions).toString(
                      CryptoJS.enc.Utf8,
                    );
                  }
                  return domParser.parseFromString(origin, "application/xml");
                } else {
                  return null;
                }
              }),
          );
        } else {
          jobs.push(Promise.resolve(null));
        }
        // ...
        return Promise.all(jobs);
      })
      .then(([manifest, contentDOM, stylesDOM, markersDOM, commentsDOM]) => {
        const sheetsArray: any[] = [];
        const newManifest = {
          [M_FILE_ENTRIES]: {
            [ZEN_PATH_CONTENT]: {},
            [ZEN_PATH_METADATA]: {},
          },
          [M_RESOURCES]: {},
        };
        if (
          manifest[M_FILE_ENTRIES][XMIND_PATH_CONTENT] &&
          manifest[M_FILE_ENTRIES][XMIND_PATH_CONTENT][M_ENCRYPTION_DATA]
        ) {
          newManifest[M_FILE_ENTRIES][ZEN_PATH_CONTENT] = {
            [M_ENCRYPTION_DATA]:
              manifest[M_FILE_ENTRIES][XMIND_PATH_CONTENT][M_ENCRYPTION_DATA],
          };
        }
        if (
          manifest[M_FILE_ENTRIES][XMIND_PATH_META] &&
          manifest[M_FILE_ENTRIES][XMIND_PATH_META][M_ENCRYPTION_DATA]
        ) {
          newManifest[M_FILE_ENTRIES][ZEN_PATH_METADATA] = {
            [M_ENCRYPTION_DATA]:
              manifest[M_FILE_ENTRIES][XMIND_PATH_META][M_ENCRYPTION_DATA],
          };
        }
        if (!contentDOM) {
          return reject("password wrong.");
        }
        const parseSheetPromises: any[] = [];
        (
          Array.from(contentDOM.getElementsByTagName("sheet")) as Element[]
        ).forEach((sheetDOM) => {
          parseSheetPromises.push(
            parseSheetDOM(sheetDOM, {
              stylesDOM,
              markersDOM,
              commentsDOM,
              sheetsArray,
              manifest,
              newManifest,
              zip,
              password,
            }),
          );
        });
        //Thumbnail
        const thumbnailZipObject = xmind_file(
          zip,
          XMIND_PATH_THUMBNAIL,
          XMIND_PATH_THUMBNAIL_S,
        );
        const thumbnailFileEntry =
          manifest[M_FILE_ENTRIES][XMIND_PATH_THUMBNAIL];
        if (thumbnailFileEntry && thumbnailZipObject) {
          const thumbnailEncryptionData = thumbnailFileEntry[M_ENCRYPTION_DATA];
          parseSheetPromises.push(
            thumbnailZipObject
              .async(thumbnailEncryptionData ? "base64" : "uint8array")
              .then((thumbnailData) => {
                try {
                  if (thumbnailEncryptionData) {
                    const decryptOptions = generateOptions(
                      password,
                      thumbnailEncryptionData,
                    );
                    thumbnailData = wordToUint8Array(
                      decrypt(thumbnailData, decryptOptions),
                    );
                  }
                  const newThumbnailPath = XMIND_PATH_THUMBNAIL;
                  newManifest[M_FILE_ENTRIES][newThumbnailPath] = {
                    [M_ENCRYPTION_DATA]: thumbnailEncryptionData,
                  };
                  newManifest[M_RESOURCES][newThumbnailPath] = thumbnailData;
                } catch {
                  //
                }
              }),
          );
        }
        Promise.all(parseSheetPromises).then(() => {
          if (!sheetsArray || !sheetsArray.length) {
            return reject("password wrong.");
          }
          // last time to fix resource
          fixXapResourceUrls(
            sheetsArray,
            Object.keys(newManifest[M_RESOURCES]).map((fp) => "xap:" + fp),
          );
          resolve({
            manifest: newManifest,
            sheets: sheetsArray,
            isOldVersion: true,
          });
        });
      })
      .catch((e) => {
        reject(e);
      });
  });
}
export function fromXMind(zip, options = {}) {
  if (!zip || !zip.files) {
    return Promise.reject("not a valid XMind file");
  }
  if (hasFile(zip, ZEN_PATH_CONTENT, ZEN_PATH_CONTENT_S)) {
    return fromJSON(zip, options);
  } else if (hasFile(zip, XMIND_PATH_CONTENT, XMIND_PATH_CONTENT_S)) {
    return fromXML(zip, options);
  }
  return Promise.reject("not a valid XMind file");
}
export function isFileEncrypted(zip) {
  return new Promise((resolve, reject) => {
    if (hasFile(zip, ZEN_PATH_CONTENT, ZEN_PATH_CONTENT_S)) {
      const manifestFile = xmind_file(
        zip,
        ZEN_PATH_MANIFEST,
        ZEN_PATH_MANIFEST_S,
      );
      if (!manifestFile) {
        return reject("not a valid XMind File");
      }
      manifestFile.async("string").then((jsonstring) => {
        const manifestJSON = JSON.parse(jsonstring);
        const passwordHint = manifestJSON[M_PASSWORD_HINT];
        for (const fileEntryKey in manifestJSON[M_FILE_ENTRIES]) {
          const fileEntry = manifestJSON[M_FILE_ENTRIES][fileEntryKey];
          if (fileEntry[M_ENCRYPTION_DATA]) {
            return resolve({
              passwordHint,
              encrypted: true,
            });
          }
        }
        return resolve(false);
      });
    } else if (hasFile(zip, XMIND_PATH_CONTENT, XMIND_PATH_CONTENT_S)) {
      const manifestFile = xmind_file(
        zip,
        XMIND_PATH_MANIFEST,
        XMIND_PATH_MANIFEST_S,
      );
      if (!manifestFile) {
        return reject("not a valid XMind File");
      }
      manifestFile.async("string").then((xmlstring) => {
        const manifestXML = new DOMParser().parseFromString(
          xmlstring,
          "application/xml",
        );
        if (
          !manifestXML ||
          !manifestXML.getElementsByTagName("manifest") ||
          !manifestXML.getElementsByTagName("manifest").length
        ) {
          resolve(false);
        }
        const passwordHint = manifestXML
          .getElementsByTagName("manifest")[0]
          .getAttribute(M_PASSWORD_HINT);
        Array.from(manifestXML.getElementsByTagName(M_FIle_ENTRY)).forEach(
          (fileEntry: any) => {
            if (
              fileEntry.getElementsByTagName(M_ENCRYPTION_DATA) &&
              fileEntry.getElementsByTagName(M_ENCRYPTION_DATA).length
            ) {
              return resolve({
                passwordHint,
                encrypted: true,
              });
            }
          },
        );
        return resolve(false);
      });
    } else {
      reject("not a valid XMind File");
    }
  });
}

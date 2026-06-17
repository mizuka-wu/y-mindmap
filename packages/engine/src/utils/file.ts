import * as constants from '../common/constants/index';
import * as lib from '../lib/index';

import { getInjectModule } from './injectmodule';

class FileRestorerError extends Error {
  constructor(msg) {
    super(`[File restorer error]${msg ? `: ${msg}` : ''}`);
  }
}
function getChildrenOfTopic(topic, types?) {
  return (types ?? constants.ALL_TOPIC_TYPES).reduce((children, type) => {
    let _b;
    return [
      ...children,
      ...(((_b = topic?.children?.[type]) === null || _b === undefined
        ? undefined
        : _b.filter(child => file_isObject(child))) ?? []),
    ];
  }, []);
}
function getAttachedChildrenOfTopic(topic) {
  return getChildrenOfTopic(topic, [constants.TOPIC_TYPE.ATTACHED]);
}
/**
 * Traverse process will stop if callback function returns false
 */
function traverseTopic(topic, relativeSheet, cb) {
  if (file_isObject(topic) && cb(topic, relativeSheet)) {
    getChildrenOfTopic(topic).forEach(childBranch => {
      traverseTopic(childBranch, relativeSheet, cb);
    });
  }
}
function file_isObject(target) {
  return typeof target === 'object' && target !== null && !Array.isArray(target);
}
function file_isString(target) {
  return typeof target === 'string';
}
/**
 * NOTE: The path parameter currently support string like '.foo.bar.baz',
 * other forms ([0], or ['key-with-dash']) are not supported yet.
 */
function isObjectPropertyExist(source, path) {
  const keyArray = path.split('.');
  keyArray.shift();
  let obj = source;
  for (const key of keyArray) {
    try {
      if (obj[key]) {
        obj = obj[key];
      } else {
        return false;
      }
    } catch {
      return false;
    }
  }
  return true;
}
/////////////////////////////
////
////  Iterative functions
////
function forEachSheetOfSheets(sheets, cb) {
  let _a;
  if ((_a = sheets?.forEach) === null || _a === undefined) {
    // do nothing
  } else {
    _a.call(sheets, cb);
  }
}
function forEachTopicOfSheets(sheets, cb) {
  let _a;
  if ((_a = sheets?.forEach) === null || _a === undefined) {
    // do nothing
  } else {
    _a.call(sheets, sheet => {
      if (!sheet.rootTopic) {
        throw new FileRestorerError('rootTopic not detected');
      }
      if (file_isObject(sheet.rootTopic)) {
        traverseTopic(sheet.rootTopic, sheet, cb);
      }
    });
  }
}
function forEachTopicStylePropertiesOfSheets(sheets, cb) {
  forEachTopicOfSheets(sheets, topic => {
    // skip if not have style.properties object
    if (!isObjectPropertyExist(topic, '.style.properties') || !file_isObject(topic.style.properties)) {
      return true;
    }
    cb(topic.style.properties);
    return true;
  });
}
function forEachThemeCategoriesOfSheets(sheets, cb) {
  forEachSheetOfSheets(sheets, sheet => {
    if (file_isObject(sheet.theme)) {
      Object.entries(sheet.theme).forEach(([className, styleData]) => {
        if (file_isObject((styleData as any).properties)) {
          cb(className, (styleData as any).properties, sheet);
        }
      });
    }
  });
}
function forEachRelationshipOfSheets(sheets, cb) {
  forEachSheetOfSheets(sheets, sheet => {
    let _a;
    let _b;
    if (
      (_b = (_a = sheet.relationships) === null || _a === undefined ? undefined : _a.forEach) === null ||
      _b === undefined
    ) {
      // do nothing
    } else {
      _b.call(_a, relationship => cb(relationship, sheet));
    }
  });
}
/////////////////////////////
////
////  Processor functions
////
function restoreMatrixExtensionData(sheets) {
  const MATRIX_STRUCTURES = [constants.STRUCTURECLASS.SPREADSHEET, constants.STRUCTURECLASS.COLUMNSPREADSHEET];
  const matrixExtensionProvider = constants.EXTENSION_PROVIDER.SPREAD_SHEET;
  forEachTopicOfSheets(sheets, topic => {
    let _a;
    let _b;
    if (file_isString(topic.structureClass) && MATRIX_STRUCTURES.includes(topic.structureClass)) {
      const labelsSet = getAttachedChildrenOfTopic(topic) // head topics
        .reduce((list, headBranch) => [...list, ...getAttachedChildrenOfTopic(headBranch)], []) // cell topics
        .reduce(
          // labels set
          (labelSet, cellBranch) => (cellBranch.labels ? labelSet.add(cellBranch.labels.join(',')) : labelSet),
          new Set()
        );
      const extensions = topic.extensions;
      const matrixExtension =
        (_a = extensions?.find) === null || _a === undefined
          ? undefined
          : _a.call(extensions, ext => ext.provider === matrixExtensionProvider);
      const extensionContentStrList = (
        ((_b = matrixExtension?.content) === null || _b === undefined ? undefined : _b[0].content) ?? []
      )
        .map(item => item.content)
        .filter(str => typeof str !== 'undefined');
      const hasSameCount = extensionContentStrList.length === labelsSet.size;
      const hasSameContent = Array.from(labelsSet).reduce((_, label) => extensionContentStrList.includes(label), true);
      if (!extensions || !matrixExtension || !hasSameCount || !hasSameContent) {
        if (!extensions) {
          topic.extensions = [];
        }
        const newExtensions = topic.extensions;
        const idx = newExtensions.findIndex(ext => ext.provider === matrixExtensionProvider);
        const injectPos = idx > -1 ? idx : newExtensions.length;
        newExtensions[injectPos] = {
          provider: matrixExtensionProvider,
          content: [
            {
              name: 'columns',
              content: Array.from(labelsSet).map(label => ({
                name: 'column',
                content: label,
              })),
            },
          ],
        };
      }
      return false;
    }
    return true;
  });
}
function restoreStyleAndThemeData(sheets) {
  const normalColorString = colorString => {
    if (colorString === 'none') {
      return 'none';
    }
    const color = lib.tinyColor(colorString);
    if (!color.isValid()) {
      return null;
    }
    const hexColorString = color.getAlpha() === 1 ? color.toHexString() : color.toHex8String();
    return hexColorString.toUpperCase();
  };
  const fixColor = properties => {
    for (const property in properties) {
      if (!constants.ALL_CSS_COLOR_STYLE_KEYS.includes(property)) {
        continue;
      }
      const colorValue = normalColorString(properties[property]);
      if (colorValue === null) {
        delete properties[property];
        continue;
      }
      properties[property] = colorValue;
    }
  };
  // For deprecated arrowedCurve line class
  forEachTopicStylePropertiesOfSheets(sheets, properties => {
    fixColor(properties);
    if (properties['line-class'] === constants.BRANCHCONNECTION.ARROWEDCURVE) {
      properties['line-class'] = constants.BRANCHCONNECTION.CURVE;
      properties['arrow-end-class'] = constants.ARROW_CLASS.TRIANGLE;
    }
  });
  forEachThemeCategoriesOfSheets(sheets, (_, properties) => {
    fixColor(properties);
    if (properties['line-class'] === constants.BRANCHCONNECTION.ARROWEDCURVE) {
      properties['line-class'] = constants.BRANCHCONNECTION.CURVE;
      properties['arrow-end-class'] = constants.ARROW_CLASS.TRIANGLE;
    }
  });
  forEachThemeCategoriesOfSheets(sheets, (_, properties, sheet) => {
    let _a;
    const version = (_a = sheet.coreVersion) === null || _a === undefined ? undefined : _a.split('-')[0];
    if (!version) {
      return;
    }
    const [major, minor] = version.split('.');
    if (major !== '1' || Number(minor) > 732) {
      return;
    }
    delete properties['spacing-major'];
    delete properties['spacing-minor'];
    delete properties['fo:margin-left'];
    delete properties['fo:margin-right'];
    delete properties['fo:margin-top'];
    delete properties['fo:margin-bottom'];
  });
}
function restoreUserMarkerData(sheets) {
  const { markerModule } = getInjectModule(constants.MODULE_NAME.SNOWBIRD);
  const isInvalidMarkerData = (markerId, markerData) => {
    // for the data which is not included in internal marker and not have "resource" property, treat it as invalid marker data
    return !markerModule.getMarkerInfoById(markerId) && !markerData.resource;
  };
  // collect invalid marker data
  const invalidMarkersIdSetBySheetId = sheets.reduce((map, sheet) => {
    if (isObjectPropertyExist(sheet, '.legend.markers')) {
      const markersMap = sheet.legend.markers;
      return Object.assign(Object.assign({}, map), {
        [sheet.id]: Object.entries(markersMap)
          .filter(([markerId, markerData]) => isInvalidMarkerData(markerId, markerData))
          .reduce((set, [markerId, _]) => set.add(markerId), new Set()),
      });
    } else {
      return map;
    }
  }, {});
  // fix marker data of sheet legend and legend marker groups
  const removeInvalidMarkerDataOfSheetLegend = sheet => {
    const invalidMarkersIdSet = invalidMarkersIdSetBySheetId[sheet.id];
    if (invalidMarkersIdSet?.size > 0) {
      sheet.legend.markers = Object.entries(sheet.legend.markers)
        .filter(([markerId, _]) => !invalidMarkersIdSet.has(markerId))
        .reduce(
          (res, [k, v]) =>
            Object.assign(Object.assign({}, res), {
              [k]: v,
            }),
          {}
        );
      if (sheet.legend.groups) {
        sheet.legend.groups = Object.entries(sheet.legend.groups).reduce((groups, [groupId, group]) => {
          (group as any).markers = (group as any).markers.filter(markerId => !invalidMarkersIdSet.has(markerId));
          return Object.assign(Object.assign({}, groups), {
            [groupId]: group,
          });
        }, {});
      }
    }
  };
  forEachSheetOfSheets(sheets, removeInvalidMarkerDataOfSheetLegend);
  // fix marker data of topics
  const removeInvalidMarkerDataOfTopic = (topic, sheet) => {
    if (!invalidMarkersIdSetBySheetId[sheet.id]) {
      return false;
    }
    if (topic.markers && Array.isArray(topic.markers)) {
      const invalidMarkersIdSet = invalidMarkersIdSetBySheetId[sheet.id];
      topic.markers = topic.markers.filter(marker => !invalidMarkersIdSet.has(marker.markerId));
    }
    return true;
  };
  forEachTopicOfSheets(sheets, removeInvalidMarkerDataOfTopic);
}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function restoreRelationshipPolarData(sheets) {
  const isPolarPoint = point => file_isObject(point) && 'angle' in point && 'amount' in point;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const polarPointToPlainPoint = _ => ({
    x: 120,
    y: 0,
  });
  forEachRelationshipOfSheets(sheets, relationship => {
    const { controlPoints } = relationship;
    if (controlPoints) {
      if (isPolarPoint(controlPoints['0'])) {
        controlPoints['0'] = polarPointToPlainPoint(controlPoints['0']);
      }
      if (isPolarPoint(controlPoints['1'])) {
        controlPoints['1'] = polarPointToPlainPoint(controlPoints['1']);
      }
    }
  });
}
export function restoreFile(sheets: any) {
  if (!Array.isArray(sheets)) {
    throw new Error('[File restorer] parameter should be an array of sheet model object');
  }
  let clonedSheets;
  try {
    clonedSheets = JSON.parse(JSON.stringify(sheets));
  } catch {
    throw new FileRestorerError('invalid input: not a valid JSON');
  }
  try {
    // start process
    restoreMatrixExtensionData(clonedSheets);
    restoreStyleAndThemeData(clonedSheets);
    restoreUserMarkerData(clonedSheets);
    // restoreRelationshipPolarData(clonedSheets)
    return clonedSheets;
  } catch {
    throw new FileRestorerError('File Restore error');
  }
}

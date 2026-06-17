import { markers } from "./markers";
import { GROUP_ORDER } from "./constant";
import { getDefaultOptions } from "../common/utils";
import { groupName, markerName } from "./i18n";

const allMarkerInfoList: any[] = GROUP_ORDER.map(
  (groupId) => markers[groupId].markers,
).reduce((pre, cur) => {
  return pre.concat(cur);
}, []);
let userMarkerMap = {};
export function getMarkerInfoById(markerId, options?: any) {
  const { lang } = getDefaultOptions(options);
  const markerInfo = allMarkerInfoList.find(
    (markerInfo) => markerInfo.markerId === markerId,
  );
  if (!markerInfo) {
    return null;
  }
  return Object.assign(Object.assign({}, markerInfo), {
    // @ts-ignore
    name: markerInfo.isUserMarker
      ? (markerInfo.name ?? "")
      : markerName[markerId][lang],
  });
}
export function getGroupInfoById(groupId, options) {
  options = getDefaultOptions(options);
  const groupInfo = Object.assign(Object.assign({}, userMarkerMap), markers)[
    groupId
  ];
  if (!groupInfo) {
    return null;
  }
  return Object.assign(Object.assign({}, groupInfo), {
    name: groupInfo.isUserMarker
      ? (groupInfo.name ?? "")
      : groupName[groupId][options.lang],
    markers: groupInfo.markers.map((markerInfo) =>
      getMarkerInfoById(markerInfo.markerId, options),
    ),
  });
}
export function getGroupInfoList(options) {
  options = getDefaultOptions(options);
  return GROUP_ORDER.map((groupId) => markers[groupId])
    .filter((groupInfo) => !groupInfo.hidden)
    .map((groupInfo) => {
      return Object.assign(Object.assign({}, groupInfo), {
        // @ts-ignore
        name: groupName[groupInfo.id][options.lang],
        markers: groupInfo.markers
          .filter((markerInfo) => !markerInfo.hidden)
          .map((markerInfo) => getMarkerInfoById(markerInfo.markerId, options)),
      });
    });
}
export function addUserMarkerInfoList(markers, groups) {
  const findGroupId = (markerId) => {
    for (const groupId in groups) {
      const { markers } = groups[groupId];
      if (Array.isArray(markers) && markers.includes(markerId)) {
        return groupId;
      }
    }
    return undefined;
  };
  for (const markerId in markers) {
    const { name, resource } = markers[markerId];
    allMarkerInfoList.push({
      markerId,
      groupId: groups ? findGroupId(markerId) : undefined,
      name,
      resource,
      hidden: false,
      isUserMarker: true,
    });
  }
  if (groups) {
    for (const groupId in groups) {
      const { name, markers } = groups[groupId];
      userMarkerMap = Object.assign(Object.assign({}, userMarkerMap), {
        [groupId]: {
          id: groupId,
          name,
          markers: markers
            .map((markerId) => getMarkerInfoById(markerId))
            .filter(Boolean),
          hidden: false,
          isUserMarker: true,
        },
      });
    }
  }
}
export function isSiblingMarker(markerId1, markerId2) {
  if (markerId1 === markerId2) {
    return false;
  }
  const markerInfo1 = getMarkerInfoById(markerId1);
  const markerInfo2 = getMarkerInfoById(markerId2);
  if (!markerInfo1 || !markerInfo2) {
    return false;
  }
  return markerInfo1.groupId === markerInfo2.groupId;
}
export function indexOf(markerId) {
  return allMarkerInfoList.findIndex(
    (markerInfo) => markerInfo.markerId === markerId,
  );
}

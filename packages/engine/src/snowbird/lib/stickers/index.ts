import { getDefaultOptions } from "../common/utils";
import { groupName } from "./i18n";
import { stickers } from "./stickers";

export function getGroupInfoList(options) {
  options = getDefaultOptions(options);
  return stickers.map((group) => {
    return {
      name: groupName[group.id][options.lang],
      items: group.items.map((item) => {
        return {
          name: item.name,
          resource: `stickers/${item.name}.svg`,
        };
      }),
    };
  });
}

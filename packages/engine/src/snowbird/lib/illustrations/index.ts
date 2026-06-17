import { getDefaultOptions } from "../common/utils";
import { groupName } from "./i18n";

import { illustrations } from "./illustrations";

export function getGroupInfoList(options) {
  const { lang } = getDefaultOptions(options);
  return illustrations.map((group) => ({
    name: groupName[group.id][lang],
    items: group.items.map((item) => ({
      name: item.name,
      resource: `illustrations/${item.name}.svg`,
    })),
  }));
}

import * as constants from '../common/constants/index';

import config from '../common/config';
import * as snowball from '../snowball/lib/index';
import * as snowbird from '../snowbird/lib/index';

const injectModuleMap = {
  [constants.MODULE_NAME.SNOWBALL]: snowball,
  [constants.MODULE_NAME.SNOWBIRD]: snowbird,
} as const;
export function getInjectModule<
  T = typeof constants.MODULE_NAME.SNOWBIRD | typeof constants.MODULE_NAME.SNOWBALL,
  R = T extends typeof constants.MODULE_NAME.SNOWBIRD ? typeof snowbird : typeof snowball,
>(moduleName: T): R {
  return (
    config.get(constants.CONFIG.INJECT_MODULE)[moduleName] ||
    injectModuleMap[moduleName as keyof typeof injectModuleMap]
  );
}

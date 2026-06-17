import { LANGS } from "./constant";

export function getDefaultOptions(options: any = {}) {
  return {
    lang: options.lang || LANGS.EN_US,
  };
}

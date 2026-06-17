import { CONFIG, LANGS, INFO_ITEM_STYLE_TYPE } from "./constants/index";
import * as utils from "./utils/index";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noOp = (...args) => {
  // No operation here.
};
const defaultConfigData = {
  [CONFIG.XAP_LOADER]: () => {
    return new Promise((resolve) => {
      resolve("");
    });
  },
  [CONFIG.URL_PREFIX]: "",
  [CONFIG.FONT_URL_PREFIX]: "",
  // [CONFIG.FONT_FACE_GENERATOR]: fontFamily => {
  //   return new Promise((resolve) => {
  //     let fontFace = embeddedFonts[fontFamily]
  //     resolve(fontFace ? [fontFace] : [])
  //   })
  // },
  [CONFIG.LANGUAGE]: LANGS.EN_US,
  [CONFIG.MAX_SCALE]: Infinity,
  [CONFIG.MIN_SCALE]: 0,
  [CONFIG.NO_KEYBIND]: false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [CONFIG.KEYBINDING_SERVICE]: (keyCode, modifier) => null,
  [CONFIG.NO_EDIT_RECEIVER]: false,
  [CONFIG.READONLY]: false,
  [CONFIG.HIDE_COLLAPSE_BTN]: true,
  [CONFIG.NO_TOPIC_CUSTOM_WIDTH_BTN]: true,
  [CONFIG.INFO_ITEM_STYLE]: INFO_ITEM_STYLE_TYPE.FASHION,
  [CONFIG.CLIPBOARD_READER]: function () {
    return null;
  },
  // [CONFIG.DEFERED_EVENTS]: [
  //   EVENTS.UNDO_STATE_CHANGE,
  //   EVENTS.AFTER_ADD_TOPIC,
  //   EVENTS.AFTER_REMOVE_TOPIC,
  //   EVENTS.SELECTION_CHANGED,
  //   EVENTS.SCALE_CHANGED
  // ],
  [CONFIG.PADDING_FACTOR]: 1,
  // [CONFIG.DEFERED_TIME]: 250,
  [CONFIG.FAKE_IMAGE]: false,
  [CONFIG.LOGGER]: {
    info: noOp,
    warn: noOp,
    error: noOp,
    debug: noOp,

    // info: false ? undefined : noOp,
    // warn: false ? undefined : noOp,
    // error: false ? undefined : noOp,
    // debug: false ? undefined : noOp
  },
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [CONFIG.INPUT_HANDLER]: (e) => {
    return Promise.resolve("");
  },
  /// true: continue to do other things
  /// false: stop
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  [CONFIG.LIMITED_OPERATION_HANDLER]: (operation) => {
    return Promise.resolve(true); //SUPPORTED_LIMITED_OPERATIONS.includes(operation) ? Promise.resolve(false) : Promise.resolve(true)
  },
  [CONFIG.AUTO_ACTION_STATUS]: false,
  [CONFIG.DISABLE_PRESELECTION_BOX]: false,
  [CONFIG.INJECT_MODULE]: {},
};
export class Config {
  data: Record<string, any>;
  _parent: Config | null;
  constructor(configData = {}) {
    this.data = Object.assign({}, configData);
  }
  parent(parentConfigInstance?: Config) {
    if (parentConfigInstance instanceof Config) {
      this._parent = parentConfigInstance;
    }
    return this._parent || (this !== config ? config : null);
  }
  get(key: string) {
    let value = this.data[key];
    if (utils.isUndefined(value)) {
      const p = this.parent();
      value = p && p.get(key);
    }
    return value;
  }
  set(...args) {
    if (utils.isObject(args[0])) {
      const d = args[0];
      for (const attr in d) {
        this.set(attr, d[attr]);
      }
    } else if (args.length === 2) {
      const key = args[0];
      const value = args[1];
      this.data[key] = value;
    } else {
      this.get(CONFIG.LOGGER).error("Illegal arguments for Config: ", args);
    }
  }
}

export const config = new Config(defaultConfigData);

export default config;

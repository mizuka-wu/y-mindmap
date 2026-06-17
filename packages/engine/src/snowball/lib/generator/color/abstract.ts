import {
  PCCS_COLOR_MAP,
  COLOR_FIELDS,
  CLASS_TYPE,
  TOPIC_CLASS_TYPE_LIST,
  STYLE_KEYS,
} from "../../common/constant";

import {
  UUID,
  getColorIndex,
  getProperRatioColorFromBgColor,
} from "../../common/util";

export class AbstractColorThemeGenerator {
  currentPrimaryColor0: string;
  currentColorFields: any;
  colorListName: any;
  themeName: any;
  constructor(colorListName, themeName) {
    this.currentPrimaryColor0 = "";
    this.currentColorFields = {};
    this.colorListName = colorListName;
    this.themeName = themeName;
  }
  generateColorThemeList() {
    const colorList = PCCS_COLOR_MAP[this.colorListName].list;
    const colorThemeList = colorList.map((color) => {
      return this.generateColorTheme(color);
    });
    return colorThemeList;
  }
  generateColorTheme(primaryColor0) {
    this.currentPrimaryColor0 = primaryColor0;
    this.currentColorFields = this.getCurrentColorFields();
    return this.colorFieldsToThemeData();
  }
  getCurrentColorFields() {
    const [lightColor, darkColor] = this.generateLightAndDarkColor();
    const colorFields = {
      [COLOR_FIELDS.PRIMARY_COLOR_0]: this.currentPrimaryColor0,
      [COLOR_FIELDS.PRIMARY_COLOR_1]: this.generatePrimaryColor1(),
      [COLOR_FIELDS.PRIMARY_COLOR_2]: this.generatePrimaryColor2(),
      [COLOR_FIELDS.PRIMARY_COLOR_3]: this.generatePrimaryColor3(),
      [COLOR_FIELDS.PRIMARY_COLOR_4]: this.generatePrimaryColor4(),
      [COLOR_FIELDS.SECONDARY_COLOR_1]: this.generateSecondaryColor1(),
      [COLOR_FIELDS.SECONDARY_COLOR_2]: this.generateSecondaryColor2(),
      [COLOR_FIELDS.SECONDARY_COLOR_3]: this.generateSecondaryColor3(),
      [COLOR_FIELDS.LIGHT_COLOR]: lightColor,
      [COLOR_FIELDS.DARK_COLOR]: darkColor,
      [COLOR_FIELDS.QUICK_COLOR_1]: this.generateQuickColor1(),
      [COLOR_FIELDS.QUICK_COLOR_2]: this.generateQuickColor2(),
      [COLOR_FIELDS.TRANSPARENT]: "none",
      [COLOR_FIELDS.MULTI_LINE_COLORS]: this.generateMultiLineColor(),
      [COLOR_FIELDS.COLOR_LIST]: this.generateColorList(),
    };
    return colorFields;
  }
  colorFieldsToThemeData() {
    const colorTheme: any = {};
    const { id, tags, hidden } = this.getCurrentColorThemeIdAndTags();
    colorTheme.id = id;
    colorTheme.tags = tags;
    colorTheme.hidden = !!hidden;
    let colorList = this.getColorThemeColorList();
    colorTheme.colorFieldsMap = this.currentColorFields;
    colorTheme.theme = {
      id: colorTheme.id,
    };
    // map fragment
    colorTheme.theme[CLASS_TYPE.MAP] = this.getMapStyleDataFragment();
    TOPIC_CLASS_TYPE_LIST.forEach((classType) => {
      colorTheme.theme[classType] =
        this.getNormalComponentStyleDataFragment(classType);
    });
    // set central topic's line color
    colorTheme.theme[CLASS_TYPE.CENTRAL_TOPIC].properties[
      STYLE_KEYS.LINE_COLOR
    ] =
      this.currentColorFields[
        this.getComponentsColorFieldsDefine()[CLASS_TYPE.CENTRAL_TOPIC][
          STYLE_KEYS.LINE_COLOR
        ]
      ];
    // boundary
    colorTheme.theme[CLASS_TYPE.BOUNDARY] =
      this.getNormalComponentStyleDataFragment(CLASS_TYPE.BOUNDARY);
    // summary
    colorTheme.theme[CLASS_TYPE.SUMMARY] =
      this.getNormalComponentStyleDataFragment(CLASS_TYPE.SUMMARY);
    // relationship
    colorTheme.theme[CLASS_TYPE.RELATIONSHIP] =
      this.getNormalComponentStyleDataFragment(CLASS_TYPE.RELATIONSHIP);
    // fix color list
    if (colorList.length < 3 || colorList.length > 4) {
      colorList = [
        CLASS_TYPE.CENTRAL_TOPIC,
        CLASS_TYPE.MAIN_TOPIC,
        CLASS_TYPE.BOUNDARY,
      ].map((classType) => {
        return colorTheme.theme[classType].properties[STYLE_KEYS.FILL_COLOR];
      });
    }
    return colorTheme;
  }
  getComponentsColorFieldsDefine() {
    throw new Error("Method not implemented.");
  }
  getMapStyleDataFragment() {
    const mapColorFieldsDefine =
      this.getComponentsColorFieldsDefine()[CLASS_TYPE.MAP];
    return {
      id: UUID(),
      properties: {
        [STYLE_KEYS.FILL_COLOR]:
          this.currentColorFields[mapColorFieldsDefine[STYLE_KEYS.FILL_COLOR]],
        [STYLE_KEYS.MULTI_LINE_COLORS]:
          this.currentColorFields[COLOR_FIELDS.MULTI_LINE_COLORS],
        [STYLE_KEYS.COLOR_LIST]:
          this.currentColorFields[COLOR_FIELDS.COLOR_LIST],
      },
    };
  }
  getNormalComponentStyleDataFragment(classType) {
    const colorFieldsDefine = this.getComponentsColorFieldsDefine()[classType];
    const styleData = {
      id: UUID(),
      properties: {},
    };
    Object.keys(colorFieldsDefine).forEach((styleKey) => {
      styleData.properties[styleKey] =
        this.currentColorFields[colorFieldsDefine[styleKey]];
    });
    return styleData;
  }
  getColorThemeColorList() {
    const fillColorFieldsMap = this.getComponentsColorFieldsDefine();
    return Array.from(
      new Set([
        fillColorFieldsMap[CLASS_TYPE.CENTRAL_TOPIC][STYLE_KEYS.FILL_COLOR],
        fillColorFieldsMap[CLASS_TYPE.MAIN_TOPIC][STYLE_KEYS.FILL_COLOR],
        fillColorFieldsMap[CLASS_TYPE.BOUNDARY][STYLE_KEYS.FILL_COLOR],
        fillColorFieldsMap[CLASS_TYPE.MINOR_TOPIC][STYLE_KEYS.FILL_COLOR],
      ]),
    ).map((filedName) => this.currentColorFields[filedName]);
  }
  getCurrentColorThemeIdAndTags() {
    const index = PCCS_COLOR_MAP[this.colorListName].list.indexOf(
      this.currentPrimaryColor0,
    );
    // @ts-ignore
    return COLOR_THEME_GROUP[this.themeName][index];
  }
  generateLightAndDarkColor() {
    return ["", ""];
  }
  generatePrimaryColor1() {
    return "";
  }
  generatePrimaryColor2() {
    return "";
  }
  generatePrimaryColor3() {
    return "";
  }
  generatePrimaryColor4() {
    return "";
  }
  generateQuickColor1() {
    return "";
  }
  generateQuickColor2() {
    return "";
  }
  generateSecondaryColor1() {
    return "";
  }
  generateSecondaryColor2() {
    return "";
  }
  generateSecondaryColor3() {
    return "";
  }
  generateMultiLineColor() {
    return "";
  }
  getPrimaryColor0Index() {
    return getColorIndex(this.colorListName, this.currentPrimaryColor0);
  }
  getTextColorFromFillColor(fillColor) {
    return getProperRatioColorFromBgColor(
      fillColor,
      this.currentColorFields[COLOR_FIELDS.LIGHT_COLOR],
      this.currentColorFields[COLOR_FIELDS.DARK_COLOR],
    );
  }
  generateColorList() {
    return this.generateLightAndDarkColor().join(" ");
  }
}

import { AbstractColorThemeGenerator } from "./abstract";

import * as constant from "../../common/constant";

import {
  calculateRatio,
  mapColorListToPrimaryColorInfoList,
  getMultiLineColorInfoList,
  calcPrimaryColorType,
  calcSimilarColor,
  getRainbowPrimaryColorInfo,
  getMaxRatioColorFromList,
  isColorful,
  hexStringToHSLObject,
  hslObjectToHexString,
  fixLight,
  brighten,
  getPrimaryAbleColorList,
  calcComplementaryColor,
} from "../../common/util";

function removeItemFromList(fullList, toRemoveItems) {
  const fullListCopy = [...fullList];
  if (!toRemoveItems.length) {
    return fullListCopy;
  }
  const toRemoveItemsCopy = [...toRemoveItems];
  const toRemoveItem = toRemoveItemsCopy.shift();
  fullListCopy.splice(fullListCopy.indexOf(toRemoveItem), 1);
  return removeItemFromList(fullListCopy, toRemoveItemsCopy);
}
function getColorRatioList(baseColor, colorList) {
  return colorList.map((color) => calculateRatio(baseColor, color));
}
function filterColorFromListByRatio(baseColor, colorList, minRatio = 3) {
  const ratioList = getColorRatioList(baseColor, colorList);
  return colorList.filter((color, index) => ratioList[index] >= minRatio);
}
export class SmartColorThemeGenerator {
  colorList: any[];
  currentPrimaryColorType: string;
  themeName: any;
  constructor(colorList, smartColorThemeName) {
    this.colorList = [];
    this.currentPrimaryColorType = constant.PRIMARY_COLOR_TYPE.TYPE_A;
    this.colorList = [...colorList];
    this.themeName = smartColorThemeName;
  }
  generateColorThemeList() {
    if (this.themeName === constant.SMART_COLOR_THEME_NAME.Rainbow) {
      return this.generateFullRainbowColorThemeList().map((colorTheme) => {
        colorTheme.themeName = this.themeName;
        return colorTheme;
      });
    } else {
      return [
        ...this.generateNormalColorThemeList(),
        ...this.generateMultiLineColorThemeList(),
      ].map((colorTheme) => {
        colorTheme.themeName = this.themeName;
        return colorTheme;
      });
    }
  }
  generateNormalColorThemeList() {
    return mapColorListToPrimaryColorInfoList(
      this.colorList,
      this.themeName,
    ).map((primaryColorInfo) => {
      const generator = new (this.getTargetTypeGenerator(
        primaryColorInfo.type,
      ))(this.colorList, primaryColorInfo, this.themeName);
      const themeData = generator.generateSmartColorTheme();
      themeData.id = primaryColorInfo.id;
      themeData.theme.id = primaryColorInfo.id;
      themeData.hidden = false;
      return themeData;
    });
  }
  generateMultiLineColorThemeList() {
    return getMultiLineColorInfoList(this.colorList, this.themeName)
      .map((info) => {
        const { primaryColor0, multiLineColorString } = info;
        const primaryColorType = calcPrimaryColorType(primaryColor0);
        if (!primaryColorType) {
          return null;
        }
        const generator = this.overrideMultiLineColorGenerator(
          new (this.getTargetTypeGenerator(primaryColorType))(
            this.colorList,
            primaryColor0,
            this.themeName,
          ),
          multiLineColorString,
        );
        const quickColor1 = generator.generateQuickColor1();
        generator.generateQuickColor1 = () => {
          return calcSimilarColor(quickColor1, 60);
        };
        const quickColor2 = generator.generateQuickColor2();
        generator.generateQuickColor2 = () => {
          return calcSimilarColor(quickColor2, 60);
        };
        const themeData = generator.generateSmartColorTheme();
        const id = info.id;
        themeData.id = id;
        themeData.theme.id = id;
        themeData.hidden = false;
        return themeData;
      })
      .filter((theme) => theme);
  }
  generateFullRainbowColorThemeList() {
    return this.colorList.map((primaryColor1) => {
      const primaryColorInfo = getRainbowPrimaryColorInfo(primaryColor1);
      const generator = this.overrideMultiLineColorGenerator(
        // @ts-ignore
        new smartcolor_FullRainbowSmartColorTheme(
          this.colorList,
          primaryColorInfo,
          this.themeName,
        ),
        constant.RAINBOW_MULTI_COLOR_LIST[
          this.colorList.indexOf(primaryColor1)
        ].join(" ") || "",
      );
      // @ts-ignore
      const colorFieldsDefine = generator.getComponentsColorFieldsDefine();
      // @ts-ignore
      generator.getComponentsColorFieldsDefine = () => {
        [
          constant.CLASS_TYPE.SUMMARY_TOPIC,
          constant.CLASS_TYPE.CALLOUT_TOPIC,
        ].forEach((classType) => {
          colorFieldsDefine[classType] = {
            [constant.STYLE_KEYS.FILL_COLOR]:
              constant.COLOR_FIELDS.PRIMARY_COLOR_4,
            [constant.STYLE_KEYS.BORDER_LINE_COLOR]:
              constant.COLOR_FIELDS.PRIMARY_COLOR_4,
          };
        });
        return colorFieldsDefine;
      };
      const themeData = generator.generateSmartColorTheme();
      themeData.id = primaryColorInfo.id;
      themeData.theme.id = primaryColorInfo.id;
      themeData.hidden = false;
      return themeData;
    });
  }
  overrideMultiLineColorGenerator(generator, multiLineColorString) {
    const centralTopicFillColor = generator.generatePrimaryColor1();
    generator.generateMultiLineColor = () => {
      return multiLineColorString
        .split(" ")
        .filter((c) => c !== centralTopicFillColor)
        .join(" ");
    };
    // @ts-ignore
    const colorFieldsDefine = generator.getComponentsColorFieldsDefine();
    // @ts-ignore
    generator.getComponentsColorFieldsDefine = () => {
      [constant.CLASS_TYPE.MAIN_TOPIC, constant.CLASS_TYPE.SUB_TOPIC].forEach(
        (classType) => {
          delete colorFieldsDefine[classType][constant.STYLE_KEYS.FILL_COLOR];
        },
      );
      return colorFieldsDefine;
    };
    return generator;
  }
  getTargetTypeGenerator(primaryColorType) {
    const generatorMap = {
      [constant.PRIMARY_COLOR_TYPE.TYPE_A]: smartcolor_SmartColorThemeTypeA,
      [constant.PRIMARY_COLOR_TYPE.TYPE_B]: smartcolor_SmartColorThemeTypeB,
      [constant.PRIMARY_COLOR_TYPE.TYPE_C]: smartcolor_SmartColorThemeTypeC,
    };
    // @ts-ignore
    return generatorMap[primaryColorType];
  }
}
class smartcolor_AbstractSmartColorThemeGenerator extends AbstractColorThemeGenerator {
  colorList: any[];
  currentPrimaryColorType: string;
  currentPrimaryColor1: any;
  constructor(colorList, primaryColorInfo, smartColorThemeName) {
    super("", smartColorThemeName);
    this.colorList = [];
    this.currentPrimaryColorType = constant.PRIMARY_COLOR_TYPE.TYPE_A;
    if (typeof primaryColorInfo === "string") {
      this.currentPrimaryColor0 = primaryColorInfo;
    } else {
      this.currentPrimaryColor0 = primaryColorInfo.primaryColor0;
      this.currentPrimaryColor1 = primaryColorInfo.primaryColor1;
    }
    this.colorList = [...colorList];
  }
  generateSmartColorTheme() {
    this.currentColorFields = this.getCurrentColorFields();
    return this.colorFieldsToThemeData();
  }
  generatePrimaryColor1() {
    return (
      this.currentPrimaryColor1 ??
      getMaxRatioColorFromList(this.currentPrimaryColor0, this.colorList)
    );
  }
  generateQuickColor1() {
    return this.generatePrimaryColor1();
  }
  generateQuickColor2() {
    return getMaxRatioColorFromList(
      this.currentPrimaryColor0,
      removeItemFromList(this.colorList, [
        this.generatePrimaryColor1(),
        this.generatePrimaryColor2(),
      ]),
    );
  }
  generatePrimaryColor3() {
    const baseColor = !isColorful(this.currentPrimaryColor0)
      ? this.currentPrimaryColor0
      : this.generatePrimaryColor2();
    const { h, s, l } = hexStringToHSLObject(baseColor);
    if (
      !isColorful(this.currentPrimaryColor0) &&
      l > constant.SMART_COLOR_THEME_KEY_VALUE.colorfulMaxL
    ) {
      const newL = l - (100 - l) / 2;
      return hslObjectToHexString({
        h,
        s,
        l: fixLight(newL),
      });
    } else {
      return brighten(baseColor);
    }
  }
  generateSecondaryColor1() {
    const secondaryColor1 = getMaxRatioColorFromList(
      this.currentPrimaryColor0,
      removeItemFromList(this.colorList, [
        this.generatePrimaryColor1(),
        this.generatePrimaryColor2(),
        this.generatePrimaryColor3(),
      ]),
    );
    const ratio = calculateRatio(secondaryColor1, this.currentPrimaryColor0);
    if (ratio > constant.COLOR_MIN_RATIO) {
      return secondaryColor1;
    } else {
      return this.generatePrimaryColor2();
    }
  }
  generateColorList() {
    return this.colorList.join(" ");
  }
  getComponentsColorFieldsDefine() {
    return {
      [constant.CLASS_TYPE.CENTRAL_TOPIC]: {
        [constant.STYLE_KEYS.FILL_COLOR]: constant.COLOR_FIELDS.PRIMARY_COLOR_1,
        [constant.STYLE_KEYS.LINE_COLOR]: constant.COLOR_FIELDS.PRIMARY_COLOR_1,
      },
      [constant.CLASS_TYPE.MAIN_TOPIC]: {
        [constant.STYLE_KEYS.FILL_COLOR]: constant.COLOR_FIELDS.PRIMARY_COLOR_2,
      },
      [constant.CLASS_TYPE.SUB_TOPIC]: {
        [constant.STYLE_KEYS.FILL_COLOR]: constant.COLOR_FIELDS.PRIMARY_COLOR_3,
      },
      [constant.CLASS_TYPE.MINOR_TOPIC]: {
        [constant.STYLE_KEYS.FILL_COLOR]: constant.COLOR_FIELDS.QUICK_COLOR_1,
        [constant.STYLE_KEYS.BORDER_LINE_COLOR]:
          constant.COLOR_FIELDS.QUICK_COLOR_1,
      },
      [constant.CLASS_TYPE.IMPORTANT_TOPIC]: {
        [constant.STYLE_KEYS.FILL_COLOR]: constant.COLOR_FIELDS.QUICK_COLOR_2,
        [constant.STYLE_KEYS.BORDER_LINE_COLOR]:
          constant.COLOR_FIELDS.QUICK_COLOR_2,
      },
      [constant.CLASS_TYPE.FLOATING_TOPIC]: {
        [constant.STYLE_KEYS.FILL_COLOR]:
          constant.COLOR_FIELDS.SECONDARY_COLOR_1,
        [constant.STYLE_KEYS.BORDER_LINE_COLOR]:
          constant.COLOR_FIELDS.SECONDARY_COLOR_1,
      },
      [constant.CLASS_TYPE.CALLOUT_TOPIC]: {
        [constant.STYLE_KEYS.FILL_COLOR]: constant.COLOR_FIELDS.PRIMARY_COLOR_2,
        [constant.STYLE_KEYS.BORDER_LINE_COLOR]:
          constant.COLOR_FIELDS.PRIMARY_COLOR_2,
      },
      [constant.CLASS_TYPE.SUMMARY_TOPIC]: {
        [constant.STYLE_KEYS.FILL_COLOR]: constant.COLOR_FIELDS.PRIMARY_COLOR_2,
        [constant.STYLE_KEYS.BORDER_LINE_COLOR]:
          constant.COLOR_FIELDS.PRIMARY_COLOR_2,
      },
      [constant.CLASS_TYPE.SUMMARY]: {
        [constant.STYLE_KEYS.LINE_COLOR]: constant.COLOR_FIELDS.PRIMARY_COLOR_1,
      },
      [constant.CLASS_TYPE.BOUNDARY]: {
        [constant.STYLE_KEYS.FILL_COLOR]: constant.COLOR_FIELDS.PRIMARY_COLOR_1,
        [constant.STYLE_KEYS.LINE_COLOR]: constant.COLOR_FIELDS.PRIMARY_COLOR_1,
      },
      [constant.CLASS_TYPE.RELATIONSHIP]: {
        [constant.STYLE_KEYS.LINE_COLOR]: constant.COLOR_FIELDS.PRIMARY_COLOR_1,
      },
      [constant.CLASS_TYPE.MAP]: {
        [constant.STYLE_KEYS.FILL_COLOR]: constant.COLOR_FIELDS.PRIMARY_COLOR_0,
      },
    };
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getTextColorFromFillColor(fillColor) {
    return "";
  }
  getCurrentColorThemeIdAndTags() {
    return {
      id: "",
      tags: [this.themeName, this.currentPrimaryColorType],
      hidden: false,
    };
  }
}
class smartcolor_SmartColorThemeTypeA extends smartcolor_AbstractSmartColorThemeGenerator {
  constructor(colorList, primaryColorInfo, smartColorThemeName) {
    super(colorList, primaryColorInfo, smartColorThemeName);
    this.currentPrimaryColorType = constant.PRIMARY_COLOR_TYPE.TYPE_A;
  }
  generatePrimaryColor2() {
    let colorList = getPrimaryAbleColorList(
      this.colorList,
      this.currentPrimaryColor0,
    );
    if (colorList.length === 1) {
      colorList = this.colorList;
    }
    return getMaxRatioColorFromList(
      this.currentPrimaryColor0,
      removeItemFromList(colorList, [this.generatePrimaryColor1()]),
    );
  }
}
class smartcolor_SmartColorThemeTypeB extends smartcolor_AbstractSmartColorThemeGenerator {
  constructor(colorList, primaryColorInfo, smartColorThemeName) {
    super(colorList, primaryColorInfo, smartColorThemeName);
    this.currentPrimaryColorType = constant.PRIMARY_COLOR_TYPE.TYPE_B;
  }
  generatePrimaryColor2() {
    let fillColor;
    let filteredColorList = filterColorFromListByRatio(
      this.currentPrimaryColor0,
      this.colorList,
    );
    if (filteredColorList.length === 0) {
      filteredColorList = removeItemFromList(this.colorList, [
        this.currentPrimaryColor0,
        this.generatePrimaryColor1(),
      ]);
      fillColor = getMaxRatioColorFromList(
        this.currentPrimaryColor0,
        filteredColorList,
      );
    } else {
      fillColor = filteredColorList.find((color) => {
        return !isColorful(color);
      });
      if (!fillColor) {
        fillColor = getMaxRatioColorFromList(
          this.currentPrimaryColor0,
          filteredColorList,
        );
      }
    }
    return fillColor;
  }
  generateQuickColor1() {
    return calcSimilarColor(this.generateQuickColor2());
  }
  generateQuickColor2() {
    return calcComplementaryColor(this.currentPrimaryColor0);
  }
}
class smartcolor_SmartColorThemeTypeC extends smartcolor_AbstractSmartColorThemeGenerator {
  constructor(colorList, primaryColorInfo, smartColorThemeName) {
    super(colorList, primaryColorInfo, smartColorThemeName);
    this.currentPrimaryColorType = constant.PRIMARY_COLOR_TYPE.TYPE_C;
  }
  generatePrimaryColor2() {
    return getMaxRatioColorFromList(
      this.currentPrimaryColor0,
      removeItemFromList(this.colorList, [this.generatePrimaryColor1()]),
    );
  }
}
class smartcolor_FullRainbowSmartColorTheme extends smartcolor_SmartColorThemeTypeA {
  generateSmartColorTheme() {
    this.currentColorFields = this.getCurrentColorFields();
    return this.colorFieldsToThemeData();
  }
  generatePrimaryColor4() {
    return this.currentPrimaryColor1;
  }
  generateSecondaryColor1() {
    return "#EEEBEE";
  }
  generateQuickColor1() {
    return constant.RAINBOW_QUICK_COLOR_LIST[
      this.colorList.indexOf(this.currentPrimaryColor1)
    ][constant.CLASS_TYPE.MINOR_TOPIC];
  }
  generateQuickColor2() {
    return constant.RAINBOW_QUICK_COLOR_LIST[
      this.colorList.indexOf(this.currentPrimaryColor1)
    ][constant.CLASS_TYPE.IMPORTANT_TOPIC];
  }
}

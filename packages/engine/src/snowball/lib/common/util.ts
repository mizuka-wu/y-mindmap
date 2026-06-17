import * as constant from "./constant";

// according to WCAG
// text AAA class: normal text use 7:1, larger text use 4.5:1
// text AA class: normal text use 4.5:1, larger text use 3:1
// non-text AA class: use at least 3:1
// @link https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_Colors_and_Luminance
export function blendingColor(...colorList) {
  const rgbaResult = colorList
    .filter((color) => color && color !== "none")
    .reduceRight((preColor, currentColor) => {
      let formatedCurrentColor;
      if (typeof currentColor === "string") {
        formatedCurrentColor = hexStringToRgbObject(currentColor);
      } else {
        formatedCurrentColor = currentColor;
      }
      if (!preColor) {
        return formatedCurrentColor;
      }
      const { r: foreR, g: foreG, b: foreB, a: opacity } = formatedCurrentColor;
      const { r: backR, g: backG, b: backB } = preColor;
      // https://en.wikipedia.org/wiki/Alpha_compositing#Description
      return {
        r: Math.round(opacity * foreR + (1 - opacity) * backR),
        g: Math.round(opacity * foreG + (1 - opacity) * backG),
        b: Math.round(opacity * foreB + (1 - opacity) * backB),
        a: 1,
      };
    }, null);
  return rgbObjectToHexString(rgbaResult);
}
/** @deprecated use blendingColor */
export function rgbaObjectToBlendingColor(...rgbas) {
  return rgbas.reduceRight((preColor, currentColor) => {
    if (!preColor) {
      return currentColor;
    }
    const { r: foreR, g: foreG, b: foreB, a: opacity } = currentColor;
    const { r: backR, g: backG, b: backB } = preColor;
    // https://en.wikipedia.org/wiki/Alpha_compositing#Description
    return {
      r: Math.round(opacity * foreR + (1 - opacity) * backR),
      g: Math.round(opacity * foreG + (1 - opacity) * backG),
      b: Math.round(opacity * foreB + (1 - opacity) * backB),
      a: 1,
    };
  });
}
export function hexStringToRgbObject(hex) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i;
  hex = hex.replace(shorthandRegex, (m, r, g, b) => {
    return r + r + g + g + b + b;
  });
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(
    hex,
  );
  if (!result) {
    return {
      r: 255,
      g: 255,
      b: 255,
      a: 1,
    };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
    a: result[4] ? parseInt(result[4], 16) / 255 : 1,
  };
}
export function rgbObjectToHexString(rgbObject) {
  const rgbNumberToHexString = (rgbNumber) => {
    return ("0" + parseInt(`${rgbNumber}`, 10).toString(16)).slice(-2);
  };
  return (
    "#" +
    rgbNumberToHexString(rgbObject.r) +
    rgbNumberToHexString(rgbObject.g) +
    rgbNumberToHexString(rgbObject.b)
  );
}
export function rgbObjectToHsbObject(rgbObject) {
  const { r, g, b } = rgbObject;
  const sortedRgbArray = [r, g, b].sort((a, b) => a - b);
  const minValue = sortedRgbArray[0];
  const maxValue = sortedRgbArray[2];
  const hsbObjectB = maxValue / 255;
  const hsbObjectS = maxValue === 0 ? 0 : (maxValue - minValue) / maxValue;
  let hsbObjectH = 0;
  if (maxValue === minValue) {
    hsbObjectH = 0;
  } else if (maxValue === r) {
    if (g >= b) {
      hsbObjectH = ((g - b) * 60) / (maxValue - minValue);
    } else {
      hsbObjectH = ((g - b) * 60) / (maxValue - minValue) + 360;
    }
  } else if (maxValue === g) {
    hsbObjectH = ((b - r) * 60) / (maxValue - minValue) + 120;
  } else if (maxValue === b) {
    hsbObjectH = ((r - g) * 60) / (maxValue - minValue) + 240;
  }
  return {
    h: Math.round(hsbObjectH),
    s: Math.round(hsbObjectS * 100),
    b: Math.round(hsbObjectB * 100),
  };
}
function hsbObjectToRgbObject(hsbObject) {
  let { h, s, b } = hsbObject;
  h = h % 360;
  s = s / 100;
  b = b / 100;
  const hi = parseInt("" + ((h / 60) % 6));
  const f = h / 60 - hi;
  const p = b * (1 - s);
  const q = b * (1 - f * s);
  const t = b * (1 - (1 - f) * s);
  let red = 0;
  let green = 0;
  let blue = 0;
  switch (hi) {
    case 0:
      red = b;
      green = t;
      blue = p;
      break;
    case 1:
      red = q;
      green = b;
      blue = p;
      break;
    case 2:
      red = p;
      green = b;
      blue = t;
      break;
    case 3:
      red = p;
      green = q;
      blue = b;
      break;
    case 4:
      red = t;
      green = p;
      blue = b;
      break;
    case 5:
      red = b;
      green = p;
      blue = q;
      break;
  }
  red *= 255;
  green *= 255;
  blue *= 255;
  return {
    r: parseInt(red.toFixed(0)),
    g: parseInt(green.toFixed(0)),
    b: parseInt(blue.toFixed(0)),
  };
}
export function hexStringToHsbObject(hexColor) {
  return rgbObjectToHsbObject(hexStringToRgbObject(hexColor));
}
export function hsbObjectToHexString(hsbObject) {
  return rgbObjectToHexString(hsbObjectToRgbObject(hsbObject));
}
export function rgbObjectToHslObject({ r, g, b }) {
  r = r / 255;
  g = g / 255;
  b = b / 255;
  const min = Math.min(r, g, b);
  const max = Math.max(r, g, b);
  const delta = max - min;
  let h = 0;
  let s = 0;
  if (max === min) {
    h = 0;
  } else if (r === max) {
    h = (g - b) / delta;
  } else if (g === max) {
    h = 2 + (b - r) / delta;
  } else if (b === max) {
    h = 4 + (r - g) / delta;
  }
  h = Math.min(h * 60, 360);
  if (h < 0) {
    h += 360;
  }
  const l = (min + max) / 2;
  if (max === min) {
    s = 0;
  } else if (l <= 0.5) {
    s = delta / (max + min);
  } else {
    s = delta / (2 - max - min);
  }
  return {
    h,
    s: s * 100,
    l: l * 100,
  };
}
function hslObjectToRgbObject({ h, s, l }) {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  let t2;
  let t3;
  let val;
  if (s === 0) {
    val = l * 255;
    return {
      r: val,
      g: val,
      b: val,
    };
  }
  if (l < 0.5) {
    t2 = l * (1 + s);
  } else {
    t2 = l + s - l * s;
  }
  const t1 = l * 2 - t2;
  const rgb = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    t3 = h + (1 / 3) * -(i - 1);
    if (t3 < 0) {
      t3++;
    }
    if (t3 > 1) {
      t3--;
    }
    if (t3 * 6 < 1) {
      val = t1 + (t2 - t1) * 6 * t3;
    } else if (t3 * 2 < 1) {
      val = t2;
    } else if (t3 * 3 < 2) {
      val = t1 + (t2 - t1) * (2 / 3 - t3) * 6;
    } else {
      val = t1;
    }
    rgb[i] = val * 255;
  }
  return {
    r: rgb[0],
    g: rgb[1],
    b: rgb[2],
  };
}
export function hexStringToHSLObject(hexColor) {
  return rgbObjectToHslObject(hexStringToRgbObject(hexColor));
}
export function hslObjectToHexString(hslObject) {
  return rgbObjectToHexString(hslObjectToRgbObject(hslObject));
}
function checksRGB(RsRGB) {
  if (RsRGB <= 0.03928) {
    return RsRGB / 12.92;
  } else {
    return Math.pow((RsRGB + 0.055) / 1.055, 2.4);
  }
}
function getColorObject(rgbColor) {
  return {
    r: checksRGB(rgbColor.r / 255),
    g: checksRGB(rgbColor.g / 255),
    b: checksRGB(rgbColor.b / 255),
  };
}
export function calculateRatio(hexColor1, hexColor2) {
  const rgbColor1 = hexStringToRgbObject(hexColor1);
  const rgbColor2 = hexStringToRgbObject(hexColor2);
  const colorOneObject = getColorObject(rgbColor1);
  const colorTwoObject = getColorObject(rgbColor2);
  const colorOneL =
    colorOneObject.r * 0.2126 +
    colorOneObject.g * 0.7152 +
    colorOneObject.b * 0.0722;
  const colorTwoL =
    colorTwoObject.r * 0.2126 +
    colorTwoObject.g * 0.7152 +
    colorTwoObject.b * 0.0722;
  if (colorOneL > colorTwoL) {
    return (colorOneL + 0.05) / (colorTwoL + 0.05);
  } else {
    return (colorTwoL + 0.05) / (colorOneL + 0.05);
  }
}
export function getTopicLighterBorderColor(fillColor) {
  const { h, s, l } = hexStringToHSLObject(fillColor);
  return hslObjectToHexString({
    h,
    s,
    l: fixLight(l + 20),
  });
}
export function getTopicDarkerBorderColor(fillColor) {
  const { h, s, l } = hexStringToHSLObject(fillColor);
  return hslObjectToHexString({
    h,
    s,
    l: fixLight(l - 20),
  });
}
export function getProperRatioColorFromBgColor(
  bgColor,
  lightColor = constant.LIGHT_TEXT_COLOR,
  darkColor = constant.DARK_TEXT_COLOR,
) {
  const properMinRatio = 4.5;
  let lightColorRatio = calculateRatio(bgColor, lightColor);
  let darkColorRatio = calculateRatio(bgColor, darkColor);
  if (lightColorRatio < properMinRatio && darkColorRatio < properMinRatio) {
    lightColor = constant.LIGHT_TEXT_COLOR;
    darkColor = constant.DARK_TEXT_COLOR;
  }
  lightColorRatio = calculateRatio(bgColor, lightColor);
  darkColorRatio = calculateRatio(bgColor, darkColor);
  if (lightColorRatio >= properMinRatio || lightColorRatio > darkColorRatio) {
    return lightColor;
  }
  return darkColor;
}
export function fixLight(l, max = 100, min = 3) {
  if (l > max) {
    return max;
  }
  if (l < min) {
    return min;
  }
  return l;
}
export function UUID() {
  const toReplacedString = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  return toReplacedString.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 3) | 8;
    return v.toString(16);
  });
}
function getComplementaryIndex(colorListName, hexColor) {
  const colorList = constant.PCCS_COLOR_MAP[colorListName].list;
  const baseColorIndex = colorList.indexOf(hexColor);
  if (baseColorIndex >= colorList.length / 2) {
    return baseColorIndex - colorList.length / 2;
  } else {
    return baseColorIndex + colorList.length / 2;
  }
}
export function changeColorLight(originalColor, offset, max = 97, min = 3) {
  const { h, s, l } = hexStringToHSLObject(originalColor);
  return hslObjectToHexString({
    h,
    s,
    l: fixLight(l + offset, max, min),
  });
}
export function getComplementaryColor(
  colorListName,
  baseColor,
  fromComplementaryColorListName,
) {
  const colorList = constant.PCCS_COLOR_MAP[colorListName].list;
  const index = getComplementaryIndex(colorListName, baseColor);
  // Get complementary color from another palette
  if (fromComplementaryColorListName) {
    const complementaryColorList =
      constant.PCCS_COLOR_MAP[fromComplementaryColorListName].list;
    // The given color lists are not complementary
    if (complementaryColorList.length !== colorList.length) {
      throw new Error(
        `Invalid complementary color list between ${colorListName} and ${fromComplementaryColorListName}.`,
      );
    }
    return complementaryColorList[index];
  }
  return colorList[index];
}
export function getColorIndex(colorListName, hexColor) {
  const colorList = constant.PCCS_COLOR_MAP[colorListName].list;
  const index = colorList.indexOf(hexColor);
  return getArrayIndexAsCircular(colorList, index);
}
function getArrayIndexAsCircular(array, offset) {
  if (!array || !array.length) {
    return -1;
  }
  const len = array.length;
  return ((offset % len) + len) % len;
}
function getArrayItemAsCircular(array, offset) {
  return array[getArrayIndexAsCircular(array, offset)];
}
export function getTargetIndexColor(colorListName, offsetIndex, baseHexColor) {
  const colorList = constant.PCCS_COLOR_MAP[colorListName].list;
  let baseColorIndex = 0;
  if (baseHexColor) {
    baseColorIndex = colorList.indexOf(baseHexColor);
  }
  return getArrayItemAsCircular(colorList, baseColorIndex + offsetIndex);
}
export function isTopicClassTypeValue(classType) {
  return constant.TOPIC_CLASS_TYPE_LIST.includes(classType);
}
export function themeListUniqueFilterById(themeList) {
  const map = {};
  themeList.forEach((theme) => (map[theme.id] = theme));
  return Object.values(map);
}
export function hasMultiBranchLineColor(multiLineColors) {
  return (
    !!multiLineColors && multiLineColors !== "" && multiLineColors !== "none"
  );
}
export function getMaxRatioColorFromList(baseColor, colorList) {
  const radioList = colorList.map((color) => calculateRatio(baseColor, color));
  return colorList[radioList.indexOf(Math.max(...radioList))];
}
export function calcComplementaryColor(baseColor) {
  const { h, s, l } = hexStringToHSLObject(baseColor);
  let complementaryH = h + 180;
  if (complementaryH >= 360) {
    complementaryH = complementaryH - 360;
  }
  return hslObjectToHexString({
    h: complementaryH,
    s,
    l,
  });
}
export function calcSimilarColor(baseColor, ratio?) {
  if (!ratio) {
    ratio = 45;
  }
  const { h, s, l } = hexStringToHSLObject(baseColor);
  let similarH = h + ratio;
  if (similarH >= 360) {
    similarH = similarH - 360;
  }
  return hslObjectToHexString({
    h: similarH,
    s,
    l,
  });
}
export function brighten(baseColor, amount = 10) {
  let { r, g, b } = hexStringToRgbObject(baseColor);
  r = Math.max(0, Math.min(255, r - Math.round(-(amount / 100) * 255)));
  g = Math.max(0, Math.min(255, g - Math.round(-(amount / 100) * 255)));
  b = Math.max(0, Math.min(255, b - Math.round(-(amount / 100) * 255)));
  return rgbObjectToHexString({
    r,
    g,
    b,
  });
}
export function isColorful(color) {
  const { l } = hexStringToHSLObject(color);
  return (
    l >= constant.SMART_COLOR_THEME_KEY_VALUE.colorfulMinL &&
    l <= constant.SMART_COLOR_THEME_KEY_VALUE.colorfulMaxL
  );
}
function getPrimaryColor0ForDazzleColor(dazzleColor, colorList) {
  const ratioList = colorList
    .filter((color) => color !== dazzleColor)
    .map((color) => {
      return {
        primaryColor0: color,
        ratio: calculateRatio(color, dazzleColor),
      };
    })
    .sort((a, b) => b.ratio - a.ratio);
  // todo if dazzle?
  return ratioList[0].primaryColor0;
}
export function calcPrimaryColorType(primaryColor0) {
  const { l } = hexStringToHSLObject(primaryColor0);
  if (l < constant.SMART_COLOR_THEME_KEY_VALUE.colorfulMinL) {
    return constant.PRIMARY_COLOR_TYPE.TYPE_C;
  }
  if (l > constant.SMART_COLOR_THEME_KEY_VALUE.colorfulMaxL) {
    return constant.PRIMARY_COLOR_TYPE.TYPE_A;
  }
  return constant.PRIMARY_COLOR_TYPE.TYPE_B;
}
export function getPrimaryColorInfo(color, colorThemeName, colorList) {
  const primaryColorInfo: any = {};
  let primaryColor0 = color;
  if (isDazzleColor(color)) {
    primaryColor0 = getPrimaryColor0ForDazzleColor(color, colorList);
    primaryColorInfo.primaryColor1 = color;
  }
  const colorType = calcPrimaryColorType(primaryColor0);
  if (!colorType) {
    return null;
  }
  primaryColorInfo.primaryColor0 = primaryColor0;
  primaryColorInfo.type = colorType;
  primaryColorInfo.id = `${colorThemeName}-${color}-${colorType}`;
  return primaryColorInfo;
}
export function getRainbowPrimaryColorInfo(color) {
  const primaryColor0 = "#ffffff";
  const type = calcPrimaryColorType(primaryColor0);
  return {
    primaryColor0,
    primaryColor1: color,
    type,
    id: `${constant.SMART_COLOR_THEME_NAME.Rainbow}-${color}-MULTI_LINE_COLORS`,
  };
}
export function mapColorListToPrimaryColorInfoList(colorList, colorThemeName) {
  return colorList
    .map((color) => {
      return getPrimaryColorInfo(color, colorThemeName, colorList);
    })
    .filter((i) => i);
}
function isNeutral(color) {
  return hexStringToHSLObject(color).s === 0;
}
function colorAnalysis(color) {
  const { s, l } = hexStringToHSLObject(color);
  if (isNeutral(color)) {
    return "Neutral";
  } else if (l >= constant.SMART_COLOR_THEME_KEY_VALUE.colorfulMaxL) {
    return "Light";
  } else if (l <= constant.SMART_COLOR_THEME_KEY_VALUE.colorfulMinL) {
    return "Dark";
  } else if (isDazzleColor(color)) {
    return "Dazzle";
  } else if (s > 30) {
    return "Primary";
  } else {
    return "Moderate";
  }
}
export function isDazzleColor(hex) {
  if ((dazzleRatio(hex) as number) >= 75) {
    return true;
  } else {
    return false;
  }
}
function dazzleRatio(hex) {
  const { s, l } = hexStringToHSLObject(hex);
  const r =
    s * 0.4 +
    (100 - Math.abs(l - 50) * 2) * 0.45 +
    colorPurity(hex) * 100 * 0.15;
  if (s == 0) {
    return 0;
  } else {
    return r.toFixed(2);
  }
}
function colorPurity(hex) {
  const { h } = hexStringToHSLObject(hex);
  let purity = 1;
  for (let i = 0; i <= 6; i++) {
    purity = Math.abs(i * 60 - h);
    if (purity <= 30) {
      purity = 1 - purity / 30;
      break;
    }
  }
  return Number(purity.toFixed(2));
}
export function isPrimaryColor(color) {
  return colorAnalysis(color) === "Primary";
}
export function getPrimaryAbleColorList(colorList, baseColor) {
  const filteredColorList = removeItemFromList(colorList, [baseColor]);
  let resultColorList = filteredColorList.filter((color) => {
    return calculateRatio(color, baseColor) >= 2 && isPrimaryColor(color);
  });
  if (resultColorList.length === 0) {
    resultColorList = filteredColorList;
  }
  return resultColorList;
}
export function removeItemFromList(fullList, toRemoveItems) {
  const fullListCopy = [...fullList];
  if (!toRemoveItems.length) {
    return fullListCopy;
  }
  const toRemoveItemsCopy = [...toRemoveItems];
  const toRemoveItem = toRemoveItemsCopy.shift();
  fullListCopy.splice(fullListCopy.indexOf(toRemoveItem), 1);
  return removeItemFromList(fullListCopy, toRemoveItemsCopy);
}
export function getMultiLineColorInfoList(colorList, themeName) {
  const MIN_RATIO = constant.COLOR_MIN_RATIO;
  const lightColorList = getLightColorList();
  const darkColorList = getDarkColorList();
  const lightColor = getMaxRatioColorInfo(lightColorList, colorList, true);
  const darkColor = getMaxRatioColorInfo(darkColorList, colorList, false);
  return [lightColor, darkColor]
    .filter((color) => color)
    .map((finalBgColor) => {
      return {
        primaryColor0: finalBgColor,
        multiLineColorString: getMultiLineColorString(finalBgColor),
        id: `${themeName}-${finalBgColor}-${constant.PRIMARY_COLOR_TYPE.MULTI_LINE_COLORS}`,
      };
    });
  function getLightColorList() {
    return colorList.filter((color) => {
      return (
        hexStringToHSLObject(color).l >
        constant.RAINBOW_MAP_FILL_COLOR_L.LIGHT_MIN_L
      );
    });
  }
  function getDarkColorList() {
    return colorList.filter((color) => {
      return (
        hexStringToHSLObject(color).l <
        constant.RAINBOW_MAP_FILL_COLOR_L.DARK_MAX_L
      );
    });
  }
  function getMaxRatioColorInfo(targetColorPool, baseColorPool, isLightColor) {
    if (!targetColorPool.length) {
      return "";
    }
    let bgColor = "";
    let ratioFlagSum = 0;
    targetColorPool.forEach((color) => {
      const ratioFlagList = baseColorPool
        .filter((baseColor) => baseColor !== color)
        .map((baseColor) => calRatioFlag(color, baseColor));
      if (ratioFlagList.filter((flag) => flag === 0).length > 1) {
        return;
      }
      const currentRatioFlagSum = calcRatioFlagSum(color, baseColorPool);
      if (currentRatioFlagSum > ratioFlagSum) {
        ratioFlagSum = currentRatioFlagSum;
        bgColor = color;
      }
      if (currentRatioFlagSum === ratioFlagSum) {
        const color1L = hexStringToHSLObject(bgColor).l;
        const color2L = hexStringToHSLObject(color).l;
        if (color1L >= color2L) {
          bgColor = isLightColor ? bgColor : color;
        }
      }
    });
    return bgColor;
    function calRatioFlag(targetColor, baseColor) {
      if (calculateRatio(targetColor, baseColor) >= MIN_RATIO) {
        return 1;
      } else {
        return 0;
      }
    }
    function calcRatioFlagSum(targetColor, baseColorPool) {
      return baseColorPool.reduce((pre, baseColor) => {
        return pre + calRatioFlag(targetColor, baseColor);
      }, 0);
    }
  }
  function getMultiLineColorString(finalBgColor) {
    return colorList
      .filter((color) => {
        return (
          color !== finalBgColor &&
          calculateRatio(color, finalBgColor) > MIN_RATIO
        );
      })
      .join(" ");
  }
}

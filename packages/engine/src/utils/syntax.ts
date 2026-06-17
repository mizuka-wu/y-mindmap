import underscore from "underscore";

// DEPRECATED!!! See `js/common/utils/syntax.ts`.
//
// Is a given variable undefined?
/** @deprecated See `js/common/utils/syntax.ts`. */
export const isUndefined = function (obj) {
  return obj === undefined;
}; // Is a given value equal to null?
/** @deprecated See `js/common/utils/syntax.ts`. */
export const isNull = function (obj) {
  return obj === null;
};
/** @deprecated See `js/common/utils/syntax.ts`. */
export const isDefined = function (obj) {
  return !isUndefined(obj) && !isNull(obj);
};
/** @deprecated See `js/common/utils/syntax.ts`. */
export const isObject = function (obj) {
  const type = typeof obj;
  return type === "function" || (type === "object" && !!obj);
}; // Is a given value a boolean?
/** @deprecated See `js/common/utils/syntax.ts`. */
export const isBoolean = function (obj) {
  return (
    obj === true || obj === false || toString.call(obj) === "[object Boolean]"
  );
};
/** @deprecated See `js/common/utils/syntax.ts`. */
export const isArguments = function (obj) {
  return toString.call(obj) === "[object Arguments]";
};
/** @deprecated See `js/common/utils/syntax.ts`. */
export const isFunction = function (obj) {
  return toString.call(obj) === "[object Function]";
};
/** @deprecated See `js/common/utils/syntax.ts`. */
export const isString = function (obj) {
  return toString.call(obj) === "[object String]";
};
/** @deprecated See `js/common/utils/syntax.ts`. */
export const isNumber = function (obj) {
  return toString.call(obj) === "[object Number]";
};
/** @deprecated See `js/common/utils/syntax.ts`. */
export const isDate = function (obj) {
  return toString.call(obj) === "[object Date]";
};
/** @deprecated See `js/common/utils/syntax.ts`. */
export const isRegExp = function (obj) {
  return toString.call(obj) === "[object RegExp]";
};
/** @deprecated See `js/common/utils/syntax.ts`. */
export const isError = function (obj) {
  return toString.call(obj) === "[object Error]";
};
/** @deprecated See `js/common/utils/syntax.ts`. */
export const isNaN = function (obj) {
  return isNumber(obj) && obj !== +obj;
};
/** @deprecated See `js/common/utils/syntax.ts`. */
export const subtract = function (a, b) {
  const result = {};
  for (const k of Object.keys(b)) {
    if (a[k] !== b[k]) {
      result[k] = b[k];
    }
  }
  return result;
};
/** @deprecated See `js/common/utils/syntax.ts`. */
export const isEqual = function (a, b) {
  return underscore.isEqual(a, b);
};
/** @deprecated See `js/common/utils/syntax.ts`. */
export const clone = function (obj) {
  if (isObject(obj)) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.slice();
  } else {
    return Object.assign({}, obj);
  }
};
/** @deprecated See `js/common/utils/syntax.ts`. */
export const deepClone = function (obj) {
  const cloned = clone(obj);
  Object.keys(cloned).forEach((key) => {
    const value = cloned[key];
    if (isObject(value)) {
      cloned[key] = deepClone(value);
    }
  });
  return cloned;
};

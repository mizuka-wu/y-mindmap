/* eslint-disable @typescript-eslint/no-unused-vars */
import underscore from "underscore";
// Is a given variable undefined?
export const isUndefined = (obj) => {
  return obj === undefined;
};
// Is a given value equal to null?
export const isNull = (obj) => {
  return obj === null;
};
export const isDefined = (obj) => {
  return !isUndefined(obj) && !isNull(obj);
};
export const isNone = (obj) => {
  return isUndefined(obj) || isNull(obj);
};
export const isObject = (obj) => {
  const type = typeof obj;
  return type === "function" || (type === "object" && !!obj);
};

// Is a given value a boolean?
const isBoolean = (obj) => {
  return (
    obj === true || obj === false || toString.call(obj) === "[object Boolean]"
  );
};
const isArguments = (obj) => {
  return toString.call(obj) === "[object Arguments]";
};
const isArray = (obj) => {
  return Array.isArray(obj);
};
export const isFunction = (obj) => {
  return toString.call(obj) === "[object Function]";
};
const isString = (obj) => {
  return toString.call(obj) === "[object String]";
};
const isNumber = (obj) => {
  return toString.call(obj) === "[object Number]";
};
const isDate = (obj) => {
  return toString.call(obj) === "[object Date]";
};
const isRegExp = (obj) => {
  return toString.call(obj) === "[object RegExp]";
};
const isError = (obj) => {
  return toString.call(obj) === "[object Error]";
};
const isNaN = (obj) => {
  return isNumber(obj) && obj !== +obj;
};
export const subtract = (a, b) => {
  const result = {};
  for (const k in b) {
    if (a[k] !== b[k]) {
      result[k] = b[k];
    }
  }
  return result;
};
const isEqual = (a, b) => {
  return Object(underscore.isEqual)(a, b);
};
/** @deprecated No more "one simple way to clone". Should define carefully how to clone an object in every case. */
const clone = (obj) => {
  if (!isObject(obj)) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.slice();
  } else {
    return Object.assign({}, obj);
  }
};
/** @deprecated No more "one simple way to clone". Should define carefully how to clone an object in every case. */
export const deepClone = (obj) => {
  const cloned = clone(obj);
  Object.keys(cloned).forEach((key) => {
    const value = cloned[key];
    if (isObject(value)) {
      cloned[key] = deepClone(value);
    }
  });
  return cloned;
};
export const toNumber = (fn, value, defaultValue = 0) => {
  value = isDefined(value) ? value : defaultValue;
  let num = fn(value);
  if (isNaN(num)) {
    num = defaultValue;
  }
  return num;
};

const uuidMap = {};
export function UUID(jsonUUID?) {
  if (jsonUUID && uuidMap[jsonUUID]) {
    return uuidMap[jsonUUID];
  }
  const toReplacedString = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx";
  const newUUID = toReplacedString.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 3) | 8;
    return v.toString(16);
  });
  if (jsonUUID) {
    return (uuidMap[jsonUUID] = newUUID);
  } else {
    return newUUID;
  }
}
export function methodDeprecatedWarn(deprecatedMethod, suggestedMethod) {
  return `${deprecatedMethod} has been deprecated, use ${suggestedMethod} instead`;
}

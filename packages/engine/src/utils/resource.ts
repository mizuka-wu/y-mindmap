export function getXapResourceHash(resourceStr) {
  if (isXapResource(resourceStr)) {
    const result = resourceStr.match(
      new RegExp("xap:resources/(\\S*)\\.*\\S*$"),
    );
    if (result && result.length > 0) {
      return result[1];
    } else {
      return null;
    }
  } else {
    return null;
  }
}
export function isXapResource(resourceStr) {
  return (
    typeof resourceStr === "string" &&
    resourceStr.indexOf("xap:resources/") === 0
  );
}
export function combineResourceString(...urlFragment) {
  return urlFragment.filter((url) => typeof url === "string").join("");
}

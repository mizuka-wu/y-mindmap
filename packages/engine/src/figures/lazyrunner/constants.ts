// @flow
export const PRIORITY = {
  BEFORE_EACH: "beforeEach",
  BEFORE_LAYOUT: "beforeLayout",
  LAYOUT: "layout",
  AFTER_LAYOUT: "afterLayout",
  BEFORE_RENDER: "beforeRender",
  RENDER: "render",
  AFTER_RENDER: "afterRender",
  AFTER_EACH: "afterEach",
  BEFORE_SELECT_SELECTION: "beforeSelectSelection",
  SELECT_SELECTION: "selectSelection",
};
export const ABORTED_PRIORITY = Object.assign(
  Object.assign(
    {
      NONE: "none",
    },
    PRIORITY,
  ),
  {
    ALL: "ALL",
  },
);

export default {
  PRIORITY: PRIORITY,
  ABORTED_PRIORITY: ABORTED_PRIORITY,
};

import { config } from "@repo/eslint-config/base";

export default [
  { ignores: ["**/dist/**", "**/node_modules/**"] },
  ...config,
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-this-alias": "off",
      "@typescript-eslint/no-unsafe-function-type": "off",
      "no-undef": "off",
      "no-case-declarations": "off",
      "no-async-promise-executor": "off",
    },
  },
];

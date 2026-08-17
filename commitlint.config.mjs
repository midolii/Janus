export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "header-max-length": [2, "always", 100],
    "scope-enum": [
      2,
      "always",
      ["repo", "deps", "web", "electron", "ui", "api", "storybook", "docs"],
    ],
  },
}

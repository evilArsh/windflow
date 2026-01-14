/**
https://commitlint.js.org/reference/rules-configuration.html
Level [0..2]: 0 disables the rule. For 1 it will be considered a warning for 2 an error.
Applicable always|never: never inverts the rule.
Value: value to use for this rule.
 */
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [2, "always", 500],
  },
}

import { fileURLToPath } from "node:url"
import fs from "node:fs"
import path from "node:path"
import globals from "globals"
import pluginJs from "@eslint/js"
import tseslint from "typescript-eslint"
import { defineConfig } from "eslint/config"
import typescriptEslint from "@typescript-eslint/eslint-plugin"
import parserVue from "vue-eslint-parser"
import pluginVue from "eslint-plugin-vue"
import pluginPrettier from "eslint-plugin-prettier"
import configPrettier from "eslint-config-prettier/flat"
import pluginPrettierRecommand from "eslint-plugin-prettier/recommended"
import pluginPromise from "eslint-plugin-promise"
import pluginImport from "eslint-plugin-import"
import pluginN from "eslint-plugin-n"
const autoImportConfig = JSON.parse(fs.readFileSync(".eslintrc-auto-import.json", "utf-8"))
const __filename = fileURLToPath(import.meta.url) // get the resolved path to the file
const __dirname = path.dirname(__filename) // get the name of the directory
/**
 * "off" or 0 - turn the rule off
 * "warn" or 1 - turn the rule on as a warning (doesn’t affect exit code)
 * "error" or 2 - turn the rule on as an error (exit code is 1 when triggered)
 * eslint inspect：npx @eslint/config-inspector@latest
 * deps:
    "eslint"
    "globals"
    "@eslint/js"
    "eslint-plugin-import"
    "eslint-plugin-n"
    "eslint-plugin-prettier"
    "eslint-plugin-promise"
    "eslint-plugin-vue"
    "prettier-eslint"
    "typescript-eslint"
    "@typescript-eslint/eslint-plugin"
    "eslint-config-prettier"
    "vue-eslint-parser"
 */
export default defineConfig([
  {
    files: ["src/**/*.{js,mjs,cjs,ts,vue,jsx,tsx}"],
  },
  {
    // If ignores is used without any other keys in the configuration object, then the patterns act as global ignores
    ignores: [
      "demo",
      "*.min.{js,ts,css}",
      "public/",
      ".lintstagedrc*",
      "commitlint*",
      "**/build/",
      "**/out/",
      "**/dist/",
      "**/h5/",
      "**/.vscode/",
      "**/assets/",
      "**/*/components.d.ts",
      "**/*/auto-imports.d.ts",
      "eslint.config.{mjs,cjs,js}",
      "vitest.config.{ts,mts,js,mjs}",
      "vite.config.{ts,mts,js,mjs}",
      "**/.prettierrc.{mjs,cjs,js}",
      "**/rollup.config.{js,mjs,cjs}",
      "yarn.lock",
      "package-lock.json",
      "uno.config.{ts,mts,js,mjs}",
      "electron.vite.config.{ts,mts,js,mjs}",
    ],
  },
  {
    name: "global-language-config",
    plugins: {
      prettier: pluginPrettier,
      "@typescript-eslint": typescriptEslint,
      import: pluginImport,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...autoImportConfig.globals,
      },
      parserOptions: {
        parser: tseslint.parser,
        tsconfigRootDir: __dirname,
        sourceType: "module",
        project: ["./tsconfig.json", "./tsconfig.node.json", "./tsconfig.web.json"],
        extraFileExtensions: [".vue"],
        ecmaVersion: "latest",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    name: "vue global config",
    files: ["src/**/*.vue"],
    languageOptions: {
      parser: parserVue,
      parserOptions: {
        parser: tseslint.parser,
        ecmaVersion: "latest",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/essential"],
  ...pluginVue.configs["flat/strongly-recommended"],
  ...pluginVue.configs["flat/recommended"],
  pluginPromise.configs["flat/recommended"],
  pluginPrettierRecommand,
  {
    name: "vue rules",
    rules: {
      "vue/multi-word-component-names": 0,
      "vue/require-prop-types": 0,
      "vue/one-component-per-file": 0,
      "vue/attributes-order": 0,
      "vue/no-v-html": 0,
    },
  },
  {
    name: "typescript rules",
    rules: {
      "promise/catch-or-return": "off",
      "promise/always-return": "off",
      "@typescript-eslint/no-unused-expressions": 0,
      "@typescript-eslint/no-explicit-any": 0,
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    name: "prettier rules",
    rules: {
      "prettier/prettier": "error",
    },
  },
  {
    name: "nodejs rules",
    files: ["src/main/**/*.ts", "src/preload/**/*.ts"],
    plugins: {
      n: pluginN,
    },
    rules: {
      "promise/catch-or-return": "off",
      "promise/always-return": "off",
      "n/exports-style": ["error", "module.exports"],
      "n/no-missing-import": "off",
      "n/no-unsupported-features/node-builtins": [
        "error",
        {
          version: ">=20.0.0",
          ignores: [],
        },
      ],
    },
  },
  configPrettier,
])

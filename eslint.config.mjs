import eslint from "@eslint/js"
import tseslint from "typescript-eslint"
import jestPlugin from "eslint-plugin-jest"
import prettierPlugin from "eslint-plugin-prettier/recommended"
import globals from "globals"
import tailwind from "eslint-plugin-tailwindcss"

export default tseslint.config(
  {
    ignores: ["build/**", "generated/**", "dist/**", ".yarn/**"]
  },
  eslint.configs.recommended,
  prettierPlugin,

  ...tailwind.configs["flat/recommended"],

  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
        ...globals.browser
      }
    },
    rules: {
      "block-scoped-var": "error",
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "error",
      "eol-last": "error",
      "prefer-arrow-callback": "error",
      "no-trailing-spaces": "error",
      quotes: ["warn", "double", {avoidEscape: true}]
    }
  },
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    ...tseslint.configs.recommended,
    rules: {
      "@typescript-eslint/no-warning-comments": "off",
      "@typescript-eslint/no-empty-function": "off",
      "tailwindcss/no-custom-classname": "warn",

      // Turn off Node-specific rules for frontend files
      "n/no-missing-import": "off",
      "n/no-unsupported-features/es-syntax": "off"
    }
  },
  {
    files: ["tests/**/*.ts", "**/*.spec.ts"],
    ...jestPlugin.configs["flat/recommended"],
    rules: {
      "jest/no-focused-tests": "error",
      "jest/no-identical-title": "error"
    }
  }
)

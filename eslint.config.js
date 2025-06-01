import globals from "globals"
import tseslint from "typescript-eslint"
import js from "@eslint/js"
import eslintPluginReact from "eslint-plugin-react"
import eslintPluginReactHooks from "eslint-plugin-react-hooks"
import eslintPluginJsxA11y from "eslint-plugin-jsx-a11y"
import eslintPluginReactRefresh from "eslint-plugin-react-refresh"
import eslintConfigPrettier from "eslint-config-prettier"

export default tseslint.config(
  {
    ignores: ["dist/**", "node_modules/**", ".yarn/**", "build/**"]
  },
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.es2020
      },
      parser: tseslint.parser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
      react: eslintPluginReact,
      "react-hooks": eslintPluginReactHooks,
      "jsx-a11y": eslintPluginJsxA11y,
      "react-refresh": eslintPluginReactRefresh
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...eslintPluginReact.configs.recommended.rules,
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginJsxA11y.configs.recommended.rules,
      ...eslintConfigPrettier.rules,
      "prettier/prettier": "off",
      "block-scoped-var": "error",
      eqeqeq: "error",
      "no-var": "error",
      "prefer-const": "error",
      "eol-last": "error",
      "prefer-arrow-callback": "error",
      "no-trailing-spaces": "error",
      quotes: ["warn", "double", {avoidEscape: true}],
      "no-restricted-properties": [
        "error",
        {
          object: "describe",
          property: "only"
        },
        {
          object: "it",
          property: "only"
        }
      ],
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-use-before-define": "off",
      "@typescript-eslint/no-empty-function": "warn",
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {argsIgnorePattern: "^_"}],
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-refresh/only-export-components": ["warn", {allowConstantExport: true}],
      "react/jsx-uses-react": "off"
    },
    settings: {
      react: {
        version: "detect"
      }
    }
  }
)

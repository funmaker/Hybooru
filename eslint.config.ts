/* eslint-disable @typescript-eslint/naming-convention */
import { fileURLToPath } from "node:url";
import { defineConfig } from "eslint/config";
import globals from "globals";
import jsPlugin from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import importPlugin from "eslint-plugin-import";
import stylisticPlugin from '@stylistic/eslint-plugin';
import reactHooksPlugin from "eslint-plugin-react-hooks";
import indentEmptyLinesPlugin from "eslint-plugin-indent-empty-lines";
import { includeIgnoreFile } from "@eslint/compat";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default defineConfig([
  jsPlugin.configs.recommended,
  tsPlugin.configs["flat/recommended-type-checked"] as any, // TODO: fix?
  reactPlugin.configs.flat.recommended,
  importPlugin.flatConfigs.recommended,
  stylisticPlugin.configs.recommended,
  reactHooksPlugin.configs.flat.recommended,
  indentEmptyLinesPlugin.configs.recommended,
  includeIgnoreFile(gitignorePath, "Imported .gitignore patterns"),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
        __: false,
      },
      parser: tsParser,
      ecmaVersion: 2018,
      sourceType: "module",
      parserOptions: {
        projectService: {
          allowDefaultProject: ['webpack/*.mjs'],
        },
        ecmaFeatures: {
          jsx: true,
          legacyDecorators: true,
        },
      },
    },
    settings: {
      react: {
        version: "16.2",
      },
    },
    rules: {
      "react-hooks/refs": "off", // TODO: FIX
      
      "@stylistic/array-bracket-spacing": ["warn", "never"],
      "@stylistic/arrow-parens": ["warn", "as-needed"],
      "@stylistic/arrow-spacing": "warn",
      "@stylistic/block-spacing": ["warn", "always"],
      "@stylistic/brace-style": ["warn", "1tbs", {
        allowSingleLine: true,
      }],
      "@stylistic/comma-dangle": ["warn", "always-multiline"],
      "@stylistic/comma-spacing": "warn",
      "@stylistic/comma-style": "warn",
      "@stylistic/computed-property-spacing": "warn",
      "@stylistic/eol-last": "warn",
      "@stylistic/function-call-spacing": "warn",
      "@stylistic/generator-star-spacing": ["warn", {
        after: true,
        before: false,
        method: "neither",
      }],
      "@stylistic/indent": ["warn", 2, {
        ArrayExpression: "first",
        CallExpression: {
          arguments: "first",
        },
        FunctionDeclaration: {
          parameters: "first",
        },
        FunctionExpression: {
          parameters: "first",
        },
        ignoredNodes: [
          "JSXElement",
          "JSXElement *",
          "JSXAttribute",
          "ConditionalExpression",
          "TSUnionType",
        ],
        ImportDeclaration: "first",
        MemberExpression: "off",
        ObjectExpression: "first",
        SwitchCase: 1,
        VariableDeclarator: {
          const: 3,
          let: 2,
          var: 2,
        },
      }],
      "@stylistic/indent-binary-ops": "off",
      "@stylistic/jsx-closing-bracket-location": ["warn", "after-props"],
      "@stylistic/jsx-closing-tag-location": "warn",
      "@stylistic/jsx-curly-brace-presence": "warn",
      "@stylistic/jsx-curly-spacing": "warn",
      "@stylistic/jsx-equals-spacing": "warn",
      "@stylistic/jsx-first-prop-new-line": "off",
      "@stylistic/jsx-indent-props": ["warn", "first"],
      "@stylistic/jsx-max-props-per-line": "off",
      "@stylistic/jsx-one-expression-per-line": "off",
      "@stylistic/jsx-pascal-case": "warn",
      "@stylistic/jsx-wrap-multilines": "off",
      "@stylistic/jsx-tag-spacing": "warn",
      "@stylistic/key-spacing": "warn",
      "@stylistic/keyword-spacing": ["warn", {
        overrides: {
          catch: {
            after: false,
          },
          for: {
            after: false,
          },
          if: {
            after: false,
          },
          switch: {
            after: false,
          },
          while: {
            after: false,
          },
        },
      }],
      "@stylistic/linebreak-style": "error",
      "@stylistic/lines-between-class-members": ["warn", "always", {
        exceptAfterSingleLine: true,
      }],
      "@stylistic/max-statements-per-line": "off",
      "@stylistic/member-delimiter-style": ["warn", {
        multiline: {
          delimiter: "semi",
          requireLast: true,
        },
        singleline: {
          delimiter: "semi",
          requireLast: false,
        },
      }],
      "@stylistic/no-empty": "off",
      "@stylistic/no-extra-semi": "warn",
      "@stylistic/no-mixed-operators": "off",
      "@stylistic/no-mixed-spaces-and-tabs": "warn",
      "@stylistic/no-multi-spaces": "warn",
      "@stylistic/no-multiple-empty-lines": ["warn", {
        max: 2,
        maxBOF: 1,
        maxEOF: 1,
      }],
      "@stylistic/no-trailing-spaces": ["warn", {
        ignoreComments: true,
        skipBlankLines: true,
      }],
      "@stylistic/no-whitespace-before-property": "warn",
      "@stylistic/object-curly-newline": ["warn", {
        consistent: true,
      }],
      "@stylistic/object-curly-spacing": ["warn", "always"],
      "@stylistic/operator-linebreak": ["warn", "before", {
        overrides: { "=": "ignore" },
      }],
      "@stylistic/padded-blocks": ["warn", "never"],
      "@stylistic/quotes": "off",
      "@stylistic/semi": ["warn", "always"],
      "@stylistic/semi-spacing": "warn",
      "@stylistic/semi-style": "warn",
      "@stylistic/space-before-blocks": "warn",
      "@stylistic/space-before-function-paren": ["warn", {
        anonymous: "never",
        asyncArrow: "always",
        named: "never",
        catch: "never",
      }],
      "@stylistic/space-in-parens": "warn",
      "@stylistic/space-infix-ops": "warn",
      "@stylistic/space-unary-ops": "warn",
      "@stylistic/switch-colon-spacing": "warn",
      "@stylistic/template-curly-spacing": "warn",
      "@stylistic/type-annotation-spacing": "warn",
      "@stylistic/yield-star-spacing": "warn",
      "@typescript-eslint/adjacent-overload-signatures": "warn",
      "@typescript-eslint/array-type": ["warn", {
        default: "array-simple",
      }],
      "@typescript-eslint/consistent-type-assertions": ["warn", {
        assertionStyle: "as",
        objectLiteralTypeAssertions: "allow-as-parameter",
      }],
      "@typescript-eslint/consistent-type-definitions": ["warn", "interface"],
      "@typescript-eslint/naming-convention": ["warn", {
        selector: "default",
        format: ["camelCase"],
        leadingUnderscore: "allow",
        trailingUnderscore: "allow",
      }, {
        selector: "variable",
        format: ["camelCase", "UPPER_CASE", "PascalCase"],
        leadingUnderscore: "allow",
        trailingUnderscore: "allow",
      }, {
        selector: "typeLike",
        format: ["PascalCase"],
      }, {
        selector: "function",
        format: ["camelCase", "PascalCase"],
      }, {
        selector: "enumMember",
        format: ["UPPER_CASE"],
      }, {
        selector: "import",
        format: null,
      }, {
        selector: [
          "classProperty",
          "objectLiteralProperty",
          "typeProperty",
          "classMethod",
          "objectLiteralMethod",
          "typeMethod",
          "accessor",
          "enumMember",
        ],
        format: null,
        modifiers: ["requiresQuotes"],
      }],
      "@typescript-eslint/no-array-constructor": "warn",
      "@typescript-eslint/no-empty-object-type": ["error", {
        allowInterfaces: "always",
      }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-inferrable-types": "warn",
      "@typescript-eslint/no-misused-new": "error",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-namespace": "error",
      "@typescript-eslint/no-redeclare": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unnecessary-type-assertion": "warn",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-function-type": "error",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unused-vars": ["warn", {
        ignoreRestSiblings: true,
        args: "none",
      }],
      "@typescript-eslint/no-useless-constructor": "warn",
      "@typescript-eslint/no-wrapper-object-types": "error",
      "@typescript-eslint/prefer-namespace-keyword": "warn",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
      "@typescript-eslint/triple-slash-reference": "warn",
      "@typescript-eslint/unbound-method": "off",
      "eqeqeq": "off",
      "import/named": "off",
      "import/namespace": "error",
      "import/newline-after-import": "warn",
      "import/no-absolute-path": "error",
      "import/no-amd": "warn",
      "import/no-commonjs": "warn",
      "import/no-cycle": "error",
      "import/no-deprecated": "warn",
      "import/no-duplicates": "warn",
      "import/no-dynamic-require": "error",
      "import/no-extraneous-dependencies": "warn",
      "import/no-named-as-default-member": "off",
      "import/no-self-import": "error",
      "import/no-unresolved": "off",
      "import/no-useless-path-segments": "warn",
      "import/order": "warn",
      "indent-empty-lines/indent-empty-lines": ["warn", 2],
      "no-console": "off",
      "no-constant-condition": "warn",
      "no-control-regex": "warn",
      "no-debugger": "warn",
      "no-dupe-class-members": "off",
      "no-dupe-keys": "warn",
      "no-duplicate-case": "warn",
      "no-empty-character-class": "warn",
      "no-ex-assign": "off",
      "no-extra-boolean-cast": "warn",
      "no-fallthrough": "warn",
      "no-inner-declarations": "warn",
      "no-lonely-if": "warn",
      "no-negated-in-lhs": "warn",
      "no-octal": "warn",
      "no-prototype-builtins": "off",
      "no-redeclare": "off",
      "no-regex-spaces": "off",
      "no-sparse-arrays": "warn",
      "no-undef": "off",
      "no-unexpected-multiline": "warn",
      "no-unneeded-ternary": "warn",
      "no-unreachable": "warn",
      "no-useless-computed-key": "warn",
      "no-useless-rename": "warn",
      "no-var": "warn",
      "object-shorthand": "warn",
      "operator-assignment": "warn",
      "prefer-arrow-callback": "warn",
      "prefer-const": ["warn", {
        destructuring: "all",
      }],
      "prefer-rest-params": "warn",
      "prefer-spread": "warn",
      "quote-props": ["warn", "consistent-as-needed"],
      "react-hooks/exhaustive-deps": ["warn", {
        additionalHooks: "(useAsyncCallback)",
      }],
      "react-hooks/rules-of-hooks": "error",
      "react/jsx-boolean-value": "warn",
      "react/jsx-filename-extension": ["warn", {
        extensions: [".jsx", ".tsx"],
      }],
      "react/jsx-key": "warn",
      "react/jsx-uses-react": "off",
      "react/no-access-state-in-setstate": "warn",
      "react/no-this-in-sfc": "error",
      "react/no-typos": "warn",
      "react/prop-types": ["error", {
        skipUndeclared: true,
      }],
      "react/react-in-jsx-scope": "off",
      "react/sort-comp": ["warn", {
        order: [
          "type-annotations",
          "static-methods",
          "lifecycle",
          "everything-else",
          "render",
        ],
      }],
      "react/void-dom-elements-no-children": "warn",
      "rest-spread-spacing": "warn",
      "use-isnan": "warn",
      "valid-typeof": "warn",
    },
  },
]);

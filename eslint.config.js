import tseslint from "typescript-eslint";
export default [
  { ignores: ["node_modules/**", "dist/**", "content/**", ".runtime/**"] },
  {
    files: [
      "apps/**/*.ts",
      "apps/**/*.tsx",
      "packages/**/*.ts",
      "packages/**/*.tsx",
      "scripts/**/*.ts",
      "tests/**/*.ts",
    ],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      "no-constant-condition": "error",
      "no-dupe-args": "error",
      "no-dupe-keys": "error",
      "no-unreachable": "error",
      "no-unsafe-finally": "error",
      "valid-typeof": "error",
      "no-self-assign": "error",
      "no-template-curly-in-string": "error",
    },
  },
];

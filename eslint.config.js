import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  { ignores: ["dist/", "node_modules/", ".venv/", "**/*.py"] },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,

  // Client files (React)
  {
    files: ["client/src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },

  // Server files — disable React compiler rule that leaks into non-React code
  {
    files: ["server/**/*.ts"],
    rules: {
      "preserve-caught-error": "off",
    },
  },

  // Shared rules for all TS files
  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      // Relax for gradual adoption — these can be tightened later
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
      }],
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/ban-ts-comment": "warn",
      "no-console": ["warn", { allow: ["warn", "error"] }],
      "prefer-const": "warn",
      "no-control-regex": "off",
      "no-useless-assignment": "warn",
      "no-useless-escape": "warn",
    },
  },
);

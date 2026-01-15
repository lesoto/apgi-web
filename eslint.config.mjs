import js from "@eslint/js";
import globals from "globals";

export default [
  js.configs.recommended,
  {
    files: ["**/*.js"],
    ignores: ["*.min.js", "dist/**", "node_modules/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        module: true,
        require: true,
        process: true,
        __dirname: true,
        gtag: "readonly",
        Stripe: "readonly",
        lucide: "readonly",
        logger: "readonly",
        quizData: "readonly",
        Chart: "readonly",
        fbq: "readonly",
        mixpanel: "readonly",
        React: "readonly",
        ReactDOM: "readonly",
        Plotly: "readonly",
        Recharts: "readonly",
        currentPath: "writable",
      },
    },
    rules: {
      "no-unused-vars": "off",
      "no-undef": "error",
      "no-useless-escape": "warn",
      "no-dupe-keys": "error",
      "no-case-declarations": "warn",
    },
  },
];

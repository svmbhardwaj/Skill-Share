import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Disabled: this new rule flags the standard async fetch-on-mount and
      // localStorage-restore patterns used across pages (setState happens after
      // await / in geolocation callbacks, not synchronously in the effect body).
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([".next/**"]),
]);

export default eslintConfig;
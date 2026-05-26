import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

let prettierConfig = [];
try {
  const mod = await import("eslint-config-prettier");
  prettierConfig = [mod.default ?? mod];
} catch {
  // Prettier config package is optional at load time.
}

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...prettierConfig,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

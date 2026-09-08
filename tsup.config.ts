import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/bin/cli.ts"],
  format: ["esm"],
  outDir: "dist",
  clean: true,
  splitting: false,
  sourcemap: true,
  minify: false,
  shims: true,
  bundle: true,
  // Externalize all dependencies - let Node.js resolve them at runtime
  // This avoids issues with CommonJS dynamic requires in bundled dependencies
  external: [
    // All production dependencies
    "@vitalets/google-translate-api",
    "@babel/parser",
    "@babel/types",
    "chalk",
    "commander",
    "fs-extra",
    "glob",
    "htmlparser2",
    "inquirer",
    "iso-639-1",
    "leven",
    "openai",
    "zod",
  ],
});

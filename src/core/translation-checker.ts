import path from "path";
import { hasUntranslatedHtmlText } from "./html-translation-checker.js";
import { hasUntranslatedJsxText } from "./jsx-translation-checker.js";

export const DEFAULT_TRANSLATION_FILES = "**/*.{html,htm,vue,jsx,tsx,js,ts}";

export function supportsTranslationCheck(file: string): boolean {
  return /\.(?:html?|vue|[jt]sx?)$/i.test(file);
}

export function hasUntranslatedText(file: string, content: string, patterns: RegExp[] = []): boolean {
  const extension = path.extname(file).toLowerCase();
  if ([".html", ".htm", ".vue"].includes(extension)) {
    return hasUntranslatedHtmlText(content, patterns, extension === ".vue");
  }
  return hasUntranslatedJsxText(content, patterns, extension !== ".ts");
}

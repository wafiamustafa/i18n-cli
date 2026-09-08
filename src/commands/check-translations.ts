import fs from "fs-extra";
import { glob } from "glob";
import chalk from "chalk";
import type { TranslationCheckContext } from "../context/types.js";
import { DEFAULT_TRANSLATION_FILES, hasUntranslatedText, supportsTranslationCheck } from "../core/translation-checker.js";

export interface CheckTranslationsOptions {
  files?: string;
}

export async function checkTranslationsCommand(
  context: TranslationCheckContext,
  checkOptions: CheckTranslationsOptions = {}
): Promise<string[]> {
  const pattern = checkOptions.files ?? DEFAULT_TRANSLATION_FILES;
  const files = (await glob(pattern, {
    nodir: true,
    ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/coverage/**"],
  })).filter(supportsTranslationCheck).sort();

  if (files.length === 0) {
    console.log(chalk.yellow(`No supported source files found matching "${pattern}".`));
    return [];
  }

  const untranslatedFiles: string[] = [];
  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    try {
      if (hasUntranslatedText(file, content, context.config.compiledUsagePatterns)) {
        untranslatedFiles.push(file);
      }
    } catch (error) {
      throw new Error(`Failed to check "${file}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  if (untranslatedFiles.length === 0) {
    console.log(chalk.green(`✔ No untranslated text found in ${files.length} file(s).`));
    return [];
  }

  console.log(chalk.yellow(`Files with untranslated text (${untranslatedFiles.length}):`));
  for (const file of untranslatedFiles) console.log(`  - ${file}`);

  if (context.options.ci) {
    throw new Error(`CI mode: ${untranslatedFiles.length} file(s) contain untranslated text.`);
  }

  return untranslatedFiles;
}

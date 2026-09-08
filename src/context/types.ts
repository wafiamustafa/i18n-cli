import type { I18nConfig } from "../config/types.js";
import type { FileManager } from "../core/file-manager.js";

export interface GlobalOptions {
  yes?: boolean;
  dryRun?: boolean;
  ci?: boolean;
  force?: boolean;
}

export interface CommandContext {
  config: I18nConfig;
  fileManager: FileManager;
  options: GlobalOptions;
}

export interface TranslationCheckContext {
  config: Pick<I18nConfig, "compiledUsagePatterns">;
  options: GlobalOptions;
}

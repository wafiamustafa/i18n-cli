import fs from "fs-extra";
import path from "path";
import { CONFIG_FILE_NAME, loadConfig } from "../config/config-loader.js";
import type { GlobalOptions, TranslationCheckContext } from "./types.js";

export async function buildCheckContext(options: GlobalOptions): Promise<TranslationCheckContext> {
  const config = await fs.pathExists(path.join(process.cwd(), CONFIG_FILE_NAME))
    ? await loadConfig()
    : { compiledUsagePatterns: [] };
  return { config, options };
}

import { readFileSync } from "node:fs";
import path from "node:path";
import { parse } from "dotenv";

type ApiKeyName = "GOOGLE_API_KEY" | "OPENAI_API_KEY";

/** Resolve CLI secrets without changing the project's process environment. */
export function resolveApiKey(name: ApiKeyName): string | undefined {
  if (process.env[name] !== undefined) {
    return process.env[name];
  }

  const customFile = process.env.I18N_CLI_ENV_FILE;
  if (customFile !== undefined) {
    if (!customFile.trim()) {
      throw new Error("I18N_CLI_ENV_FILE must specify an environment file path.");
    }
    return readEnvironmentFile(customFile, true)[name];
  }

  const mode = process.env.I18N_CLI_ENV ?? process.env.NODE_ENV ?? "development";
  if (!/^[a-zA-Z0-9_-]+$/.test(mode)) {
    throw new Error("I18N_CLI_ENV / NODE_ENV must be an environment name such as development, production, or staging.");
  }

  const files = [
    `.env.${mode}.local`,
    ...(mode === "test" ? [] : [".env.local"]),
    `.env.${mode}`,
    ".env"
  ];

  for (const file of files) {
    const value = readEnvironmentFile(file)[name];
    if (value !== undefined) {
      return value;
    }
  }

  return undefined;
}

function readEnvironmentFile(file: string, required = false): Record<string, string> {
  const filePath = path.resolve(process.cwd(), file);
  try {
    return parse(readFileSync(filePath));
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === "ENOENT" && !required) {
      return {};
    }
    throw new Error(`Cannot read environment file "${filePath}" (${code ?? "unknown error"}).`);
  }
}

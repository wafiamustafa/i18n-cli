#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { resolveApiKey } from "../config/environment.js";
import { buildContext } from "../context/build-context.js";
import { initCommand } from "../commands/init.js";
import { addLang } from "../commands/add-lang.js";
import { removeLangCommand } from "../commands/remove-lang.js";
import { addKeyCommand } from "../commands/add-key.js";
import { updateKeyCommand } from "../commands/update-key.js";
import { removeKeyCommand } from "../commands/remove-key.js";
import { cleanUnusedCommand } from "../commands/clean-unused.js";
import { validateCommand } from "../commands/validate.js";
import { GoogleTranslator } from "../providers/google.js";
import { OpenAITranslator } from "../providers/openai.js";
import type { Translator } from "../providers/translator.js";

const program = new Command();

program
  .name("i18n-ai-cli")
  .description("Professional CLI tool for managing translation files")
  .version("1.0.0");

// Global options helper
function withGlobalOptions(command: Command): Command {
  return command
    .option("-y, --yes", "Skip confirmation prompts")
    .option("--dry-run", "Preview changes without writing files")
    .option("--ci", "Run in CI mode (no prompts, exit on issues)")
    .option("-f, --force", "Force operation even if validation fails");
}

// Language Commands
withGlobalOptions(
  program
    .command("init")
    .description("Create an i18n-cli configuration file")
    .action(async (options) => {
      await initCommand(options);
    })
);

withGlobalOptions(
  program
    .command("add:lang <lang>")
    .option("--from <locale>", "Clone from existing locale")
    .option("--strict", "Enable strict mode")
    .description("Add new language locale")
    .action(async (lang, options) => {
      const context = await buildContext(options);
      await addLang(lang, options, context);
    })
);

withGlobalOptions(
  program
    .command("remove:lang")
    .argument("<lang>", "Language code to remove")
    .description("Remove a language translation file")
    .action(async (lang, options) => {
        const context = await buildContext(options);
        await removeLangCommand(context, lang);
    })
);

//
// Key Commands
//
withGlobalOptions(
  program
    .command("add:key")
    .argument("<key>", "Translation key (e.g., auth.login.title)")
    .requiredOption("-v, --value <value>", "Value for default locale")
    .option("-p, --provider <provider>", "Translation provider (google, openai)")
    .description("Add new translation key to all locales")
    .action(async (key, options) => {
        const context = await buildContext(options);

        let translator: Translator | undefined;

        if (options.provider) {
          const provider = options.provider as string;

          if (provider === "google") {
            translator = new GoogleTranslator();
          } else if (provider === "openai") {
            translator = new OpenAITranslator();
          } else {
            throw new Error(
              `Unknown translation provider "${provider}". Use "google" or "openai".`
            );
          }
        } else if (resolveApiKey("OPENAI_API_KEY") !== undefined) {
          translator = new OpenAITranslator();
        } else {
          translator = new GoogleTranslator();
        }

        await addKeyCommand(context, key, options, translator);
    })
);

withGlobalOptions(
  program
    .command("update:key")
    .argument("<key>", "Translation key")
    .requiredOption("-v, --value <value>", "New value")
    .option("-l, --locale <locale>", "Specific locale file to update (writes value as-is)")
    .option("-p, --provider <provider>", "Translation provider for syncing to other locales (google, openai)")
    .option("-s, --sync", "Sync the updated value to all other locales via translation")
    .description("Update translation key")
    .action(async (key, options) => {
        const context = await buildContext(options);

        let translator: Translator | undefined;

        if (options.sync) {
          if (options.provider) {
            const provider = options.provider as string;

            if (provider === "google") {
              translator = new GoogleTranslator();
            } else if (provider === "openai") {
              translator = new OpenAITranslator();
            } else {
              throw new Error(
                `Unknown translation provider "${provider}". Use "google" or "openai".`
              );
            }
          } else if (resolveApiKey("OPENAI_API_KEY") !== undefined) {
            translator = new OpenAITranslator();
          } else {
            translator = new GoogleTranslator();
          }
        }

        await updateKeyCommand(context, key, options, translator);
    })
);

withGlobalOptions(
  program
    .command("remove:key")
    .argument("<key>", "Translation key to remove")
    .description("Remove translation key from all locales")
    .action(async (key, options) => {
        const context = await buildContext(options);
        await removeKeyCommand(context, key);
    })
);

// Clean Command
withGlobalOptions(
  program
    .command("clean:unused")
    .description("Remove unused translation keys from all locales")
    .action(async (options) => {
        const context = await buildContext(options);
        await cleanUnusedCommand(context);
    })
);

// Validate Command
withGlobalOptions(
  program
    .command("validate")
    .description("Validate & auto-correct existing translation files")
    .option(
      "-p, --provider <provider>",
      "Translation provider for missing keys (google, openai)"
    )
    .action(async (options) => {
        const context = await buildContext(options);

        let translator: Translator | undefined;

        if (options.provider) {
          const provider = options.provider as string;

          if (provider === "google") {
            translator = new GoogleTranslator();
          } else if (provider === "openai") {
            translator = new OpenAITranslator();
          } else {
            throw new Error(
              `Unknown translation provider "${provider}". Use "google" or "openai".`
            );
          }
        } else if (resolveApiKey("OPENAI_API_KEY") !== undefined) {
          translator = new OpenAITranslator();
        } else {
          translator = new GoogleTranslator();
        }

        await validateCommand(context, { translator });
    })
);

// Global Error Handling
program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (err: any) {
  console.error(chalk.red("❌ Error:"), err.message);
  process.exitCode = 1;
}

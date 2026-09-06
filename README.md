# i18n-ai-cli

AI-powered CLI tool for managing translation files in internationalized applications. It detects and fixes missing translations automatically. Simplify your i18n workflow with automated key management, unused key detection, AI-powered translations via OpenAI and Google Translate, and flexible configuration.

[![npm version](https://img.shields.io/npm/v/i18n-ai-cli.svg)](https://www.npmjs.com/package/i18n-ai-cli)
[![License: Custom](https://img.shields.io/badge/License-Custom-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)

## ✨ Features

- **🤖 AI-Powered Translation**: OpenAI GPT & Google Translate integration
- **🌍 Language Management**: Add/remove locales with ISO 639-1 validation
- **🔑 Key Management**: Add, update, remove keys with auto-translation
- **🧹 Maintenance**: Unused key detection, structural validation, auto-correction
- **⚡ Developer Experience**: Dry run mode, CI/CD ready, TypeScript support

## 📦 Installation

```bash
npm install -g i18n-ai-cli
```

Or locally (recommended):
```bash
npm install --save-dev i18n-ai-cli
```

Then use with `npx i18n-ai-cli` or add to package.json scripts.

**Prerequisites:** Node.js 18+

## 🚀 Quick Start

```bash
# Initialize configuration
i18n-ai-cli init

# Add a language
i18n-ai-cli add:lang es --from en

# Add a translation key
i18n-ai-cli add:key welcome.message --value "Welcome to our app"

# Update and sync translations
i18n-ai-cli update:key welcome.message --value "Welcome!" --sync

# Clean unused keys
i18n-ai-cli clean:unused

# Validate files
i18n-ai-cli validate
```

## ⚙️ Configuration

Create `i18n-cli.config.json`:
```bash
i18n-ai-cli init
```

Example config:
```json
{
  "localesPath": "./locales",
  "defaultLocale": "en",
  "supportedLocales": ["en", "es", "fr", "de"],
  "keyStyle": "nested",
  "usagePatterns": [
    "t\\(['\"](?<key>.*?)['\"]\\)",
    "translate\\(['\"](?<key>.*?)['\"]\\)"
  ],
  "autoSort": true
}
```

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `localesPath` | `string` | Yes | Directory containing translation files |
| `defaultLocale` | `string` | Yes | Default/source language code |
| `supportedLocales` | `string[]` | Yes | List of supported language codes |
| `keyStyle` | `"flat"` \| `"nested"` | No | Key structure style (default: "nested") |
| `usagePatterns` | `string[]` | No | Regex patterns to detect key usage |
| `autoSort` | `boolean` | No | Auto-sort keys alphabetically (default: true) |

## 📖 Usage Reference

### Initialize Configuration

```bash
i18n-ai-cli init
```

**Options:** `-f, --force` (overwrite), `-y, --yes` (skip prompts)

### Language Management Commands

#### Add a New Language

```bash
i18n-ai-cli add:lang <lang-code> [--from <locale>] [--strict]
```

**Examples:**
```bash
i18n-ai-cli add:lang fr
i18n-ai-cli add:lang de --from en
i18n-ai-cli add:lang pt-BR --strict
```

**Options:**
- `--from <locale>`: Clone and auto-translate from existing locale
- `--strict`: Enable strict validation
- `-y, --yes`: Skip confirmation
- `--dry-run`: Preview changes

**What it does:** Validates language code, creates locale file, updates config.

#### Remove a Language

```bash
i18n-ai-cli remove:lang <lang-code>
```

**Example:**
```bash
i18n-ai-cli remove:lang fr
```

**Options:** `-y, --yes`, `--dry-run`

### Key Management Commands

#### Add a New Translation Key

```bash
i18n-ai-cli add:key <key> --value <value> [--provider <provider>]
```

**Examples:**
```bash
i18n-ai-cli add:key auth.login.title --value "Login"
i18n-ai-cli add:key welcome.message --value "Welcome" --provider openai
```

**Options:**
- `-v, --value <value>`: **Required**. Value for default locale
- `-p, --provider <provider>`: Translation provider (`openai` or `google`)
- `-y, --yes`: Skip confirmation
- `--dry-run`: Preview changes

**What it does:** Adds key to all locales with auto-translation.

#### Update a Translation Key

```bash
i18n-ai-cli update:key <key> --value <value> [--locale <locale>] [--sync] [--provider <provider>]
```

**Examples:**
```bash
i18n-ai-cli update:key auth.login.title --value "Sign In"
i18n-ai-cli update:key auth.login.title --value "Anmelden" --locale de
i18n-ai-cli update:key welcome.message --value "Welcome" --sync
```

**Options:**
- `-v, --value <value>`: **Required**. New value
- `-l, --locale <locale>`: Specific locale to update (default: default locale)
- `-s, --sync`: Translate to all other locales
- `-p, --provider <provider>`: Provider for syncing
- `-y, --yes`, `--dry-run`

**What it does:** Updates key and optionally syncs translations.

#### Remove a Translation Key

```bash
i18n-ai-cli remove:key <key>
```

**Example:**
```bash
i18n-ai-cli remove:key auth.legacy.title
```

**Options:** `-y, --yes`, `--dry-run`

### Validation & Maintenance Commands

#### Validate Translation Files

```bash
i18n-ai-cli validate [--provider <provider>]
```

**Examples:**
```bash
i18n-ai-cli validate
export OPENAI_API_KEY=sk-your-api-key-here
i18n-ai-cli validate --provider openai
i18n-ai-cli validate --provider google
```

**Options:**
- `-p, --provider <provider>`: Provider for auto-translating missing keys
- `-y, --yes`, `--dry-run`, `--ci`: CI mode (non-interactive, fails on issues)

**What it does:** Validates files, detects missing/extra/type-mismatched keys, auto-corrects.

#### Clean Unused Keys

```bash
i18n-ai-cli clean:unused
```

**Options:** `-y, --yes`, `--dry-run`, `--ci`

**What it does:** Scans source code using `usagePatterns`, removes unused keys from all locales.

## 🌐 Global Options

| Option | Description |
|--------|-------------|
| `-y, --yes` | Skip confirmation prompts |
| `--dry-run` | Preview changes without writing files |
| `--ci` | CI mode (non-interactive; fails if changes would be made) |
| `-f, --force` | Force operation even if validation fails |

**Examples:**
```bash
i18n-ai-cli clean:unused --dry-run
i18n-ai-cli validate --ci --dry-run
i18n-ai-cli remove:key auth.legacy --yes
```

## 💡 Usage Examples

### Basic Workflow
```bash
i18n-ai-cli init
i18n-ai-cli add:lang de --from en
i18n-ai-cli add:key auth.login.title --value "Login"
i18n-ai-cli update:key auth.login.title --value "Sign In" --sync
i18n-ai-cli clean:unused --dry-run
i18n-ai-cli validate --provider openai
```

### Auto-Translation
```bash
# Uses OpenAI if OPENAI_API_KEY is set, else Google
i18n-ai-cli add:key welcome.message --value "Welcome"

# Specify provider
i18n-ai-cli add:key welcome.message --value "Welcome" --provider openai
i18n-ai-cli update:key welcome.message --value "Willkommen" --locale de --sync --provider openai
```

### CI/CD Integration
```bash
# Check without modifying
i18n-ai-cli clean:unused --ci --dry-run

# Apply in pipeline
i18n-ai-cli clean:unused --ci --yes
i18n-ai-cli validate --ci --yes
```

## 🤖 Translation Providers

### Available Providers

| Provider | Description | Cost |
|----------|-------------|------|
| **OpenAI** | GPT models, context-aware translations | Paid |
| **Google Translate (personal)** | Unofficial translation via `@vitalets/google-translate-api`; personal, non-commercial use only | No API key required |
| **Google Cloud Translation (commercial)** | Official Google Cloud Translation Basic (v2), selected when `GOOGLE_API_KEY` is set | Google Cloud billing applies |

### Provider Selection

1. **Explicit `--provider` flag** (highest priority)
2. **`OPENAI_API_KEY` in the environment or project `.env` files** → uses OpenAI
3. **Fallback to Google Translate** → official Cloud Translation when `GOOGLE_API_KEY` is set; otherwise the unofficial integration for personal, non-commercial use only

For commercial Google translation, set `GOOGLE_API_KEY` before running translation commands. The CLI selects the Google backend based on the key; it does not detect whether your project is commercial.

### Persistent API Keys (All Frameworks)

Create a `.env` file beside `i18n-cli.config.json` and run the CLI from that project directory. This works the same way for Angular, React, Vite, Next.js, Vue, and other projects; no framework plugin or repeated shell export is needed.

```dotenv
# Add only the keys for providers you use.
GOOGLE_API_KEY=your-google-cloud-api-key
OPENAI_API_KEY=your-openai-api-key
```

```bash
i18n-ai-cli validate --provider google
i18n-ai-cli validate --provider openai
```

If both keys are present, OpenAI is selected by default. Use `--provider google` to select Google explicitly. A configured but empty key raises an error.

Both providers use this priority, from highest to lowest:

1. The provider's explicit `apiKey` constructor option.
2. The shell or CI environment variable (`GOOGLE_API_KEY` / `OPENAI_API_KEY`).
3. `.env.<mode>.local`.
4. `.env.local` (skipped in `test` mode).
5. `.env.<mode>`.
6. `.env`.

The CLI's mode is `I18N_CLI_ENV`, then `NODE_ENV`, then `development`. These are the CLI's lookup rules; it does not infer the mode from Angular build configurations or a frontend dev server. Missing files are skipped, and each key resolves independently. Existing shell values are never overwritten. Quoted values, comments, and `export KEY=value` syntax are supported; `${VARIABLE}` expansion is not performed.

```bash
# Read .env.production.local / .env.local / .env.production / .env
I18N_CLI_ENV=production i18n-ai-cli validate --provider google

# Use a specific dotenv file instead of the default file search
I18N_CLI_ENV_FILE=./config/translation.env i18n-ai-cli validate --provider google
```

`I18N_CLI_ENV` and `I18N_CLI_ENV_FILE` are shell/CI settings. An explicit file path is relative to the current project directory (absolute paths also work); a missing explicit file raises an error. Shell API keys still take precedence. The resolver reads file values for the CLI without copying them into `process.env`.

Keep the names **unprefixed**. Do not put these secrets in Angular's `src/environments/environment.ts` or use `VITE_`, `REACT_APP_`, or `NEXT_PUBLIC_` prefixes, which expose values to browser code. The CLI does not read those aliases or execute frontend configuration files. See [Angular's environment guidance](https://angular.dev/tools/cli/environments) and [Vite's environment guidance](https://vite.dev/guide/env-and-mode).

Add secret files to your project's `.gitignore`:

```gitignore
.env
.env.*
!.env.example
```

For a custom file such as `config/translation.env`, ignore that path as well. This repository includes a commented `.env.example` you can copy and fill in locally.

### OpenAI Provider Setup

1. Get API key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Add `OPENAI_API_KEY` to your project `.env` file as described above, or set a shell environment variable:
   ```bash
   export OPENAI_API_KEY=sk-your-api-key-here
   ```
3. Use in commands:
   ```bash
   i18n-ai-cli add:key welcome --value "Welcome"  # Uses OpenAI automatically
   i18n-ai-cli validate --provider openai
   ```

**Models:** `gpt-4o` (best), `gpt-4o-mini` (fast), `gpt-3.5-turbo` (default)

### Google Translate Provider

For **personal, non-commercial use**, no key is required. When Google is selected and `GOOGLE_API_KEY` is absent, the provider uses `@vitalets/google-translate-api`.

```bash
# Personal, non-commercial use only when no GOOGLE_API_KEY is set
i18n-ai-cli add:key welcome --value "Welcome" --provider google
```

For **commercial use of Google translation**, you must use the official Google Cloud Translation API:

1. Follow the [Google Cloud Translation setup guide](https://docs.cloud.google.com/translate/docs/setup) to create or select a Google Cloud project, enable billing, and enable the Cloud Translation API.
2. Create an API key and restrict it to the Cloud Translation API and your application's usage where applicable. See [Google's API key guidance](https://docs.cloud.google.com/docs/authentication/api-keys).
3. Add `GOOGLE_API_KEY` to your project `.env` file, export it in your shell, or configure it as a CI secret:

   ```bash
   export GOOGLE_API_KEY="your-google-cloud-api-key"
   i18n-ai-cli add:key welcome --value "Welcome" --provider google
   i18n-ai-cli validate --provider google
   ```

With a key configured, the provider calls [Google Cloud Translation Basic (v2)](https://docs.cloud.google.com/translate/docs/reference/rest/v2/translate) and sends the key in an authentication header. A failed Cloud request raises an error; it never falls back to the unofficial integration. Google Cloud terms, billing, and quotas apply. Personal users can also choose this backend by setting a key.

When constructing `GoogleTranslator` directly, its `apiKey` option takes precedence over `GOOGLE_API_KEY` in the shell or project `.env` files. The `host` and `fetchOptions` options apply only to the unofficial backend. Keep API keys out of source control.

The project's personal-use permission does not override Google's service terms. The [unofficial package's own documentation](https://github.com/vitalets/google-translate-api#readme) directs users to the official API and describes the package as intended for pet projects and prototyping.

## 💻 Programmatic API

```typescript
import { loadConfig } from 'i18n-ai-cli/config/config-loader';
import { FileManager } from 'i18n-ai-cli/core/file-manager';
import { TranslationService } from 'i18n-ai-cli/services';
import { OpenAITranslator } from 'i18n-ai-cli/providers';

const config = await loadConfig();
const fileManager = new FileManager(config);

// Read/write locale files
const enTranslations = await fileManager.readLocale('en');
await fileManager.writeLocale('en', { greeting: 'Hello' }, { dryRun: false });

// Translate
const translator = new OpenAITranslator({ apiKey: 'sk-your-key' });
const service = new TranslationService(translator);
const translated = await service.translate({
  text: 'Welcome',
  targetLocale: 'es',
  sourceLocale: 'en',
});
```

**Available APIs:** `loadConfig()`, `FileManager`, `TranslationService`, `OpenAITranslator`, `GoogleTranslator`, `KeyValidator`, `buildContext()`

## 🛠️ Development

### Setup

```bash
git clone https://github.com/wafiamustafa/i18n-cli.git
cd i18n-cli
npm install
```

### Build & Test

```bash
npm run build          # Build
npm run dev            # Watch mode
npm test               # Run tests
npm run typecheck      # Type checking
```

### Local Testing

```bash
npm link
i18n-ai-cli --help
npm unlink -g i18n-ai-cli
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 🤝 Contributing

Pull requests welcome! 

- **Report bugs**: [GitHub Issues](https://github.com/wafiamustafa/i18n-cli/issues)
- **Discussions**: [GitHub Discussions](https://github.com/wafiamustafa/i18n-cli/discussions)
- **Contact**: wafiamustafa@gmail.com

## 📄 License

[Custom license](LICENSE) — no license fee for personal or commercial use, subject to the Google translation conditions:

- **Personal, non-commercial use:** the unofficial `@vitalets/google-translate-api` integration is permitted under this project's license, subject to Google's terms.
- **Commercial Google translation:** a valid Google Cloud API key and the official Google Cloud Translation API are required. The unofficial integration is not permitted.
- **Other providers:** their own terms apply; a Google key is not required when Google translation is not used.

This is a custom license with a use restriction, not the standard ISC license. Third-party dependencies retain their own licenses. Earlier ISC releases retain their original license.

---

**Made with ❤️ by Wafia Mustafa R. and contributors**

[![npm version](https://img.shields.io/npm/v/i18n-ai-cli.svg)](https://www.npmjs.com/package/i18n-ai-cli)
[![GitHub stars](https://img.shields.io/github/stars/wafiamustafa/i18n-cli.svg)](https://github.com/wafiamustafa/i18n-cli/stargazers)
[![License](https://img.shields.io/badge/License-Custom-blue.svg)](LICENSE)

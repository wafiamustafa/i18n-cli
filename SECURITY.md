# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the latest version of i18n-ai-cli.

| Version | Supported          |
| ------- | ------------------ |
| Latest  | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of i18n-ai-cli seriously. If you believe you've found a security vulnerability, please follow these guidelines:

### How to Report

**Email**: Send a detailed report to **wafiamustafa@gmail.com**

**Subject Line**: `[Security Vulnerability] Brief description`

### What to Include

Please provide as much information as possible:

1. **Description**: Clear description of the vulnerability
2. **Impact**: Potential impact if exploited
3. **Reproduction Steps**: Detailed steps to reproduce the issue
4. **Affected Versions**: Which versions are affected
5. **Suggested Fix**: If you have suggestions for addressing the issue
6. **Your Contact Info**: Name and preferred contact method (optional but helpful)

### Response Time

- **Acknowledgment**: You will receive a confirmation within **48 hours**
- **Initial Assessment**: We will respond with our initial assessment within **5 business days**
- **Updates**: You will receive updates at least every **7 business days**
- **Resolution**: We aim to resolve critical issues within **30 days**

### What to Expect

1. **Confidentiality**: Your report will be kept confidential
2. **No Retaliation**: We do not retaliate against good-faith reporters
3. **Credit**: We will credit you for the discovery (unless you prefer to remain anonymous)
4. **Communication**: We will keep you informed of our progress

## Security Best Practices

When using i18n-ai-cli, please follow these security best practices:

### API Key Management

**OpenAI and Google Cloud API Keys:**
- ✅ **DO**: Store API keys in environment variables or `.env` files
- ✅ **DO**: Add `.env`, `.env.*`, and any custom secret file to your `.gitignore` file
- ✅ **DO**: Rotate API keys periodically
- ❌ **DON'T**: Commit API keys to version control
- ❌ **DON'T**: Hardcode API keys in source code
- ❌ **DON'T**: Share API keys publicly

**Example:**
```bash
# Recommended
export OPENAI_API_KEY=sk-your-api-key-here
export GOOGLE_API_KEY=your-google-cloud-api-key

# Or use a .env file (add to .gitignore)
OPENAI_API_KEY=sk-your-api-key-here
GOOGLE_API_KEY=your-google-cloud-api-key
```

Both providers automatically read project `.env` files using the same [lookup rules](README.md#persistent-api-keys-all-frameworks). Shell and CI variables take precedence. Keep keys unprefixed and outside Angular `environment.ts` and browser-public `VITE_`, `REACT_APP_`, or `NEXT_PUBLIC_` variables.

### File Permissions

- Ensure locale files have appropriate read/write permissions
- Restrict access to configuration files containing sensitive data
- Use file system permissions to protect translation files in production

### Data Handling

**What i18n-ai-cli Processes:**
- Translation JSON files in your project
- Source code files (for unused key detection)
- API keys for translation providers

**Data Storage:**
- All data is stored locally in your project directory
- No data is sent to third-party services except through official translation APIs
- Configuration is stored in `i18n-cli.config.json` in your project root

**Network Requests:**
- Translation requests go directly to OpenAI or Google Translate APIs
- No intermediate servers or proxies are used
- API endpoints:
  - OpenAI: `https://api.openai.com/v1`
  - Google Cloud Translation (with `GOOGLE_API_KEY`): `https://translation.googleapis.com/language/translate/v2`
  - Unofficial Google Translate (personal, non-commercial use only, without a key): `https://translate.google.com`

### Dependency Security

We maintain secure dependencies:

- Regular dependency audits via `npm audit`
- Prompt updates for security patches
- Use of locked dependency versions in `package-lock.json`

**To check for vulnerabilities in your installation:**
```bash
npm audit
npm audit fix
```

## Known Security Considerations

### Translation Provider APIs

**OpenAI Integration:**
- Requires valid API key with billing setup
- Subject to OpenAI's rate limits and usage policies
- Review OpenAI's [security documentation](https://platform.openai.com/docs/security)

**Google Translate Integration:**
- With `GOOGLE_API_KEY` (or the provider's `apiKey` option), uses the official Google Cloud Translation API and sends the key in an authentication header.
- Commercial Google translation must use the official API with a valid key, enabled billing, and compliance with Google's terms and quotas.
- Without a key, uses `@vitalets/google-translate-api` for personal, non-commercial use only, subject to Google's terms and rate limits.
- Failed official API requests never fall back to the unofficial integration.

### File System Access

The CLI requires read/write access to:
- Locale directory (configured in `localesPath`)
- Configuration file (`i18n-cli.config.json`)
- Source code directories (for `clean:unused` command)

Ensure these directories have appropriate permissions.

## Security Features

### Input Validation

- Language codes validated against ISO 639-1 standard
- Translation keys validated for proper format
- JSON structure validation prevents malformed files

### Confirmation Prompts

- Destructive operations require explicit confirmation
- `--yes` flag bypasses prompts (use carefully in automation)
- `--dry-run` mode previews changes before applying

### Non-Interactive Mode

- CI/CD pipelines can use `--ci` flag for non-interactive validation
- Deterministic exit codes for automated workflows
- No interactive prompts in CI mode

## Incident Response Process

When a security vulnerability is reported:

1. **Triage**: Assess severity and impact
2. **Investigation**: Reproduce and analyze the issue
3. **Fix Development**: Create and test a patch
4. **Release**: Publish updated version with security advisory
5. **Disclosure**: Coordinate public disclosure with reporter

## Security Updates

Security updates are released as patch versions (e.g., `1.0.8` → `1.0.9`).

**To stay updated:**
- Watch the repository on GitHub for security advisories
- Update regularly: `npm update i18n-ai-cli`
- Review CHANGELOG for security-related fixes

## Scope

**In Scope:**
- The i18n-ai-cli npm package
- Official CLI commands and programmatic API
- Translation provider integrations
- Configuration file handling

**Out of Scope:**
- Third-party translation providers' security (OpenAI, Google)
- Vulnerabilities in dependencies (report to respective projects)
- Issues in forked or modified versions

## Legal Notice

This security policy is part of our commitment to maintaining a secure project. By reporting or using i18n-ai-cli, you agree to:

- Act in good faith when reporting vulnerabilities
- Not exploit discovered vulnerabilities maliciously
- Respect responsible disclosure practices
- Comply with applicable laws and regulations

## Contact

**Security Questions**: wafiamustafa@gmail.com  
**Bug Reports**: https://github.com/wafiamustafa/i18n-cli/issues  
**General Inquiries**: https://github.com/wafiamustafa/i18n-cli/discussions

---

*Last updated: March 28, 2026*

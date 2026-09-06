import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveApiKey } from '../../src/config/environment.js';
import { GoogleTranslator } from '../../src/providers/google.js';
import { OpenAITranslator } from '../../src/providers/openai.js';
import OpenAI from 'openai';

vi.mock('openai', () => ({ default: vi.fn(function () {}) }));

describe('project environment API keys', () => {
  let project: string;
  const writeEnv = (file: string, content: string) => writeFileSync(path.join(project, file), content);

  beforeEach(() => {
    project = mkdtempSync(path.join(tmpdir(), 'i18n-cli-env-'));
    vi.spyOn(process, 'cwd').mockReturnValue(project);
    for (const name of ['GOOGLE_API_KEY', 'OPENAI_API_KEY', 'NODE_ENV', 'I18N_CLI_ENV', 'I18N_CLI_ENV_FILE']) {
      vi.stubEnv(name, undefined);
    }
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    rmSync(project, { recursive: true, force: true });
  });

  it('reads both keys using dotenv quoting, comments, export, and CRLF syntax', () => {
    writeEnv('.env', 'export GOOGLE_API_KEY="google#key" # comment\r\nOPENAI_API_KEY=\'openai-key\'\r\n');
    expect(resolveApiKey('GOOGLE_API_KEY')).toBe('google#key');
    expect(resolveApiKey('OPENAI_API_KEY')).toBe('openai-key');
    expect(process.env.GOOGLE_API_KEY).toBeUndefined();
    expect(process.env.OPENAI_API_KEY).toBeUndefined();
  });

  it('returns undefined when no key is configured', () => {
    expect(resolveApiKey('GOOGLE_API_KEY')).toBeUndefined();
  });

  it.each(['shell-key', ''])('preserves the shell value even when it is empty: %j', (key) => {
    writeEnv('.env.local', 'GOOGLE_API_KEY=file-key');
    vi.stubEnv('GOOGLE_API_KEY', key);
    expect(resolveApiKey('GOOGLE_API_KEY')).toBe(key);
  });

  it.each([
    ['.env'],
    ['.env', '.env.development'],
    ['.env', '.env.development', '.env.local'],
    ['.env', '.env.development', '.env.local', '.env.development.local']
  ].map(files => ({ files })))('applies file precedence: $files', ({ files }) => {
    for (const file of files) writeEnv(file, `GOOGLE_API_KEY=${file}`);
    expect(resolveApiKey('GOOGLE_API_KEY')).toBe(files.at(-1));
  });

  it('resolves each key independently across files', () => {
    writeEnv('.env.local', 'GOOGLE_API_KEY=local-google');
    writeEnv('.env', 'GOOGLE_API_KEY=base-google\nOPENAI_API_KEY=base-openai');
    expect(resolveApiKey('GOOGLE_API_KEY')).toBe('local-google');
    expect(resolveApiKey('OPENAI_API_KEY')).toBe('base-openai');
  });

  it('uses the CLI environment override before NODE_ENV', () => {
    vi.stubEnv('NODE_ENV', 'production');
    writeEnv('.env.production', 'GOOGLE_API_KEY=production-key');
    writeEnv('.env.staging', 'GOOGLE_API_KEY=staging-key');
    expect(resolveApiKey('GOOGLE_API_KEY')).toBe('production-key');
    vi.stubEnv('I18N_CLI_ENV', 'staging');
    expect(resolveApiKey('GOOGLE_API_KEY')).toBe('staging-key');
  });

  it('skips .env.local in test mode', () => {
    vi.stubEnv('NODE_ENV', 'test');
    writeEnv('.env.local', 'GOOGLE_API_KEY=local-key');
    writeEnv('.env.test', 'GOOGLE_API_KEY=test-key');
    expect(resolveApiKey('GOOGLE_API_KEY')).toBe('test-key');
  });

  it('supports an explicit dotenv file without falling back to default files', () => {
    writeEnv('translation.env', 'GOOGLE_API_KEY=custom-key');
    writeEnv('.env', 'OPENAI_API_KEY=default-key');
    vi.stubEnv('I18N_CLI_ENV_FILE', 'translation.env');
    expect(resolveApiKey('GOOGLE_API_KEY')).toBe('custom-key');
    expect(resolveApiKey('OPENAI_API_KEY')).toBeUndefined();
    vi.stubEnv('I18N_CLI_ENV_FILE', path.join(project, 'translation.env'));
    expect(resolveApiKey('GOOGLE_API_KEY')).toBe('custom-key');
  });

  it('reports a missing explicitly configured file', () => {
    vi.stubEnv('I18N_CLI_ENV_FILE', 'missing.env');
    expect(() => resolveApiKey('GOOGLE_API_KEY')).toThrow('Cannot read environment file');
  });

  it('reports unreadable files instead of silently falling back', () => {
    mkdirSync(path.join(project, '.env.local'));
    writeEnv('.env', 'GOOGLE_API_KEY=fallback-key');
    expect(() => resolveApiKey('GOOGLE_API_KEY')).toThrow('Cannot read environment file');
  });

  it('rejects invalid mode and empty custom path settings', () => {
    vi.stubEnv('I18N_CLI_ENV', '../production');
    expect(() => resolveApiKey('GOOGLE_API_KEY')).toThrow('must be an environment name');
    vi.stubEnv('I18N_CLI_ENV_FILE', '  ');
    expect(() => resolveApiKey('GOOGLE_API_KEY')).toThrow('must specify an environment file path');
  });

  it('does not read browser-public aliases or execute Angular environment files', () => {
    writeEnv('.env', 'VITE_GOOGLE_API_KEY=public-key\nREACT_APP_OPENAI_API_KEY=public-key\nNEXT_PUBLIC_OPENAI_API_KEY=public-key');
    mkdirSync(path.join(project, 'src/environments'), { recursive: true });
    writeEnv('src/environments/environment.ts', 'throw new Error("must not execute")');
    expect(resolveApiKey('GOOGLE_API_KEY')).toBeUndefined();
    expect(resolveApiKey('OPENAI_API_KEY')).toBeUndefined();
  });

  it('passes the .env OpenAI key to the SDK and allows an explicit override', () => {
    writeEnv('.env', 'OPENAI_API_KEY=file-openai');
    new OpenAITranslator();
    expect(OpenAI).toHaveBeenLastCalledWith({ apiKey: 'file-openai' });
    new OpenAITranslator({ apiKey: 'explicit-openai' });
    expect(OpenAI).toHaveBeenLastCalledWith({ apiKey: 'explicit-openai' });
  });

  it('routes the .env Google key to the official API and allows an explicit override', async () => {
    writeEnv('.env', 'GOOGLE_API_KEY=file-google');
    const fetchMock = vi.fn().mockImplementation(async () => new Response(JSON.stringify({
      data: { translations: [{ translatedText: 'Hola' }] }
    })));
    vi.stubGlobal('fetch', fetchMock);
    const request = { text: 'Hello', targetLocale: 'es' };
    await new GoogleTranslator().translate(request);
    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://translation.googleapis.com/language/translate/v2',
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Goog-Api-Key': 'file-google' }) })
    );
    await new GoogleTranslator({ apiKey: 'explicit-google' }).translate(request);
    expect(fetchMock).toHaveBeenLastCalledWith(
      'https://translation.googleapis.com/language/translate/v2',
      expect.objectContaining({ headers: expect.objectContaining({ 'X-Goog-Api-Key': 'explicit-google' }) })
    );
  });

  it('rejects blank file keys rather than silently switching providers', async () => {
    writeEnv('.env', 'GOOGLE_API_KEY=" "\nOPENAI_API_KEY=');
    expect(() => new OpenAITranslator()).toThrow('OpenAI API key is required');
    await expect(new GoogleTranslator().translate({ text: 'Hello', targetLocale: 'es' }))
      .rejects.toThrow('Google API key cannot be empty');
  });
});

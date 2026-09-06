export interface TranslationRequest {
  text: string;
  targetLocale: string;
  sourceLocale?: string;
  context?: string;
}

export interface TranslationResult {
  text: string;
  detectedSourceLocale?: string;
  provider: string;
}

export interface Translator {
  readonly name: string;
  translate(request: TranslationRequest): Promise<TranslationResult>;
}

export interface GoogleTranslatorOptions {
  from?: string;
  to?: string;
  /** Unofficial personal-use backend only. */
  host?: string;
  /** Unofficial personal-use backend only. */
  fetchOptions?: Record<string, unknown>;
  /** Selects Google Cloud Translation Basic (v2); falls back to GOOGLE_API_KEY in the environment or project .env files. */
  apiKey?: string;
}

export interface OpenAITranslatorOptions {
  /** Falls back to OPENAI_API_KEY in the environment or project .env files. */
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface AIProvider {
  translate(
    text: string,
    from: string,
    to: string,
    context?: string
  ): Promise<string>;

  suggestKey(
    text: string,
    namespace?: string
  ): Promise<string>;
}

export interface LocaleIssues {
  missingKeys: string[];
  extraKeys: string[];
  typeMismatches: { key: string; expected: string; actual: string }[];
}

export interface ValidationReport {
  locale: string;
  issues: LocaleIssues;
}

export interface ValidateOptions {
  translator?: Translator | undefined;
}

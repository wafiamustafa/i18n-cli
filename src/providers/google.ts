import { translate } from "@vitalets/google-translate-api";
import { z } from "zod";
import { resolveApiKey } from "../config/environment.js";
import type {
  Translator,
  TranslationRequest,
  TranslationResult,
  GoogleTranslatorOptions
} from "./translator.js";

const CloudTranslationResponse = z.object({
  data: z.object({
    translations: z.array(z.object({
      translatedText: z.string(),
      detectedSourceLanguage: z.string().optional()
    })).min(1)
  })
});

export class GoogleTranslator implements Translator {
  readonly name = "google";
  private options: GoogleTranslatorOptions;

  constructor(options: GoogleTranslatorOptions = {}) {
    this.options = options;
  }

  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const { text, targetLocale, sourceLocale } = request;
    const { from, host, fetchOptions } = this.options;
    const apiKey = this.options.apiKey ?? resolveApiKey("GOOGLE_API_KEY");

    if (apiKey !== undefined) {
      if (!apiKey.trim()) {
        throw new Error("Google API key cannot be empty. Set a valid GOOGLE_API_KEY for Google Cloud Translation.");
      }
      return this.translateWithCloud(request, apiKey.trim());
    }

    const translateOptions: {
      to: string;
      from?: string;
      host?: string;
      fetchOptions?: Record<string, unknown>;
    } = { to: targetLocale };

    if (host !== undefined) {
      translateOptions.host = host;
    }

    if (fetchOptions !== undefined) {
      translateOptions.fetchOptions = fetchOptions;
    }

    if (sourceLocale !== undefined) {
      translateOptions.from = sourceLocale;
    } else if (from !== undefined) {
      translateOptions.from = from;
    }

    const result = await translate(text, translateOptions);

    return {
      text: result.text,
      detectedSourceLocale: result.raw?.src,
      provider: this.name
    };
  }

  async translateWithCloud(
    request: TranslationRequest,
    apiKey: string
  ): Promise<TranslationResult> {
    const source = request.sourceLocale ?? this.options.from;
    const response = await fetch("https://translation.googleapis.com/language/translate/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey
      },
      body: JSON.stringify({
        q: request.text,
        target: request.targetLocale,
        format: "text",
        ...(source && source !== "auto" ? { source } : {})
      })
    });

    if (!response.ok) {
      throw new Error(
        `Google Cloud Translation request failed (HTTP ${response.status}). ` +
        "Check your API key, Cloud Translation API access, billing, and quota."
      );
    }

    const parsed = CloudTranslationResponse.safeParse(await response.json());
    if (!parsed.success) {
      throw new Error("Google Cloud Translation returned an invalid translation response.");
    }

    const translation = parsed.data.data.translations[0]!;
    return {
      text: translation.translatedText,
      ...(translation.detectedSourceLanguage !== undefined
        ? { detectedSourceLocale: translation.detectedSourceLanguage }
        : {}),
      provider: this.name
    };
  }
}

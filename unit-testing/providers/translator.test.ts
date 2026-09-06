import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GoogleTranslator } from '../../src/providers/google.js';
import { DeeplTranslator } from '../../src/providers/deepl.js';
import { OpenAITranslator } from '../../src/providers/openai.js';
import type { TranslationRequest } from '../../src/providers/translator.js';

// File resolution has separate integration tests; ignore developers' real .env files here.
vi.mock('../../src/config/environment.js', () => ({
  resolveApiKey: (name: string) => process.env[name]
}));

// Mock the google translate API
vi.mock('@vitalets/google-translate-api', () => ({
  translate: vi.fn()
}));

// Mock the openai SDK
const mockCreate = vi.fn();
vi.mock('openai', () => {
  const MockOpenAI = vi.fn(function (this: any) {
    this.chat = {
      completions: {
        create: mockCreate,
      },
    };
  });
  return { default: MockOpenAI };
});

import { translate } from '@vitalets/google-translate-api';
import OpenAI from 'openai';

describe('Translator Providers', () => {
  describe('GoogleTranslator', () => {
    beforeEach(() => {
      vi.resetAllMocks();
      vi.stubEnv('GOOGLE_API_KEY', undefined);
    });

    afterEach(() => {
      vi.unstubAllEnvs();
    });

    it('should have correct name', () => {
      const translator = new GoogleTranslator();
      expect(translator.name).toBe('google');
    });

    it('should translate text with source locale', async () => {
      const mockResult = {
        text: 'Hola mundo',
        raw: { src: 'en' }
      } as any;
      vi.mocked(translate).mockResolvedValue(mockResult);

      const translator = new GoogleTranslator();
      const request: TranslationRequest = {
        text: 'Hello world',
        targetLocale: 'es',
        sourceLocale: 'en'
      };

      const result = await translator.translate(request);

      expect(translate).toHaveBeenCalledWith('Hello world', {
        to: 'es',
        from: 'en'
      });
      expect(result).toEqual({
        text: 'Hola mundo',
        detectedSourceLocale: 'en',
        provider: 'google'
      });
    });

    it('should translate text without source locale (auto-detect)', async () => {
      const mockResult = {
        text: 'Hola mundo',
        raw: { src: 'en' }
      } as any;
      vi.mocked(translate).mockResolvedValue(mockResult);

      const translator = new GoogleTranslator();
      const request: TranslationRequest = {
        text: 'Hello world',
        targetLocale: 'es'
      };

      const result = await translator.translate(request);

      expect(translate).toHaveBeenCalledWith('Hello world', {
        to: 'es'
      });
      expect(result.text).toBe('Hola mundo');
    });

    it('should use default options when provided', async () => {
      const mockResult = {
        text: 'Hola mundo',
        raw: { src: 'en' }
      } as any;
      vi.mocked(translate).mockResolvedValue(mockResult);

      const translator = new GoogleTranslator({
        from: 'en',
        host: 'translate.google.com',
        fetchOptions: { headers: { 'User-Agent': 'test' } }
      });

      const request: TranslationRequest = {
        text: 'Hello world',
        targetLocale: 'es'
      };

      await translator.translate(request);

      expect(translate).toHaveBeenCalledWith('Hello world', {
        to: 'es',
        from: 'en',
        host: 'translate.google.com',
        fetchOptions: { headers: { 'User-Agent': 'test' } }
      });
    });

    it('should override default from with request sourceLocale', async () => {
      const mockResult = {
        text: 'Bonjour',
        raw: { src: 'fr' }
      } as any;
      vi.mocked(translate).mockResolvedValue(mockResult);

      const translator = new GoogleTranslator({ from: 'en' });

      const request: TranslationRequest = {
        text: 'Hello',
        targetLocale: 'de',
        sourceLocale: 'fr'
      };

      await translator.translate(request);

      expect(translate).toHaveBeenCalledWith('Hello', {
        to: 'de',
        from: 'fr'
      });
    });

    it('should handle translation with context', async () => {
      const mockResult = {
        text: 'Bank (financial)',
        raw: { src: 'en' }
      } as any;
      vi.mocked(translate).mockResolvedValue(mockResult);

      const translator = new GoogleTranslator();
      const request: TranslationRequest = {
        text: 'Bank',
        targetLocale: 'es',
        context: 'financial institution'
      };

      const result = await translator.translate(request);
      expect(result.text).toBe('Bank (financial)');
    });

    it('should handle API errors', async () => {
      vi.mocked(translate).mockRejectedValue(new Error('API Error'));

      const translator = new GoogleTranslator();
      const request: TranslationRequest = {
        text: 'Hello',
        targetLocale: 'es'
      };

      await expect(translator.translate(request)).rejects.toThrow('API Error');
    });

    it('should handle result without raw data', async () => {
      const mockResult = {
        text: 'Hola'
        // no raw property
      } as any;
      vi.mocked(translate).mockResolvedValue(mockResult);

      const translator = new GoogleTranslator();
      const request: TranslationRequest = {
        text: 'Hello',
        targetLocale: 'es'
      };

      const result = await translator.translate(request);
      expect(result.detectedSourceLocale).toBeUndefined();
    });
  });

  describe('DeeplTranslator', () => {
    it('should have correct name', () => {
      const translator = new DeeplTranslator();
      expect(translator.name).toBe('deepl');
    });

    it('should throw not implemented error', async () => {
      const translator = new DeeplTranslator();
      const request: TranslationRequest = {
        text: 'Hello',
        targetLocale: 'es'
      };

      await expect(translator.translate(request)).rejects.toThrow(
        'DeepL translator is not implemented. Provide an adapter or implementation.'
      );
    });

    it('should accept options in constructor', () => {
      const translator = new DeeplTranslator({
        apiKey: 'test-key',
        apiUrl: 'https://api.deepl.com'
      });
      expect(translator.name).toBe('deepl');
    });

    it('should work with empty options', () => {
      const translator = new DeeplTranslator();
      expect(translator.name).toBe('deepl');
    });
  });

  describe('OpenAITranslator', () => {
    const savedEnv = process.env.OPENAI_API_KEY;

    beforeEach(() => {
      vi.resetAllMocks();
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Hola mundo' } }],
      });
      vi.mocked(OpenAI).mockImplementation(function (this: any) {
        this.chat = {
          completions: {
            create: mockCreate,
          },
        };
      } as any);
    });

    afterEach(() => {
      if (savedEnv !== undefined) {
        process.env.OPENAI_API_KEY = savedEnv;
      } else {
        delete process.env.OPENAI_API_KEY;
      }
    });

    it('should have correct name', () => {
      const translator = new OpenAITranslator({ apiKey: 'test-key' });
      expect(translator.name).toBe('openai');
    });

    it('should translate text successfully', async () => {
      const translator = new OpenAITranslator({ apiKey: 'test-key' });
      const request: TranslationRequest = {
        text: 'Hello world',
        targetLocale: 'es',
        sourceLocale: 'en',
      };

      const result = await translator.translate(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-3.5-turbo',
          temperature: 0.3,
        })
      );
      expect(result).toEqual({
        text: 'Hola mundo',
        provider: 'openai',
      });
    });

    it('should include context in user message when provided', async () => {
      const translator = new OpenAITranslator({ apiKey: 'test-key' });
      const request: TranslationRequest = {
        text: 'Bank',
        targetLocale: 'es',
        context: 'financial institution',
      };

      await translator.translate(request);

      const callArgs = mockCreate.mock.calls[0]![0];
      const userMessage = callArgs.messages.find(
        (m: { role: string }) => m.role === 'user'
      );
      expect(userMessage.content).toContain('Context: financial institution');
      expect(userMessage.content).toContain('Bank');
    });

    it('should use default model gpt-3.5-turbo', async () => {
      const translator = new OpenAITranslator({ apiKey: 'test-key' });
      const request: TranslationRequest = {
        text: 'Hello',
        targetLocale: 'es',
      };

      await translator.translate(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-3.5-turbo' })
      );
    });

    it('should use custom model when provided', async () => {
      const translator = new OpenAITranslator({
        apiKey: 'test-key',
        model: 'gpt-4o',
      });
      const request: TranslationRequest = {
        text: 'Hello',
        targetLocale: 'es',
      };

      await translator.translate(request);

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4o' })
      );
    });

    it('should resolve API key from options', () => {
      delete process.env.OPENAI_API_KEY;
      const translator = new OpenAITranslator({ apiKey: 'from-options' });
      expect(translator.name).toBe('openai');
      expect(OpenAI).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: 'from-options' })
      );
    });

    it('should resolve API key from environment variable', () => {
      process.env.OPENAI_API_KEY = 'from-env';
      const translator = new OpenAITranslator();
      expect(translator.name).toBe('openai');
      expect(OpenAI).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: 'from-env' })
      );
    });

    it('should prefer options apiKey over env var', () => {
      process.env.OPENAI_API_KEY = 'from-env';
      const translator = new OpenAITranslator({ apiKey: 'from-options' });
      expect(translator.name).toBe('openai');
      expect(OpenAI).toHaveBeenCalledWith(
        expect.objectContaining({ apiKey: 'from-options' })
      );
    });

    it('should throw when no API key is available', () => {
      delete process.env.OPENAI_API_KEY;
      expect(() => new OpenAITranslator()).toThrow(
        /OpenAI API key is required/
      );
    });

    it('should handle API errors', async () => {
      mockCreate.mockRejectedValue(new Error('API Error'));

      const translator = new OpenAITranslator({ apiKey: 'test-key' });
      const request: TranslationRequest = {
        text: 'Hello',
        targetLocale: 'es',
      };

      await expect(translator.translate(request)).rejects.toThrow('API Error');
    });

    it('should pass baseUrl to OpenAI client', () => {
      const translator = new OpenAITranslator({
        apiKey: 'test-key',
        baseUrl: 'https://custom.api.com',
      });
      expect(translator.name).toBe('openai');
      expect(OpenAI).toHaveBeenCalledWith(
        expect.objectContaining({ baseURL: 'https://custom.api.com' })
      );
    });

    it('should handle empty response content', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null } }],
      });

      const translator = new OpenAITranslator({ apiKey: 'test-key' });
      const request: TranslationRequest = {
        text: 'Hello',
        targetLocale: 'es',
      };

      const result = await translator.translate(request);
      expect(result.text).toBe('');
    });

    it('should include source locale in system message when provided', async () => {
      const translator = new OpenAITranslator({ apiKey: 'test-key' });
      const request: TranslationRequest = {
        text: 'Hello',
        targetLocale: 'es',
        sourceLocale: 'en',
      };

      await translator.translate(request);

      const callArgs = mockCreate.mock.calls[0]![0];
      const systemMessage = callArgs.messages.find(
        (m: { role: string }) => m.role === 'system'
      );
      expect(systemMessage.content).toContain('from en');
      expect(systemMessage.content).toContain('to es');
    });
  });
});

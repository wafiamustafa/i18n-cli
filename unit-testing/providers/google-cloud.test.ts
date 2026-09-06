import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { translate } from '@vitalets/google-translate-api';
import { GoogleTranslator } from '../../src/providers/google.js';

vi.mock('@vitalets/google-translate-api', () => ({ translate: vi.fn() }));
vi.mock('../../src/config/environment.js', () => ({
  resolveApiKey: (name: string) => process.env[name]
}));

describe('Google Cloud Translation', () => {
  const fetchMock = vi.fn();
  const request = { text: 'Hello world', targetLocale: 'es' };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('GOOGLE_API_KEY', undefined);
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      data: {
        translations: [{ translatedText: 'Hola mundo', detectedSourceLanguage: 'en' }]
      }
    })));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it('uses the official API when a key is supplied through the environment', async () => {
    vi.stubEnv('GOOGLE_API_KEY', 'environment-key');

    const result = await new GoogleTranslator().translate(request);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://translation.googleapis.com/language/translate/v2',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': 'environment-key'
        },
        body: JSON.stringify({ q: 'Hello world', target: 'es', format: 'text' })
      }
    );
    expect(result).toEqual({
      text: 'Hola mundo', detectedSourceLocale: 'en', provider: 'google'
    });
    expect(translate).not.toHaveBeenCalled();
  });

  it('prefers the explicit key and ignores unofficial host and fetch options', async () => {
    vi.stubEnv('GOOGLE_API_KEY', 'environment-key');

    await new GoogleTranslator({
      apiKey: 'explicit-key',
      host: 'example.com',
      fetchOptions: { headers: { 'X-Goog-Api-Key': 'wrong-key' } }
    }).translate(request);

    expect(fetchMock).toHaveBeenCalledWith(
      'https://translation.googleapis.com/language/translate/v2',
      expect.objectContaining({
        headers: expect.objectContaining({ 'X-Goog-Api-Key': 'explicit-key' })
      })
    );
    expect(translate).not.toHaveBeenCalled();
  });

  it.each([
    { from: 'fr', sourceLocale: 'en', expected: 'en' },
    { from: 'fr', sourceLocale: undefined, expected: 'fr' },
    { from: 'fr', sourceLocale: 'auto', expected: undefined },
    { from: 'auto', sourceLocale: undefined, expected: undefined }
  ])('handles source selection: $from / $sourceLocale', async ({ from, sourceLocale, expected }) => {
    await new GoogleTranslator({ apiKey: 'key', from }).translate({
      ...request,
      ...(sourceLocale === undefined ? {} : { sourceLocale })
    });

    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(body.source).toBe(expected);
  });

  it.each(['', '   '])('rejects an empty configured key without using the unofficial backend', async (apiKey) => {
    vi.stubEnv('GOOGLE_API_KEY', apiKey);

    await expect(new GoogleTranslator().translate(request)).rejects.toThrow('Google API key cannot be empty');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(translate).not.toHaveBeenCalled();
  });

  it.each([400, 403, 429, 500])('reports HTTP %s without falling back or exposing the key', async (status) => {
    fetchMock.mockResolvedValue(new Response('secret-key', { status }));

    const result = new GoogleTranslator({ apiKey: 'secret-key' }).translate(request);

    await expect(result).rejects.toThrow(`Google Cloud Translation request failed (HTTP ${status})`);
    await expect(result).rejects.not.toThrow('secret-key');
    expect(translate).not.toHaveBeenCalled();
  });

  it('does not fall back on network errors', async () => {
    fetchMock.mockRejectedValue(new Error('Network unavailable'));

    await expect(new GoogleTranslator({ apiKey: 'key' }).translate(request))
      .rejects.toThrow('Network unavailable');
    expect(translate).not.toHaveBeenCalled();
  });

  it.each([
    {},
    { data: { translations: [] } },
    { data: { translations: [{ translatedText: 123 }] } }
  ])('rejects malformed API responses', async (body) => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify(body)));

    await expect(new GoogleTranslator({ apiKey: 'key' }).translate(request))
      .rejects.toThrow('Google Cloud Translation returned an invalid translation response');
    expect(translate).not.toHaveBeenCalled();
  });

  it('accepts responses without a detected source language', async () => {
    fetchMock.mockResolvedValue(new Response(JSON.stringify({
      data: { translations: [{ translatedText: 'Hola' }] }
    })));

    await expect(new GoogleTranslator({ apiKey: 'key' }).translate(request))
      .resolves.toEqual({ text: 'Hola', provider: 'google' });
  });

  it('retains the unofficial backend for personal use without a key', async () => {
    vi.mocked(translate).mockResolvedValue({ text: 'Hola' } as Awaited<ReturnType<typeof translate>>);

    await expect(new GoogleTranslator().translate(request))
      .resolves.toMatchObject({ text: 'Hola', provider: 'google' });
    expect(translate).toHaveBeenCalledWith('Hello world', { to: 'es' });
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

import { describe, expect, it } from "vitest";
import { hasUntranslatedHtmlText } from "../../src/core/html-translation-checker.js";

describe("hasUntranslatedHtmlText", () => {
  it.each([
    "<h1>Welcome</h1>",
    "<p>مرحبا</p>",
    "<p>&#72;&#101;llo</p>",
    "<p>{{ 'title' | translate }}</p><button>Save</button>",
    "<p>Welcome {{ user.name }}</p>",
    '<input placeholder="Search" />',
    '<img alt="Profile photo">',
    '<button aria-label="Close"></button>',
    '<div title="Help"></div>',
    '<input type="submit" value="Save">',
    '<input [placeholder]="\'Search\'">',
    '<button [attr.aria-label]="\'Close\'"></button>',
    "<p>{{ 'Hello' }}</p>",
    "<p>{{ show ? 'Yes' : 'No' }}</p>",
    '<p i18n title="Untranslated tooltip">Translated text</p>',
    '<div i18n><img alt="Untranslated photo"></div>',
    '<p translate="yes">Welcome</p>',
    '<p translate="no">Welcome</p>',
    '<app-icon /><span>Hello</span>',
    '<div *transloco="let t"><p>Hardcoded</p></div>',
    '<div [title]="\'a > b\'">{{ t("key") }}</div>',
  ])("flags literal UI text: %s", html => {
    expect(hasUntranslatedHtmlText(html)).toBe(true);
  });

  it.each([
    "",
    "<!-- Welcome -->",
    "<!doctype html><div class='welcome' id='title'></div>",
    "<script>const label = 'Hello';</script><style>.title { color: red; }</style>",
    "<p>&nbsp; &#x20; &amp; &copy; 123 — !</p>",
    "<p>{{ 'title' | translate }}</p>",
    "<p>{{ 'title' | translate: { name: user.name } }}</p>",
    "<p>{{ t('title') }}</p>",
    "<p>{{ translate('title') }}</p>",
    "<p>{{ i18n.t('title') }}</p>",
    "<p>{{ user.name }}</p>",
    '<p i18n="@@welcome">Welcome <strong>back</strong></p>',
    '<p translate>welcome.title</p>',
    '<p translate="welcome.title"></p>',
    '<p [translate]="key">Fallback</p>',
    '<p transloco="welcome.title"></p>',
    '<input placeholder="Search" i18n-placeholder>',
    '<input placeholder="{{ \'search\' | translate }}">',
    '<input [placeholder]="\'search\' | translate">',
    '<input [placeholder]="placeholderFromServer">',
    '<input type="hidden" value="Internal value">',
    '<img src="hello.png"><a href="/welcome"></a>',
    '<div>{{ count < limit ? t("less") : t("more") }}</div>',
    '<p title="{{ t(\'key\') }}"></p>',
  ])("ignores translated or nonliteral content: %s", html => {
    expect(hasUntranslatedHtmlText(html)).toBe(false);
  });

  it("uses custom usage patterns without mutating their state", () => {
    const pattern = /localize\('(?<key>.*?)'\)/g;
    pattern.lastIndex = 10;
    const html = "<p>{{ localize('welcome') }}</p>";
    expect(hasUntranslatedHtmlText(html, [pattern])).toBe(false);
    expect(hasUntranslatedHtmlText(html, [pattern])).toBe(false);
    expect(pattern.lastIndex).toBe(10);
  });

  it("does not let a custom translation hide surrounding literal text", () => {
    expect(hasUntranslatedHtmlText(
      "<p>{{ localize('welcome') + ' friend' }}</p>",
      [/localize\('(.*?)'\)/g]
    )).toBe(true);
  });

  it("does not mistake translation calls printed literally for translated output", () => {
    expect(hasUntranslatedHtmlText("<p>t('welcome')</p>")).toBe(true);
  });
});

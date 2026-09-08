import { describe, expect, it } from "vitest";
import { hasUntranslatedText } from "../../src/core/translation-checker.js";

describe("cross-framework translation checks", () => {
  it.each([
    ["page.html", "<h1>Welcome</h1>"],
    ["page.htm", "<h1>Welcome</h1>"],
    ["Page.jsx", "export default () => <><h1>{t('title')}</h1><button>Save</button></>"],
    ["Page.tsx", "const Page = (props: {name: string}) => <p>Hello {props.name}</p>"],
    ["Page.js", "export default () => <button aria-label='Close' />"],
    ["Page.jsx", "export default () => <p>{ready ? 'Yes' : 'No'}</p>"],
    ["Page.jsx", "export default () => <p>{t('key') + ' friend'}</p>"],
    ["Page.jsx", "export default () => <p>{`Welcome ${name}`}</p>"],
    ["Page.jsx", "export default () => <input placeholder={'Search'} />"],
    ["Page.jsx", "export default () => <input type='submit' value='Save' />"],
    ["Page.jsx", "export default () => <Trans><img alt='Photo' /></Trans>"],
    ["Page.jsx", "export default () => <p>&#72;ello</p>"],
    ["Page.jsx", "export default () => <p>{ready && <span>Hello</span>}</p>"],
    ["Page.vue", "<template><h1>{{ $t('title') }}</h1><button>Save</button></template>"],
    ["Page.vue", `<template><input :placeholder="'Search'"></template>`],
    ["Page.vue", `<template><p v-text="'Hello'"></p></template>`],
    ["Page.vue", `<template><p v-html="'Hello'"></p></template>`],
    ["Page.vue", `<template><input v-bind:placeholder="'Search'"></template>`],
    ["page.ts", "@Component({ template: `<h1>Welcome</h1>` }) class Page {}"],
    ["page.ts", "@Component({ template: '<h1>Welcome</h1>' }) class Page {}"],
  ])("flags rendered literal text in %s: %s", (file, content) => {
    expect(hasUntranslatedText(file, content)).toBe(true);
  });

  it.each([
    ["Page.jsx", "import React from 'react'; const label = 'internal'; export default () => <p>{t('key')}</p>"],
    ["Page.jsx", "export default () => <p>{t('key', {defaultValue: 'Hello'})}</p>"],
    ["Page.jsx", "export default () => <p>{user.role === 'admin' ? t('admin') : t('user')}</p>"],
    ["Page.jsx", "export default () => <p>{name}</p>"],
    ["Page.jsx", "export default () => <p>{/* Comment */}123 &nbsp; &#x20; &amp;</p>"],
    ["Page.jsx", "export default () => <Trans i18nKey='key'>Hello <strong>friend</strong></Trans>"],
    ["Page.jsx", "export default () => <FormattedMessage id='key' defaultMessage='Hello' />"],
    ["Page.jsx", "export default () => <input placeholder={t('search')} />"],
    ["Page.jsx", "export default () => <p>{ready && <span>{t('key')}</span>}</p>"],
    ["Page.tsx", "type Props = {name: string}; export const Page = ({name}: Props) => <p>{name}</p>"],
    ["Page.vue", `<script setup>const name = 'User';</script><template><p>{{ $t('hello') }}</p></template><style>.text { color: red; }</style>`],
    ["Page.vue", `<template><p v-t="'hello'"></p><i18n-t keypath="hello">Fallback</i18n-t></template>`],
    ["Page.vue", `<template><input :placeholder="$t('search')"></template>`],
    ["Page.vue", `<template><p v-text="$t('hello')"></p></template>`],
    ["Page.vue", `<template><input v-bind:placeholder="$t('search')"></template>`],
    ["page.ts", "@Component({ template: `<h1>{{ 'hello' | translate }}</h1>` }) class Page {}"],
    ["page.ts", "const identity = <T>(value: T): T => value; const label = <string>name;"],
    ["page.ts", "const config = { template: 'internal non-UI template name' };"],
    ["Page.vue", `<template><p>{{ $t('hello') }}</p></template><i18n>{"en":{"hello":"Hello"}}</i18n>`],
  ])("accepts translated and non-rendered text in %s: %s", (file, content) => {
    expect(hasUntranslatedText(file, content)).toBe(false);
  });

  it("does not silently accept invalid JavaScript", () => {
    expect(() => hasUntranslatedText("Page.jsx", "export default () => <p>Oops")).toThrow();
  });

  it("reports unsupported Vue template languages", () => {
    expect(() => hasUntranslatedText("Page.vue", '<template lang="pug">p Hello</template>'))
      .toThrow('Unsupported Vue template language "pug"');
  });
});

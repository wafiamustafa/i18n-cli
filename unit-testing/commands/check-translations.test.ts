import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs-extra";
import { glob } from "glob";
import { checkTranslationsCommand } from "../../src/commands/check-translations.js";
import type { CommandContext } from "../../src/context/types.js";
import { FileManager } from "../../src/core/file-manager.js";

vi.mock("fs-extra", () => ({ default: { readFile: vi.fn() } }));
vi.mock("glob", () => ({ glob: vi.fn() }));

describe("check:translations command", () => {
  let context: CommandContext;

  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    const config: CommandContext["config"] = {
      localesPath: "./locales",
      defaultLocale: "en",
      supportedLocales: ["en"],
      keyStyle: "nested",
      usagePatterns: [],
      compiledUsagePatterns: [],
      autoSort: true,
    };
    context = { config, options: {}, fileManager: new FileManager(config) };
    vi.spyOn(context.fileManager, "readLocale");
    vi.spyOn(context.fileManager, "writeLocale");
    vi.mocked(glob).mockResolvedValue([]);
  });

  afterEach(() => vi.restoreAllMocks());

  it("lists every affected file once in sorted order, including partially translated files", async () => {
    vi.mocked(glob).mockResolvedValue(["src/z.html", "src/ok.html", "src/a.html"]);
    vi.mocked(fs.readFile)
      .mockResolvedValueOnce("<p>Welcome</p><button>Save</button>" as never)
      .mockResolvedValueOnce("<p>{{ 'key' | translate }}</p>" as never)
      .mockResolvedValueOnce("<p>{{ t('key') }}</p><p>Hardcoded</p>" as never);

    expect(await checkTranslationsCommand(context)).toEqual(["src/a.html", "src/z.html"]);
    expect(console.log).toHaveBeenCalledWith("  - src/a.html");
    expect(console.log).toHaveBeenCalledWith("  - src/z.html");
    expect(context.fileManager.readLocale).not.toHaveBeenCalled();
    expect(context.fileManager.writeLocale).not.toHaveBeenCalled();
  });

  it("accepts a custom glob and excludes generated files and dependencies", async () => {
    await checkTranslationsCommand(context, { files: "templates/**/*.html" });
    expect(glob).toHaveBeenCalledWith("templates/**/*.html", {
      nodir: true,
      ignore: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/coverage/**"],
    });
  });

  it("reports an empty scan separately from a clean scan", async () => {
    expect(await checkTranslationsCommand(context)).toEqual([]);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("No supported source files found"));
  });

  it("reports a clean scan successfully in CI", async () => {
    context.options.ci = true;
    vi.mocked(glob).mockResolvedValue(["src/ok.html"]);
    vi.mocked(fs.readFile).mockResolvedValue("<p i18n>Hello</p>" as never);
    expect(await checkTranslationsCommand(context)).toEqual([]);
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("No untranslated text"));
  });

  it.each([{}, { yes: true }, { dryRun: true }, { force: true }])(
    "fails in CI after printing affected files, regardless of flags: %s", async options => {
      context.options = { ci: true, ...options };
      vi.mocked(glob).mockResolvedValue(["src/bad.html"]);
      vi.mocked(fs.readFile).mockResolvedValue("<p>Hello</p>" as never);
      await expect(checkTranslationsCommand(context)).rejects.toThrow("CI mode: 1 file(s)");
      expect(console.log).toHaveBeenCalledWith("  - src/bad.html");
    }
  );

  it("propagates read errors instead of reporting a clean scan", async () => {
    vi.mocked(glob).mockResolvedValue(["src/bad.html"]);
    vi.mocked(fs.readFile).mockRejectedValue(new Error("Permission denied"));
    await expect(checkTranslationsCommand(context)).rejects.toThrow("Permission denied");
  });

  it("includes the filename when parsing fails", async () => {
    vi.mocked(glob).mockResolvedValue(["src/Bad.tsx"]);
    vi.mocked(fs.readFile).mockResolvedValue("export const Page = () => <p>" as never);
    await expect(checkTranslationsCommand(context)).rejects.toThrow('Failed to check "src/Bad.tsx"');
  });

  it("scans mixed project types and ignores unsupported files", async () => {
    vi.mocked(glob).mockResolvedValue(["Home.tsx", "Page.vue", "index.html", "locales/en.json"]);
    vi.mocked(fs.readFile)
      .mockResolvedValueOnce("export const Home = () => <p>Hello</p>" as never)
      .mockResolvedValueOnce("<template><p>{{ $t('hello') }}</p></template>" as never)
      .mockResolvedValueOnce("<p>Hello</p>" as never);
    expect(await checkTranslationsCommand(context)).toEqual(["Home.tsx", "index.html"]);
    expect(fs.readFile).toHaveBeenCalledTimes(3);
  });

  it("passes configured translation patterns to the checker", async () => {
    context.config.compiledUsagePatterns = [/localize\('(.*?)'\)/g];
    vi.mocked(glob).mockResolvedValue(["src/custom.html"]);
    vi.mocked(fs.readFile).mockResolvedValue("<p>{{ localize('key') }}</p>" as never);
    expect(await checkTranslationsCommand(context)).toEqual([]);
  });
});

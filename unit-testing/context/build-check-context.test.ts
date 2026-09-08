import { beforeEach, describe, expect, it, vi } from "vitest";
import fs from "fs-extra";
import { loadConfig } from "../../src/config/config-loader.js";
import { buildCheckContext } from "../../src/context/build-check-context.js";

vi.mock("fs-extra", () => ({ default: { pathExists: vi.fn() } }));
vi.mock("../../src/config/config-loader.js", () => ({
  CONFIG_FILE_NAME: "i18n-cli.config.json",
  loadConfig: vi.fn(),
}));

describe("buildCheckContext", () => {
  beforeEach(() => vi.resetAllMocks());

  it("works without a configuration or locale directory", async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(false as never);
    expect(await buildCheckContext({ ci: true })).toEqual({
      config: { compiledUsagePatterns: [] }, options: { ci: true },
    });
    expect(loadConfig).not.toHaveBeenCalled();
  });

  it("uses existing configuration", async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true as never);
    const config = { compiledUsagePatterns: [/localize\('(.*?)'\)/g] };
    vi.mocked(loadConfig).mockResolvedValue(config as Awaited<ReturnType<typeof loadConfig>>);
    expect((await buildCheckContext({})).config).toBe(config);
  });

  it("does not ignore invalid existing configuration", async () => {
    vi.mocked(fs.pathExists).mockResolvedValue(true as never);
    vi.mocked(loadConfig).mockRejectedValue(new Error("Invalid configuration"));
    await expect(buildCheckContext({})).rejects.toThrow("Invalid configuration");
  });
});

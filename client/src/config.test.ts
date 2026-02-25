import { describe, it, expect } from "vitest";
import { APP_CONFIG } from "./config";

describe("APP_CONFIG", () => {
  it("has correct app name", () => {
    expect(APP_CONFIG.name).toBe("VibeQuant");
  });

  it("has correct domain", () => {
    expect(APP_CONFIG.domain).toBe("www.vquant.ai");
  });

  it("has required API endpoints", () => {
    expect(APP_CONFIG.endpoints.chat).toBe("/api/chat");
    expect(APP_CONFIG.endpoints.share).toBe("/api/share");
    expect(APP_CONFIG.endpoints.generatePDF).toBe("/api/generate-pdf");
    expect(APP_CONFIG.endpoints.generateDOCX).toBe("/api/generate-docx");
    expect(APP_CONFIG.endpoints.download).toBe("/api/download");
  });

  it("has reasonable limits", () => {
    expect(APP_CONFIG.limits.maxToolsPerBatch).toBeGreaterThan(0);
    expect(APP_CONFIG.limits.maxQueryLength).toBeGreaterThanOrEqual(1000);
    expect(APP_CONFIG.limits.maxPdfChars).toBeGreaterThan(0);
  });

  it("has all feature flags as booleans", () => {
    for (const [, value] of Object.entries(APP_CONFIG.features)) {
      expect(typeof value).toBe("boolean");
    }
  });
});

import { describe, expect, it } from "vitest";

import { buildPreviewDocument, isValidConsoleMessage } from "@/lib/playground";

describe("buildPreviewDocument", () => {
  const doc = buildPreviewDocument({
    html: "<h1>Halo</h1>",
    css: "h1 { color: tomato; }",
    js: "console.log('jalan');",
  });

  it("creates a complete document with the user's HTML, CSS, and JS", () => {
    expect(doc).toContain("<!DOCTYPE html>");
    expect(doc).toContain("<h1>Halo</h1>");
    expect(doc).toContain("h1 { color: tomato; }");
    expect(doc).toContain("console.log('jalan');");
  });

  it("injects a console bridge before user code", () => {
    const bridgeIndex = doc.indexOf("learncode-preview");
    const userCodeIndex = doc.indexOf("console.log('jalan')");
    expect(bridgeIndex).toBeGreaterThan(-1);
    expect(bridgeIndex).toBeLessThan(userCodeIndex);
  });

  it("wraps user JavaScript in a try/catch so one error does not blank the page", () => {
    expect(doc).toContain("} catch (error) {");
    expect(doc).toContain("console.error(");
  });

  it("escapes a closing script tag so user code cannot break out of the script element", () => {
    const hostile = buildPreviewDocument({
      html: "",
      css: "",
      js: "const value = '</script><script>alert(1)</script>';",
    });
    expect(hostile).not.toContain("</script><script>alert(1)</script>");
    expect(hostile).toContain("<\\/script");
  });

  it("sets a no-referrer policy inside the sandboxed document", () => {
    expect(doc).toContain('name="referrer" content="no-referrer"');
  });

  it("includes a base body style but leaves layout to the user's CSS", () => {
    expect(doc).toContain("html, body { margin: 0; }");
  });
});

describe("isValidConsoleMessage", () => {
  it("accepts messages produced by the preview bridge", () => {
    expect(
      isValidConsoleMessage({
        source: "learncode-preview",
        level: "warn",
        text: "hati-hati",
      }),
    ).toBe(true);
  });

  it.each([
    null,
    undefined,
    "text",
    { source: "other", level: "log", text: "x" },
    { source: "learncode-preview", level: "debug", text: "x" },
    { source: "learncode-preview", level: "log", text: 42 },
  ])("rejects malformed payload %#", (value) => {
    expect(isValidConsoleMessage(value)).toBe(false);
  });
});

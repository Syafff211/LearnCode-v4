import { describe, expect, it } from "vitest";

import { renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown", () => {
  it("renders headings and highlighted code blocks", async () => {
    const html = await renderMarkdown(
      "## Label dan input\n\n```html\n<label for=\"email\">Email</label>\n```\n",
    );
    expect(html).toContain("<h2>Label dan input</h2>");
    expect(html).toContain("<pre");
    expect(html).toContain("data-language=\"html\"");
  });

  it("drops raw HTML tags instead of passing them through", async () => {
    const script = await renderMarkdown('Hello <script>alert("xss")</script>\n');
    expect(script).not.toMatch(/<script/i);

    const img = await renderMarkdown('<img src="x" onerror="alert(1)" />\n');
    expect(img).not.toMatch(/<img/i);
    expect(img).not.toContain("onerror=");
  });

  it("renders GitHub-flavoured tables", async () => {
    const html = await renderMarkdown(
      "| Properti | Nilai |\n| --- | --- |\n| display | flex |\n",
    );
    expect(html).toContain("<table>");
    expect(html).toContain("<td>flex</td>");
  });

  it("renders inline code as an inline element inside the paragraph", async () => {
    const html = await renderMarkdown("Gunakan `box-sizing: border-box` di setiap kartu.");
    expect(html).toContain("<p>");
    expect(html).toContain("<code");
    expect(html).toContain("box-sizing: border-box");
    expect(html).not.toContain("<pre");
  });

  it("keeps links in the document", async () => {
    const html = await renderMarkdown("Baca [daftar elemen](https://developer.mozilla.org).");
    expect(html).toContain('href="https://developer.mozilla.org"');
  });
});

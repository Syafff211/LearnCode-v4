import { describe, expect, it } from "vitest";

import { getBlogTableOfContents, renderBlogMarkdown } from "@/lib/markdown";

describe("blog Markdown renderer", () => {
  it("creates matching, unique heading anchors for the table of contents", async () => {
    const markdown = "## First topic\n\nText.\n\n## First topic\n\nMore text.\n\n### Nested detail\n\nDetails.";
    const toc = getBlogTableOfContents(markdown);
    const html = await renderBlogMarkdown(markdown);

    expect(toc.map((heading) => heading.id)).toEqual([
      "blog-first-topic",
      "blog-first-topic-1",
      "blog-nested-detail",
    ]);
    for (const heading of toc) expect(html).toContain(`id="${heading.id}"`);
  });

  it("strips raw script markup and unsafe link protocols", async () => {
    const html = await renderBlogMarkdown(
      'Safe text.\n\n<script>alert("no")</script>\n\n[bad link](javascript:alert%281%29)',
    );
    expect(html).not.toContain("<script");
    expect(html).not.toContain("href=\"javascript:");
  });
});

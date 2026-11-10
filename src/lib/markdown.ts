import "server-only";

import GithubSlugger from "github-slugger";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSanitize from "rehype-sanitize";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypePrettyCode, {
    theme: {
      light: "github-light",
      dark: "github-dark-default",
    },
    keepBackground: false,
    defaultLang: "text",
  })
  .use(rehypeStringify);

/** Lesson content is authored by LearnCode and stored in the database. */
export async function renderMarkdown(markdown: string): Promise<string> {
  const file = await processor.process(markdown);
  return String(file);
}

const blogProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  // Disallow raw HTML and unsafe URL protocols in editor-authored content.
  .use(rehypeSanitize)
  // Prefixes prevent DOM clobbering and make stable links for the article TOC.
  .use(rehypeSlug, { prefix: "blog-" })
  .use(rehypePrettyCode, {
    theme: {
      light: "github-light",
      dark: "github-dark-default",
    },
    keepBackground: false,
    defaultLang: "text",
  })
  .use(rehypeStringify);

export type BlogHeading = { depth: 2 | 3; id: string; text: string };

type MarkdownNode = {
  type: string;
  depth?: number;
  value?: string;
  children?: MarkdownNode[];
};

function markdownNodeText(node: MarkdownNode): string {
  if (node.type === "text" || node.type === "inlineCode" || node.type === "html") {
    return node.value ?? "";
  }
  if (node.type === "break") return " ";
  return (node.children ?? []).map(markdownNodeText).join("");
}

/** Heading IDs match rehype-slug and are used only when the sanitized article renders. */
export function getBlogTableOfContents(markdown: string): BlogHeading[] {
  const tree = unified().use(remarkParse).parse(markdown) as unknown as { children: MarkdownNode[] };
  const slugger = new GithubSlugger();
  const headings: BlogHeading[] = [];

  for (const node of tree.children) {
    if (node.type !== "heading" || (node.depth !== 2 && node.depth !== 3)) continue;
    const text = markdownNodeText(node).replace(/\s+/g, " ").trim();
    if (!text) continue;
    const slug = slugger.slug(text);
    headings.push({ depth: node.depth, id: `blog-${slug}`, text });
  }
  return headings;
}

/** Safe server-side rendering for public blog content with stable heading IDs. */
export async function renderBlogMarkdown(markdown: string): Promise<string> {
  const file = await blogProcessor.process(markdown);
  return String(file);
}

import {
  BlockObjectResponse,
  PageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import {
  Html,
  isBlockObjectResponse,
  todo,
  transformToHtmlString,
} from "./util.js";
import fs from "fs";
import {
  LayoutTemplateReplacements,
  PageTemplateReplacements,
} from "./index.js";
import handlebars from "handlebars";
import { fetchPageContents } from "./notionApi.js";

export enum HtmlTemplate {
  Layout = "layout",
  Page = "page",
}

export type RenderedPage = {
  title: string;
  html: Html;
};

export function createHtmlElement(tag: string, contents: Html): Html {
  return `<${tag}>${contents}</${tag}>`;
}

export function transformRichTextToHtml(richText: RichTextItemResponse): Html {
  if (richText.type === "text") {
    return richText.text.content;
  }

  // TODO: Process other types of rich text.
  console.debug(richText);
  todo();
}

export function transformBlockToHtml(block: BlockObjectResponse): Html {
  if (block.type === "paragraph") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.paragraph.rich_text
    );

    return createHtmlElement("p", contents);
  }

  console.debug(block);

  // TODO: Implement.
  todo();
}

export function renderTemplate<
  T extends LayoutTemplateReplacements | PageTemplateReplacements
>(name: HtmlTemplate, replacements: T): string {
  const template = handlebars.compile(
    fs.readFileSync(`templates/${name}.html`, "utf-8")
  );

  return template(replacements);
}

export function loadStylesheet(): Html {
  // TODO: Use PostCSS package to programmatically process CSS, along with some plugins like autoprefixer, and minify.
  return fs.readFileSync("style.css", "utf-8");
}

export async function renderPage(
  page: PageObjectResponse
): Promise<RenderedPage> {
  const blocks = await fetchPageContents(page.id);
  let pageHtmlContents: Html = "";

  for (const block of blocks) {
    if (!isBlockObjectResponse(block)) {
      continue;
    }

    pageHtmlContents += transformBlockToHtml(block);
  }

  const pageHtml = renderTemplate<PageTemplateReplacements>(HtmlTemplate.Page, {
    content: pageHtmlContents,
  });

  const css = loadStylesheet();

  // TODO: Extract page title from page.
  const title = "Blog post" + Date.now();

  const html = renderTemplate<LayoutTemplateReplacements>(HtmlTemplate.Layout, {
    title,
    page: pageHtml,
    css,
  });

  return {
    title,
    html,
  };
}

import {
  BlockObjectResponse,
  Heading1BlockObjectResponse,
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
  PageTemplateReplacements
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

export function createHtmlElement(tag: string, contents: Html, args?: string): Html {
  return `<${tag}${args !== undefined ? ` ${args}` : ""}>${contents}</${tag}>`;
}

function createHtmlElementList(tags: string[], content: Html): string {
  const formattedTags = [content];

  for (const tag of tags) {
    formattedTags.unshift(`<${tag}>`);
    formattedTags.push(`</${tag}>`);
  }

  return formattedTags.join("");
}

export function transformRichTextToHtml(richText: RichTextItemResponse): Html {
  const listTag: string[] = []

  if (richText.type === "text") {
    if (richText.annotations.bold) listTag.unshift("b")
    if (richText.annotations.italic) listTag.unshift("i")
    if (richText.annotations.underline) listTag.unshift("u")
    if (richText.annotations.strikethrough) listTag.unshift("del")

    const text = createHtmlElementList(listTag, richText.text.content)
    return text;
  }
  // TODO: Process color for text
  // TODO: Handle href
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
  if (block.type === "heading_1") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.heading_1.rich_text
    );
    const tag = block.heading_1.is_toggleable ? "toggle" : "h1"
    console.log(createHtmlElement(tag, contents))
    return createHtmlElement(tag, contents);
  }
  if (block.type === "heading_2") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.heading_2.rich_text
    );
    const tag = block.heading_2.is_toggleable ? "toggle" : "h2"
    console.log(createHtmlElement(tag, contents))
    return createHtmlElement(tag, contents);
  }
  if (block.type === "heading_3") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.heading_3.rich_text
    );
    const tag = block.heading_3.is_toggleable ? "toggle" : "h3"
    console.log(createHtmlElement(tag, contents))
    return createHtmlElement(tag, contents);
  }
  if (block.type === "bulleted_list_item") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.bulleted_list_item.rich_text
    );
    console.log(createHtmlElement("li", contents))
    return createHtmlElement("li", contents);
  }
  if (block.type === "quote") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.quote.rich_text
    );
    console.log(createHtmlElement("blockquote", contents))
    return createHtmlElement("blockquote", contents);
  }
  if (block.type === "numbered_list_item") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.numbered_list_item.rich_text
    );
    console.log(createHtmlElement("li", contents))
    return createHtmlElement("li", contents);
    /*Output
    <li>Testing</li>
    <li>Improve</li>
    */
   // TODO: This output should be encapsulated with <ol>
  }
  if (block.type === "divider") {
    console.log(createHtmlElement("hr", ""))
    return createHtmlElement("hr", "");
  }
  if (block.type === "image") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.image.caption
    );

    if (block.image.type === "external"){
      const image = createHtmlElement("img", "", `src="${block.image.external.url}"`)
      const caption = createHtmlElement("p", contents)
      const container = createHtmlElement("div", `${image}${caption}`)
      console.log(container)
      return image
    }
    if (block.image.type === "file"){
      const image = createHtmlElement("img", "", `src="${block.image.file.url}"`)
      const caption = createHtmlElement("p", contents)
      const container = createHtmlElement("div", `${image}${caption}`)
      console.log(container)
      return image
    }

    return createHtmlElement("img", contents);
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

import {
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import { Html, todo, transformToHtmlString } from "./util.js";
import fs from "fs";
import {
  LayoutTemplateReplacements,
  PageTemplateReplacements,
} from "./index.js";
import handlebars from "handlebars";

export enum HtmlTemplate {
  Layout = "layout",
  Page = "page",
}

export function createHtmlElement(tag: string, contents: Html): Html {
  return `<${tag}>${contents}</${tag}>`;
}

export function transformRichTextToHtml(richText: RichTextItemResponse): Html {
  if (richText.type === "text") {
    return richText.text.content;
  }

  // TODO: Process other types of rich text.
  console.log(richText);
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

  console.log(block);

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
  return fs.readFileSync("style.css", "utf-8");
}

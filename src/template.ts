import {type PageObjectResponse} from "@notionhq/client/build/src/api-endpoints.js";
import fs from "fs";
import handlebars from "handlebars";
import {fetchBlockChildren, fetchPageContents} from "./notionApi.js";
import {transformBlockToHtml} from "./transform.js";
import {isBlockObjectResponse, type Html} from "./util.js";

export type LayoutTemplateReplacements = {
  title: string;
  content: Html;
  css: string;
};

export type PostTemplateReplacements = {
  content: Html;
};

export enum HtmlTemplate {
  Layout = "layout",
  Page = "page",
}

export type RenderedPage = {
  title: string;
  html: Html;
};

export function createHtmlElement(
  tag: string,
  contents: Html,
  args?: string
): Html {
  return `<${tag}${args !== undefined ? ` ${args}` : ""}>${contents}</${tag}>`;
}

export function renderTemplate<
  T extends LayoutTemplateReplacements | PostTemplateReplacements
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

    if (block.has_children) {
      console.log("000000000000000000000000000");
      const childrens = await fetchBlockChildren(block.id);
      let childrenHtmlContents: Html = "";

      for (const children of childrens) {
        childrenHtmlContents += transformBlockToHtml(children);
      }
      // TODO: Check why not arrive childrenHtmlContents to summary content after the first
      pageHtmlContents += transformBlockToHtml(block, childrenHtmlContents);
    } else {
      pageHtmlContents += transformBlockToHtml(block);
    }
  }

  const pageHtml = renderTemplate<PostTemplateReplacements>(HtmlTemplate.Page, {
    content: pageHtmlContents,
  });

  const css = loadStylesheet();
  let title = "Blog post" + Date.now();

  if (page.properties.title.type === "title") {
    page.properties.title.title.forEach((titleProp) => {
      title = titleProp.plain_text;
    });
  }

  const html = renderTemplate<LayoutTemplateReplacements>(HtmlTemplate.Layout, {
    title,
    content: pageHtml,
    css,
  });

  return {
    title,
    html,
  };
}

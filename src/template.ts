import {type PageObjectResponse} from "@notionhq/client/build/src/api-endpoints.js";
import fs from "fs";
import handlebars from "handlebars";
import {fetchBlockChildren, fetchPageContents} from "./notionApi.js";
import {extractTitle, transformBlockToHtml} from "./transform.js";
import {isBlockObjectResponse, type Html} from "./util.js";

export type LayoutTemplateReplacements = {
  postTitle: string;
  content: Html;
  css: string;
};

export type PostTemplateReplacements = {
  content: Html;
  postTitle: string;
};

export enum HtmlTemplate {
  Layout = "layout",
  Page = "post",
}

export type RenderedPage = {
  title: string;
  html: Html;
};

export type CreateHtmlElementProps = {
  tag: HtmlTag;
  contents?: Html;
  args?: string;
  isSingle?: boolean;
};

type HtmlTag = keyof HTMLElementTagNameMap;

export function createHtmlElement(props: CreateHtmlElementProps): Html {
  if (props.contents !== undefined && props.contents.trim() === "") {
    return "";
  }

  if (props.isSingle ?? false) {
    return `<${props.tag}${props.args !== undefined ? ` ${props.args}` : ""}>`;
  }

  return `<${props.tag}${props.args !== undefined ? ` ${props.args}` : ""}>${
    props.contents
  }</${props.tag}>`;
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
  return "";
}

export async function renderPage(
  page: PageObjectResponse
): Promise<RenderedPage> {
  const blocks = await fetchPageContents(page.id);
  let pageHtmlContents: Html = "";
  const elementList: Html[] = [];
  let inList = false;

  for (const block of blocks) {
    if (!isBlockObjectResponse(block)) {
      continue;
    }

    if (elementList.length > 0 && !inList) {
      inList = true;
    }

    if (
      block.type !== "numbered_list_item" &&
      block.type !== "bulleted_list_item" &&
      elementList.length > 0
    ) {
      inList = false;

      const isNumbered = elementList.includes("<ol>");

      elementList.push(isNumbered ? "</ol>" : "</ul>");
      pageHtmlContents += elementList.join("");
      elementList.length = 0;
    }

    if (!block.has_children) {
      pageHtmlContents += transformBlockToHtml(block, inList, elementList);

      continue;
    }

    const elementListChildren: Html[] = [];
    let inListChildren = false;
    const children = await fetchBlockChildren(block.id);
    let childrenHtmlContents: Html = "";

    let index = 0;

    for (const child of children) {
      if (elementListChildren.length > 0 && !inListChildren) {
        inListChildren = true;
      }

      const isListItem =
        child.type === "numbered_list_item" ||
        child.type === "bulleted_list_item";
      const isLastChild = index === children.length - 1;

      if (
        (child.type !== "numbered_list_item" &&
          child.type !== "bulleted_list_item" &&
          elementListChildren.length > 0) ||
        (isLastChild && isListItem && elementListChildren.length > 0)
      ) {
        if (isLastChild) {
          elementListChildren.push(
            transformBlockToHtml(child, inListChildren, elementListChildren)
          );
        }

        inListChildren = false;

        const isNumbered = elementListChildren.includes("<ol>");

        elementListChildren.push(isNumbered ? "</ol>" : "</ul>");
        childrenHtmlContents += elementListChildren.join("");
        elementListChildren.length = 0;
      }

      childrenHtmlContents += transformBlockToHtml(
        child,
        inListChildren,
        elementListChildren
      );

      index++;
    }

    pageHtmlContents += transformBlockToHtml(
      block,
      inListChildren,
      elementListChildren,
      childrenHtmlContents
    );
  }

  const css = loadStylesheet();
  const title = extractTitle(page);

  const pageHtml = renderTemplate<PostTemplateReplacements>(HtmlTemplate.Page, {
    content: pageHtmlContents,
    postTitle: title,
  });

  const html = renderTemplate<LayoutTemplateReplacements>(HtmlTemplate.Layout, {
    postTitle: title,
    content: pageHtml,
    css,
  });

  return {
    title,
    html,
  };
}

import {
  type PartialBlockObjectResponse,
  type BlockObjectResponse,
  type PageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import fs from "fs";
import handlebars from "handlebars";
import {fetchBlockChildren, fetchPageContents} from "./notionApi.js";
import {extractCover, extractTitle, transformBlockToHtml} from "./transform.js";
import {checkIsItemList, isBlockObjectResponse, type Html} from "./util.js";

export type LayoutTemplateReplacements = {
  postTitle: string;
  content: Html;
  css: string;
};

export type PostTemplateReplacements = {
  content: Html;
  postTitle: Html;
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

type CompileNotionListProps = {
  inListResult: boolean;
  htmlContentsResult: Html;
};

type HtmlTag = keyof HTMLElementTagNameMap;

export function createHtmlElement({
  tag,
  args,
  contents,
  isSingle,
}: CreateHtmlElementProps): Html {
  if (contents !== undefined && contents.trim() === "") {
    return "";
  }

  const argsString = args !== undefined ? ` ${args}` : "";

  if (isSingle ?? false) {
    return `<${tag}${argsString}>`;
  }

  return `<${tag}${argsString}>${contents}</${tag}>`;
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
  const pageHtmlContents: Html = await processBlocks(blocks);

  const css = loadStylesheet();
  const title = extractTitle(page);
  const coverWithTitle = extractCover(page);

  const pageHtml = renderTemplate<PostTemplateReplacements>(HtmlTemplate.Page, {
    content: pageHtmlContents,
    postTitle: coverWithTitle,
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

async function processBlocks(
  blocks: PartialBlockObjectResponse[] | BlockObjectResponse[]
): Promise<Html> {
  let pageHtmlContents: Html = "";
  const elementList: Html[] = [];
  let inList = false;

  let blockIndex = 0;
  const blockLastIndex = blocks.length - 1;

  for (const block of blocks) {
    if (!isBlockObjectResponse(block)) {
      continue;
    }

    if (elementList.length > 0 && !inList) {
      inList = true;
    }

    const isListItem = checkIsItemList(block);
    const isLastBock = blockIndex === blockLastIndex;

    const {htmlContentsResult, inListResult} = compileNotionList(
      block,
      elementList,
      isLastBock,
      isListItem,
      inList
    );

    if (!inListResult) {
      inList = false;
      pageHtmlContents += htmlContentsResult;
    }

    if (!block.has_children) {
      pageHtmlContents += transformBlockToHtml(block, inList, elementList);

      blockIndex++;
      continue;
    }

    const blockChildrenProcessed = await processBlockChildren(block);
    pageHtmlContents += transformBlockToHtml(
      block,
      inList,
      elementList,
      blockChildrenProcessed
    );

    blockIndex++;
  }

  return pageHtmlContents;
}

const compileNotionList = (
  child: BlockObjectResponse,
  elementList: string[],
  inLastItem: boolean,
  isListItem: boolean,
  inList: boolean
): CompileNotionListProps => {
  if (
    (child.type !== "numbered_list_item" &&
      child.type !== "bulleted_list_item" &&
      elementList.length > 0) ||
    (inLastItem && isListItem && elementList.length > 0)
  ) {
    if (inLastItem && isListItem) {
      elementList.push(transformBlockToHtml(child, inList, elementList));
    }

    const isNumbered = elementList.includes("<ol>");

    elementList.push(isNumbered ? "</ol>" : "</ul>");
    const htmlResult = elementList.join("");
    elementList.length = 0;

    return {inListResult: false, htmlContentsResult: htmlResult};
  }

  return {inListResult: true, htmlContentsResult: ""};
};

async function processBlockChildren(block: BlockObjectResponse): Promise<Html> {
  const elementListChildren: Html[] = [];
  let inListChildren = false;
  const children = await fetchBlockChildren(block.id);
  let childrenHtmlContents: Html = "";

  let index = 0;

  for (const child of children) {
    if (elementListChildren.length > 0 && !inListChildren) {
      inListChildren = true;
    }

    const isListItem = checkIsItemList(child);
    const isLastChild = index === children.length - 1;

    const {htmlContentsResult, inListResult} = compileNotionList(
      child,
      elementListChildren,
      isLastChild,
      isListItem,
      inListChildren
    );

    if (!inListResult) {
      inListChildren = false;
      childrenHtmlContents += htmlContentsResult;
    }

    index++;

    childrenHtmlContents += transformBlockToHtml(
      child,
      inListChildren,
      elementListChildren
    );
  }

  return childrenHtmlContents;
}

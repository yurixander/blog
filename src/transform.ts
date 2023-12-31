import {
  type BlockObjectResponse,
  type BulletedListItemBlockObjectResponse,
  type CalloutBlockObjectResponse,
  type DividerBlockObjectResponse,
  type Heading1BlockObjectResponse,
  type Heading2BlockObjectResponse,
  type Heading3BlockObjectResponse,
  type ImageBlockObjectResponse,
  type NumberedListItemBlockObjectResponse,
  type ParagraphBlockObjectResponse,
  type QuoteBlockObjectResponse,
  type RichTextItemResponse,
  type ToDoBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import {createHtmlElement} from "./template.js";
import {todo, type Html} from "./util.js";

type Transformer<T extends BlockObjectResponse = never> = (block: T) => Html;

export function transformBlockToHtml(block: BlockObjectResponse): Html {
  switch (block.type) {
    case "paragraph":
      return paragraphTransformer(block);
    case "heading_1":
      return heading1Transformer(block);
    case "heading_2":
      return heading2Transformer(block);
    case "heading_3":
      return heading3Transformer(block);
    case "bulleted_list_item":
      return bulletedListItemTransformer(block);
    case "quote":
      return quoteTransformer(block);
    case "numbered_list_item":
      return numberedListItemTransformer(block);
    case "divider":
      return dividerTransformer(block);
    case "to_do":
      return todoTransformer(block);
    case "image":
      return imageTransformer(block);
    case "callout":
      return calloutTransformer(block);
    default:
      throw new Error(`Unknown block type: ${block.type}`);
  }
}

export function transformToHtmlString<T>(
  transformer: (value: T) => Html,
  values: T[]
): Html {
  return values.map(transformer).join("");
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
  const listTag: string[] = [];
  let args: string | undefined;

  if (richText.type === "text") {
    if (richText.annotations.bold) {
      listTag.unshift("b");
    } else if (richText.annotations.italic) {
      listTag.unshift("i");
    } else if (richText.annotations.underline) {
      listTag.unshift("u");
    } else if (richText.annotations.strikethrough) {
      listTag.unshift("del");
    } else if (richText.annotations.color !== "default") {
      args = `style="color: ${richText.annotations.color};"`;
    }

    const text = createHtmlElementList(listTag, richText.text.content);

    if (richText.text.link?.url !== undefined) {
      return createHtmlElement("a", text, `href="${richText.text.link?.url}"`);
    }

    return createHtmlElement("span", text, args);
  }
  // TODO: Handle href
  // TODO: Process other types of rich text.
  console.debug(richText);
  todo();
}

const paragraphTransformer: Transformer<ParagraphBlockObjectResponse> = (
  paragraph
) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    paragraph.paragraph.rich_text
  );

  return createHtmlElement("p", contents);
};

export const heading1Transformer: Transformer<Heading1BlockObjectResponse> = (
  heading1
) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    heading1.heading_1.rich_text
  );

  const tag = heading1.heading_1.is_toggleable ? "toggle" : "h1";

  return createHtmlElement(tag, contents);
};

export const heading2Transformer: Transformer<Heading2BlockObjectResponse> = (
  heading2
) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    heading2.heading_2.rich_text
  );

  const tag = heading2.heading_2.is_toggleable ? "toggle" : "h2";

  return createHtmlElement(tag, contents);
};

const heading3Transformer: Transformer<Heading3BlockObjectResponse> = (
  heading3
) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    heading3.heading_3.rich_text
  );

  const tag = heading3.heading_3.is_toggleable ? "toggle" : "h3";

  return createHtmlElement(tag, contents);
};

const bulletedListItemTransformer: Transformer<
  BulletedListItemBlockObjectResponse
> = (bulletedListItem) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    bulletedListItem.bulleted_list_item.rich_text
  );

  return createHtmlElement("li", contents);
};

const quoteTransformer: Transformer<QuoteBlockObjectResponse> = (quote) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    quote.quote.rich_text
  );

  return createHtmlElement("blockquote", contents);
};

const numberedListItemTransformer: Transformer<
  NumberedListItemBlockObjectResponse
> = (numberedListItem) => {
  // TODO: This output should be encapsulated with `<ol>`.

  const contents = transformToHtmlString(
    transformRichTextToHtml,
    numberedListItem.numbered_list_item.rich_text
  );

  const item = createHtmlElement("li", contents);
  const container = createHtmlElement("ol", item);

  return container;
};

const dividerTransformer: Transformer<DividerBlockObjectResponse> = () => {
  return createHtmlElement("hr", "");
};

const todoTransformer: Transformer<ToDoBlockObjectResponse> = (todo) => {
  const isChecked = todo.to_do.checked ? "checked" : "";
  const textTag = isChecked ? "del" : "p";

  const caption = transformToHtmlString(
    transformRichTextToHtml,
    todo.to_do.rich_text
  );

  const checkbox = createHtmlElement(
    "input",
    "",
    `type="checkbox" ${isChecked} disabled="true"`
  );

  const text = createHtmlElement(textTag, caption);

  const checkboxContainer = createHtmlElement(
    "div",
    `${checkbox}${text}`,
    `class="checkbox-container"`
  );

  return checkboxContainer;
};

const imageTransformer: Transformer<ImageBlockObjectResponse> = (image) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    image.image.caption
  );

  if (image.image.type === "external") {
    const imageHtml = createHtmlElement(
      "img",
      "",
      `src="${image.image.external.url}"`
    );

    const caption = createHtmlElement("p", contents);
    const container = createHtmlElement("div", `${imageHtml}${caption}`);

    return container;
  } else if (image.image.type === "file") {
    const imageHtml = createHtmlElement(
      "img",
      "",
      `src="${image.image.file.url}"`
    );

    const caption = createHtmlElement("p", contents);
    const container = createHtmlElement("div", `${imageHtml}${caption}`);

    return container;
  }

  return createHtmlElement("img", contents);
};

const calloutTransformer: Transformer<CalloutBlockObjectResponse> = (
  callout
) => {
  const richText = transformToHtmlString(
    transformRichTextToHtml,
    callout.callout.rich_text
  );

  let iconSrc: string;

  if (callout.callout.icon?.type === "external") {
    iconSrc = callout.callout.icon.external.url;
  } else if (callout.callout.icon?.type === "emoji") {
    iconSrc = callout.callout.icon.emoji;
  } else if (callout.callout.icon?.type === "file") {
    iconSrc = callout.callout.icon.file.url;
  } else {
    throw new Error(`Icon type is undefined`);
  }

  const icon = createHtmlElement("img", "", `class="icon" src="${iconSrc}"`);
  const text = createHtmlElement("p", richText);

  const container = createHtmlElement(
    "div",
    `${icon}${text}`,
    `class="callout"`
  );

  return container;
};

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
  block
) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    block.paragraph.rich_text
  );

  return createHtmlElement("p", contents);
};

export const heading1Transformer: Transformer<Heading1BlockObjectResponse> = (
  block
) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    block.heading_1.rich_text
  );

  const tag = block.heading_1.is_toggleable ? "toggle" : "h1";

  return createHtmlElement(tag, contents);
};

export const heading2Transformer: Transformer<Heading2BlockObjectResponse> = (
  block
) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    block.heading_2.rich_text
  );

  const tag = block.heading_2.is_toggleable ? "toggle" : "h2";

  return createHtmlElement(tag, contents);
};

const heading3Transformer: Transformer<Heading3BlockObjectResponse> = (
  block
) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    block.heading_3.rich_text
  );

  const tag = block.heading_3.is_toggleable ? "toggle" : "h3";

  return createHtmlElement(tag, contents);
};

const bulletedListItemTransformer: Transformer<
  BulletedListItemBlockObjectResponse
> = (block) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    block.bulleted_list_item.rich_text
  );

  return createHtmlElement("li", contents);
};

const quoteTransformer: Transformer<QuoteBlockObjectResponse> = (block) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    block.quote.rich_text
  );

  return createHtmlElement("blockquote", contents);
};

const numberedListItemTransformer: Transformer<
  NumberedListItemBlockObjectResponse
> = (block) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    block.numbered_list_item.rich_text
  );

  const item = createHtmlElement("li", contents);
  const container = createHtmlElement("ol", item);

  return container;
  /* Output
    <li>Testing</li>
    <li>Improve</li>
    */
  // TODO: This output should be encapsulated with <ol>
};

const dividerTransformer: Transformer<DividerBlockObjectResponse> = () => {
  return createHtmlElement("hr", "");
};

const todoTransformer: Transformer<ToDoBlockObjectResponse> = (block) => {
  const isChecked = block.to_do.checked ? "checked" : "";
  const textTag = isChecked ? "del" : "p";

  const caption = transformToHtmlString(
    transformRichTextToHtml,
    block.to_do.rich_text
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

const imageTransformer: Transformer<ImageBlockObjectResponse> = (block) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    block.image.caption
  );

  if (block.image.type === "external") {
    const image = createHtmlElement(
      "img",
      "",
      `src="${block.image.external.url}"`
    );

    const caption = createHtmlElement("p", contents);
    const container = createHtmlElement("div", `${image}${caption}`);

    return container;
  }

  if (block.image.type === "file") {
    const image = createHtmlElement("img", "", `src="${block.image.file.url}"`);

    const caption = createHtmlElement("p", contents);
    const container = createHtmlElement("div", `${image}${caption}`);

    return container;
  }

  return createHtmlElement("img", contents);
};

const calloutTransformer: Transformer<CalloutBlockObjectResponse> = (block) => {
  const richText = transformToHtmlString(
    transformRichTextToHtml,
    block.callout.rich_text
  );

  let iconSrc = "";

  if (block.callout.icon?.type === "external") {
    iconSrc = block.callout.icon.external.url;
  } else if (block.callout.icon?.type === "emoji") {
    iconSrc = block.callout.icon.emoji;
  } else if (block.callout.icon?.type === "file") {
    iconSrc = block.callout.icon.file.url;
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

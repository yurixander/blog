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

enum HeadingType {
  H1 = "h1",
  H2 = "h2",
  H3 = "h3",
}

enum ElementClass {
  H1 = `class="text-h1"`,
  H2 = `class="text-h2"`,
  H3 = `class="text-h3"`,
  BulletedList = `class="max-w-full break-words mt-0"`,
  Blockquote = `class="border-l-2 ps-2 p-1"`,
  NumberedList = `class="list-decimal pl-4"`,
  CheckboxContainer = `class="flex gap-2 items-center"`,
  Checkbox = `class="size-3.5 appearance-none border-2 checked:border-none checked:bg-checkIcon checked:bg-blue-700" type="checkbox" disabled`,
  Image = `class="max-w-xl object-cover"`,
  CalloutContainer = `class="flex gap-2 p-2 rounded-md bg-neutral-700"`,
  CalloutIcon = `class="size-5"`,
}

const colors = [
  "gray",
  "brown",
  "orange",
  "yellow",
  "green",
  "blue",
  "purple",
  "pink",
  "red",
];

const backgroundColors = [
  "gray_background",
  "brown_background",
  "orange_background",
  "yellow_background",
  "green_background",
  "blue_background",
  "purple_background",
  "pink_background",
  "red_background",
];

export function transformBlockToHtml(
  block: BlockObjectResponse,
  children?: Html
): Html {
  switch (block.type) {
    case "paragraph":
      return paragraphTransformer(block);
    case "heading_1":
      return heading1Transformer(block, children);
    case "heading_2":
      return heading2Transformer(block, children);
    case "heading_3":
      return heading3Transformer(block, children);
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

export function extractColor(color: string): string {
  const isColor = colors.includes(color);
  const isBackgroundColor = backgroundColors.includes(color);

  if (isColor) {
    return `class="text-${color}-600"`;
  }
  if (isBackgroundColor) {
    // TODO: Handle here when is background-color
    throw new Error("Not handle background color");
  }

  throw new Error(`Unknown color : ${color}`);
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

function createToggleableElement(
  title: Html,
  content: Html,
  headingType: HeadingType
): Html {
  return `<details>
  <summary><span class="text-${headingType} break-words">${title}</span></summary>
  ${content}
</details>`;
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
      args = extractColor(richText.annotations.color);
    }

    const text = createHtmlElementList(listTag, richText.text.content);

    if (richText.text.link?.url !== undefined) {
      return createHtmlElement(
        "a",
        text,
        `class="underline" href="${richText.text.link?.url}"`
      );
    }

    return createHtmlElement("span", text, args);
  }

  // TODO: Handle href.
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

export const heading1Transformer = (
  heading1: Heading1BlockObjectResponse,
  children?: Html
) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    heading1.heading_1.rich_text
  );

  if (heading1.heading_1.is_toggleable) {
    const childrenParam = children ?? "";

    return createToggleableElement(contents, childrenParam, HeadingType.H1);
  }

  return createHtmlElement("h1", contents, ElementClass.H1);
};

export const heading2Transformer = (
  heading2: Heading2BlockObjectResponse,
  children?: Html
) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    heading2.heading_2.rich_text
  );

  if (heading2.heading_2.is_toggleable) {
    if (heading2.has_children && children !== undefined) {
      return createToggleableElement(contents, children, HeadingType.H2);
    }
    return createToggleableElement(contents, "", HeadingType.H2);
  }
  return createHtmlElement("h2", contents, ElementClass.H2);
};

const heading3Transformer = (
  heading3: Heading3BlockObjectResponse,
  children?: Html
) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    heading3.heading_3.rich_text
  );

  if (heading3.heading_3.is_toggleable) {
    if (heading3.has_children && children !== undefined) {
      return createToggleableElement(contents, children, HeadingType.H3);
    }
    return createToggleableElement(contents, "", HeadingType.H3);
  }
  return createHtmlElement("h3", contents, ElementClass.H3);
};

const bulletedListItemTransformer: Transformer<
  BulletedListItemBlockObjectResponse
> = (bulletedListItem) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    bulletedListItem.bulleted_list_item.rich_text
  );

  return createHtmlElement("li", contents, ElementClass.BulletedList);
};

const quoteTransformer: Transformer<QuoteBlockObjectResponse> = (quote) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    quote.quote.rich_text
  );

  return createHtmlElement("blockquote", contents, ElementClass.Blockquote);
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
  const textTag = isChecked ? "del" : "span";

  const caption = transformToHtmlString(
    transformRichTextToHtml,
    todo.to_do.rich_text
  );

  const checkbox = createHtmlElement(
    "input",
    "",
    `${ElementClass.Checkbox} ${isChecked}`
  );

  const text = createHtmlElement(textTag, caption);

  const checkboxContainer = createHtmlElement(
    "div",
    `${checkbox}${text}`,
    ElementClass.CheckboxContainer
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
      `${ElementClass.Image} src="${image.image.external.url}"`
    );

    const caption = createHtmlElement("p", contents);
    const container = createHtmlElement("div", `${imageHtml}${caption}`);

    return container;
  } else if (image.image.type === "file") {
    const imageHtml = createHtmlElement(
      "img",
      "",
      `${ElementClass.Image} src="${image.image.file.url}"`
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

  const icon = createHtmlElement(
    "img",
    "",
    `${ElementClass.CalloutIcon} src="${iconSrc}"`
  );

  const text = createHtmlElement("p", richText);

  const container = createHtmlElement(
    "div",
    `${icon}${text}`,
    ElementClass.CalloutContainer
  );

  return container;
};

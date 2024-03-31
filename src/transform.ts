import {
  type PageObjectResponse,
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
  type VideoBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import {createHtmlElement} from "./template.js";
import {
  convertYTUrlToEmbed,
  processPlainText,
  tailwindClassMerge,
  type Html,
} from "./util.js";
import {backgroundColors, colors} from "./constants.js";

type Transformer<T extends BlockObjectResponse = never> = (block: T) => Html;

enum HeadingType {
  H1 = "h1",
  H2 = "h2",
  H3 = "h3",
}

export function transformBlockToHtml(
  block: BlockObjectResponse,
  inList: boolean,
  list?: Html[],
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
      return bulletedListItemTransformer(block, inList, list);
    case "quote":
      return quoteTransformer(block);
    case "numbered_list_item":
      return numberedListItemTransformer(block, inList, list);
    case "divider":
      return dividerTransformer(block);
    case "to_do":
      return todoTransformer(block);
    case "image":
      return imageTransformer(block);
    case "callout":
      return calloutTransformer(block);
    case "video":
      return videoTransformer(block);
    default:
      throw new Error(`Unknown block type: ${block.type}`);
  }
}

export function videoTransformer(video: VideoBlockObjectResponse): Html {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    video.video.caption
  );

  const caption = createHtmlElement({tag: "p", contents});

  if (video.video.type === "external") {
    const src = convertYTUrlToEmbed(video.video.external.url);

    const videoEmbed = createHtmlElement({
      tag: "iframe",
      args: `width="560" height="315" src="${src}" allowfullscreen title="Video embed"`,
    });

    const container = createHtmlElement({
      tag: "div",
      contents: `${videoEmbed}${caption}`,
    });

    return container;
  }

  const source = createHtmlElement({
    tag: "source",
    args: `src="${video.video.file.url}"`,
    isSingle: true,
  });

  const videoEmbed = createHtmlElement({
    tag: "video",
    contents: source,
    args: `controls width="320"`,
  });

  const container = createHtmlElement({
    tag: "div",
    contents: `${videoEmbed}${caption}`,
  });

  return container;
}

export function extractColor(color: string): string {
  const isColor = colors.includes(color);
  const isBackgroundColor = backgroundColors.includes(color);

  if (isColor) {
    return `class="text-${color}"`;
  }

  if (isBackgroundColor) {
    const bgColor = color.replace("_background", "");
    const bgDark = `dark:bg-${bgColor}`;
    const bgLight = `bg-${bgColor}`;

    return tailwindClassMerge(bgLight, bgDark);
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
  const summaryTitle = createHtmlElement({tag: headingType, contents: title});
  const summary = createHtmlElement({tag: "summary", contents: summaryTitle});

  const detailsContent = createHtmlElement({
    tag: "div",
    args: `class="details-container"`,
    contents: content,
  });

  return createHtmlElement({
    tag: "details",
    contents: `${summary}${detailsContent}`,
  });
}

export function transformRichTextToHtml(richText: RichTextItemResponse): Html {
  const listTag: string[] = [];
  let args: string | undefined;
  let isCode = false;

  if (richText.type !== "text") {
    return "";
  }

  if (richText.annotations.bold) {
    listTag.unshift("b");
  }

  if (richText.annotations.italic) {
    listTag.unshift("i");
  }

  if (richText.annotations.underline) {
    listTag.unshift("u");
  }

  if (richText.annotations.strikethrough) {
    listTag.unshift("del");
  }

  if (richText.annotations.color !== "default") {
    args = extractColor(richText.annotations.color);
  }

  if (richText.annotations.code) {
    isCode = true;
  }

  const textProcessed = processPlainText(richText.plain_text);
  const text = createHtmlElementList(listTag, textProcessed);

  if (richText.text.link?.url !== undefined) {
    return createHtmlElement({
      tag: "a",
      contents: text,
      args: `href="${richText.text.link?.url}" ${args}`,
    });
  }

  return createHtmlElement({
    tag: isCode ? "code" : "span",
    contents: text,
    args,
  });
}

const paragraphTransformer: Transformer<ParagraphBlockObjectResponse> = (
  paragraph
) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    paragraph.paragraph.rich_text
  );

  if (contents.length === 0) {
    return "";
  }

  return createHtmlElement({tag: "p", contents});
};

export const heading1Transformer = (
  heading1: Heading1BlockObjectResponse,
  children?: Html
): Html => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    heading1.heading_1.rich_text
  );

  if (heading1.heading_1.is_toggleable) {
    const childrenParam = children ?? "";

    return createToggleableElement(contents, childrenParam, HeadingType.H1);
  }

  return createHtmlElement({tag: "h1", contents});
};

export const heading2Transformer = (
  heading2: Heading2BlockObjectResponse,
  children?: Html
): Html => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    heading2.heading_2.rich_text
  );

  if (heading2.heading_2.is_toggleable) {
    const childrenParam = children ?? "";

    return createToggleableElement(contents, childrenParam, HeadingType.H2);
  }

  return createHtmlElement({tag: "h2", contents});
};

const heading3Transformer = (
  heading3: Heading3BlockObjectResponse,
  children?: Html
): Html => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    heading3.heading_3.rich_text
  );

  if (heading3.heading_3.is_toggleable) {
    const childrenParam = children ?? "";

    return createToggleableElement(contents, childrenParam, HeadingType.H3);
  }

  return createHtmlElement({tag: "h3", contents});
};

function bulletedListItemTransformer(
  bulletedListItem: BulletedListItemBlockObjectResponse,
  inList: boolean,
  list?: Html[]
): Html {
  if (list === undefined) {
    return "";
  }

  const contents = transformToHtmlString(
    transformRichTextToHtml,
    bulletedListItem.bulleted_list_item.rich_text
  );

  const item = createHtmlElement({tag: "li", contents});

  if (inList) {
    list.push(item);
  } else {
    list.push("<ul>");
    list.push(item);
  }

  return "";
}

const quoteTransformer: Transformer<QuoteBlockObjectResponse> = (quote) => {
  const contents = transformToHtmlString(
    transformRichTextToHtml,
    quote.quote.rich_text
  );

  return createHtmlElement({tag: "blockquote", contents});
};

function numberedListItemTransformer(
  numberedListItem: NumberedListItemBlockObjectResponse,
  inList: boolean,
  numberedList?: Html[]
): Html {
  if (numberedList === undefined) {
    return "";
  }

  const contents = transformToHtmlString(
    transformRichTextToHtml,
    numberedListItem.numbered_list_item.rich_text
  );

  const item = createHtmlElement({tag: "li", contents});

  if (inList) {
    numberedList.push(item);
  } else {
    numberedList.push("<ol>");
    numberedList.push(item);
  }

  return "";
}

const dividerTransformer: Transformer<DividerBlockObjectResponse> = () => {
  return createHtmlElement({tag: "hr", isSingle: true});
};

const todoTransformer: Transformer<ToDoBlockObjectResponse> = (todo) => {
  const isChecked = todo.to_do.checked ? "checked" : "";
  const textTag = isChecked.length > 0 ? "del" : "span";

  const caption = transformToHtmlString(
    transformRichTextToHtml,
    todo.to_do.rich_text
  );

  const checkbox = createHtmlElement({
    tag: "input",
    isSingle: true,
    args: `type="checkbox" ${isChecked} disabled`,
  });

  const text = createHtmlElement({tag: textTag, contents: caption});

  const checkboxContainer = createHtmlElement({
    tag: "div",
    contents: `${checkbox}${text}`,
    args: `class="checkbox-container"`,
  });

  return checkboxContainer;
};

const imageTransformer: Transformer<ImageBlockObjectResponse> = (image) => {
  let description: string = "";

  const contents = transformToHtmlString(
    transformRichTextToHtml,
    image.image.caption
  );

  for (const word of image.image.caption) {
    description += " " + word.plain_text;
  }

  const imageUrl =
    image.image.type === "external"
      ? image.image.external.url
      : image.image.file.url;

  const imageHtml = createHtmlElement({
    tag: "img",
    isSingle: true,
    args: `src="${imageUrl}" alt="${description}"`,
  });

  const caption = createHtmlElement({tag: "p", contents});

  const container = createHtmlElement({
    tag: "div",
    contents: `${imageHtml}${caption}`,
  });

  return container;
};

const calloutTransformer: Transformer<CalloutBlockObjectResponse> = (
  callout
) => {
  const richText = transformToHtmlString(
    transformRichTextToHtml,
    callout.callout.rich_text
  );

  if (callout.callout.icon === null) {
    return "";
  }

  let iconSrc: string;
  const iconType = callout.callout.icon.type;

  switch (iconType) {
    case "external":
      iconSrc = callout.callout.icon.external.url;

      break;
    case "emoji":
      iconSrc = callout.callout.icon.emoji;

      break;
    case "file":
      iconSrc = callout.callout.icon.file.url;

      break;
    default:
      throw new Error(`Icon type is undefined`);
  }

  const icon = createHtmlElement({
    tag: "img",
    isSingle: true,
    args: `class="icon" src="${iconSrc}" alt="Icon about content"`,
  });

  const text = createHtmlElement({tag: "p", contents: richText});

  const container = createHtmlElement({
    tag: "div",
    contents: `${icon}${text}`,
    args: `class="callout-container"`,
  });

  return container;
};

export function extractTitle(page: PageObjectResponse): string {
  let title = "Blog post" + Date.now();

  if (page.properties.title.type === "title") {
    for (const titleProp of page.properties.title.title) {
      title = titleProp.plain_text;
    }
  }

  return title;
}

export function extractCover(page: PageObjectResponse): Html {
  if (page.cover === null) {
    return "";
  }

  const urlImage =
    page.cover.type === "external"
      ? page.cover.external.url
      : page.cover.file.url;

  const title = createHtmlElement({
    tag: "div",
    args: `class="page-title"`,
    contents: extractTitle(page),
  });

  const image = createHtmlElement({
    tag: "img",
    isSingle: true,
    args: `src="${urlImage}" alt="Post cover"`,
  });

  const cover = createHtmlElement({
    tag: "div",
    contents: `${image}${title}`,
    args: `class="cover"`,
  });

  return cover;
}

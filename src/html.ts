import {
  type BlockObjectResponse,
  type PageObjectResponse,
  type RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints.js"
import {
  type Html,
  isBlockObjectResponse,
  todo,
  transformToHtmlString,
} from "./util.js"
import fs from "fs"
import {
  type LayoutTemplateReplacements,
  type PageTemplateReplacements,
} from "./index.js"
import handlebars from "handlebars"
import {fetchPageContents} from "./notionApi.js"

export enum HtmlTemplate {
  Layout = "layout",
  Page = "page",
}

export type RenderedPage = {
  title: string
  html: Html
}

export function createHtmlElement(
  tag: string,
  contents: Html,
  args?: string
): Html {
  return `<${tag}${args !== undefined ? ` ${args}` : ""}>${contents}</${tag}>`
}

function createHtmlElementList(tags: string[], content: Html): string {
  const formattedTags = [content]

  for (const tag of tags) {
    formattedTags.unshift(`<${tag}>`)
    formattedTags.push(`</${tag}>`)
  }

  return formattedTags.join("")
}

export function transformRichTextToHtml(richText: RichTextItemResponse): Html {
  const listTag: string[] = []
  let args: string | undefined

  if (richText.type === "text") {
    if (richText.annotations.bold) listTag.unshift("b")
    if (richText.annotations.italic) listTag.unshift("i")
    if (richText.annotations.underline) listTag.unshift("u")
    if (richText.annotations.strikethrough) listTag.unshift("del")
    if (richText.annotations.color !== "default")
      args = `style="color: ${richText.annotations.color};"`

    const text = createHtmlElementList(listTag, richText.text.content)
    return createHtmlElement("span", text, args)
  }
  // TODO: Handle href
  // TODO: Process other types of rich text.
  console.debug(richText)
  todo()
}

export function transformBlockToHtml(block: BlockObjectResponse): Html {
  if (block.type === "paragraph") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.paragraph.rich_text
    )
    return createHtmlElement("p", contents)
  }
  if (block.type === "heading_1") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.heading_1.rich_text
    )
    const tag = block.heading_1.is_toggleable ? "toggle" : "h1"
    return createHtmlElement(tag, contents)
  }
  if (block.type === "heading_2") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.heading_2.rich_text
    )
    const tag = block.heading_2.is_toggleable ? "toggle" : "h2"
    return createHtmlElement(tag, contents)
  }
  if (block.type === "heading_3") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.heading_3.rich_text
    )
    const tag = block.heading_3.is_toggleable ? "toggle" : "h3"
    return createHtmlElement(tag, contents)
  }
  if (block.type === "bulleted_list_item") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.bulleted_list_item.rich_text
    )
    return createHtmlElement("li", contents)
  }
  if (block.type === "quote") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.quote.rich_text
    )
    return createHtmlElement("blockquote", contents)
  }
  if (block.type === "numbered_list_item") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.numbered_list_item.rich_text
    )
    const item = createHtmlElement("li", contents)
    const container = createHtmlElement("ol", item)
    return container
    /* Output
    <li>Testing</li>
    <li>Improve</li>
    */
    // TODO: This output should be encapsulated with <ol>
  }
  if (block.type === "divider") {
    console.log(createHtmlElement("hr", ""))
    return createHtmlElement("hr", "")
  }
  if (block.type === "to_do") {
    const isChecked = block.to_do.checked ? "checked" : ""
    const textTag = isChecked ? "del" : "p"

    const caption = transformToHtmlString(
      transformRichTextToHtml,
      block.to_do.rich_text
    )

    const checkbox = createHtmlElement(
      "input",
      "",
      `type="checkbox" ${isChecked} disabled="true"`
    )
    const text = createHtmlElement(textTag, caption)
    const checkboxContainer = createHtmlElement(
      "div",
      `${checkbox}${text}`,
      `class="checkbox-container"`
    )
    return checkboxContainer
  }
  if (block.type === "image") {
    const contents = transformToHtmlString(
      transformRichTextToHtml,
      block.image.caption
    )

    if (block.image.type === "external") {
      const image = createHtmlElement(
        "img",
        "",
        `src="${block.image.external.url}"`
      )
      const caption = createHtmlElement("p", contents)
      const container = createHtmlElement("div", `${image}${caption}`)
      return container
    }
    if (block.image.type === "file") {
      const image = createHtmlElement(
        "img",
        "",
        `src="${block.image.file.url}"`
      )
      const caption = createHtmlElement("p", contents)
      const container = createHtmlElement("div", `${image}${caption}`)
      return container
    }

    return createHtmlElement("img", contents)
  }

  if (block.type === "callout") {
    const richText = transformToHtmlString(
      transformRichTextToHtml,
      block.callout.rich_text
    )

    let iconSrc = ""
    if (block.callout.icon?.type === "external")
      iconSrc = block.callout.icon.external.url
    if (block.callout.icon?.type === "emoji") iconSrc = block.callout.icon.emoji
    if (block.callout.icon?.type === "file")
      iconSrc = block.callout.icon.file.url

    const icon = createHtmlElement("img", "", `class="icon" src="${iconSrc}"`)
    const text = createHtmlElement("p", richText)
    const container = createHtmlElement(
      "div",
      `${icon}${text}`,
      `class="callout"`
    )
    return container
  }

  console.debug(block)

  // TODO: Implement.
  todo()
}

export function renderTemplate<
  T extends LayoutTemplateReplacements | PageTemplateReplacements
>(name: HtmlTemplate, replacements: T): string {
  const template = handlebars.compile(
    fs.readFileSync(`templates/${name}.html`, "utf-8")
  )

  return template(replacements)
}

export function loadStylesheet(): Html {
  // TODO: Use PostCSS package to programmatically process CSS, along with some plugins like autoprefixer, and minify.
  return fs.readFileSync("style.css", "utf-8")
}

export async function renderPage(
  page: PageObjectResponse
): Promise<RenderedPage> {
  const blocks = await fetchPageContents(page.id)
  let pageHtmlContents: Html = ""

  for (const block of blocks) {
    if (!isBlockObjectResponse(block)) {
      continue
    }

    pageHtmlContents += transformBlockToHtml(block)
  }

  const pageHtml = renderTemplate<PageTemplateReplacements>(HtmlTemplate.Page, {
    content: pageHtmlContents,
  })
  const css = loadStylesheet()

  let title = "Blog post" + Date.now()

  if (page.properties.title.type === "title") {
    page.properties.title.title.forEach(titleProp => {
      title = titleProp.plain_text
    })
  }

  const html = renderTemplate<LayoutTemplateReplacements>(HtmlTemplate.Layout, {
    title,
    page: pageHtml,
    css,
  })

  return {
    title,
    html,
  }
}

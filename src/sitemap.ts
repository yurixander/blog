import {
  requireEnvVariable,
  type Html,
  EnvironmentVariable,
  getOrSetLogger,
} from "./util.js";
import fs from "fs";
import * as path from "path";
import {createHtmlElement} from "./template.js";
import handlebars from "handlebars";
import {writeWorkspaceFile} from "./workspace.js";

export type IndexTemplateReplacements = {
  siteTitle: string;
  content: Html;
};

export enum HtmlTemplate {
  Index = "index",
}

export type RenderedPage = {
  title: string;
  html: Html;
};

export type PostProp = {
  name: string;
  route: string;
};

export function renderTemplate<T extends IndexTemplateReplacements>(
  name: HtmlTemplate,
  replacements: T
): string {
  const template = handlebars.compile(
    fs.readFileSync(`templates/${name}.html`, "utf-8")
  );

  return template(replacements);
}

function extractPostsProps(): PostProp[] {
  const workspacePath = requireEnvVariable(EnvironmentVariable.WorkspacePath);
  const workspacePostsPath = requireEnvVariable(
    EnvironmentVariable.WorkspacePostFolder
  );

  const files = fs.readdirSync(workspacePostsPath);
  const postsPath = workspacePostsPath.replace(workspacePath + "/", "");

  return files
    .filter((file) => fs.statSync(path.join(workspacePostsPath, file)).isFile())
    .map((file) => ({
      name: path.basename(file, ".html"),
      route: path.join(postsPath, file),
    }));
}

export async function generateSitemap(): Promise<void> {
  const logger = getOrSetLogger();
  const title = requireEnvVariable(EnvironmentVariable.SiteTitle);
  const siteFilename = "index.html";
  const postProps = extractPostsProps();

  const contentHtml = postProps
    .map((postProp) =>
      createHtmlElement({
        tag: "li",
        contents: createHtmlElement({
          tag: "a",
          contents: postProp.name,
          args: `href="${postProp.route}"`,
        }),
      })
    )
    .join("");

  const html = renderTemplate<IndexTemplateReplacements>(HtmlTemplate.Index, {
    siteTitle: title,
    content: contentHtml,
  });

  await writeWorkspaceFile(siteFilename, html);
  logger.info(`Wrote: ${siteFilename}.`);
}

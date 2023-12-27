import { config } from "dotenv";
import {
  fetchLastEditedTime,
  fetchPageContents,
  fetchPageDetails,
} from "./notionApi.js";
import { EnvironmentVariable, requireEnvVariable } from "./util.js";
import fs from "fs";
import path from "path";
import { tryInit, tryPull } from "./git.js";
import handlebars from "handlebars";
import {
  BlockObjectResponse,
  PartialBlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";

enum Template {
  Layout = "layout",
  Page = "page",
}

export type LayoutTemplateReplacements = {
  title: string;
  page: string;
};

export type PageTemplateReplacements = {
  content: string;
};

// Load environment variables from `.env` file.
config();

const lastEditedTimeFilename = requireEnvVariable(
  EnvironmentVariable.LastEditedTimeFilename
);

async function updateLocalLastEditedTime(
  newLastEditedTime: string
): Promise<void> {
  const saveFilename = lastEditedTimeFilename;

  fs.writeFileSync(saveFilename, newLastEditedTime);
}

async function getLocalLastEditedTime(): Promise<string | null> {
  const saveFilename = lastEditedTimeFilename;

  if (!fs.existsSync(saveFilename)) {
    return null;
  }

  return fs.readFileSync(saveFilename, "utf-8");
}

async function checkForChanges(): Promise<boolean> {
  const localLastEditedTime = await getLocalLastEditedTime();

  if (localLastEditedTime === null) {
    return true;
  }

  const notionLastEditedTime = await fetchLastEditedTime();

  return notionLastEditedTime !== localLastEditedTime;
}

function transformNotionBlocksToHtml(
  pageContents: Array<PartialBlockObjectResponse | BlockObjectResponse>
): string {
  // TODO: Implement.
  throw new Error("Not yet implemented");
}

async function deploy(): Promise<void> {
  const didInit = await tryInit();

  if (didInit) {
    console.log("Initialized virtual Git repository.");
  }

  const didPull = await tryPull();

  if (didPull) {
    console.log(
      "Pulled changes from remote Git repository. Manual intervention may have occurred."
    );
  }

  const notionPageId = requireEnvVariable(EnvironmentVariable.NotionPageId);
  const notionPageDetails = await fetchPageDetails(notionPageId);
  const notionPageContents = await fetchPageContents(notionPageId);

  // TODO: Transform Notion blocks into corresponding HTML.
  const notionContentsAsHtml = transformNotionBlocksToHtml(notionPageContents);

  const page = renderTemplate<PageTemplateReplacements>(Template.Page, {
    content: notionContentsAsHtml,
  });

  const layout = renderTemplate<LayoutTemplateReplacements>(Template.Layout, {
    // TODO: Extract page title from Notion page details.
    title: "Blog post",
    page,
  });

  // TODO: Need to have a sitemap be the index file, and then create a new file for each blog post.
  writeVirtualFile("index.html", layout);

  // TODO: Deploy by pushing to GitHub's `pages` branch.
}

async function writeVirtualFile(
  subPath: string,
  contents: string
): Promise<void> {
  const basePath = requireEnvVariable(EnvironmentVariable.GithubVirtualPath);
  const fullPath = path.join(basePath, subPath);

  return fs.promises.writeFile(fullPath, contents, { encoding: "utf8" });
}

function renderTemplate<
  T extends LayoutTemplateReplacements | PageTemplateReplacements
>(name: Template, replacements: T): string {
  const template = handlebars.compile(
    fs.readFileSync(`templates/${name}.html`, "utf-8")
  );

  return template(replacements);
}

async function checkAndDeploy(): Promise<void> {
  // If there are no changes, do nothing.
  if (!(await checkForChanges())) {
    console.log("No changes detected.");

    return;
  }

  const notionLastEditedTime = await fetchLastEditedTime();

  updateLocalLastEditedTime(notionLastEditedTime);
  console.log("Changes detected; re-deploying...");
  deploy();
}

// Check for changes every X milliseconds (based in the
// `.env` environment variable).
setInterval(
  () => checkAndDeploy(),
  parseInt(requireEnvVariable(EnvironmentVariable.CheckInterval))
);

// Initial check when the script is first run.
checkAndDeploy();

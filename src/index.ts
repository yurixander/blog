import { config } from "dotenv";
import {
  fetchLastEditedTime,
  fetchPageContents,
  fetchPageDetails,
} from "./notionApi.js";
import {
  EnvironmentVariable,
  Html,
  isBlockObjectResponse,
  requireEnvVariable,
} from "./util.js";
import fs from "fs";
import {
  emptyWorkspace,
  stageCommitAndPush,
  tryInit,
  tryResetWorkspace,
  writeWorkspaceFile,
} from "./workspace.js";
import {
  HtmlTemplate,
  loadStylesheet,
  renderTemplate,
  transformBlockToHtml,
} from "./html.js";

export type LayoutTemplateReplacements = {
  title: string;
  page: Html;
  css: string;
};

export type PageTemplateReplacements = {
  content: Html;
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

async function deploy(): Promise<void> {
  const didReset = tryResetWorkspace();

  if (didReset) {
    console.log("Reset workspace.");
  }

  emptyWorkspace();

  const didInit = await tryInit();

  if (didInit) {
    console.log("Initialized fresh workspace.");
  }

  const notionPageId = requireEnvVariable(EnvironmentVariable.NotionPageId);

  // TODO: Make use of page details.
  const notionPageDetails = await fetchPageDetails(notionPageId);

  const notionPageBlocks = await fetchPageContents(notionPageId);
  let pageHtmlContents: Html = "";

  for (const block of notionPageBlocks) {
    if (!isBlockObjectResponse(block)) {
      continue;
    }

    pageHtmlContents += transformBlockToHtml(block);
  }

  const page = renderTemplate<PageTemplateReplacements>(HtmlTemplate.Page, {
    content: pageHtmlContents,
  });

  const css = loadStylesheet();

  const layout = renderTemplate<LayoutTemplateReplacements>(
    HtmlTemplate.Layout,
    {
      // TODO: Extract page title from Notion page details.
      title: "Blog post",
      page,
      css,
    }
  );

  // TODO: Need to have a sitemap be the index file, and then create a new file for each blog post.
  // TODO: Need to validate both HTML and CSS, likely will need to use a library for that.

  writeWorkspaceFile("index.html", layout);
  console.log("Wrote workspace index file.");
  stageCommitAndPush();
  console.log("Published changes to GitHub.");
}

async function checkAndDeploy(): Promise<void> {
  // If there are no changes, do nothing.
  if (!(await checkForChanges())) {
    console.log("No changes detected.");

    return;
  }

  const notionLastEditedTime = await fetchLastEditedTime();

  console.log("Changes detected; re-deploying...");
  deploy();
  updateLocalLastEditedTime(notionLastEditedTime);
}

// Check for changes every X milliseconds (based in the
// `.env` environment variable).
setInterval(
  () => checkAndDeploy(),
  parseInt(requireEnvVariable(EnvironmentVariable.CheckInterval))
);

// Initial check when the script is first run.
checkAndDeploy();

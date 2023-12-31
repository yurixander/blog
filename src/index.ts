import {type PageObjectResponse} from "@notionhq/client/build/src/api-endpoints.js";
import {config} from "dotenv";
import fs from "fs";
import {fetchLastEditedTime, fetchSharedPages} from "./notionApi.js";
import {renderPage} from "./template.js";
import {
  EnvironmentVariable,
  assert,
  convertTitleToFilename,
  getOrSetLogger,
  requireEnvVariable,
} from "./util.js";
import {
  stageCommitAndPush,
  tryCleanFilesOfWorkspace,
  tryCleanWorkspace,
  tryInitializeWorkspace,
  writeWorkspaceFile,
} from "./workspace.js";
import {generateSitemap} from "./sitemap.js";

// Load environment variables from `.env` file.
config();

const lastEditedTimeFilename = requireEnvVariable(
  EnvironmentVariable.LastEditedTimeFilename
);

async function updateLocalLastEditedTimes(
  pages: PageObjectResponse[]
): Promise<void> {
  const existingLastEditedTimes = await getLocalLastEditedTimes();
  const newLastEditedTimes: Record<string, string> = {};

  for (const page of pages) {
    newLastEditedTimes[page.id] = page.last_edited_time;
  }

  // Merge with existing last edited times.
  Object.assign({}, existingLastEditedTimes, newLastEditedTimes);

  fs.writeFileSync(
    lastEditedTimeFilename,
    JSON.stringify(newLastEditedTimes),
    "utf-8"
  );
}

async function getLocalLastEditedTimes(): Promise<Record<
  string,
  string
> | null> {
  const saveFilename = lastEditedTimeFilename;

  if (!fs.existsSync(saveFilename)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(saveFilename, "utf-8"));
}

async function checkForChanges(): Promise<boolean> {
  const localLastEditedTimes = await getLocalLastEditedTimes();

  if (localLastEditedTimes === null) {
    return true;
  }

  const pages = await fetchSharedPages();

  for (const page of pages) {
    const notionLastEditedTime = await fetchLastEditedTime(page.id);

    const wasModified =
      !(page.id in localLastEditedTimes) ||
      notionLastEditedTime !== localLastEditedTimes[page.id];

    if (wasModified) {
      return true;
    }
  }

  return false;
}

async function deploy(pages: PageObjectResponse[]): Promise<void> {
  const logger = getOrSetLogger();

  // TODO: Show a list of the modified pages' titles.
  logger.info(`Deploying ${pages.length} modified page(s).`);

  // TODO: Merge tryCleanWorkspace with tryCleanFilesOfWorkspace
  tryCleanWorkspace();

  assert(
    await tryInitializeWorkspace(),
    "Workspace should be successfully initialized after cleaning."
  );

  tryCleanFilesOfWorkspace();

  for (const page of pages) {
    const renderedPage = await renderPage(page);

    // TODO: Need to validate both HTML and CSS, likely will need to use a library for that.

    const filename = `${convertTitleToFilename(renderedPage.title)}.html`;

    await writeWorkspaceFile(filename, renderedPage.html);
    logger.info(`Wrote: ${filename}.`);
  }

  void generateSitemap();

  await stageCommitAndPush();
  logger.info("Published changes to GitHub.");
}

async function deployModifiedPages(): Promise<void> {
  // If there are no changes, do nothing.
  if (!(await checkForChanges())) {
    return;
  }

  const pages = await fetchSharedPages();
  const lastEditedTimes = await getLocalLastEditedTimes();

  const modifiedPages = pages.filter(
    (page) =>
      lastEditedTimes === null ||
      !(page.id in lastEditedTimes) ||
      page.last_edited_time !== lastEditedTimes[page.id]
  );

  await deploy(modifiedPages);
  await updateLocalLastEditedTimes(modifiedPages);
}

// Initial deployment attempt when the script is first run.
void deployModifiedPages();

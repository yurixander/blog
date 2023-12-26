import { config } from "dotenv";
import { fetchLastEditedTime } from "./notionApi.js";
import { EnvironmentVariable, requireEnvVariable } from "./util.js";
import fs from "fs";
import { tryInit, tryPull } from "./git.js";

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
  console.log(
    (await tryInit())
      ? "Initialized virtual Git repository."
      : "Virtual Git repository already initialized."
  );

  const didPull = await tryPull();

  if (didPull) {
    console.log(
      "Pulled changes from remote Git repository. Manual intervention may have occurred."
    );
  }

  // TODO: Re-create HTML & CSS files, and re-deploy by pushing to GitHub's `pages` branch.
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

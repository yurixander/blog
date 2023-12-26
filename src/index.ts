import { config } from "dotenv";
import { getLastEditedTime } from "./notionApi.js";
import { requireEnvVariable } from "./util.js";
import fs from "fs";

// Load Notion API token from environment.
config();

const CHECK_INTERVAL = parseInt(requireEnvVariable(process.env.CHECK_INTERVAL));
const LAST_EDITED_TIME_FILENAME = "lastEditedTime.json";

async function updateLocalLastEditedTime(
  lastEditedTime: string
): Promise<void> {
  const saveFilename = LAST_EDITED_TIME_FILENAME;

  fs.writeFileSync(saveFilename, lastEditedTime);
}

async function getLocalLastEditedTime(): Promise<string> {
  const saveFilename = LAST_EDITED_TIME_FILENAME;

  if (!fs.existsSync(saveFilename)) {
    const DEFAULT_LAST_EDITED_TIME = "0";

    updateLocalLastEditedTime(DEFAULT_LAST_EDITED_TIME);

    return DEFAULT_LAST_EDITED_TIME;
  }

  return fs.readFileSync(saveFilename, "utf-8");
}

async function checkForChanges(): Promise<boolean> {
  const notionLastEditedTime = await getLastEditedTime();
  const localLastEditedTime = await getLocalLastEditedTime();

  return notionLastEditedTime !== localLastEditedTime;
}

// Check for changes every X milliseconds (based in the
// `.env` environment variable).
setInterval(() => checkForChanges(), CHECK_INTERVAL);

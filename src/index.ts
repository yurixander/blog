import { Client } from "@notionhq/client";
import { config } from "dotenv";
import { getPageContent, getPageDetails } from "./notionApi";
import { assertEnvVariable } from "./util";

// Load Notion API token from environment.
config();

const token = process.env.NOTION_TOKEN;
const notion = new Client({ auth: token });
const blogPageId = assertEnvVariable(process.env.NOTION_PAGE_ID);
const CHECK_INTERVAL = parseInt(assertEnvVariable(process.env.CHECK_INTERVAL));

async function checkForChanges() {
  // TODO: Implement this function.
}

// Check for changes every X milliseconds (based in the
// `.env` environment variable).
setInterval(() => checkForChanges(), CHECK_INTERVAL);

import {
  type BlockObjectResponse,
  type DatabaseObjectResponse,
  type PageObjectResponse,
  type PartialBlockObjectResponse,
  type PartialDatabaseObjectResponse,
  type PartialPageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import moment from "moment-timezone";
import winston, {type Logger} from "winston";

export enum EnvironmentVariable {
  CheckInterval = "CHECK_INTERVAL",
  LastEditedTimeFilename = "LAST_EDITED_TIME_FILENAME",
  GithubProjectUrl = "GITHUB_PROJECT_URL",
  GithubPagesBranchName = "GITHUB_PAGES_BRANCH_NAME",
  WorkspacePath = "WORKSPACE_PATH",
  NotionToken = "NOTION_TOKEN",
  GithubPersonalAccessToken = "GITHUB_PERSONAL_ACCESS_TOKEN",
  GithubUsername = "GITHUB_USERNAME",
  GithubEmail = "GITHUB_EMAIL",
  LoggerTimezone = "LOGGER_TIMEZONE",
}

export type Html = string;

let loggerSingleton: Logger | null = null;

export function getOrSetLogger(): Logger {
  if (loggerSingleton === null) {
    const loggerTimezone = requireEnvVariable(
      EnvironmentVariable.LoggerTimezone
    );

    loggerSingleton = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp({
          format: () =>
            moment().tz(loggerTimezone).format("YYYY-MM-DD hh:mm:ss A"),
        }),
        winston.format.colorize(),
        winston.format.printf(
          (info) => `${info.timestamp} ${info.level}: ${info.message}`
        )
      ),
      transports: [new winston.transports.Console()],
    });
  }

  return loggerSingleton;
}

export function requireEnvVariable(name: EnvironmentVariable): string {
  const variable = process.env[name];

  if (variable === undefined) {
    throw new Error(`Environment variable ${name} is not defined`);
  }

  return variable;
}

export function todo(): never {
  throw new Error("Not implemented");
}

export function assert(
  condition: boolean,
  reasoning: string
): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${reasoning}`);
  }
}

export function isBlockObjectResponse(
  block: PartialBlockObjectResponse | BlockObjectResponse
): block is BlockObjectResponse {
  return (block as BlockObjectResponse).type !== undefined;
}

export function isPageObjectResponse(
  page:
    | PageObjectResponse
    | PartialPageObjectResponse
    | PartialDatabaseObjectResponse
    | DatabaseObjectResponse
): page is PageObjectResponse {
  // TODO: This doesn't differentiate between partial page and page.
  return page.object === "page";
}

export async function notify(message: string): Promise<void> {
  // TODO: Trigger webhook and notify.
  todo();
}

export function convertTitleToFilename(string: string): string {
  return (
    string
      .toLowerCase()
      // Replace any non-alphanumeric character with a hyphen
      .replace(/[^a-z0-9]/g, "-")
      // Replace multiple hyphens with a single hyphen
      .replace(/-+/g, "-")
      // Trim leading and trailing hyphens
      .replace(/^-*|-*$/g, "")
  );
}

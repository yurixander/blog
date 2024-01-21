import {
  type BlockObjectResponse,
  type DatabaseObjectResponse,
  type PageObjectResponse,
  type PartialBlockObjectResponse,
  type PartialDatabaseObjectResponse,
  type PartialPageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import {HtmlValidate} from "html-validate";
import moment from "moment-timezone";
import winston, {type Logger} from "winston";
import {mkdir} from "fs";

export enum EnvironmentVariable {
  SiteTitle = "SITE_TITLE",
  CheckInterval = "CHECK_INTERVAL",
  LastEditedTimeFilename = "LAST_EDITED_TIME_FILENAME",
  WorkspacePath = "WORKSPACE_PATH",
  NotionToken = "NOTION_TOKEN",
  LoggerTimezone = "LOGGER_TIMEZONE",
  GithubProjectUrl = "GIT_PROJECT_URL",
  GithubPagesBranchName = "GIT_PAGES_BRANCH_NAME",
  GithubPersonalAccessToken = "GIT_PERSONAL_ACCESS_TOKEN",
  GithubUsername = "GIT_USERNAME",
  GithubEmail = "GIT_EMAIL",
  PostCssInputPath = "POSTCSS_INPUT",
  PostCssOutputPath = "POSTCSS_OUTPUT",
  WorkspacePostFolder = "WORKSPACE_POST_FOLDER",
}

export type Html = string;

let loggerSingleton: Logger | null = null;

export function getOrSetLogger(): Logger {
  if (loggerSingleton === null) {
    const loggerTimezone = requireEnvVariable(
      EnvironmentVariable.LoggerTimezone
    );

    const timestampFormat = (): string =>
      moment().tz(loggerTimezone).format("YYYY-MM-DD hh:mm:ss A");

    loggerSingleton = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp({
          format: timestampFormat,
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

export async function validateHtml(html: Html): Promise<void> {
  const htmlValidate = new HtmlValidate();
  const report = await htmlValidate.validateString(html);
  const logger = getOrSetLogger();

  if (!report.valid) {
    logger.info("Errors: ", report.errorCount);
    for (const result of report.results) {
      for (const message of result.messages) {
        logger.info(
          `Line ${message.line}, Column ${message.column}: ${message.message}`
        );
      }
    }
  }
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

export function tailwindClassMerge(...args: string[]): string {
  return `class="${args.join(" ")}"`;
}

export function createFolder(folderName: string): void {
  mkdir(folderName, {recursive: true}, (error) => {
    if (error !== null) {
      console.error("Error creating folder: ", error);
    }
  });
}

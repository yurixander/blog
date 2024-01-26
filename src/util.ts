import {
  type BlockObjectResponse,
  type DatabaseObjectResponse,
  type PageObjectResponse,
  type PartialBlockObjectResponse,
  type PartialDatabaseObjectResponse,
  type PartialPageObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";
import {HtmlValidate, type Report} from "html-validate";
import moment from "moment-timezone";
import winston, {type Logger} from "winston";
import {mkdir} from "fs";
import {YT_REG_EXP} from "./constants.js";

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
  FetchPageSize = "FETCH_PAGE_SIZE",
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

export async function validateHtml(html: Html): Promise<Report> {
  const htmlValidate = new HtmlValidate();

  return await htmlValidate.validateString(html);
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

export function processPlainText(plainText: string): string {
  return plainText.replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function createFolder(folderName: string): Promise<void> {
  mkdir(folderName, {recursive: true}, (error) => {
    if (error !== null) {
      throw new Error(`Error creating folder: ${error.message}`);
    }
  });
}

export function convertYTUrlToEmbed(url: string): string {
  const match = url.match(YT_REG_EXP);

  if (match != null && match[5].length > 0) {
    return `https://www.youtube.com/embed/${match[5]}`;
  }

  throw new Error("Invalid url");
}

export function checkIsItemList(block: BlockObjectResponse): boolean {
  return (
    block.type === "numbered_list_item" || block.type === "bulleted_list_item"
  );
}

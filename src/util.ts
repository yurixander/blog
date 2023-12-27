import {
  PartialBlockObjectResponse,
  BlockObjectResponse,
} from "@notionhq/client/build/src/api-endpoints.js";

export enum EnvironmentVariable {
  CheckInterval = "CHECK_INTERVAL",
  LastEditedTimeFilename = "LAST_EDITED_TIME_FILENAME",
  GithubProjectUrl = "GITHUB_PROJECT_URL",
  GithubPagesBranchName = "GITHUB_PAGES_BRANCH_NAME",
  WorkspacePath = "WORKSPACE_PATH",
  NotionToken = "NOTION_TOKEN",
  NotionPageId = "NOTION_PAGE_ID",
  GithubPersonalAccessToken = "GITHUB_PERSONAL_ACCESS_TOKEN",
  GithubUsername = "GITHUB_USERNAME",
  GithubEmail = "GITHUB_EMAIL",
}

export type Html = string;

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

export function transformToHtmlString<T>(
  transformer: (value: T) => Html,
  values: T[]
): Html {
  return values.map(transformer).join("");
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

export async function notify(message: string): Promise<void> {
  // TODO: Trigger webhook and notify.
  todo();
}

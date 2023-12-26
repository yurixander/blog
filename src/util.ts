export enum EnvironmentVariable {
  CheckInterval = "CHECK_INTERVAL",
  LastEditedTimeFilename = "LAST_EDITED_TIME_FILENAME",
  GithubProjectUrl = "GITHUB_PROJECT_URL",
  GithubPagesBranchName = "GITHUB_PAGES_BRANCH_NAME",
  GithubVirtualPath = "GITHUB_VIRTUAL_PATH",
  NotionToken = "NOTION_TOKEN",
  NotionPageId = "NOTION_PAGE_ID",
}

export function requireEnvVariable(name: EnvironmentVariable): string {
  const variable = process.env[name];

  if (variable === undefined) {
    throw new Error(`Environment variable ${name} is not defined`);
  }

  return variable;
}

import { SimpleGit, simpleGit } from "simple-git";
import { EnvironmentVariable, requireEnvVariable } from "./util.js";
import fs from "fs";
import path from "path";
import dayjs from "dayjs";

let gitSingleton: SimpleGit | null = null;

function getOrSetGit(): SimpleGit {
  if (gitSingleton !== null) {
    return gitSingleton;
  }

  const workspacePath = requireEnvVariable(EnvironmentVariable.WorkspacePath);

  gitSingleton = simpleGit(workspacePath);

  return gitSingleton;
}

export async function tryInit(): Promise<boolean> {
  const workspacePath = requireEnvVariable(EnvironmentVariable.WorkspacePath);

  if (fs.existsSync(workspacePath)) {
    return false;
  }

  fs.mkdirSync(workspacePath);

  const githubProjectUrl = requireEnvVariable(
    EnvironmentVariable.GithubProjectUrl
  );

  const authenticatedGithubProjectUrl = githubProjectUrl.replace(
    "https://",
    `https://${requireEnvVariable(
      EnvironmentVariable.GithubPersonalAccessToken
    )}@`
  );

  const githubPagesBranchName = requireEnvVariable(
    EnvironmentVariable.GithubPagesBranchName
  );

  const git = getOrSetGit();

  await git.clone(authenticatedGithubProjectUrl, ".");
  await git.checkout(githubPagesBranchName);

  const githubUsername = requireEnvVariable(EnvironmentVariable.GithubUsername);
  const githubEmail = requireEnvVariable(EnvironmentVariable.GithubEmail);

  await git.addConfig("user.name", githubUsername, false, "local");
  await git.addConfig("user.email", githubEmail, false, "local");

  return true;
}

export function tryResetWorkspace(): boolean {
  const workspacePath = requireEnvVariable(EnvironmentVariable.WorkspacePath);

  if (!fs.existsSync(workspacePath)) {
    return false;
  }

  fs.rmSync(workspacePath, { recursive: true });

  return true;
}

export async function stageCommitAndPush(): Promise<void> {
  const git = getOrSetGit();

  await git.add("-A");

  // TODO: In the future, use a more descriptive commit message. Perhaps base it on what page(s) were updated.
  await git.commit(dayjs().format());

  await git.push();
}

export function emptyWorkspace(): boolean {
  const workspacePath = requireEnvVariable(EnvironmentVariable.WorkspacePath);

  if (!fs.existsSync(workspacePath)) {
    return false;
  }

  const filesAndDirectories = fs
    .readdirSync(workspacePath)
    .filter((fileOrDirectory) => fileOrDirectory !== ".git");

  for (const fileOrDirectory of filesAndDirectories) {
    fs.rmSync(path.join(workspacePath, fileOrDirectory), { recursive: true });
  }

  return true;
}

export async function writeWorkspaceFile(
  subPath: string,
  contents: string
): Promise<void> {
  const basePath = requireEnvVariable(EnvironmentVariable.WorkspacePath);
  const fullPath = path.join(basePath, subPath);

  return fs.promises.writeFile(fullPath, contents, { encoding: "utf8" });
}

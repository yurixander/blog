import { SimpleGit, simpleGit } from "simple-git";
import { EnvironmentVariable, requireEnvVariable } from "./util.js";
import fs from "fs";

let gitSingleton: SimpleGit | null = null;

function getOrSetGit(): SimpleGit {
  if (gitSingleton !== null) {
    return gitSingleton;
  }

  const virtualPath = requireEnvVariable(EnvironmentVariable.GithubVirtualPath);

  gitSingleton = simpleGit(virtualPath);

  return gitSingleton;
}

export async function tryInit(): Promise<boolean> {
  const virtualPath = requireEnvVariable(EnvironmentVariable.GithubVirtualPath);

  if (fs.existsSync(virtualPath)) {
    return false;
  }

  fs.mkdirSync(virtualPath);

  const githubProjectUrl = requireEnvVariable(
    EnvironmentVariable.GithubProjectUrl
  );

  const githubPagesBranchName = requireEnvVariable(
    EnvironmentVariable.GithubPagesBranchName
  );

  const git = getOrSetGit();

  await git.clone(githubProjectUrl, ".");
  await git.checkout(githubPagesBranchName);

  return true;
}

export async function tryPull(): Promise<boolean> {
  const git = getOrSetGit();
  const result = await git.pull();

  return result.files.length > 0;
}

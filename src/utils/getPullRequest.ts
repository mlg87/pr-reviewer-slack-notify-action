import * as core from "@actions/core";
import * as github from "@actions/github";

import { fail } from "./fail";
import { logger } from "./logger";

export const getPullRequest = async () => {
  logger.info("START getPullRequest");
  try {
    const ghToken = core.getInput("github-token");
    const octokit = github.getOctokit(ghToken);
    const {
      commits,
      pull_request: prFromContext,
      repository,
    } = github.context.payload;

    if (prFromContext) {
      logger.info(`using PR from context: ${JSON.stringify(prFromContext)}`);
      const { data } = await octokit.rest.pulls.get({
        owner: github.context.payload.repository?.owner.login || "",
        repo: repository?.name || "",
        pull_number: prFromContext.number,
      });
      return data;
    }

    if (!commits || !commits.length) {
      throw Error("No commits found");
    }

    if (!repository) {
      throw Error("No repository found in github.context.payload");
    }

    const commit_sha = commits[0].id;
    const res = await octokit.rest.repos.listPullRequestsAssociatedWithCommit({
      owner: repository.owner.name!,
      repo: repository.name,
      commit_sha,
    });

    const [pull_request] = res.data;

    if (!pull_request) {
      throw Error(`No pull_request found for commit: ${commit_sha}`);
    }

    logger.info(`END getPullRequest: ${JSON.stringify(pull_request)}`);
    return pull_request;
  } catch (error) {
    fail(error);
    throw error;
  }
};

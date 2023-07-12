import * as core from "@actions/core";
import * as github from "@actions/github";

import { fail } from "./fail";
import { logger } from "./logger";

export const getPrForCommit = async () => {
  logger.info('START getPrForCommit')
  try {
    const ghToken = core.getInput("github-token");
    const octokit = github.getOctokit(ghToken);
    const { commits, pull_request: pr, repository } = github.context.payload;


    const {data: fetchedPr} = (await octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
      // @ts-ignore
      owner: repository?.owner?.login, // remove leading slash
      // @ts-ignore
      repo: repository?.name,
      // @ts-ignore
      pull_number: pr?.number,
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    }))

    if (fetchedPr) {
      return fetchedPr;
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

    logger.info(`END getPrForCommit: ${JSON.stringify(pull_request)}`)
    return pull_request;
  } catch (error) {
    fail(error);
    throw error;
  }
};

import * as github from "@actions/github";
import * as core from "@actions/core";
import { fail } from "./fail";
import { logger } from "./logger";
import { getPullRequest } from "./getPullRequest";

export const getSlackMessageId = async (): Promise<string | null> => {
  logger.info("Looking up SLACK_MESSAGE_ID from PR comments");
  try {
    const { repository } = github.context.payload;
    let pull_request: any = github.context.payload.pull_request;
    if (github.context.eventName === "push" && !pull_request) {
      pull_request = await getPullRequest();
    }
    if (!pull_request) {
      throw Error(
        "No pull_request key on github.context.payload in getSlackMessageId"
      );
    }
    if (!repository) {
      throw Error(
        "No repository key on github.context.payload in getSlackMessageId"
      );
    }

    const octokit = github.getOctokit(core.getInput("github-token"));
    const res = await octokit.rest.issues.listComments({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: pull_request.number,
    });
    let slackMessageId;
    res.data.forEach((comment) => {
      const match = comment?.body?.match(
        /SLACK_MESSAGE_ID:[0-9]{1,}.[0-9]{1,}/
      );
      if (match) {
        slackMessageId = match[0];
      }
    });

    if (!slackMessageId) {
      logger.info(
        `No SLACK_MESSAGE_ID found in PR #${pull_request.number} comments`
      );
      return null;
    }

    logger.info(`Found ${slackMessageId} for PR #${pull_request.number}`);
    return slackMessageId;
  } catch (error) {
    fail(error);
    throw error;
  }
};

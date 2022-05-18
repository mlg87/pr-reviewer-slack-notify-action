import * as github from "@actions/github";
import * as core from "@actions/core";
import { fail } from "./fail";
import { logger } from "./logger";

// requires pull_request and repository as inputs bc of the differently shaped action payloads
export const getSlackMessageId = async (): Promise<string> => {
  logger.info('START getSlackMessageId')
  try {
    const { pull_request, repository } = github.context.payload;
    logger.info(`github.context: ${JSON.stringify(github.context)}`)
    if (!pull_request) {
      throw Error(
        "No pull_request key on github.context.payload in getSlackMessageId"
      );
    } else if (!repository) {
      throw Error(
        "No repository key on github.context.payload in getSlackMessageId"
      );
    }
    // get slack id and PR number from pull comment
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
      throw Error(
        "Unable to find SLACK_MESSAGE_ID comment in PR comment thread."
      );
    }

    logger.info(`END getSlackMessageId: ${slackMessageId}`)
    return slackMessageId;
  } catch (error) {
    fail(error);
    throw error;
  }
};

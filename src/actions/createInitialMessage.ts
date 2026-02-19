import * as core from "@actions/core";
import * as github from "@actions/github";
import { createUsersToAtString } from "../utils/createUsersToAtString";
import { fail } from "../utils/fail";
import { getPullRequest } from "../utils/getPullRequest";
import { logger } from "../utils/logger";
import { slackWebClient } from "../utils/slackWebClient";
import { getRequestedReviewersAsIndividuals } from "../utils/getRequestedReviewersAsIndividuals";

export const createInitialMessage = async (): Promise<string | void> => {
  const verbose: boolean = core.getBooleanInput("verbose");
  logger.info(`Creating initial Slack notification (verbose: ${verbose})`);

  try {
    const channelId = core.getInput("channel-id");
    const { repository } = github.context.payload;
    const pull_request = await getPullRequest();

    if (!pull_request) {
      logger.info("No pull_request found, skipping initial message");
      return;
    }

    if (!repository) {
      logger.info("No repository found on payload, skipping initial message");
      return;
    }

    const requestedReviewers = await getRequestedReviewersAsIndividuals();

    if (!requestedReviewers.length) {
      logger.info("No requested reviewers on PR, skipping initial message");
      return;
    }

    let baseMessage = `*${pull_request.user?.login}* is requesting your review on <${pull_request._links.html.href}|*${pull_request.title}*>`;
    if (!!pull_request.body && verbose) {
      baseMessage = `${baseMessage}\n>${pull_request.body}`;
    }

    const usersToAtString = await createUsersToAtString(requestedReviewers);

    const text = `${usersToAtString} ${baseMessage}`;
    const prSlackMsg = await slackWebClient.chat.postMessage({
      channel: channelId,
      text,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text,
          },
        },
      ],
    });

    if (!prSlackMsg.ok || !prSlackMsg.ts) {
      throw Error("Failed to create initial Slack message");
    }

    const ghToken = core.getInput("github-token");
    const octokit = github.getOctokit(ghToken);
    const slackMessageId = `SLACK_MESSAGE_ID:${prSlackMsg.ts}`;
    await octokit.rest.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: pull_request.number,
      body: slackMessageId,
    });

    logger.info(
      `Initial Slack message created for PR #${pull_request.number} (${slackMessageId})`
    );
    core.summary.addRaw(
      `Slack notification sent for PR #${pull_request.number}. Thread ID: ${prSlackMsg.ts}`
    );
    await core.summary.write();

    return slackMessageId;
  } catch (error: any) {
    core.error(`Failed to create initial Slack message: ${error.message}`);
    fail(error.message);
  }
};

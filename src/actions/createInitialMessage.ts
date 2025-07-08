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
  const labelForInitialNotification = core.getInput(
    "label-for-initial-notification"
  );
  logger.info(`START createInitialMessage. Verbose? ${verbose}`);

  try {
    const channelId = core.getInput("channel-id");
    const { repository } = github.context.payload;
    const pull_request = await getPullRequest();

    if (!pull_request || !repository) return;

    // Check if the required label is present (if one is configured)
    if (labelForInitialNotification) {
      let hasRequiredLabel = false;
      for (const label of pull_request.labels || []) {
        if (label.name === labelForInitialNotification) {
          hasRequiredLabel = true;
          break;
        }
      }

      if (!hasRequiredLabel) {
        logger.info(
          `Skipping initial message creation because required label '${labelForInitialNotification}' is not present`
        );
        return;
      }
    }

    const requestedReviewers = await getRequestedReviewersAsIndividuals();

    //
    // ─── RETURN IF THERE ARE NO REQUESTED REVIEWERS ──────────────────
    //

    if (!requestedReviewers.length) {
      return;
    }

    let baseMessage = `*${pull_request.user?.login}* is requesting your review on <${pull_request._links.html.href}|*${pull_request.title}*>`;
    if (!!pull_request.body && verbose) {
      baseMessage = `${baseMessage}\n>${pull_request.body}`;
    }

    // build users to mention string
    const usersToAtString = await createUsersToAtString(requestedReviewers);

    // DOCS https://api.slack.com/methods/chat.postMessage
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
      throw Error("failed to create initial slack message");
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

    logger.info(`END createInitialMessage: ${slackMessageId}`);
    return slackMessageId;
  } catch (error: any) {
    console.error("error in createInitialMessage::: ", error);

    fail(error.message);
  }
};

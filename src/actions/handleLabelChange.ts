import * as core from "@actions/core";
import * as github from "@actions/github";

import { fail } from "../utils/fail";
import { getEngineersFromS3 } from "../utils/getEngineersFromS3";
import { getSlackMessageId } from "../utils/getSlackMessageId";
import { logger } from "../utils/logger";
import { slackWebClient } from "../utils/slackWebClient";

import { createInitialMessage } from "./createInitialMessage";

export const handleLabelChange = async (): Promise<void> => {
  try {
    const channelId = core.getInput("channel-id");
    const labelForInitialNotification = core.getInput(
      "label-for-initial-notification",
    );
    const labelNameToWatchFor = core.getInput("label-name-to-watch-for");
    const { pull_request, sender, label } = github.context.payload;

    if (!pull_request) {
      throw Error("No pull_request found on github.context.payload");
    }

    if (!sender) {
      throw Error("No sender found on github.context.payload");
    }

    // Handle initial notification trigger via label-for-initial-notification
    if (label?.name === labelForInitialNotification) {
      logger.info(
        `Label '${labelForInitialNotification}' applied to PR #${pull_request.number}, checking for existing Slack thread`,
      );

      const existingMessageId = await getSlackMessageId();

      if (existingMessageId) {
        logger.info(
          `Slack thread already exists (${existingMessageId}), skipping duplicate notification`,
        );
        core.summary.addRaw(
          `Slack thread already exists for PR #${pull_request.number}. No new notification sent.`,
        );
        await core.summary.write();
        return;
      }

      logger.info(
        `No existing Slack thread found, creating initial notification`,
      );
      await createInitialMessage();
      return;
    }

    // Handle the label-name-to-watch-for functionality (existing logic)
    if (labelNameToWatchFor) {
      let hasLabel = false;
      pull_request.labels.forEach((l: any) => {
        if (l.name === labelNameToWatchFor) {
          hasLabel = true;
        }
      });

      if (!hasLabel) {
        logger.info(
          `Label '${labelNameToWatchFor}' not present on PR, skipping`,
        );
        return;
      }

      const slackUsers = await getEngineersFromS3();
      const [labeler] = slackUsers.engineers.filter((user) => {
        return user.github_username === sender.login;
      });
      const [author] = slackUsers.engineers.filter((user) => {
        return user.github_username === pull_request.user.login;
      });

      const plainText = `<@${author.slack_id}>, ${labeler.github_username} added the label ${labelNameToWatchFor} to your PR`;
      const richText = `<@${author.slack_id}>, *${labeler.github_username}* added the label *${labelNameToWatchFor}* to your PR`;
      const slackMessageId = await getSlackMessageId();

      if (!slackMessageId) {
        logger.info(
          `No Slack thread found for label '${labelNameToWatchFor}' notification, skipping`,
        );
        core.warning(
          `Unable to notify about label '${labelNameToWatchFor}' because no Slack message ID could be found.`,
        );
        return;
      }

      logger.info(
        `Posting label '${labelNameToWatchFor}' notification to Slack thread`,
      );
      await slackWebClient.chat.postMessage({
        channel: channelId,
        thread_ts: slackMessageId,
        text: plainText,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: richText,
            },
          },
        ],
      });

      await slackWebClient.reactions.add({
        channel: channelId,
        timestamp: slackMessageId,
        name: "heart_eyes",
      });
    }

    return;
  } catch (error) {
    fail(error);
    throw error;
  }
};

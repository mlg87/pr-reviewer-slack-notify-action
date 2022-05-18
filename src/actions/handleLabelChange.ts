import * as core from "@actions/core";
import * as github from "@actions/github";
import { fail } from "../utils/fail";
import { getEngineersFromS3 } from "../utils/getEngineersFromS3";
import { getSlackMessageId } from "../utils/getSlackMessageId";
import { logger } from "../utils/logger";
import { slackWebClient } from "../utils/slackWebClient";

// TODO handle labels being removed
export const handleLabelChange = async (): Promise<void> => {
  logger.info('START handleLableChange')
  try {
    const channelId = core.getInput("channel-id");
    const labelNameToWatchFor = core.getInput("label-name-to-watch-for");
    const slackUsers = await getEngineersFromS3();
    const { pull_request, repository, sender } = github.context.payload;

    if (!pull_request) {
      throw Error("No pull_request found on github.context.payload");
    }

    if (!sender) {
      throw Error("No sender found on github.context.payload");
    }

    // if there is now a matching label added, notify the slack message
    let hasLabel = false;
    pull_request.labels.forEach((label: any) => {
      if (label.name === labelNameToWatchFor) {
        hasLabel = true;
      }
    });

    if (!hasLabel) {
      return;
    }

    const [labeler] = slackUsers.engineers.filter((user) => {
      return user.github_username === sender.login;
    });
    const [author] = slackUsers.engineers.filter((user) => {
      return user.github_username === pull_request.user.login;
    });

    const plainText = `<@${author.slack_id}>, ${labeler.github_username} added the label ${labelNameToWatchFor} to your PR`;
    const richText = `<@${author.slack_id}>, *${labeler.github_username}* added the label *${labelNameToWatchFor}* to your PR`;
    const slackMessageId = await getSlackMessageId();

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

    logger.info('END handleLableChange')
    return;
  } catch (error) {
    fail(error);
    throw error;
  }
};

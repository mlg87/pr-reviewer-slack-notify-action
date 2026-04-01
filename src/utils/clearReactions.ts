import * as core from "@actions/core";
import { WebAPIPlatformError } from "@slack/web-api";

import { fail } from "./fail";
import { logger } from "./logger";
import { slackWebClient } from "./slackWebClient";

export const clearReactions = async (slackMessageId: string) => {
  logger.info(`Clearing reactions on Slack message ${slackMessageId}`);
  try {
    const channelId = core.getInput("channel-id");

    const existingReactions = await slackWebClient.reactions.get({
      channel: channelId,
      timestamp: slackMessageId,
    });

    if (
      existingReactions.type === "message" &&
      existingReactions.message &&
      existingReactions.message.reactions
    ) {
      for (const reaction of existingReactions.message.reactions) {
        await slackWebClient.reactions.remove({
          channel: channelId,
          timestamp: slackMessageId,
          name: reaction.name!,
        });
      }
    }

    logger.info("Reactions cleared");
    return;
  } catch (error) {
    if ((error as WebAPIPlatformError)?.data?.error === "no_reaction") {
      logger.info("No reactions to clear (no_reaction error)");
      return;
    }

    fail(error);
    throw error;
  }
};

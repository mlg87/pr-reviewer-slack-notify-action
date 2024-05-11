import * as core from "@actions/core";
import { fail } from "./fail";
import { logger } from "./logger";
import { slackWebClient } from "./slackWebClient";
import { WebAPIPlatformError } from "@slack/web-api";

export const clearReactions = async (slackMessageId: string) => {
  logger.info(`START clearReactions: ${slackMessageId}`);
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

    logger.info("END clearReactions");
    return;
  } catch (error) {
    if ((error as WebAPIPlatformError)?.data?.error === "no_reaction") {
      // Fail silently
      logger.info(`END clearReactions with error: ${JSON.stringify(error)}`);
      return;
    }

    fail(error);
    throw error;
  }
};

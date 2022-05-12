import  core from "@actions/core"
import { fail } from './fail';
import { slackWebClient } from './slackWebClient';

export const clearReactions = async (slackMessageId: string) => {
  try {
    const channelId = core.getInput("channel-id");

    const existingReactions = await slackWebClient.reactions.get({
      channel: channelId,
      timestamp: slackMessageId,
    });

    if (
      existingReactions.type === 'message' &&
      existingReactions.message &&
      existingReactions.message.reactions
    ) {
      for(const reaction of existingReactions.message.reactions) {
        await slackWebClient.reactions.remove({
          channel: channelId,
          timestamp: slackMessageId,
          name: reaction.name!,
        })
      }
    }

    return;
  } catch (error) {
    fail(error);
    throw(error)
  }
};

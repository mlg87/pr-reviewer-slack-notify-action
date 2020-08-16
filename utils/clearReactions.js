const core = require("@actions/core");

const { slackWebClient } = require(".");

module.exports = async (slackMessageId) => {
  try {
    const channelId = core.getInput("channel-id");

    const existingReactions = await slackWebClient.reactions.get({
      channel: channelId,
      timestamp: slackMessageId,
    });

    if (
      existingReactions.message.reactions &&
      existingReactions.message.reactions.length
    ) {
      existingReactions.message.reactions.forEach(async (reaction) => {
        await slackWebClient.reactions.remove({
          channel: channelId,
          timestamp: slackMessageId,
          name: reaction.name,
        });
      });
    }

    return;
  } catch (error) {
    core.setFailed(error.message);
  }
};

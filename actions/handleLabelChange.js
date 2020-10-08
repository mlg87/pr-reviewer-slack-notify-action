const core = require("@actions/core");
const github = require("@actions/github");
const { slackWebClient, getSlackMessageId } = require("../utils");

// TODO handle labels being removed
module.exports = async () => {
  try {
    const channelId = core.getInput("channel-id");
    const labelNameToWatchFor = core.getInput("label-name-to-watch-for");
    const slackUsers = JSON.parse(core.getInput("slack-users"));
    const { pull_request, repository, sender } = github.context.payload;

    // if there is now a matching label added, notify the slack message
    let hasLabel = false;
    pull_request.labels.forEach((label) => {
      if (label.name === labelNameToWatchFor) {
        hasLabel = true;
      }
    });

    if (!hasLabel) {
      return null;
    }

    const [labeler] = slackUsers.filter((user) => {
      return user.github_username === sender.login;
    });
    const [author] = slackUsers.filter((user) => {
      return user.github_username === pull_request.user.login;
    });

    const plainText = `<@${author.slack_id}>, ${labeler.github_username} added the label ${labelNameToWatchFor} to your PR`;
    const richText = `<@${author.slack_id}>, *${labeler.github_username}* added the label *${labelNameToWatchFor}* to your PR`;
    const slackMessageId = await getSlackMessageId(pull_request, repository);

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

    return await slackWebClient.reactions.add({
      channel: channelId,
      timestamp: slackMessageId,
      name: "heart_eyes",
    });
  } catch (error) {
    core.setFailed(error.message);
  }
};

const core = require("@actions/core");
const github = require("@actions/github");
const { slackWebClient } = require("../utils");

// TODO use actual values from artifacts
const SLACK_MESSAGE_ID = "1597439544.023300";
const PR_NUMBER = 2;

const reactionMap = {
  commented: "speech_balloon",
  approved: "white_check_mark",
  "changes-requested": "octagonal_sign",
};

module.exports = async () => {
  try {
    const channelId = core.getInput("channel-id");
    const slackUsers = JSON.parse(core.getInput("slack-users"));
    // const requestedReviewers = github.context.payload.pull_request.requested_reviewers.map(
    //   (user) => user.login
    // );
    const { action, pull_request, review } = github.context.payload;

    // TODO handle more than just submitted PRs
    if (action !== "submitted") {
      return null;
    }

    let reactionToAdd = reactionMap["changes-requested"];
    if (review.state === "commented") {
      reactionToAdd = reactionMap["commented"];
    } else if (review.state === "approved") {
      reactionToAdd = reactionMap["approved"];
    }

    // get existing reactions on message
    const existingReactionsRes = await slackWebClient.reactions.get({
      channel: channelId,
      timestamp: SLACK_MESSAGE_ID,
    });

    let hasReaction = false;
    // return out if the reaction we would add is already present (since we cant have the bot react on behalf of a user)
    existingReactionsRes.message.reactions.forEach((reaction) => {
      if (reaction.name === reactionToAdd) {
        hasReaction = true;
      }
    });

    if (hasReaction) {
      return null;
    }

    // add new reactions
    await slackWebClient.reactions.add({
      channel: channelId,
      timestamp: SLACK_MESSAGE_ID,
      name: reactionToAdd,
    });
    const [reviewer] = slackUsers.filter((user) => {
      return user.github_username === review.user.login;
    });
    const [author] = slackUsers.filter((user) => {
      return user.github_username === pull_request.user.login;
    });
    const messageText = `<@${author.slack_id}>, ${reviewer.github_username} ${review.state} your PR`;
    // post corresponding message
    return await slackWebClient.chat.postMessage({
      channel: channelId,
      thread_ts: SLACK_MESSAGE_ID,
      text: messageText,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
};

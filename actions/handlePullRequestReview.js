const core = require("@actions/core");
const github = require("@actions/github");
const { slackWebClient } = require("../utils");

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
    const requestedReviewers = github.context.payload.pull_request.requested_reviewers.map(
      (user) => user.login
    );
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

    // return out if the reaction we would add is already present (since we cant have the bot react on behalf of a user)
    existingReactionsRes.message.reactions.forEach((reaction) => {
      if (reaction.name === reactionToAdd) {
        return null;
      }
    });

    return await slackWebClient.reactions.add({
      channel: channelId,
      timestamp: SLACK_MESSAGE_ID,
      name: reactionToAdd,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
};

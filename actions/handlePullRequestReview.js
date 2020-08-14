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

    let reaction = reactionMap["changes-requested"];
    if (review.state === "commented") {
      reaction = reactionMap["commented"];
    } else if (review.state === "approved") {
      reaction = reactionMap["approved"];
    }

    return await slackWebClient.reactions.add({
      channel: channelId,
      timestamp: SLACK_MESSAGE_ID,
      name: reaction,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
};

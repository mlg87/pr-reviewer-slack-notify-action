const fetch = require("node-fetch");

const { getSlackMessageId } = require("../utils");

// NOTE in the future we may want to wait to notify everyone that they can review it again when the PR author
// explicitly asks for a re-review
module.exports = async () => {
  try {
    console.log("in handle commit push");
    console.log("github.context.payload", github.context.payload);
    console.log("shouldve logged the github context payload");

    const channelId = core.getInput("channel-id");
    const ghToken = core.getInput("github-token");
    const slackUsers = JSON.parse(core.getInput("slack-users"));

    return null;

    // const requestedReviewers = github.context.payload.pull_request.requested_reviewers.map(
    //   (user) => user.login
    // );
    // const { repository } = github.context.payload;
    // //
    // // ─── GET THE ISSUE NUMBER FOR THE COMMIT ─────────────────────────
    // //

    // // TODO pick up here: add SHA to request
    // const prRes = await fetch(
    //   `https://api.github.com/${repository.full_name}/commits/${}/pulls`,
    //   {
    //     headers: {
    //       Authorization: `token ${ghToken}`
    //     },
    //     method: 'GET'
    //   }
    // )

    // const slackMessageId = await getSlackMessageId()
    // //
    // // ─── CLEAR ALL REACTIONS BC THERE IS NEW CODE ────────────────────
    // //

    // const existingReactions = await slackWebClient.reactions.get({
    //   channel: channelId,
    //   timestamp: slackMessageId,
    // });

    //
    // ─── NOTIFY REVIEWERS IN THREAD ──────────────────────────────────
    //
  } catch (error) {}
};

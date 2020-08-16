const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");

const { getSlackMessageId } = require("../utils");

// NOTE in the future we may want to wait to notify everyone that they can review it again when the PR author
// explicitly asks for a re-review
module.exports = async () => {
  try {
    const channelId = core.getInput("channel-id");
    const ghToken = core.getInput("github-token");
    const slackUsers = JSON.parse(core.getInput("slack-users"));
    const { commits, repository } = github.context.payload;
    //
    // ─── GET THE ISSUE NUMBER FOR THE COMMIT ─────────────────────────
    //
    const prRes = await fetch(
      `https://api.github.com/repos/${repository.full_name}/commits/${commits[0].id}/pulls`,
      {
        headers: {
          // NOTE very solid chance this breaks as github warns that it is in preview mode currently
          Accept: "application/vnd.github.groot-preview+json",
          Authorization: `token ${ghToken}`,
        },
        method: "GET",
      }
    );
    const prResJson = await prRes.json();

    console.log("prResJson", prResJson);
    const [pull_request] = prResJson;

    throw Error("not implemented yet");
    const requestedReviewers = github.context.payload.pull_request.requested_reviewers.map(
      (user) => user.login
    );

    const slackMessageId = await getSlackMessageId();
    //
    // ─── CLEAR ALL REACTIONS BC THERE IS NEW CODE ────────────────────
    //

    const existingReactions = await slackWebClient.reactions.get({
      channel: channelId,
      timestamp: slackMessageId,
    });

    //
    // ─── NOTIFY REVIEWERS IN THREAD ──────────────────────────────────
    //
  } catch (error) {
    core.setFailed(error.message);
  }
};

const core = require("@actions/core");
const github = require("@actions/github");
const { slackWebClient, createUsersToAtString } = require("../utils");

module.exports = async () => {
  try {
    const channelId = core.getInput("channel-id");
    const { number, pull_request, repository, sender } = github.context.payload;
    const requestedReviewers = github.context.payload.pull_request.requested_reviewers.map(
      (user) => user.login
    );

    //
    // ─── RETURN IF THERE ARE NO REQUESTED REVIEWERS ──────────────────
    //

    if (!requestedReviewers.length) {
      return null;
    }

    console.log("payload", github.context.payload);

    // TODO update this to include content from the author's description or last comment
    const baseMessage = `${sender.login} is requesting your review on [PR ${pull_request.number}](${pull_request._links.html.href})`;

    // build users to mention string
    const usersToAtString = createUsersToAtString(requestedReviewers);

    // DOCS https://api.slack.com/methods/chat.postMessage
    prSlackMsg = await slackWebClient.chat.postMessage({
      channel: channelId,
      text: `${usersToAtString} ${baseMessage}`,
    });

    if (!prSlackMsg.ok || !prSlackMsg.ts) {
      throw Error("failed to create initial slack message");
    }

    const ghToken = core.getInput("github-token");
    const octokit = github.getOctokit(ghToken);
    return await octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: number,
      body: `SLACK_MESSAGE_ID:${prSlackMsg.ts}`,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
};

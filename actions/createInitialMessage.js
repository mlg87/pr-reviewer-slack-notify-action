const core = require("@actions/core");
const github = require("@actions/github");
const { slackWebClient, createUsersToAtString, fail } = require("../utils");

module.exports = async () => {
  try {
    const channelId = core.getInput("channel-id");
    const { number, pull_request, repository, sender } = github.context.payload;
    const requestedReviewers = pull_request.requested_reviewers.map(
      (user) => user.login
    );

    //
    // ─── RETURN IF THERE ARE NO REQUESTED REVIEWERS ──────────────────
    //

    if (!requestedReviewers.length) {
      return null;
    }

    let baseMessage = `*${sender.login}* is requesting your review on <${pull_request._links.html.href}|*${pull_request.title}*>`;
    if (!!pull_request.body) {
      baseMessage = `${baseMessage}\n>${pull_request.body}`;
    }

    // build users to mention string
    const usersToAtString = createUsersToAtString(requestedReviewers);

    // DOCS https://api.slack.com/methods/chat.postMessage
    const text = `${usersToAtString} ${baseMessage}`;
    prSlackMsg = await slackWebClient.chat.postMessage({
      channel: channelId,
      text,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text,
          },
        },
      ],
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
    fail(error.message);
  }
};

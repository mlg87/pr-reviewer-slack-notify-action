const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");

(async () => {
  try {
    const channelWebhook = core.getInput("channel-webhook");
    const slackUsers = JSON.parse(core.getInput("slack-users"));
    const requestedReviewers = github.context.payload.pull_request.requested_reviewers.map(
      (user) => user.login
    );
    if (!requestedReviewers.length) {
      return null;
    }
    const baseMessage = `${github.context.payload.sender.login} is requesting your review on ${github.context.payload.pull_request._links.html.href}`;

    const usersToAt = slackUsers.filter((user) =>
      requestedReviewers.includes(user.github_username)
    );
    let usersToAtString;
    usersToAt.forEach((user) => {
      if (!usersToAtString) {
        usersToAtString = `<@${user.slack_id}>`;
        return;
      }
      usersToAtString = `${usersToAtString}, <@${user.slack_id}>`;
      return;
    });
    const options = {
      body: JSON.stringify({
        text: `${usersToAtString} ${baseMessage}`,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    };
    await fetch(channelWebhook, options);
  } catch (error) {
    core.setFailed(error.message);
  }
})();

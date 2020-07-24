const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");

(() => {
  try {
    // `slack-users` input defined in action metadata file
    const slackUsers = JSON.parse(core.getInput("slack-users"));
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    // console.log("payload", payload);

    const requested_reviewers = github.context.payload.pull_request.requested_reviewers.map(
      (user) => user.login
    );
    console.log("requested_reviewers", requested_reviewers);

    slackUsers.forEach(async (user) => {
      if (requested_reviewers.includes(user.github_username)) {
        const options = {
          body: JSON.stringify({
            text: `@${user.slack_username}, ${github.context.payload.sender.login} is requesting your review on ${github.context.payload.pull_request._links.html.href}`,
          }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
        };
        await fetch(user.slack_webhook, options);
      }
    });
  } catch (error) {
    core.setFailed(error.message);
  }
})();

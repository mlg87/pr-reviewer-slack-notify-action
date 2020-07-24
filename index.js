const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");

(() => {
  try {
    // `slack-users` input defined in action metadata file
    const slackUsers = JSON.parse(core.getInput("slack-users"));
    // Get the JSON webhook payload for the event that triggered the workflow
    const payload = JSON.stringify(github.context.payload, undefined, 2);
    console.log("payload", payload);

    const options = {
      body: JSON.stringify({
        text: `${github.context.payload.sender.login} is requesting your review on ${github.context.payload.pull_request._links.html.href}`,
      }),
      headers: { "Content-Type": "application/json" },
      method: "POST",
    };
    slackUsers.forEach(async (user) => {
      await fetch(user.slack_webhook, options);
    });
  } catch (error) {
    core.setFailed(error.message);
  }
})();

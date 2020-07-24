const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");

(() => {
  try {
    const channel = core.getInput("channel");
    // `slack-users` input defined in action metadata file
    const slackUsers = JSON.parse(core.getInput("slack-users"));
    // Get the JSON webhook payload for the event that triggered the workflow
    // const payload = JSON.stringify(github.context.payload, undefined, 2);
    // console.log("payload", payload);
    const requested_reviewers = github.context.payload.pull_request.requested_reviewers.map(
      (user) => user.login
    );
    const baseMessage = `${github.context.payload.sender.login} is requesting your review on ${github.context.payload.pull_request._links.html.href}`;
    console.log("requested_reviewers", requested_reviewers);
    
    if (!channel) {
      const options = {
        body: JSON.stringify({
          text: baseMessage
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      };
      slackUsers.forEach(async (user) => {
        if (requested_reviewers.includes(user.github_username)) {
          await fetch(user.slack_webhook, options);
        }
      });
    } else {
      const usersToAt = slackUsers.filter(user => requested_reviewers.includes(user.github_username));
      let usersToAtString;
      usersToAt.forEach(user => {
        if (!usersToAtString) {
          usersToAtString = `@${user.slack_username}`;
          return;
        }
        usersToAtString = `${usersToAtString}, @${user.slack_username}`;
        return;
      });
      const options = {
        body: JSON.stringify({
          text: `${usersToAtString}`
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      };
      await fetch(channel, options);
    }

  } catch (error) {
    core.setFailed(error.message);
  }
})();

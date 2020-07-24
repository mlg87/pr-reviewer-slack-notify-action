const core = require("@actions/core");
const github = require("@actions/github");

try {
  // `slack-users` input defined in action metadata file
  const slackUsers = JSON.parse(core.getInput("slack-users"));
  console.log("slackUsers", slackUsers);

  // Get the JSON webhook payload for the event that triggered the workflow
  const payload = JSON.stringify(github.context.payload, undefined, 2);
  console.log(`The event payload: ${payload}`);
} catch (error) {
  core.setFailed(error.message);
}

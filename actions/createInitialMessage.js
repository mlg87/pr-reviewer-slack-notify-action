const fs = require("fs");
const core = require("@actions/core");
const github = require("@actions/github");
const artifact = require("@actions/artifact");
const { slackWebClient } = require("../utils");

module.exports = async () => {
  const { payload } = github.context;

  try {
    const channelId = core.getInput("channel-id");
    const slackUsers = JSON.parse(core.getInput("slack-users"));

    const requestedReviewers = github.context.payload.pull_request.requested_reviewers.map(
      (user) => user.login
    );
    // stop everything if there are no requested reviewers
    if (!requestedReviewers.length) {
      return null;
    }
    // TODO update this to include content from the author's description or last comment
    const baseMessage = `${github.context.payload.sender.login} is requesting your review on ${github.context.payload.pull_request._links.html.href}`;

    // build users to mention string
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
    // See: https://api.slack.com/methods/chat.postMessage
    prSlackMsg = await slackWebClient.chat.postMessage({
      channel: channelId,
      text: `${usersToAtString} ${baseMessage}`,
    });

    if (prSlackMsg.ok === false || !prSlackMsg.ts)
      throw Error("failed to create initial slack message");

    // we want to create some json and store this as an github artifact
    const githubArtifact = {
      slack_message_id: prSlackMsg.ts,
      github_pr_number: payload.number,
    };

    const jsonFilePath = "artifacts/pr-reviewer-slack-notify-action-data.json";

    fs.writeFileSync(jsonFilePath, JSON.stringify(githubArtifact));
    const artifactClient = artifact.create();
    const artifactName = "pr-reviewer-slack-notify-action-data";
    const uploadResult = await artifactClient.uploadArtifact(
      artifactName,
      jsonFilePath,
      rootDir
    );

    // there should be no failed files.
    if (uploadResult.failedItems.length > 0)
      throw Error("failed to upload github artifact");
  } catch (error) {
    core.setFailed(error.message);
  }
};

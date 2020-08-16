const core = require("@actions/core");
const github = require("@actions/github");

const { clearReactions, getPrForCommit, slackWebClient } = require("../utils");

// will only run on push to base branch (i.e. staging), so we can assume that a closed state for PR
// equates to 'merged' (no specific event for 'merged' on PRs)
module.exports = async () => {
  try {
    const channelId = core.getInput("channel-id");
    const { commits, repository } = github.context.payload;
    const commitSha = commits[0].id;
    //
    // ─── CONFIRM COMMIT IS ASSOCIATED WITH A PR IN CLOSED STATE ──────
    //

    const pull_request = await getPrForCommit();

    if (!pull_request) {
      throw Error(`No pull_request found for commit: ${commitSha}`);
    }

    if (pull_request.state !== "closed") {
      console.log("pull_request", pull_request);
      throw Error(`PR is not closed for commit: ${commitSha}`);
    }

    const slackMessageId = await getSlackMessageId(pull_request, repository);

    if (!slackMessageId) {
      console.error("pull_request", pull_request);
      console.error("repository", repository);
      throw Error("No slackMessageId found.");
    }

    //
    // ─── CLEAR REACTIONS ─────────────────────────────────────────────
    //

    await clearReactions(slackMessageId);

    //
    // ─── POST SHIPPED REACTION AND MESSAGE TO THREAD ─────────────────
    //

    await slackWebClient.reactions.add({
      channel: channelId,
      timestamp: slackMessageId,
      name: "ship-it",
    });

    const text = "This PR has been merged. Time to SHIP THIS MOTHER TO PROD!";
    return await slackWebClient.chat.postMessage({
      channel: channelId,
      thread_ts: slackMessageId,
      text,
    });
  } catch (error) {
    core.setFailed(error.message);
  }
};

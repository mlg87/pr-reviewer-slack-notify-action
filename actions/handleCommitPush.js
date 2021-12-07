const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");

const {
  getSlackMessageId,
  slackWebClient,
  createUsersToAtString,
  clearReactions,
  getPrForCommit,
  fail,
} = require("../utils");

// NOTE in the future we may want to wait to notify everyone that they can review it again when the PR author
// explicitly asks for a re-review
module.exports = async () => {
  try {
    const channelId = core.getInput("channel-id");
    const ghToken = core.getInput("github-token");
    const { repository } = github.context.payload;

    //
    // ─── GET THE ISSUE NUMBER FOR THE COMMIT ─────────────────────────
    //

    const pull_request = await getPrForCommit();
    // dont spam everyone on slack
    if (!pull_request || pull_request.state === "closed") {
      return null;
    }

    const slackMessageId = await getSlackMessageId(pull_request, repository);

    // this should throw instead of return null bc if there is a pull_request found with this commit it in,
    // there should also already be a slack message id comment
    if (!slackMessageId) {
      console.log("pull_request", pull_request);
      console.log("repository", repository);
      console.log("No slackMessageId found.");
      return null;
    }

    //
    // ─── CLEAR ALL REACTIONS BC THERE IS NEW CODE ────────────────────
    //

    await clearReactions(slackMessageId);

    //
    // ─── NOTIFY REVIEWERS IN THREAD ──────────────────────────────────
    //

    const existingReviewsRes = await fetch(
      `https://api.github.com/repos/${repository.full_name}/pulls/${pull_request.number}/reviews`,
      {
        headers: {
          Authorization: `token ${ghToken}`,
        },
        method: "GET",
      }
    );
    const existingReviewsJson = await existingReviewsRes.json();

    if (existingReviewsJson && existingReviewsJson.length) {
      const previousReviewers = existingReviewsJson.map(
        (review) => review.user.login
      );
      const distinctPreviousReviewers = [...new Set(previousReviewers)];
      const baseMessage = `new code has been committed since your review of <${pull_request._links.html.href}|*PR ${pull_request.number}*>, please review the updates.`;
      const usersToAtString = createUsersToAtString(distinctPreviousReviewers);
      const text = `${usersToAtString} ${baseMessage}`;
      const threadUpdateRes = await slackWebClient.chat.postMessage({
        channel: channelId,
        thread_ts: slackMessageId,
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

      if (!threadUpdateRes.ok || !threadUpdateRes.ts) {
        throw Error("Failed to post message to thread requesting re-reviewe");
      }
    }
  } catch (error) {
    fail(error.message);
  }
};

const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");

const {
  getSlackMessageId,
  slackWebClient,
  createUsersToAtString,
} = require("../utils");

// NOTE in the future we may want to wait to notify everyone that they can review it again when the PR author
// explicitly asks for a re-review
module.exports = async () => {
  try {
    const channelId = core.getInput("channel-id");
    const ghToken = core.getInput("github-token");
    const slackUsers = JSON.parse(core.getInput("slack-users"));
    const { commits, repository } = github.context.payload;

    //
    // ─── GET THE ISSUE NUMBER FOR THE COMMIT ─────────────────────────
    //

    const commitSha = commits[0].id;
    // DOCS https://developer.github.com/v3/repos/commits/#list-pull-requests-associated-with-a-commit
    const prRes = await fetch(
      `https://api.github.com/repos/${repository.full_name}/commits/${commitSha}/pulls`,
      {
        headers: {
          // NOTE very solid chance this breaks as github warns that it is in preview mode currently
          Accept: "application/vnd.github.groot-preview+json",
          Authorization: `token ${ghToken}`,
        },
        method: "GET",
      }
    );
    const prResJson = await prRes.json();
    const [pull_request] = prResJson;

    if (!pull_request) {
      console.log(`No pull_request found for commit: ${commitSha}`);
      return null;
    }

    const slackMessageId = await getSlackMessageId(pull_request, repository);

    // this should throw instead of return null bc if there is a pull_request found with this commit it in,
    // there should also already be a slack message id comment
    if (!slackMessageId) {
      console.error("pull_request", pull_request);
      console.error("repository", repository);
      throw Error("No slackMessageId found.");
    }

    //
    // ─── CLEAR ALL REACTIONS BC THERE IS NEW CODE ────────────────────
    //

    const existingReactions = await slackWebClient.reactions.get({
      channel: channelId,
      timestamp: slackMessageId,
    });

    if (
      existingReactions.message.reactions &&
      existingReactions.message.reactions.length
    ) {
      existingReactions.message.reactions.forEach(async (reaction) => {
        await slackWebClient.reactions.remove({
          channel: channelId,
          timestamp: slackMessageId,
          name: reaction.name,
        });
      });
    }

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
            type: "mrkdwn",
            text,
          },
        ],
      });

      if (!threadUpdateRes.ok || !threadUpdateRes.ts) {
        throw Error("Failed to post message to thread requesting re-reviewe");
      }
    }
  } catch (error) {
    core.setFailed(error.message);
  }
};

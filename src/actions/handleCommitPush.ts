import core from "@actions/core";
import github from "@actions/github";
import { clearReactions } from "../utils/clearReactions";
import { createUsersToAtString } from "../utils/createUsersToAtString";
import { fail } from "../utils/fail";
import { getPrForCommit } from "../utils/getPrForCommit";
import { getSlackMessageId } from "../utils/getSlackMessageId";
import { slackWebClient } from "../utils/slackWebClient";

// NOTE in the future we may want to wait to notify everyone that they can review it again when the PR author
// explicitly asks for a re-review
export const handleCommitPush = async () => {
  try {
    const channelId = core.getInput("channel-id");
    const { repository } = github.context.payload;

    if (!repository) {
      throw Error(
        "no repository found in github.context.paylod in handleCommitPush"
      );
    }

    //
    // ─── GET THE ISSUE NUMBER FOR THE COMMIT ─────────────────────────
    //

    const pull_request = await getPrForCommit();
    // dont spam everyone on slack
    if (!pull_request || pull_request.state === "closed") {
      return;
    }

    const slackMessageId = await getSlackMessageId();

    //
    // ─── CLEAR ALL REACTIONS BC THERE IS NEW CODE ────────────────────
    //

    await clearReactions(slackMessageId);

    //
    // ─── NOTIFY REVIEWERS IN THREAD ──────────────────────────────────
    //

    const octokit = github.getOctokit(core.getInput("github-token"));
    const res = await octokit.rest.pulls.listReviews({
      owner: repository.owner.name!,
      repo: repository.name,
      pull_number: pull_request.number,
    });

    if (res.data) {
      const previousReviewers = res.data.map((review) => review!.user!.login);
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
    fail(error);
    throw error;
  }
};

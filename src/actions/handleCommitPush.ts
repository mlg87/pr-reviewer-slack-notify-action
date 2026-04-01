import * as core from "@actions/core";
import * as github from "@actions/github";
import { clearReactions } from "../utils/clearReactions";
import { createUsersToAtString } from "../utils/createUsersToAtString";
import { fail } from "../utils/fail";
import { getPullRequest } from "../utils/getPullRequest";
import { getSlackMessageId } from "../utils/getSlackMessageId";
import { logger } from "../utils/logger";
import { slackWebClient } from "../utils/slackWebClient";

// NOTE in the future we may want to wait to notify everyone that they can review it again when the PR author
// explicitly asks for a re-review
export const handleCommitPush = async (): Promise<void> => {
  logger.info("Handling commit push event");
  try {
    const channelId = core.getInput("channel-id");
    const { compare, repository } = github.context.payload;

    if (!repository) {
      throw Error(
        "No repository found in github.context.payload in handleCommitPush"
      );
    }

    const pull_request = await getPullRequest();
    if (!pull_request || pull_request.state === "closed") {
      logger.info("PR is closed or not found, skipping commit push notification");
      return;
    }

    const slackMessageId = await getSlackMessageId();

    if (!slackMessageId) {
      logger.info("No Slack thread found, skipping commit push notification");
      core.warning(
        "Unable to post commit push notification because no Slack message ID could be found."
      );
      return;
    }

    //
    // ─── CLEAR ALL REACTIONS BC THERE IS NEW CODE ────────────────────
    //

    await clearReactions(slackMessageId);

    //
    // ─── NOTIFY REVIEWERS IN THREAD ──────────────────────────────────
    //

    const ghToken = core.getInput("github-token");
    const octokit = github.getOctokit(ghToken);
    const res = await octokit.rest.pulls.listReviews({
      owner: repository.owner.login,
      repo: repository.name,
      pull_number: pull_request.number,
    });

    if (res.data) {
      const previousReviewers = res.data.map((review) => review!.user!.login);
      const distinctPreviousReviewers = [...new Set(previousReviewers)];
      const diffLink = compare
        ? ` <${compare}|View the changes>.`
        : "";
      const baseMessage = `new code has been committed since your review of <${pull_request._links.html.href}|*PR ${pull_request.number}*>, please review the updates.${diffLink}`;
      const usersToAtString = await createUsersToAtString(
        distinctPreviousReviewers
      );
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
        throw Error("Failed to post message to thread requesting re-review");
      }
    }

    logger.info(`Commit push notification posted to Slack thread for PR #${pull_request.number}`);
    return;
  } catch (error) {
    fail(error);
    throw error;
  }
};

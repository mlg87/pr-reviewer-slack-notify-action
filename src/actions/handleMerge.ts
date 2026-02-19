import * as core from "@actions/core";
import * as github from "@actions/github";
import { clearReactions } from "../utils/clearReactions";
import { fail } from "../utils/fail";
import { getPullRequest } from "../utils/getPullRequest";
import { getSlackMessageId } from "../utils/getSlackMessageId";
import { logger } from "../utils/logger";
import { slackWebClient } from "../utils/slackWebClient";

// will only run on push to base branch (i.e. staging), so we can assume that a closed state for PR
// equates to 'merged' (no specific event for 'merged' on PRs)
export const handleMerge = async (): Promise<void> => {
  logger.info("Handling PR merge event");
  try {
    const channelId = core.getInput("channel-id");
    const { commits, repository } = github.context.payload;
    const commitSha = commits[0].id;

    const pull_request = await getPullRequest();

    if (!pull_request) {
      throw Error(`No pull_request found for commit: ${commitSha}`);
    }

    if (pull_request.state !== "closed") {
      throw Error(`PR is not closed for commit: ${commitSha}`);
    }

    const slackMessageId = await getSlackMessageId();

    if (!slackMessageId) {
      logger.info("No Slack thread found, skipping merge notification");
      core.warning(
        "Unable to post merge notification because no Slack message ID could be found."
      );
      return;
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

    const text =
      "This PR has been merged. One-way ticket to Prod purchased. See you in Valhalla.";
    await slackWebClient.chat.postMessage({
      channel: channelId,
      thread_ts: slackMessageId,
      text,
    });

    logger.info(`Merge notification posted for PR #${pull_request.number}`);
    return;
  } catch (error) {
    fail(error);
    throw error;
  }
};

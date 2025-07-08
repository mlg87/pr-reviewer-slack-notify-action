import * as core from "@actions/core";
import * as github from "@actions/github";
import { fail } from "../utils/fail";
import { getEngineersFromS3 } from "../utils/getEngineersFromS3";
import { getSlackMessageId } from "../utils/getSlackMessageId";
import { logger } from "../utils/logger";
import { slackWebClient } from "../utils/slackWebClient";

const reactionMap = {
  commented: "speech_balloon",
  approved: "white_check_mark",
  changes_requested: "octagonal_sign",
};

export const handlePullRequestReview = async (): Promise<void> => {
  logger.info("START handlePullRequestReview");
  try {
    const channelId = core.getInput("channel-id");
    const slackUsers = await getEngineersFromS3();
    const { action, pull_request, review } = github.context.payload;

    // TODO handle more than just submitted PRs
    if (action !== "submitted") {
      return;
    }

    if (!pull_request) {
      throw Error(
        "No pull_request found in handlePullRequestReivew (github.context.payload)"
      );
    }

    const slackMessageId = await getSlackMessageId();

    if (!slackMessageId) {
      core.warning(
        "Unable to post pull request review notification because no Slack message ID could be found. This may be because the required label is not present."
      );
      return;
    }

    //
    // ─── MAP USERS ───────────────────────────────────────────────────
    //

    const [reviewer] = slackUsers.engineers.filter((user) => {
      return user.github_username === review.user.login;
    });
    const [author] = slackUsers.engineers.filter((user) => {
      return user.github_username === pull_request.user.login;
    });

    if (!reviewer) {
      throw Error(
        `Could not map ${review.user.login} to the users you provided in action.yml`
      );
    }

    if (!author) {
      throw Error(
        `Could not map ${pull_request.user.login} to the users you provided in action.yml`
      );
    }

    //
    // ─── BUILD MESSAGE ───────────────────────────────────────────────
    //

    const userText = `<@${author.slack_id}>, *${reviewer.github_username}*`;
    let actionText: string = "";
    let reactionToAdd: string = "";
    switch (review.state) {
      case "changes_requested":
        actionText = "would like you to change some things in the code";
        reactionToAdd = reactionMap["changes_requested"];
        break;
      // TODO see if getting the review could allow for posting the text that was commented
      // NOTE for reviews where the state is "commented", the comment text is not in the event payload
      case "commented":
        actionText = "neither approved or denied your PR, but merely commented";
        reactionToAdd = reactionMap["commented"];
        break;
      case "approved":
        actionText = "approved your PR";
        reactionToAdd = reactionMap["approved"];
        break;
    }
    if (!!review.body) {
      actionText = `${actionText}\n>${review.body}`;
    }
    const text = `${userText} ${actionText}`;
    // post corresponding message
    await slackWebClient.chat.postMessage({
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

    //
    // ─── ADD REACTION TO MAIN THREAD ─────────────────────────────────
    //

    // get existing reactions on message
    const existingReactionsRes = await slackWebClient.reactions.get({
      channel: channelId,
      timestamp: slackMessageId,
    });

    let hasReaction = false;
    if (existingReactionsRes?.message?.reactions) {
      // return out if the reaction we would add is already present (since we cant have the bot react on behalf of a user)
      existingReactionsRes.message.reactions.forEach((reaction) => {
        if (reaction.name === reactionToAdd) {
          hasReaction = true;
        }
      });
    }

    if (hasReaction) {
      logger.info("END handlePullRequestReview: hasReaction");
      return;
    }

    // add new reactions
    await slackWebClient.reactions.add({
      channel: channelId,
      timestamp: slackMessageId,
      name: reactionToAdd,
    });

    logger.info("END handlePullRequestReview: new reactions added");
    return;
  } catch (error) {
    fail(error);
    throw error;
  }
};

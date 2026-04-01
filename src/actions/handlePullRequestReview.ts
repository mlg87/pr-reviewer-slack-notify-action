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
  logger.info("Handling pull request review event");
  try {
    const channelId = core.getInput("channel-id");
    const slackUsers = await getEngineersFromS3();
    const { action, pull_request, review } = github.context.payload;

    if (action !== "submitted") {
      logger.info(`Ignoring review action '${action}', only 'submitted' is handled`);
      return;
    }

    if (!pull_request) {
      throw Error(
        "No pull_request found in handlePullRequestReview (github.context.payload)"
      );
    }

    const slackMessageId = await getSlackMessageId();

    if (!slackMessageId) {
      logger.info("No Slack thread found, skipping review notification");
      core.warning(
        "Unable to post pull request review notification because no Slack message ID could be found."
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
      core.error(`Could not map reviewer '${review.user.login}' to a Slack user from the S3 mapping`);
      throw Error(
        `Could not map ${review.user.login} to the users you provided in action.yml`
      );
    }

    if (!author) {
      core.error(`Could not map PR author '${pull_request.user.login}' to a Slack user from the S3 mapping`);
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
        if (review.body) {
          actionText = `${actionText}\n>${review.body}`;
        }
        break;
      case "commented": {
        reactionToAdd = reactionMap["commented"];

        // fetch inline review comments from the API
        const ghToken = core.getInput("github-token");
        const octokit = github.getOctokit(ghToken);
        const { repository } = github.context.payload;
        const commentsRes =
          await octokit.rest.pulls.listCommentsForReview({
            owner: repository!.owner.login,
            repo: repository!.name,
            pull_number: pull_request.number,
            review_id: review.id,
          });

        const allComments: { body: string; url: string }[] = [];
        if (review.body) {
          allComments.push({ body: review.body, url: review.html_url });
        }
        for (const comment of commentsRes.data) {
          if (comment.body) {
            allComments.push({ body: comment.body, url: comment.html_url });
          }
        }

        const commentCount = allComments.length;
        const commentLabel =
          commentCount === 1 ? "a comment" : `${commentCount} comments`;
        actionText = `added ${commentLabel}:`;
        for (const { body, url } of allComments) {
          actionText = `${actionText}\n><${url}|:link:> ${body}`;
        }
        break;
      }
      case "approved":
        actionText = "approved your PR";
        reactionToAdd = reactionMap["approved"];
        if (review.body) {
          actionText = `${actionText}\n>${review.body}`;
        }
        break;
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
      logger.info(`Reaction '${reactionToAdd}' already present, skipping`);
      return;
    }

    await slackWebClient.reactions.add({
      channel: channelId,
      timestamp: slackMessageId,
      name: reactionToAdd,
    });

    logger.info(`Review by ${review.user.login} (${review.state}) posted to Slack thread`);
    return;
  } catch (error) {
    fail(error);
    throw error;
  }
};

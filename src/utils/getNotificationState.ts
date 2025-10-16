import * as github from "@actions/github";
import * as core from "@actions/core";
import { logger } from "./logger";

export type NotificationState = "PENDING" | "POLLING" | "NOTIFIED" | "SKIPPED";

const STATE_MARKER_PREFIX = "SLACK_NOTIFICATION_STATE:";

export const getNotificationState = async (
  pull_request: any,
  repository: any
): Promise<NotificationState | null> => {
  logger.info("START getNotificationState");
  try {
    if (!pull_request || !repository) {
      throw Error("pull_request and repository are required");
    }

    const octokit = github.getOctokit(core.getInput("github-token"));
    const res = await octokit.rest.issues.listComments({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: pull_request.number,
    });

    let state: NotificationState | null = null;
    res.data.forEach((comment) => {
      const match = comment?.body?.match(
        /SLACK_NOTIFICATION_STATE:(PENDING|POLLING|NOTIFIED|SKIPPED)/
      );
      if (match) {
        state = match[1] as NotificationState;
      }
    });

    logger.info(`END getNotificationState: ${state}`);
    return state;
  } catch (error: any) {
    logger.error(`Error in getNotificationState: ${error.message}`);
    throw error;
  }
};

export const setNotificationState = async (
  pull_request: any,
  repository: any,
  state: NotificationState
): Promise<void> => {
  logger.info(`START setNotificationState: ${state}`);
  try {
    if (!pull_request || !repository) {
      throw Error("pull_request and repository are required");
    }

    const octokit = github.getOctokit(core.getInput("github-token"));

    // First, try to find and update existing state comment
    const res = await octokit.rest.issues.listComments({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: pull_request.number,
    });

    let existingCommentId: number | null = null;
    res.data.forEach((comment) => {
      if (comment?.body?.includes(STATE_MARKER_PREFIX)) {
        existingCommentId = comment.id;
      }
    });

    const stateMessage = `${STATE_MARKER_PREFIX}${state}`;

    if (existingCommentId) {
      // Update existing comment
      await octokit.rest.issues.updateComment({
        owner: repository.owner.login,
        repo: repository.name,
        comment_id: existingCommentId,
        body: stateMessage,
      });
      logger.info(`Updated existing state comment to: ${state}`);
    } else {
      // Create new comment
      await octokit.rest.issues.createComment({
        owner: repository.owner.login,
        repo: repository.name,
        issue_number: pull_request.number,
        body: stateMessage,
      });
      logger.info(`Created new state comment: ${state}`);
    }

    logger.info(`END setNotificationState: ${state}`);
  } catch (error: any) {
    logger.error(`Error in setNotificationState: ${error.message}`);
    throw error;
  }
};

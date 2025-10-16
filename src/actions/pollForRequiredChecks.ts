import * as core from "@actions/core";
import * as github from "@actions/github";
import { createInitialMessage } from "./createInitialMessage";
import { fail } from "../utils/fail";
import { logger } from "../utils/logger";
import { getPullRequest } from "../utils/getPullRequest";
import { getRequiredStatusChecks } from "../utils/getRequiredStatusChecks";
import {
  getNotificationState,
  setNotificationState,
} from "../utils/getNotificationState";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const pollForRequiredChecks = async (): Promise<void> => {
  logger.info("START pollForRequiredChecks");
  try {
    const { repository } = github.context.payload;
    const pull_request = await getPullRequest();

    if (!pull_request || !repository) {
      throw Error("pull_request or repository not found in context");
    }

    // Check if we should skip this (draft PR, quiet label, etc.)
    const ignoreDraft = core.getBooleanInput("ignore-draft-prs");
    const silenceQuiet = core.getBooleanInput("silence-on-quiet-label");
    const labelForInitialNotification = core.getInput(
      "label-for-initial-notification"
    );

    const isDraft = pull_request.draft;
    let hasQuietLabel = false;
    let hasRequiredLabel = !labelForInitialNotification; // Default to true if no label required

    for (const label of pull_request.labels || []) {
      if (label.name === "quiet") {
        hasQuietLabel = true;
      }
      if (
        labelForInitialNotification &&
        label.name === labelForInitialNotification
      ) {
        hasRequiredLabel = true;
      }
    }

    // Exit early if we should skip
    if ((isDraft && ignoreDraft) || (hasQuietLabel && silenceQuiet)) {
      logger.info("Skipping due to draft status or quiet label");
      await setNotificationState(pull_request, repository, "SKIPPED");
      return;
    }

    // Exit early if required label is not present
    if (!hasRequiredLabel) {
      logger.info(
        `Required label '${labelForInitialNotification}' not present, will not poll`
      );
      return;
    }

    // Check current notification state
    const currentState = await getNotificationState(pull_request, repository);
    if (currentState === "NOTIFIED") {
      logger.info("Already notified, exiting early");
      return;
    }

    if (currentState === "SKIPPED") {
      logger.info("Previously skipped, exiting early");
      return;
    }

    // Mark as polling if not already
    if (currentState !== "POLLING") {
      await setNotificationState(pull_request, repository, "POLLING");
    }

    // Get polling configuration
    const pollingIntervalSeconds =
      parseInt(core.getInput("polling-interval")) || 90;
    const pollingTimeoutMinutes =
      parseInt(core.getInput("polling-timeout")) || 30;

    const pollingIntervalMs = pollingIntervalSeconds * 1000;
    const pollingTimeoutMs = pollingTimeoutMinutes * 60 * 1000;
    const startTime = Date.now();

    logger.info(
      `Starting to poll every ${pollingIntervalSeconds}s for up to ${pollingTimeoutMinutes} minutes`
    );

    // Polling loop
    while (true) {
      const elapsedTime = Date.now() - startTime;

      // Check if we've exceeded timeout
      if (elapsedTime >= pollingTimeoutMs) {
        logger.info("Polling timeout reached, exiting without notification");
        core.warning(
          `Polling timed out after ${pollingTimeoutMinutes} minutes. Required checks did not pass in time.`
        );
        return;
      }

      // Re-fetch PR to check if it's been closed or merged
      const updatedPR = await getPullRequest();
      if (!updatedPR) {
        logger.info("PR not found, exiting");
        return;
      }

      if (updatedPR.state === "closed") {
        logger.info("PR has been closed, exiting without notification");
        await setNotificationState(pull_request, repository, "SKIPPED");
        return;
      }

      // Check status of required checks
      logger.info("Checking status of required checks...");
      const checkResult = await getRequiredStatusChecks(updatedPR, repository);

      if (!checkResult.hasRequiredChecks) {
        // No required checks, we can notify immediately
        logger.info("No required checks found, proceeding to notify");
        break;
      }

      if (checkResult.allRequiredChecksPassed) {
        logger.info("All required checks have passed, proceeding to notify");
        break;
      }

      // Checks haven't passed yet, wait and try again
      logger.info(
        `Checks not ready yet (${checkResult.passedChecksCount}/${checkResult.requiredChecksCount} passed, ${checkResult.pendingChecksCount} pending, ${checkResult.failedChecksCount} failed). Waiting ${pollingIntervalSeconds}s...`
      );

      await sleep(pollingIntervalMs);
    }

    // All checks passed (or no checks exist), send notification
    logger.info("Checks passed, creating initial Slack message");
    const slackMessageId = await createInitialMessage();

    if (slackMessageId) {
      await setNotificationState(pull_request, repository, "NOTIFIED");
      logger.info("Successfully notified reviewers");
    } else {
      logger.info("No message created (likely no reviewers assigned)");
    }

    logger.info("END pollForRequiredChecks");
  } catch (error: any) {
    logger.error(`Error in pollForRequiredChecks: ${error.message}`);
    fail(error.message);
    throw error;
  }
};

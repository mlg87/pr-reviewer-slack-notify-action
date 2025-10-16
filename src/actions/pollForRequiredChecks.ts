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
  
  // Initialize summary
  await core.summary
    .addHeading('🔔 PR Slack Notify - Polling for Required Checks')
    .addRaw('\n')
    .write();
  
  try {
    const { repository } = github.context.payload;
    const pull_request = await getPullRequest();

    if (!pull_request || !repository) {
      await core.summary
        .addRaw('❌ **Error**: Pull request or repository not found\n')
        .write();
      throw Error("pull_request or repository not found in context");
    }
    
    await core.summary
      .addRaw(`📝 **PR**: #${pull_request.number} - ${pull_request.title}\n`)
      .addRaw(`🌿 **Branch**: ${pull_request.head.ref} → ${pull_request.base.ref}\n`)
      .addRaw('\n')
      .write();

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
      const reason = isDraft ? "draft PR" : "quiet label";
      await core.summary
        .addRaw(`⏭️ **Skipped**: Not notifying reviewers (${reason})\n`)
        .write();
      await setNotificationState(pull_request, repository, "SKIPPED");
      return;
    }

    // Exit early if required label is not present
    if (!hasRequiredLabel) {
      logger.info(
        `Required label '${labelForInitialNotification}' not present, will not poll`
      );
      await core.summary
        .addRaw(`⏸️ **Waiting**: Required label '${labelForInitialNotification}' not yet applied\n`)
        .write();
      return;
    }

    // Check current notification state
    const currentState = await getNotificationState(pull_request, repository);
    if (currentState === "NOTIFIED") {
      logger.info("Already notified, exiting early");
      await core.summary
        .addRaw(`✅ **Already Notified**: Reviewers were previously notified\n`)
        .write();
      return;
    }

    if (currentState === "SKIPPED") {
      logger.info("Previously skipped, exiting early");
      await core.summary
        .addRaw(`⏭️ **Previously Skipped**: PR was marked as skipped\n`)
        .write();
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
    
    await core.summary
      .addRaw(`⏱️ **Polling Configuration**:\n`)
      .addRaw(`   - Check interval: ${pollingIntervalSeconds}s\n`)
      .addRaw(`   - Timeout: ${pollingTimeoutMinutes} minutes\n`)
      .addRaw('\n')
      .write();

    // Polling loop
    let pollCount = 0;
    while (true) {
      pollCount++;
      const elapsedTime = Date.now() - startTime;

      // Check if we've exceeded timeout
      if (elapsedTime >= pollingTimeoutMs) {
        logger.info("Polling timeout reached, exiting without notification");
        await core.summary
          .addRaw(`⏰ **Timeout**: Polling timed out after ${pollingTimeoutMinutes} minutes\n`)
          .addRaw(`   - ${pollCount} poll attempts made\n`)
          .addRaw(`   - Required checks did not pass in time\n`)
          .write();
        core.warning(
          `Polling timed out after ${pollingTimeoutMinutes} minutes. Required checks did not pass in time.`
        );
        return;
      }

      // Re-fetch PR to check if it's been closed or merged
      const updatedPR = await getPullRequest();
      if (!updatedPR) {
        logger.info("PR not found, exiting");
        await core.summary
          .addRaw(`❌ **Error**: PR not found during polling\n`)
          .write();
        return;
      }

      if (updatedPR.state === "closed") {
        logger.info("PR has been closed, exiting without notification");
        await core.summary
          .addRaw(`🚫 **PR Closed**: PR was closed before checks completed\n`)
          .write();
        await setNotificationState(pull_request, repository, "SKIPPED");
        return;
      }

      // Check status of required checks
      logger.info("Checking status of required checks...");
      const checkResult = await getRequiredStatusChecks(updatedPR, repository);

      if (!checkResult.hasRequiredChecks) {
        // No required checks, we can notify immediately
        logger.info("No required checks found, proceeding to notify");
        await core.summary
          .addRaw(`✅ **No Required Checks**: Proceeding to notify immediately\n`)
          .write();
        break;
      }

      if (checkResult.allRequiredChecksPassed) {
        logger.info("All required checks have passed, proceeding to notify");
        const elapsedMinutes = Math.round(elapsedTime / 60000);
        await core.summary
          .addRaw(`✅ **All Checks Passed**: ${checkResult.passedChecksCount}/${checkResult.requiredChecksCount} required checks passed\n`)
          .addRaw(`   - Polls: ${pollCount}\n`)
          .addRaw(`   - Elapsed time: ${elapsedMinutes} minute(s)\n`)
          .addRaw('\n')
          .write();
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
      await core.summary
        .addRaw(`🔔 **Notification Sent**: Reviewers notified in Slack\n`)
        .write();
    } else {
      logger.info("No message created (likely no reviewers assigned)");
      await core.summary
        .addRaw(`⚠️ **No Notification**: No reviewers assigned to PR\n`)
        .write();
    }

    logger.info("END pollForRequiredChecks");
  } catch (error: any) {
    logger.error(`Error in pollForRequiredChecks: ${error.message}`);
    fail(error.message);
    throw error;
  }
};

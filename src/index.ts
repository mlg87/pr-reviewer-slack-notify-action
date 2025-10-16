import * as github from "@actions/github";
import * as core from "@actions/core";
import { createInitialMessage } from "./actions/createInitialMessage";
import { handleLabelChange } from "./actions/handleLabelChange";
import { getSlackMessageId } from "./utils/getSlackMessageId";
import { handleMerge } from "./actions/handleMerge";
import { handleCommitPush } from "./actions/handleCommitPush";
import { handlePullRequestReview } from "./actions/handlePullRequestReview";
import { pollForRequiredChecks } from "./actions/pollForRequiredChecks";
import { logger } from "./utils/logger";

const run = async (): Promise<void> => {
  logger.info(`START run (github.context): ${JSON.stringify(github.context)}`);
  const { eventName, payload, ref } = github.context;
  const baseBranch = core.getInput("base-branch");
  const isActingOnBaseBranch = ref.includes(baseBranch);

  let hasQuietLabel = false;
  let hasRequiredLabel = true; // Default to true if no label is required
  const pull_request = payload.pull_request;

  const ignoreDraft = core.getInput("ignore-draft-prs");
  const silenceQuiet = core.getInput("silence-on-quiet-label");
  const labelForInitialNotification = core.getInput(
    "label-for-initial-notification"
  );

  // need to prevent unhandled errors here
  if (pull_request) {
    // Check for quiet label
    for (const label of pull_request.labels) {
      if (label.name === "quiet") {
        hasQuietLabel = true;
        break;
      }
    }

    // Check for required label for initial notification
    if (labelForInitialNotification) {
      hasRequiredLabel = false; // Reset to false if we need to check for a specific label
      for (const label of pull_request.labels) {
        if (label.name === labelForInitialNotification) {
          hasRequiredLabel = true;
          break;
        }
      }
    }

    const isWip = pull_request && pull_request["draft"] && ignoreDraft;

    // Don't do anything if this is a draft or we tell it to shut up
    if (isWip || (hasQuietLabel && silenceQuiet)) return;
  }

  // route to the appropriate action
  if (eventName === "pull_request") {
    if (payload.action === "opened" || payload.action === "ready_for_review") {
      console.log("running pollForRequiredChecks::: ", payload);

      // Use polling handler which will wait for required checks to pass
      await pollForRequiredChecks();
      return;
    }

    // notify thread of a PR label change
    if (payload.action === "labeled" || payload.action === "unlabeled") {
      console.log("running handleLabelChange::: ", payload);

      await handleLabelChange();
      return;
    }
  }

  // Get slack message ID for subsequent operations (reviews, commits, merge)
  // The initial message should have been created by pollForRequiredChecks
  const slackMessageId = await getSlackMessageId();
  if (!slackMessageId) {
    core.warning(
      "No Slack message found. Initial notification may not have been sent yet (checks still pending) or PR may be skipped."
    );
    return;
  }

  // push of commit / review dismissed
  if (
    eventName === "push" ||
    (eventName === "pull_request_review" && payload.action === "dismissed")
  ) {
    // merge of PR to base branch
    if (isActingOnBaseBranch) {
      console.log("running handleMerge::: ", payload);

      await handleMerge();
      return;
    }

    console.log("running handleCommitPush::: ", payload);

    await handleCommitPush();
    return;
  }

  // a review has been submitted
  if (eventName === "pull_request_review") {
    console.log("running handlePullRequestReview::: ", payload);

    await handlePullRequestReview();
    return;
  }
};

run();

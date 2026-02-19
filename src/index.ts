import * as github from "@actions/github";
import * as core from "@actions/core";
import { handleLabelChange } from "./actions/handleLabelChange";
import { getSlackMessageId } from "./utils/getSlackMessageId";
import { handleMerge } from "./actions/handleMerge";
import { handleCommitPush } from "./actions/handleCommitPush";
import { handlePullRequestReview } from "./actions/handlePullRequestReview";
import { assignCodeownersAsReviewers } from "./utils/assignReviewers";
import { getPullRequest } from "./utils/getPullRequest";
import { logger } from "./utils/logger";

const handleReviewerAssignment = async (): Promise<void> => {
  const { payload } = github.context;
  const pull_request = payload.pull_request;
  const { repository } = payload;

  if (!pull_request || !repository) {
    logger.info("Missing pull_request or repository on payload, skipping reviewer assignment");
    return;
  }

  logger.info(`Assigning CODEOWNERS reviewers for PR #${pull_request.number}`);
  const result = await assignCodeownersAsReviewers(pull_request, repository);

  if (result.success) {
    const assigned = [
      ...result.assigned.users.map((u: string) => `@${u}`),
      ...result.assigned.teams.map((t: string) => `@${t}`),
    ].join(", ");
    core.summary.addRaw(
      `Reviewers assigned: ${assigned}. Slack notification will be sent when the '${core.getInput("label-for-initial-notification")}' label is applied.`
    );
  } else if (result.errors.length > 0) {
    core.summary.addRaw(
      `Reviewer assignment had issues: ${result.errors.join(", ")}`
    );
  } else {
    core.summary.addRaw("No reviewers to assign from CODEOWNERS.");
  }

  await core.summary.write();
};

const run = async (): Promise<void> => {
  const { eventName, payload, ref } = github.context;
  logger.info(
    `Event: ${eventName}, Action: ${payload.action || "N/A"}, Ref: ${ref}`
  );
  const baseBranch = core.getInput("base-branch");
  const isActingOnBaseBranch = ref.includes(baseBranch);

  let hasQuietLabel = false;
  const pull_request = payload.pull_request;

  const ignoreDraft = core.getInput("ignore-draft-prs");
  const silenceQuiet = core.getInput("silence-on-quiet-label");

  if (pull_request) {
    for (const label of pull_request.labels) {
      if (label.name === "quiet") {
        hasQuietLabel = true;
        break;
      }
    }

    const isWip = pull_request && pull_request["draft"] && ignoreDraft;

    if (isWip || (hasQuietLabel && silenceQuiet)) {
      logger.info("Skipping: PR is draft or has quiet label");
      return;
    }
  }

  // route to the appropriate action
  if (eventName === "pull_request") {
    if (payload.action === "opened" || payload.action === "ready_for_review") {
      logger.info(`PR ${payload.action}: assigning CODEOWNERS reviewers`);
      await handleReviewerAssignment();
      return;
    }

    if (payload.action === "labeled" || payload.action === "unlabeled") {
      logger.info(`PR label event: ${payload.action}`);
      await handleLabelChange();
      return;
    }
  }

  // Get slack message ID for subsequent operations (reviews, commits, merge)
  const slackMessageId = await getSlackMessageId();
  if (!slackMessageId) {
    logger.info("No Slack thread found, skipping event");
    core.warning(
      "No Slack message found. The initial notification may not have been sent yet."
    );
    return;
  }

  // push of commit / review dismissed
  if (
    eventName === "push" ||
    (eventName === "pull_request_review" && payload.action === "dismissed")
  ) {
    if (isActingOnBaseBranch) {
      logger.info(`Push to base branch detected, handling as merge`);
      await handleMerge();
      return;
    }

    logger.info(`Commit pushed to feature branch, notifying reviewers`);
    await handleCommitPush();
    return;
  }

  // a review has been submitted
  if (eventName === "pull_request_review") {
    logger.info(`Review submitted on PR, posting to Slack thread`);
    await handlePullRequestReview();
    return;
  }

  logger.info(`Unhandled event: ${eventName} / ${payload.action}`);
};

run();

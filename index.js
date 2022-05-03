const github = require("@actions/github");
const core = require("@actions/core");
const { getSlackMessageId } = require("./utils");

const {
  createInitialMessage,
  handleCommitPush,
  handleLabelChange,
  handlePullRequestReview,
  handleMerge,
} = require("./actions");

(async () => {
  const { eventName, payload, ref } = github.context;
  const baseBranch = core.getInput("base-branch");
  const isActingOnBaseBranch = ref.includes(baseBranch);

  let hasQuietLabel = false;
  const pull_request = payload.pull_request;

  const ignoreDraft = core.getInput("ignore-draft-prs");
  const silenceQuiet = core.getInput("silence-on-quiet-label");

  // need to prevent unhandled errors here
  if (pull_request) {
    for (const label of pull_request.labels) {
      if (label.name === "quiet") {
        hasQuietLabel = true;
        break;
      }
    }

    const isWip = pull_request && pull_request["draft"] && ignoreDraft;

    // Don't do anything if this is a draft or we tell it to shut up
    if (isWip || (hasQuietLabel && silenceQuiet)) return;
  }

  // route to the appropriate action
  if (eventName === "pull_request") {
    if (payload.action === "opened" || payload.action === "ready_for_review") {
      console.log("running createInitialMessage::: ", payload);

      return await createInitialMessage();
    }

    // notify thread of a PR label change
    if (payload.action === "labeled" || payload.action === "unlabeled") {
      console.log("running handleLabelChange::: ", payload);

      return await handleLabelChange();
    }
  }

  // reduce spamming channels by adding a message if one didn't get created somehow
  const slackMessageId = await getSlackMessageId();
  if (!slackMessageId) {
    return await createInitialMessage();
  }

  // push of commit
  if (eventName === "push") {
    // merge of PR to base branch
    if (isActingOnBaseBranch) {
      console.log("running handleMerge::: ", payload);

      return await handleMerge();
    }

    console.log("running handleCommitPush::: ", payload);

    return await handleCommitPush();
  }

  // a review has been submitted
  if (eventName === "pull_request_review") {
    console.log("running handlePullRequestReview::: ", payload);

    return await handlePullRequestReview();
  }
})();

const github = require("@actions/github");
const core = require("@actions/core");

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
  // TODO check for slack message id here and return if its not found

  // push of commit
  else if (eventName === "push") {
    // merge of PR to staging
    if (isActingOnBaseBranch) {
      console.log("running handleMerge::: ", payload);

      return await handleMerge();
    }

    console.log("running handleCommitPush::: ", payload);

    return await handleCommitPush();
  }
  // a review has been submitted
  else if (eventName === "pull_request_review") {
    console.log("running handlePullRequestReview::: ", payload);

    return await handlePullRequestReview();
  }
})();

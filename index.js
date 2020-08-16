const github = require("@actions/github");

const {
  createInitialMessage,
  handleCommitPush,
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
      return await createInitialMessage();
    }
  }
  // push of commit
  else if (eventName === "push") {
    if (isActingOnBaseBranch) {
      return await handleMerge();
    }

    return await handleCommitPush();
  }
  // a review has been submitted
  else if (eventName === "pull_request_review") {
    return await handlePullRequestReview();
  }
})();

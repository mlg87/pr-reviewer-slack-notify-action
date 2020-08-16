const github = require("@actions/github");

const {
  createInitialMessage,
  handleCommitPush,
  handlePullRequestReview,
  handleMerge,
} = require("./actions");

(async () => {
  const { eventName, payload } = github.context;
  // route to the appropriate action
  if (eventName === "pull_request") {
    if (payload.action === "opened" || payload.action === "ready_for_review") {
      return await createInitialMessage();
    } else if (payload.action === "merged") {
      return await handleMerge();
    }
  }
  // push of commit
  else if (eventName === "push") {
    return await handleCommitPush();
  }
  // a review has been submitted
  else if (eventName === "pull_request_review") {
    return await handlePullRequestReview();
  }
})();

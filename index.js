const github = require("@actions/github");

const {
  createInitialMessage,
  handleCommitPush,
  handlePullRequestReview,
} = require("./actions");

(async () => {
  const { eventName, payload } = github.context;
  console.log("eventName", eventName);
  // route to the appropriate action
  // triggered by one of the pull_request events (opened, ready_for_review, merged)
  if (eventName === "pull_request") {
    if (payload.action === "opened" || payload.action === "ready_for_review") {
      return await createInitialMessage();
    } else if (payload.action === "merged") {
      // TODO add handler for closing out the process here
    }
  }
  // push of commit
  else if (eventName === "push") {
    return await handleCommitPush();
  }
  // a review has been submitted
  else if (eventName === "pull_request_review") {
    // TODO add payload.review.state here (commented, approved, changes requested)
    const reactionRes = await handlePullRequestReview();
    console.log("reactionRes", reactionRes);
  }

  // NOTE
  // looks like payload.review.state
})();

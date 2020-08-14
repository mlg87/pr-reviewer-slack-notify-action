const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");

const { createInitialMessage, handlePullRequestReview } = require("./actions");

(async () => {
  const { eventName, payload } = github.context;
  console.log("eventName", eventName);
  // route to the appropriate action
  // triggered by one of the pull_request events (opened, ready_for_review, merged)
  if (eventName === "pull_request") {
    if (payload.action === "opened" || payload.action === "ready_for_review") {
      const res = await createInitialMessage();
      // TODO store the message id and the PR number in the artifact
      /**
      {
        "slack_message_id": String,
        "github_pr_number": Number,
      }
       */
      console.log("init msg res", res);
    } else if (payload.action === "merged") {
      // TODO add handler for closing out the process here
    }
  }
  // push of commit
  else if (eventName === "push") {
    // TODO add handler for new code here
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

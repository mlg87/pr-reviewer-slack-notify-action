const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");

const { createInitialMessage } = require("./actions");

(async () => {
  const { payload } = github.context;
  console.log("github.context", github.context);

  // route to the appropriate action
  // triggered by one of the pull_request events (opened, ready_for_review, merged)
  if (!!payload.pull_request) {
    if (payload.action === "opened" || payload.action === "ready_for_review") {
      const res = await createInitialMessage();
      // TODO store the message id and the PR number in the artifact
      console.log("init msg res", res);
    } else if (payload.action === "merged") {
      // TODO add handler for closing out the process here
    }
  }
  // push of commit
  else if (!!payload.pusher) {
    // TODO add handler for new code here
  }
  // a review has been submitted
  else if (!!payload.review) {
    // TODO add payload.review.state here (commented, approved, changes requested)
  }

  // NOTE
  // looks like payload.review.state
})();

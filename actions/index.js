const createInitialMessage = require("./createInitialMessage");
const handleCommitPush = require("./handleCommitPush");
const handleMerge = require("./handleMerge");
const handlePullRequestReview = require("./handlePullRequestReview");

module.exports = {
  createInitialMessage,
  handleCommitPush,
  handleMerge,
  handlePullRequestReview,
};

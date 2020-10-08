const createInitialMessage = require("./createInitialMessage");
const handleCommitPush = require("./handleCommitPush");
const handleLabelChange = require("./handleLabelChange");
const handleMerge = require("./handleMerge");
const handlePullRequestReview = require("./handlePullRequestReview");

module.exports = {
  createInitialMessage,
  handleCommitPush,
  handleLabelChange,
  handleMerge,
  handlePullRequestReview,
};

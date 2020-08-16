const core = require("@actions/core");
const { WebClient } = require("@slack/web-api");

const token = core.getInput("bot-token");
const slackWebClient = new WebClient(token);

module.exports = slackWebClient;

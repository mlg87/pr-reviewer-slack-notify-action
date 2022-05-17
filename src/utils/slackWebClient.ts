import core from "@actions/core";
import { WebClient } from "@slack/web-api";

const token = core.getInput("bot-token");
export const slackWebClient = new WebClient(token);

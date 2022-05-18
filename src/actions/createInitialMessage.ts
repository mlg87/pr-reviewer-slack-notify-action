import * as core from "@actions/core";
import * as github from "@actions/github";
import { Github } from "../types/github-api-types";
import { createUsersToAtString } from "../utils/createUsersToAtString";
import { fail } from "../utils/fail";
import { slackWebClient } from "../utils/slackWebClient";

export const createInitialMessage = async (): Promise<void> => {
  try {
    const channelId = core.getInput("channel-id");
    const { number, pull_request, repository, sender } = github.context.payload;

    if (!pull_request || !repository || !sender) return;

    const requestedReviewers = (
      pull_request as Github.PullRequest
    ).requested_reviewers.map((user) => user.login);

    //
    // ─── RETURN IF THERE ARE NO REQUESTED REVIEWERS ──────────────────
    //

    if (!requestedReviewers.length) {
      return;
    }

    let baseMessage = `*${sender.login}* is requesting your review on <${pull_request._links.html.href}|*${pull_request.title}*>`;
    if (!!pull_request.body) {
      baseMessage = `${baseMessage}\n>${pull_request.body}`;
    }

    // build users to mention string
    const usersToAtString = await createUsersToAtString(requestedReviewers);

    // DOCS https://api.slack.com/methods/chat.postMessage
    const text = `${usersToAtString} ${baseMessage}`;
    const prSlackMsg = await slackWebClient.chat.postMessage({
      channel: channelId,
      text,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text,
          },
        },
      ],
    });

    if (!prSlackMsg.ok || !prSlackMsg.ts) {
      throw Error("failed to create initial slack message");
    }

    const ghToken = core.getInput("github-token");
    const octokit = github.getOctokit(ghToken);
    await octokit.rest.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: number,
      body: `SLACK_MESSAGE_ID:${prSlackMsg.ts}`,
    });
    return;
  } catch (error: any) {
    console.error("error in createInitialMessage::: ", error);

    fail(error.message);
  }
};

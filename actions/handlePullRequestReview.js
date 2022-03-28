const core = require("@actions/core");
const github = require("@actions/github");

const { getSlackMessageId, slackWebClient, fail, getEngineersFromS3 } = require("../utils");

const reactionMap = {
  commented: "speech_balloon",
  approved: "white_check_mark",
  changes_requested: "octagonal_sign",
};

module.exports = async () => {
  try {
    const channelId = core.getInput("channel-id");
    const slackUsers = await getEngineersFromS3();
    const { action, pull_request, repository, review } = github.context.payload;

    // TODO handle more than just submitted PRs
    if (action !== "submitted") {
      return null;
    }

    const slackMessageId = await getSlackMessageId(pull_request, repository);

    //
    // ─── MAP USERS ───────────────────────────────────────────────────
    //

    const [reviewer] = slackUsers.filter((user) => {
      return user.github_username === review.user.login;
    });
    const [author] = slackUsers.filter((user) => {
      return user.github_username === pull_request.user.login;
    });

    if (!reviewer) {
      throw Error(
        `Could not map ${review.user.login} to the users you provided in action.yml`
      );
    }

    if (!author) {
      throw Error(
        `Could not map ${pull_request.user.login} to the users you provided in action.yml`
      );
    }

    //
    // ─── BUILD MESSAGE ───────────────────────────────────────────────
    //

    const userText = `<@${author.slack_id}>, *${reviewer.github_username}*`;
    let actionText;
    let reactionToAdd;
    switch (review.state) {
      case "changes_requested":
        actionText = "would like you to change some things in the code";
        reactionToAdd = reactionMap["changes_requested"];
        break;
      case "commented":
        actionText = "neither approved or denied your PR, but merely commented";
        reactionToAdd = reactionMap["commented"];
        break;
      case "approved":
        actionText = "approved your PR";
        reactionToAdd = reactionMap["approved"];
        break;
    }
    if (!!review.body) {
      actionText = `${actionText}\n>${review.body}`;
    }
    const text = `${userText} ${actionText}`;
    // post corresponding message
    await slackWebClient.chat.postMessage({
      channel: channelId,
      thread_ts: slackMessageId,
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

    //
    // ─── ADD REACTION TO MAIN THREAD ─────────────────────────────────
    //

    // get existing reactions on message
    const existingReactionsRes = await slackWebClient.reactions.get({
      channel: channelId,
      timestamp: slackMessageId,
    });

    let hasReaction = false;
    if (
      existingReactionsRes.message.reactions &&
      existingReactionsRes.message.reactions.length
    ) {
      // return out if the reaction we would add is already present (since we cant have the bot react on behalf of a user)
      existingReactionsRes.message.reactions.forEach((reaction) => {
        if (reaction.name === reactionToAdd) {
          hasReaction = true;
        }
      });
    }

    if (hasReaction) {
      return null;
    }

    // add new reactions
    return await slackWebClient.reactions.add({
      channel: channelId,
      timestamp: slackMessageId,
      name: reactionToAdd,
    });
  } catch (error) {
    fail(error.message);
  }
};

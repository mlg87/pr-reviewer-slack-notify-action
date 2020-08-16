const core = require("@actions/core");

// reviewers is string[], where the strings should be github user names
module.exports = (reviewers) => {
  const slackUsers = JSON.parse(core.getInput("slack-users"));

  const usersToAt = slackUsers.filter((user) =>
    reviewers.includes(user.github_username)
  );

  let usersToAtString;

  usersToAt.forEach((user) => {
    if (!usersToAtString) {
      usersToAtString = `<@${user.slack_id}>`;
      return;
    }
    usersToAtString = `${usersToAtString}, <@${user.slack_id}>`;
    return;
  });

  return usersToAtString;
};

const fail = require("./fail");
const getEngineersFromS3 = require("./getEngineersFromS3");

// reviewers is string[], where the strings should be github user names
module.exports = async (reviewers) => {
  let slackUsers = [];
  try {
    slackUsers = await getEngineersFromS3();
  } catch (error) {
    fail(error)
  }

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

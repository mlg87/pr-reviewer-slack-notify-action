const core = require("@actions/core");
const github = require("@actions/github");
const fetch = require("node-fetch");

module.exports = async () => {
  try {
    const ghToken = core.getInput("github-token");
    const { commits, repository } = github.context.payload;

    if (!commits || !commits.length) {
      return null;
    }

    const commitSha = commits[0].id;
    // DOCS https://developer.github.com/v3/repos/commits/#list-pull-requests-associated-with-a-commit
    const prRes = await fetch(
      `https://api.github.com/repos/${repository.full_name}/commits/${commitSha}/pulls`,
      {
        headers: {
          // NOTE very solid chance this breaks as github warns that it is in preview mode currently
          Accept: "application/vnd.github.groot-preview+json",
          Authorization: `token ${ghToken}`,
        },
        method: "GET",
      }
    );
    const prResJson = await prRes.json();
    const [pull_request] = prResJson;

    if (!pull_request) {
      console.log(`No pull_request found for commit: ${commitSha}`);
      return null;
    }

    return pull_request;
  } catch (error) {
    core.setFailed(error.message);
  }
};

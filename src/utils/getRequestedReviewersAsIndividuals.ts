import * as core from "@actions/core";
import * as github from "@actions/github";

import { fail } from "./fail";
import { getPullRequest } from "./getPullRequest";
import { logger } from "./logger";

export const getRequestedReviewersAsIndividuals = async () => {
  logger.info("START getRequestedReviewersAsIndividuals");
  try {
    const ghToken = core.getInput("github-token");
    const octokit = github.getOctokit(ghToken);
    const pr = await getPullRequest();
    const requestedReviewers = pr.requested_reviewers ?? [];
    const requestedTeams = pr.requested_teams ?? [];
    const users = requestedReviewers
      ? requestedReviewers.map((user) => user.login)
      : [];
    if (requestedTeams && requestedTeams.length) {
      for (const requestedTeam in requestedTeams) {
        const org = (requestedTeam as any).html_url;
        const teamMembers = await octokit.rest.teams.listMembersInOrg({
          org,
          team_slug: requestedTeam,
        });
        teamMembers.data.forEach((member) => {
          users.push(member.login);
        });
      }
    }

    logger.info(
      `END getRequestedReviewersAsIndividuals: ${JSON.stringify(users)}`
    );
    return users;
  } catch (error) {
    fail(error);
    throw error;
  }
};

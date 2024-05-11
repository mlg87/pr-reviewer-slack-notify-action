import * as core from "@actions/core";
import * as github from "@actions/github";
import cache from 'memory-cache';

import { fail } from "./fail";
import { getPullRequest } from "./getPullRequest";
import { logger } from "./logger";

const CACHE_KEY = 'REVIEWERS';

export const getRequestedReviewersAsIndividuals = async () => {
  logger.info('START getRequestedReviewersAsIndividuals')
  try {
    const ghToken = core.getInput('github-token')
    const octokit = github.getOctokit(ghToken);
    const pr = await getPullRequest();
    const requestedReviewers = pr.requested_reviewers ?? [];
    const requestedTeams = pr.requested_teams ?? [];
    const users = requestedReviewers ? requestedReviewers.map((user) => user.login) : [];
    if (requestedTeams && requestedTeams.length) {
      for (const requestedTeam in requestedTeams) {
        // TODO probably want to do this a better way
        const org = (requestedTeam as any).html_url
        const teamMembers = await octokit.rest.teams.listMembersInOrg({
          org: github.context.payload.repository.or
        })
      }
    }
    
    
    logger.info(`END getRequestedReviewersAsIndividuals: ${JSON.stringify(pull_request)}`)
    return pull_request;
  } catch (error) {
    fail(error);
    throw error;
  }
};

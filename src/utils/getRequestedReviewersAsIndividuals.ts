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

    logger.info(`Processing ${requestedTeams.length} requested teams`);

    if (requestedTeams && requestedTeams.length) {
      for (const team of requestedTeams) {
        logger.info(`Processing team: ${JSON.stringify(team)}`);

        // Validate team data before processing
        if (!team || !team.id || team.id === 0) {
          logger.warn(
            `Invalid team data - missing or invalid ID: ${JSON.stringify(team)}`
          );
          continue;
        }

        if (!team.slug) {
          logger.warn(
            `Invalid team data - missing slug: ${JSON.stringify(team)}`
          );
          continue;
        }

        // Extract organization from team data
        // The organization can be found in different ways depending on the webhook payload
        let org: string | undefined;

        // Try to get org from team.organization.login (standard format)
        if ((team as any).organization?.login) {
          org = (team as any).organization.login;
        }
        // Try to get org from team.html_url (fallback)
        else if (team.html_url) {
          const match = team.html_url.match(/github\.com\/orgs\/([^\/]+)/);
          if (match) {
            org = match[1];
          }
        }
        // Try to get org from team.url (another fallback)
        else if (team.url) {
          const match = team.url.match(/\/orgs\/([^\/]+)\/teams/);
          if (match) {
            org = match[1];
          }
        }
        // Try to get org from the repository context
        else if (github.context.payload.repository?.owner?.login) {
          org = github.context.payload.repository.owner.login;
          logger.info(`Using repository owner as org: ${org}`);
        }

        if (!org) {
          logger.warn(
            `Could not determine organization for team: ${JSON.stringify(team)}`
          );
          continue;
        }

        logger.info(`Fetching members for team: ${team.slug} in org: ${org}`);

        try {
          const teamMembers = await octokit.rest.teams.listMembersInOrg({
            org,
            team_slug: team.slug,
          });

          logger.info(
            `Found ${teamMembers.data.length} members for team ${team.slug}`
          );

          teamMembers.data.forEach((member) => {
            users.push(member.login);
          });
        } catch (error: any) {
          logger.error(
            `Failed to fetch team members for ${team.slug}: ${error.message}`
          );
          logger.error(
            `API URL attempted: https://api.github.com/orgs/${org}/teams/${team.slug}/members`
          );

          // Continue processing other teams instead of failing completely
          continue;
        }
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

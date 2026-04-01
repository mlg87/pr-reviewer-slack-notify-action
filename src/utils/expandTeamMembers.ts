import * as core from "@actions/core";
import * as github from "@actions/github";

import { logger } from "./logger";

/**
 * Gets individual members from GitHub teams
 * Adapted from existing GitHub Actions script
 */
export const getTeamMembers = async (
  teams: string[],
  org: string,
): Promise<{ users: string[]; errors: string[] }> => {
  const octokit = github.getOctokit(core.getInput("github-token"));
  const allUsers = new Set<string>();
  const errors: string[] = [];

  for (const teamSlug of teams) {
    try {
      logger.info(`Getting members for team: ${teamSlug}`);

      // Team slug format is typically 'org/team-name'
      const [teamOrg, teamName] = teamSlug.includes("/")
        ? teamSlug.split("/")
        : [org, teamSlug];

      const { data: members } = await octokit.rest.teams.listMembersInOrg({
        org: teamOrg,
        team_slug: teamName,
        per_page: 100,
      });

      members.forEach((member) => {
        allUsers.add(member.login);
        logger.info(`  - Added member: ${member.login}`);
      });
    } catch (error: any) {
      const errorMsg = `Could not get members for team ${teamSlug}: ${error.message}`;
      logger.error(errorMsg);

      if (error.status === 403 || error.status === 404) {
        logger.warn(
          `Unable to expand team ${teamSlug} - missing 'members: read' organization permission or team not found. ` +
            `The team will be assigned as a reviewer instead of individual members.`,
        );
      }

      errors.push(errorMsg);
    }
  }

  return {
    users: Array.from(allUsers),
    errors,
  };
};

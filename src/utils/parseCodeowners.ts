import * as core from "@actions/core";
import * as github from "@actions/github";

import { logger } from "./logger";

/**
 * Parses CODEOWNERS file and extracts unique users and teams
 * Adapted from existing GitHub Actions script
 */
export const parseCodeowners = async (
  repository: any,
  branch: string,
): Promise<{ users: string[]; teams: string[]; success: boolean }> => {
  logger.info("Looking for CODEOWNERS file...");

  const octokit = github.getOctokit(core.getInput("github-token"));
  const possiblePaths = [".github/CODEOWNERS", "CODEOWNERS", "docs/CODEOWNERS"];

  let codeownersContent: string | null = null;

  // Find and read CODEOWNERS file
  for (const path of possiblePaths) {
    try {
      const { data } = await octokit.rest.repos.getContent({
        owner: repository.owner.login,
        repo: repository.name,
        path,
        ref: branch,
      });

      if ("content" in data && data.content) {
        codeownersContent = Buffer.from(data.content, "base64").toString(
          "utf-8",
        );
        logger.info(`Found CODEOWNERS file at ${path}`);
        break;
      }
    } catch (error: any) {
      if (error.status !== 404) {
        logger.warn(`Error fetching CODEOWNERS from ${path}: ${error.message}`);
      }
    }
  }

  if (!codeownersContent) {
    logger.info("No CODEOWNERS file found");
    return { users: [], teams: [], success: false };
  }

  logger.info("Parsing CODEOWNERS content...");

  // Parse the CODEOWNERS content
  const lines = codeownersContent.split("\n");
  const users = new Set<string>();
  const teams = new Set<string>();

  for (const line of lines) {
    // Skip empty lines and comments
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    // Split line into parts (path pattern and owners)
    const parts = trimmedLine.split(/\s+/);

    // Skip the first part (path pattern) and process owners
    for (let i = 1; i < parts.length; i++) {
      const owner = parts[i].trim();

      if (owner.startsWith("@")) {
        // Remove the @ symbol
        const cleanOwner = owner.substring(1);

        if (cleanOwner.includes("/")) {
          // This is a team (org/team format)
          teams.add(cleanOwner);
          logger.info(`Found team: ${cleanOwner}`);
        } else {
          // This is a user
          users.add(cleanOwner);
          logger.info(`Found user: ${cleanOwner}`);
        }
      }
    }
  }

  const userArray = Array.from(users);
  const teamArray = Array.from(teams);

  logger.info("Parsing complete:");
  logger.info(`  - Users: ${userArray.length} (${userArray.join(", ")})`);
  logger.info(`  - Teams: ${teamArray.length} (${teamArray.join(", ")})`);

  if (userArray.length === 0 && teamArray.length === 0) {
    logger.warn("No valid users or teams found in CODEOWNERS");
    return { users: [], teams: [], success: false };
  }

  return {
    users: userArray,
    teams: teamArray,
    success: true,
  };
};

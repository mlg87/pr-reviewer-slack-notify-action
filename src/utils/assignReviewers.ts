import * as core from "@actions/core";
import * as github from "@actions/github";

import { getTeamMembers } from "./expandTeamMembers";
import { logger } from "./logger";
import { parseCodeowners } from "./parseCodeowners";

/**
 * Assigns reviewers to a pull request based on CODEOWNERS
 * Adapted from existing GitHub Actions script
 */
export const assignCodeownersAsReviewers = async (
  pull_request: any,
  repository: any,
  expandTeams: boolean = true,
): Promise<{
  success: boolean;
  assigned: { users: string[]; teams: string[] };
  errors: string[];
}> => {
  const octokit = github.getOctokit(core.getInput("github-token"));

  try {
    logger.info(`Assigning reviewers to PR #${pull_request.number}...`);
    logger.info(`PR Author: ${pull_request.user.login}`);
    logger.info(`Expand teams to members: ${expandTeams}`);

    // Parse CODEOWNERS
    const codeownersResult = await parseCodeowners(
      repository,
      pull_request.base.ref,
    );

    if (!codeownersResult.success) {
      logger.info("Failed to parse CODEOWNERS");
      return {
        success: false,
        assigned: { users: [], teams: [] },
        errors: ["No CODEOWNERS file found or parsing failed"],
      };
    }

    let allUsers = [...codeownersResult.users];
    let finalTeams = [...codeownersResult.teams];
    const errors: string[] = [];

    logger.info(`Candidate users: ${allUsers.join(", ") || "none"}`);
    logger.info(`Candidate teams: ${finalTeams.join(", ") || "none"}`);

    // If expandTeams is true, get individual members from teams
    if (expandTeams && finalTeams.length > 0) {
      logger.info("Expanding teams to individual members...");
      const teamMemberResult = await getTeamMembers(
        finalTeams,
        repository.owner.login,
      );

      // Add team members to the user list
      allUsers.push(...teamMemberResult.users);
      errors.push(...teamMemberResult.errors);

      // Don't assign teams directly if we're expanding them
      finalTeams = [];

      logger.info(
        `Expanded team(s) to ${teamMemberResult.users.length} individual member(s)`,
      );
    }

    // Remove duplicates from users
    allUsers = [...new Set(allUsers)];

    // Filter out the PR author from users
    const filteredUsers = allUsers.filter(
      (user) => user !== pull_request.user.login,
    );

    if (filteredUsers.length !== allUsers.length) {
      logger.info(
        `Filtered out PR author (${pull_request.user.login}) from reviewers list`,
      );
    }

    // Validate that we have reviewers to assign
    if (filteredUsers.length === 0 && finalTeams.length === 0) {
      logger.warn(
        "No valid reviewers to assign (PR author was the only user in CODEOWNERS)",
      );
      return {
        success: false,
        assigned: { users: [], teams: [] },
        errors: ["No valid reviewers available after filtering out PR author"],
      };
    }

    let assignedUsers: string[] = [];
    let assignedTeams: string[] = [];

    // Prepare reviewer assignment request
    const reviewerRequest: any = {};

    if (filteredUsers.length > 0) {
      reviewerRequest.reviewers = filteredUsers;
    }

    if (finalTeams.length > 0) {
      reviewerRequest.team_reviewers = finalTeams;
    }

    logger.info("Attempting to assign:");
    logger.info(`  - Users: ${filteredUsers.join(", ") || "none"}`);
    logger.info(`  - Teams: ${finalTeams.join(", ") || "none"}`);

    // Assign reviewers
    try {
      const { data: result } = await octokit.rest.pulls.requestReviewers({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number,
        ...reviewerRequest,
      });

      assignedUsers =
        result.requested_reviewers?.map((user: any) => user.login) || [];
      assignedTeams =
        result.requested_teams?.map((team: any) => team.slug) || [];

      logger.info("Successfully assigned reviewers:");
      logger.info(`  - Users: ${assignedUsers.join(", ") || "none"}`);
      logger.info(`  - Teams: ${assignedTeams.join(", ") || "none"}`);
    } catch (assignError: any) {
      logger.error(`Error assigning reviewers: ${assignError.message}`);

      // Parse specific GitHub API errors
      if (assignError.status === 422) {
        errors.push(
          "Some reviewers could not be assigned (may not have repository access or already be reviewers)",
        );
      } else if (assignError.status === 403) {
        errors.push("Insufficient permissions to assign reviewers");
      } else {
        errors.push(`GitHub API error: ${assignError.message}`);
      }

      // Try to get current reviewers to see what was actually assigned
      try {
        const { data: currentReviewers } =
          await octokit.rest.pulls.listRequestedReviewers({
            owner: repository.owner.login,
            repo: repository.name,
            pull_number: pull_request.number,
          });

        assignedUsers =
          currentReviewers.users?.map((user: any) => user.login) || [];
        assignedTeams =
          currentReviewers.teams?.map((team: any) => team.slug) || [];
      } catch (listError: any) {
        logger.error(`Could not fetch current reviewers: ${listError.message}`);
      }
    }

    // Add a comment to the PR confirming assignment
    try {
      const assignedReviewersText: string[] = [];

      if (assignedUsers.length > 0) {
        assignedReviewersText.push(
          `**Users:** ${assignedUsers.map((user) => `@${user}`).join(", ")}`,
        );
      }

      if (assignedTeams.length > 0) {
        assignedReviewersText.push(
          `**Teams:** ${assignedTeams.map((team) => `@${team}`).join(", ")}`,
        );
      }

      let commentBody: string;

      if (assignedReviewersText.length > 0) {
        const labelForInitialNotification = core.getInput(
          "label-for-initial-notification",
        );
        commentBody = `🤖 **Auto-assigned reviewers from CODEOWNERS**\n\n${assignedReviewersText.join(
          "\n",
        )}\n\n_You'll receive a Slack notification when the '${labelForInitialNotification}' label is applied._`;
      } else if (errors.length > 0) {
        commentBody = `🤖 **Attempted to auto-assign reviewers from CODEOWNERS**\n\n⚠️ However, some issues occurred:\n${errors
          .map((error) => `- ${error}`)
          .join(
            "\n",
          )}\n\n_Please manually assign reviewers or check repository permissions._`;
      } else {
        commentBody = `🤖 **Processed CODEOWNERS**\n\n_Attempted to auto-assign reviewers, but no changes were made to reviewer assignments._`;
      }

      // Check for existing auto-assignment comments to avoid duplicates
      const { data: existingComments } = await octokit.rest.issues.listComments(
        {
          owner: repository.owner.login,
          repo: repository.name,
          issue_number: pull_request.number,
        },
      );

      const autoAssignmentCommentExists = existingComments.some(
        (comment) =>
          comment.body?.includes(
            "🤖 **Auto-assigned reviewers from CODEOWNERS**",
          ) ||
          comment.body?.includes(
            "🤖 **Attempted to auto-assign reviewers from CODEOWNERS**",
          ) ||
          comment.body?.includes("🤖 **Processed CODEOWNERS**"),
      );

      if (autoAssignmentCommentExists) {
        logger.info(
          "Auto-assignment comment already exists, skipping duplicate",
        );
      } else {
        await octokit.rest.issues.createComment({
          owner: repository.owner.login,
          repo: repository.name,
          issue_number: pull_request.number,
          body: commentBody,
        });

        logger.info("Added confirmation comment to PR");
      }
    } catch (commentError: any) {
      logger.warn(`Could not add comment to PR: ${commentError.message}`);
      errors.push("Could not add confirmation comment to PR");
    }

    const success =
      (assignedUsers.length > 0 || assignedTeams.length > 0) &&
      errors.length === 0;

    return {
      success,
      assigned: {
        users: assignedUsers,
        teams: assignedTeams,
      },
      errors,
    };
  } catch (error: any) {
    logger.error(
      `Unexpected error in assignCodeownersAsReviewers: ${error.message}`,
    );
    return {
      success: false,
      assigned: { users: [], teams: [] },
      errors: [`Unexpected error: ${error.message}`],
    };
  }
};

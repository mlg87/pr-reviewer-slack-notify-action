import * as github from "@actions/github";
import * as core from "@actions/core";
import { logger } from "./logger";

export interface CheckResult {
  allRequiredChecksPassed: boolean;
  requiredChecksCount: number;
  passedChecksCount: number;
  pendingChecksCount: number;
  failedChecksCount: number;
  hasRequiredChecks: boolean;
}

export const getRequiredStatusChecks = async (
  pull_request: any,
  repository: any
): Promise<CheckResult> => {
  logger.info("START getRequiredStatusChecks");
  try {
    if (!pull_request || !repository) {
      throw Error("pull_request and repository are required");
    }

    const octokit = github.getOctokit(core.getInput("github-token"));
    const baseBranch = pull_request.base.ref;
    const headSha = pull_request.head.sha;

    // Get branch protection rules to identify required checks
    let requiredChecks: string[] = [];
    let requiredStatusChecks: string[] = [];
    try {
      const protection = await octokit.rest.repos.getBranchProtection({
        owner: repository.owner.login,
        repo: repository.name,
        branch: baseBranch,
      });

      // GitHub has two types of required checks:
      // 1. required_status_checks.contexts (legacy)
      // 2. required_status_checks.checks (new format)
      if (protection.data.required_status_checks) {
        requiredStatusChecks =
          protection.data.required_status_checks.contexts || [];

        // New format with checks array
        if (protection.data.required_status_checks.checks) {
          const checkNames = protection.data.required_status_checks.checks.map(
            (check: any) => check.context
          );
          requiredChecks = [...requiredStatusChecks, ...checkNames];
        } else {
          requiredChecks = requiredStatusChecks;
        }
      }

      logger.info(
        `Found ${requiredChecks.length} required checks: ${requiredChecks.join(", ")}`
      );
    } catch (error: any) {
      // Branch protection might not be enabled or we might not have permission
      if (error.status === 404 || error.status === 403) {
        logger.info(
          `No branch protection found or insufficient permissions for branch ${baseBranch}. Assuming no required checks.`
        );
      } else {
        throw error;
      }
    }

    // If no required checks, all checks are considered "passed"
    if (requiredChecks.length === 0) {
      logger.info("No required checks found, returning success");
      return {
        allRequiredChecksPassed: true,
        requiredChecksCount: 0,
        passedChecksCount: 0,
        pendingChecksCount: 0,
        failedChecksCount: 0,
        hasRequiredChecks: false,
      };
    }

    // Fetch check runs for this commit
    const checkRuns = await octokit.rest.checks.listForRef({
      owner: repository.owner.login,
      repo: repository.name,
      ref: headSha,
    });

    // Fetch commit statuses (legacy status API)
    const commitStatuses = await octokit.rest.repos.getCombinedStatusForRef({
      owner: repository.owner.login,
      repo: repository.name,
      ref: headSha,
    });

    // Build a map of check name to status
    const checkStatusMap = new Map<string, string>();

    // Process check runs
    checkRuns.data.check_runs.forEach((checkRun) => {
      if (checkRun.status === "completed") {
        checkStatusMap.set(checkRun.name, checkRun.conclusion || "unknown");
      } else {
        checkStatusMap.set(checkRun.name, "pending");
      }
    });

    // Process commit statuses
    commitStatuses.data.statuses.forEach((status) => {
      checkStatusMap.set(status.context, status.state);
    });

    // Check if all required checks have passed
    let passedCount = 0;
    let pendingCount = 0;
    let failedCount = 0;

    for (const requiredCheck of requiredChecks) {
      const status = checkStatusMap.get(requiredCheck);

      if (!status) {
        // Check hasn't started yet
        pendingCount++;
        logger.info(`Required check '${requiredCheck}' has not started yet`);
      } else if (status === "success") {
        passedCount++;
        logger.info(`Required check '${requiredCheck}' passed`);
      } else if (
        status === "pending" ||
        status === "queued" ||
        status === "in_progress"
      ) {
        pendingCount++;
        logger.info(`Required check '${requiredCheck}' is pending (${status})`);
      } else {
        failedCount++;
        logger.info(`Required check '${requiredCheck}' failed (${status})`);
      }
    }

    const allPassed = passedCount === requiredChecks.length;

    logger.info(
      `Check results: ${passedCount}/${requiredChecks.length} passed, ${pendingCount} pending, ${failedCount} failed`
    );

    const result: CheckResult = {
      allRequiredChecksPassed: allPassed,
      requiredChecksCount: requiredChecks.length,
      passedChecksCount: passedCount,
      pendingChecksCount: pendingCount,
      failedChecksCount: failedCount,
      hasRequiredChecks: true,
    };

    logger.info(`END getRequiredStatusChecks: ${JSON.stringify(result)}`);
    return result;
  } catch (error: any) {
    logger.error(`Error in getRequiredStatusChecks: ${error.message}`);
    throw error;
  }
};

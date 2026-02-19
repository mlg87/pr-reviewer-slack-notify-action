# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

GitHub Action that notifies requested PR reviewers via Slack once all required CI/CD checks have passed. Integrates GitHub, Slack, and AWS S3 (for GitHub-to-Slack user mapping). Runtime: Node 24, packaged with @vercel/ncc.

## Commands

```bash
yarn build          # Compile TypeScript (tsc → lib/)
yarn package        # Bundle with ncc for GitHub Actions (→ dist/)
yarn test           # Run all Jest tests
yarn test -- --testNamePattern="pattern"  # Run specific test by name
yarn format         # Prettier formatting
yarn lint:script    # ESLint with auto-fix
```

The `dist/` directory is committed to the repo (required for GitHub Actions). After code changes, run `yarn build && yarn package` before committing.

## Commit Conventions

Uses Conventional Commits enforced by commitlint + husky:
- Format: `<type>(<scope>): <description>`
- Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert
- Scopes: slack, helpers, logger, api, webhook, etc.
- Breaking changes: `feat(scope)!: description` with `BREAKING CHANGE:` footer
- Imperative mood, under 72 characters
- When told to "commit": stage and commit ALL changed files without asking

Releases are automated via semantic-release on push to main. Commit types map to version bumps (feat→minor, fix→patch, breaking→major).

## Architecture

### Event-Driven Handler Pattern

`src/index.ts` is the entry point. It reads the GitHub event context and routes to the appropriate handler in `src/actions/`:

| Event | Handler | What it does |
|---|---|---|
| PR opened/ready | `pollForRequiredChecks.ts` | Polls CI checks every 90s (30m timeout), sends Slack notification when all pass |
| check_suite/workflow_run completed | `pollForRequiredChecks.ts` | Re-evaluates check status |
| pull_request_review submitted | `handlePullRequestReview.ts` | Posts review status to Slack thread with emoji reactions |
| push (synchronize) | `handleCommitPush.ts` | Clears reactions, notifies reviewers of new code |
| PR merged | `handleMerge.ts` | Posts merge celebration, adds ship-it reaction |
| Label added | `handleLabelChange.ts` | Watches for configured label, notifies author |

### State Management via PR Comments

The action stores state in hidden PR comments to coordinate across workflow runs:
- `SLACK_NOTIFICATION_STATE:STATE` — tracks notification lifecycle (PENDING → POLLING → NOTIFIED → SKIPPED)
- `SLACK_MESSAGE_ID:timestamp` — stores the Slack message timestamp for threading

### Key Utilities (`src/utils/`)

- **getEngineersFromS3/** — Fetches GitHub↔Slack user mapping JSON from S3
- **assignReviewers.ts** + **parseCodeowners.ts** + **expandTeamMembers.ts** — CODEOWNERS parsing and automatic reviewer assignment with team expansion
- **getRequiredStatusChecks.ts** — Fetches branch protection rules and evaluates check/status results
- **createUsersToAtString.ts** — Maps GitHub usernames to Slack @-mentions using S3 data
- **getNotificationState.ts** — Reads/writes notification state from PR comments
- **slackWebClient.ts** — Configured Slack WebClient instance
- **logger.ts** — Winston logger with colored console output

### External Dependencies

- **GitHub API** via `@actions/github` (Octokit) — PR data, checks, comments, team membership
- **Slack Web API** via `@slack/web-api` — Channel messages, threads, reactions
- **AWS S3** via `@aws-sdk/client-s3` — Engineer mapping file (GitHub username → Slack ID)

### Action Inputs

Defined in `action.yml`. Required: aws-region, aws-s3-bucket, aws-s3-object-key, base-branch, bot-token, channel-id, github-token. Notable optional: polling-interval (default 90s), polling-timeout (default 30m), ignore-draft-prs, silence-on-quiet-label, fail-silently.

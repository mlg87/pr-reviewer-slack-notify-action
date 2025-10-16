# PR Reviewer Slack Notify Action

This action posts a message to a Slack channel @ing the requested reviewers after all required CI/CD checks have passed on a PR. The action polls until checks complete, ensuring reviewers are only notified when code is ready for review. This is easy to set up, but requires creating a Slack app with bot permissions.

## Setting up the Slack app

[Create a Slack App](https://api.slack.com/apps) with `Bots` and `Permissions` functionality. It is worth noting that you will need administrator privileges for this, so hit up your IT team in advance. Once the app is created install it to your workspace and invite the bot to the channel you would messages posted to.

You will need to make sure that the bot has the correct minimum required scopes:

- `chat:write`
- `reactions:read`
- `reactions:write`

##### NOTE: previous versions of this action relied on `Incoming Webhooks`. In order to post to the message thread and have the bot update reactions, it is now required to provide this permissions

## AWS

This no longer accepts `slack-users` as an input. Instead this action expects you to have a JSON file stored somewhere in S3 that has this shape:

```json
{
  "engineers": [
    { "github_username": "myGithubHandle", "slack_id": "U123456789" }
  ]
}
```

This makes it much easier to manage using this action at scale where the same engineers are working in many repos. You will need to create an IAM user with permission to get this object from this particular bucket in S3.

## Adding the action to your project

In your `./github/workflows` directory, add a `slackNotify.yml` (or whatever the hell you want to call it) file. Add the following as contents:

```yml
name: PR Review Slack Notify
on:
  pull_request:
    types: [opened, ready_for_review]
  pull_request_review:
    types: [submitted]
  push:

# IMPORTANT: Prevent concurrent runs per PR to avoid duplicate notifications
concurrency:
  group: pr-slack-notify-${{ github.event.pull_request.number || github.event.number }}
  cancel-in-progress: false # Don't cancel, let it complete

# IMPORTANT! in order for the aws sdk to auth correctly these keys/values need to be exposed here
env:
  AWS_ACCESS_KEY_ID: ${{ secrets.YOUR_AWS_ACCESS_KEY_ID }}
  AWS_SECRET_ACCESS_KEY: ${{ secrets.YOUR_AWS_SECRET_ACCESS_KEY }}

jobs:
  notify:
    runs-on: ubuntu-latest
    name: PR Review Slack Notify
    timeout-minutes: 35 # Slightly more than polling timeout
    steps:
      - name: Send slack notifications to requested reviewers
        id: pr-slack-notify
        uses: mlg87/pr-reviewer-slack-notify-action@v9.0.0
        with:
          aws-region: "us-west-2"
          aws-s3-bucket: "my-bucket"
          aws-s3-object-key: "path/to/json/file/engineer-github-slack-mapping.json"
          base-branch: "staging"
          bot-token: ${{ secrets.SLACK_BOT_TOKEN }}
          channel-id: "[GET_THIS_FROM_SLACK]"
          github-token: ${{ secrets.GH_TOKEN }}
          verbose: false
          polling-interval: 90 # Check every 90 seconds
          polling-timeout: 30 # Give up after 30 minutes
```

## Action inputs

| Input                            | Description                                                                                                                                                      | Required | Type     | Default |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------- | ------- |
| `aws-region`                     | Region in which the Github <=> Slack engineer mapping JSON is stored                                                                                             | `true`   | `String` | n/a     |
| `aws-s3-bucket`                  | Bucket in which the Github <=> Slack engineer mapping JSON object is stored in S3                                                                                | `true`   | `String` | n/a     |
| `aws-s3-object-key`              | Name of the Github <=> Slack engineer mapping JSON object in S3                                                                                                  | `true`   | `String` | n/a     |
| `base-branch`                    | Branch name that your PRs will be opened in to.                                                                                                                  | `true`   | `String` | n/a     |
| `bot-token`                      | OAuth token from Slack. Find this on your Slack App's settings page under `OAuth & Permissions`.                                                                 | `true`   | `String` | n/a     |
| `channel-id`                     | The id of the channel you would like messages posted to. It is easiest to find this by opening your Slack workspace in the browser and grabbing it from the URL. | `true`   | `String` | n/a     |
| `github-token`                   | Personal access token generated by Github. Can be an individual user's or one generated for a bot.                                                               | `true`   | `String` | n/a     |
| `label-name-to-watch-for`        | Optional label to watch for to notify thread of activity                                                                                                         | `false`  | `String` | `''`    |
| `label-for-initial-notification` | If set, the action will wait for this label to be added to the PR before running initial notifications.                                                          | `false`  | `String` | `''`    |
| `verbose`                        | Optional feature to shorten the slack message. Verbose: true will post the PR body. Verbose: false will not.                                                     | `false`  | `String` | `true`  |
| `polling-interval`               | Number of seconds to wait between checks when polling for required status checks to pass.                                                                        | `false`  | `Number` | `90`    |
| `polling-timeout`                | Maximum number of minutes to wait for required checks to pass before giving up.                                                                                  | `false`  | `Number` | `30`    |

##### NOTE: It is recommended to store sensitive values (bot-token, AWS credentials) in GitHub Secrets

## Using the label-for-initial-notification feature

The `label-for-initial-notification` input allows you to require a specific label before the action starts polling for checks. This is useful for manual approval workflows where you want human oversight before notifying reviewers.

**Note**: In v9.0.0+, this feature works in combination with required checks. The action will wait for BOTH the label to be present AND all required checks to pass before notifying reviewers.

### How it works:

1. **PR opened without label**: The action will not start polling for checks until the required label is added
2. **Label added**: Once the label is added, the action begins polling for required checks to pass
3. **PR opened with label**: If the label is already present, polling starts immediately

### Common use cases:

- **Manual approval**: Require manual label addition before starting the review process
- **Staged rollout**: Use different labels for different environments or review stages
- **Extra gating**: Add a human checkpoint on top of automated checks

## How it Works (v9.0.0+)

**Polling-Based Notifications**: Starting with v9.0.0, this action uses a polling mechanism to ensure notifications are only sent after all required CI/CD checks have passed. This prevents premature notifications and ensures reviewers aren't pinged before the code is ready.

**Workflow**:

1. When a PR is opened or marked as ready for review, the action starts
2. It checks if all required status checks (as defined in branch protection) have passed
3. If not, it waits (polling every 90 seconds by default) until they pass
4. Once all required checks pass, it notifies the reviewers in Slack
5. If checks don't pass within the timeout period (30 minutes by default), no notification is sent

**Important Notes**:

- Only **required** checks block notification - non-required checks that fail won't prevent notifications
- Use the `concurrency` group in your workflow to prevent duplicate runs
- Reviewers should be assigned before opening the PR or converting from draft
- The action tracks state in PR comments to prevent duplicate notifications

## Migrating from v8.x to v9.0.0

**Breaking Changes**:

- Notifications are now delayed until required checks pass (not immediate)
- You **must** add a `concurrency` group to your workflow (see example above)
- Job timeout should be set to slightly more than `polling-timeout` (default: 35 minutes)
- Action now requires Node.js 24 runtime

**Note**: If your repository has no required status checks configured in branch protection, notifications will be sent immediately (similar to v8.x behavior).

An example of a PR lifecyle and how the bot works:

1. User gets ready to open PR and assigns reviewers prior to opening the PR.
1. User opens PR with required CI/CD checks configured.
1. Action starts and begins polling for required checks to pass (every 90 seconds).
1. Once all required checks pass, the action posts a message in the provided Slack channel mentioning the requested reviewers with a link to the PR, the PR title, and the PR body (if verbose is enabled).
1. One of the reviewers requests changes to the PR, so the action adds the stop sign reaction to the original thread and mentions the PR author in a message in the thread that changes have been requested. The body (main comment associated with the review) is included in the message.
1. PR owner pushes up code changes, so action removes reactions from the thread and notifies the requested reviewers that there is new code and they should go check it out.
1. Someone approves! Action updates the reactions accordingly and notifies the PR owner.
1. The code gets merged into the `base-branch`, so action updates the thread and reactions.

[K, bye.](https://media.giphy.com/media/DfSLII45H40RW/giphy.gif)

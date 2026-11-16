import * as core from "@actions/core";

// Defaults live here rather than in action.yml `default:` so an input that
// resolves to an empty string (e.g. an unset `${{ vars.X }}`) falls back to
// real copy instead of posting an empty Slack message.
export const MESSAGE_DEFAULTS = {
  "message-initial":
    "{{reviewer_mentions}} *{{author}}* is requesting your review on <{{pr_url}}|*{{pr_title}}*>",
  "message-review-approved":
    "{{author_mention}}, *{{reviewer}}* approved your PR",
  "message-review-changes-requested":
    "{{author_mention}}, *{{reviewer}}* would like you to change some things in the code",
  "message-review-commented":
    "{{author_mention}}, *{{reviewer}}* added a comment:",
  "message-review-commented-plural":
    "{{author_mention}}, *{{reviewer}}* added {{comment_count}} comments:",
  "message-review-comment-line": "<{{comment_url}}|:link:> {{comment_body}}",
  "message-new-commits":
    "{{reviewer_mentions}} new code has been committed since your review of <{{pr_url}}|*PR {{pr_number}}*>, please review the updates.",
  "message-new-commits-diff-link": "<{{compare_url}}|View the changes>.",
  "message-label-added":
    "{{author_mention}}, *{{labeler}}* added the label *{{label}}* to your PR",
  "message-merged":
    "This PR has been merged. One-way ticket to Prod purchased. See you in Valhalla.",
} as const;

export const REACTION_DEFAULTS = {
  "reaction-review-approved": "white_check_mark",
  "reaction-review-changes-requested": "octagonal_sign",
  "reaction-review-commented": "speech_balloon",
  "reaction-label-added": "heart_eyes",
  "reaction-merged": "ship-it",
} as const;

export type MessageInput = keyof typeof MESSAGE_DEFAULTS;
export type ReactionInput = keyof typeof REACTION_DEFAULTS;
export type Placeholders = Record<string, string | number>;

// Structural so it accepts both the REST pull request (getPullRequest) and the
// webhook payload pull_request, whose title/html_url are loosely typed.
type PullRequestLike = {
  number: number;
  title?: string;
  html_url?: string;
  user?: { login: string } | null;
};

export const pullRequestPlaceholders = (
  pull_request: PullRequestLike,
): Placeholders => ({
  author: pull_request.user?.login ?? "",
  pr_number: pull_request.number,
  pr_title: pull_request.title ?? "",
  pr_url: pull_request.html_url ?? "",
});

const PLACEHOLDER_PATTERN = /\{\{\s*(\w+)\s*\}\}/g;

export const renderMessage = (
  input: MessageInput,
  placeholders: Placeholders,
): string => {
  const template = core.getInput(input) || MESSAGE_DEFAULTS[input];
  // Single pass over the template only: substituted values (PR titles, review
  // bodies) are never re-scanned, so user content containing `{{...}}` is inert.
  return template.replace(PLACEHOLDER_PATTERN, (match, name: string) => {
    if (Object.hasOwn(placeholders, name)) return String(placeholders[name]);
    core.warning(
      `Input '${input}' uses unknown placeholder ${match}; it was left as-is.`,
    );
    return match;
  });
};

export const getReaction = (input: ReactionInput): string => {
  // Slack's reactions.add rejects `:name:`, which is how users copy emoji names.
  const name = (core.getInput(input) || "").replace(/^:+|:+$/g, "");
  return name || REACTION_DEFAULTS[input];
};

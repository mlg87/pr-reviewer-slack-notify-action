export const MAX_QUOTE_LENGTH = 3000;

/** Slack-mrkdwn blockquote: truncates to MAX_QUOTE_LENGTH and prefixes every line with `>` */
export const formatQuote = (body: string): string => {
  const truncated =
    body.length > MAX_QUOTE_LENGTH
      ? `${body.slice(0, MAX_QUOTE_LENGTH)}…`
      : body;
  return truncated
    .split("\n")
    .map((line) => `>${line}`)
    .join("\n");
};

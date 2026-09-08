import { describe, it, expect } from "vitest";

import { formatQuote, MAX_QUOTE_LENGTH } from "./formatQuote";

describe("formatQuote", () => {
  it("should prefix every line of a multi-line body with '>'", () => {
    const result = formatQuote("line one\nline two\nline three");

    expect(result).toBe(">line one\n>line two\n>line three");
  });

  it("should truncate a body longer than MAX_QUOTE_LENGTH to 3000 chars plus an ellipsis", () => {
    const body = "a".repeat(MAX_QUOTE_LENGTH + 1);

    const result = formatQuote(body);
    const quotedBody = result.slice(1); // strip leading '>'

    expect(quotedBody).toBe(`${"a".repeat(MAX_QUOTE_LENGTH)}…`);
  });

  it("should not truncate a body of exactly MAX_QUOTE_LENGTH", () => {
    const body = "a".repeat(MAX_QUOTE_LENGTH);

    const result = formatQuote(body);

    expect(result).toBe(`>${body}`);
    expect(result).not.toContain("…");
  });
});

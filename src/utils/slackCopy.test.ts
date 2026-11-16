import { readFileSync } from "node:fs";

import * as core from "@actions/core";
import { load } from "js-yaml";
import { describe, it, expect, vi, beforeEach } from "vitest";

import {
  getReaction,
  MESSAGE_DEFAULTS,
  pullRequestPlaceholders,
  REACTION_DEFAULTS,
  renderMessage,
} from "./slackCopy";

vi.mock("@actions/core");

const mockCore = vi.mocked(core);

const setInputs = (inputs: Record<string, string>) => {
  mockCore.getInput.mockImplementation((name: string) => inputs[name] ?? "");
};

describe("slackCopy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCore.getInput.mockReturnValue("");
  });

  describe("renderMessage", () => {
    it("should render the default template when the input is unset", () => {
      const result = renderMessage("message-review-approved", {
        author_mention: "<@U1>",
        reviewer: "bob",
      });

      expect(result).toBe("<@U1>, *bob* approved your PR");
    });

    it("should substitute an override, tolerating whitespace in braces and stringifying numbers", () => {
      setInputs({
        "message-merged": "Shipped {{ pr_title }} (#{{pr_number}})",
      });

      const result = renderMessage("message-merged", {
        pr_title: "T",
        pr_number: 7,
      });

      expect(result).toBe("Shipped T (#7)");
    });

    it("should leave an unknown placeholder verbatim and warn about it", () => {
      setInputs({ "message-merged": "Hi {{nope}}" });

      const result = renderMessage("message-merged", {});

      expect(result).toBe("Hi {{nope}}");
      expect(mockCore.warning).toHaveBeenCalledWith(
        expect.stringContaining("message-merged"),
      );
      expect(mockCore.warning).toHaveBeenCalledWith(
        expect.stringContaining("{{nope}}"),
      );
    });

    it("should not expand placeholders that appear inside substituted values", () => {
      const result = renderMessage("message-review-comment-line", {
        comment_url: "u",
        comment_body: "see {{author}}",
        author: "x",
      });

      expect(result).toBe("<u|:link:> see {{author}}");
      expect(mockCore.warning).not.toHaveBeenCalled();
    });
  });

  describe("getReaction", () => {
    it("should return the default when unset", () => {
      expect(getReaction("reaction-merged")).toBe("ship-it");
    });

    it("should strip surrounding colons", () => {
      setInputs({ "reaction-merged": ":tada:" });

      expect(getReaction("reaction-merged")).toBe("tada");
    });

    it("should keep inner colons of skin-tone modifiers", () => {
      setInputs({ "reaction-merged": ":thumbsup::skin-tone-2:" });

      expect(getReaction("reaction-merged")).toBe("thumbsup::skin-tone-2");
    });

    it("should fall back to the default when the input is only colons", () => {
      setInputs({ "reaction-merged": "::" });

      expect(getReaction("reaction-merged")).toBe("ship-it");
    });
  });

  describe("pullRequestPlaceholders", () => {
    it("should use empty strings for missing pull request fields", () => {
      expect(pullRequestPlaceholders({ number: 1, user: null })).toEqual({
        author: "",
        pr_number: 1,
        pr_title: "",
        pr_url: "",
      });
    });
  });

  // An input read in code but undeclared in action.yml makes GitHub annotate
  // every consumer run with "Unexpected input(s)".
  it("should declare every message and reaction input in action.yml", () => {
    const action = load(readFileSync("action.yml", "utf8")) as {
      inputs: Record<string, unknown>;
    };
    const declared = Object.keys(action.inputs);

    for (const name of [
      ...Object.keys(MESSAGE_DEFAULTS),
      ...Object.keys(REACTION_DEFAULTS),
    ]) {
      expect(declared).toContain(name);
    }
  });
});

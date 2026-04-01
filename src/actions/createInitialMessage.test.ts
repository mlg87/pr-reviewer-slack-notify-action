import { describe, it, expect, beforeEach, vi } from "vitest";
import * as core from "@actions/core";
import * as github from "@actions/github";
import { createUsersToAtString } from "../utils/createUsersToAtString";
import { fail } from "../utils/fail";
import { getPullRequest } from "../utils/getPullRequest";
import { slackWebClient } from "../utils/slackWebClient";
import { getRequestedReviewersAsIndividuals } from "../utils/getRequestedReviewersAsIndividuals";
import { createInitialMessage } from "./createInitialMessage";

vi.mock("@actions/core");
vi.mock("@actions/github");
vi.mock("../utils/createUsersToAtString");
vi.mock("../utils/fail");
vi.mock("../utils/getPullRequest");
vi.mock("../utils/logger");
vi.mock("../utils/slackWebClient", () => ({
  slackWebClient: {
    chat: { postMessage: vi.fn(), getPermalink: vi.fn() },
  },
}));
vi.mock("../utils/getRequestedReviewersAsIndividuals");

const mockCore = vi.mocked(core);
const mockGithub = vi.mocked(github);
const mockCreateUsersToAtString = vi.mocked(createUsersToAtString);
const mockFail = vi.mocked(fail);
const mockGetPullRequest = vi.mocked(getPullRequest);
const mockGetRequestedReviewersAsIndividuals = vi.mocked(
  getRequestedReviewersAsIndividuals
);
const mockPostMessage = vi.mocked(slackWebClient.chat.postMessage);
const mockGetPermalink = vi.mocked(slackWebClient.chat.getPermalink);

const mockCreateComment = vi.fn();

const basePullRequest = {
  number: 42,
  title: "Add new feature",
  body: "This is the PR description",
  user: { login: "author" },
  _links: { html: { href: "https://github.com/org/repo/pull/42" } },
};

describe("createInitialMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCore.getInput.mockImplementation((name: string) => {
      if (name === "channel-id") return "C123456";
      if (name === "github-token") return "gh-token";
      return "";
    });
    mockCore.getBooleanInput.mockReturnValue(false);
    mockCore.summary = {
      addRaw: vi.fn().mockReturnThis(),
      write: vi.fn().mockResolvedValue(undefined),
    } as any;

    Object.defineProperty(mockGithub, "context", {
      value: {
        payload: {
          repository: { owner: { login: "org" }, name: "repo" },
        },
      },
      writable: true,
      configurable: true,
    });
    mockGithub.getOctokit.mockReturnValue({
      rest: { issues: { createComment: mockCreateComment } },
    } as any);

    mockGetPullRequest.mockResolvedValue(basePullRequest as any);
    mockGetRequestedReviewersAsIndividuals.mockResolvedValue([
      "reviewer1",
      "reviewer2",
    ]);
    mockCreateUsersToAtString.mockResolvedValue("<@U111> <@U222>");
    mockPostMessage.mockResolvedValue({
      ok: true,
      ts: "1234567890.123456",
    } as any);
    mockGetPermalink.mockResolvedValue({
      ok: true,
      permalink: "https://slack.com/archives/C123/p1234567890123456",
    } as any);
    mockCreateComment.mockResolvedValue({});
  });

  it("creates Slack message and posts PR comment with SLACK_MESSAGE_ID", async () => {
    const result = await createInitialMessage();

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "C123456",
      })
    );
    expect(mockCreateComment).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "org",
        repo: "repo",
        issue_number: 42,
        body: expect.stringContaining("SLACK_MESSAGE_ID:1234567890.123456"),
      })
    );
    expect(result).toBe("SLACK_MESSAGE_ID:1234567890.123456");
  });

  it("includes Slack permalink in PR comment when available", async () => {
    await createInitialMessage();

    expect(mockCreateComment).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.stringContaining(
          "[View Slack thread](https://slack.com/archives/C123/p1234567890123456)"
        ),
      })
    );
  });

  it("falls back to just SLACK_MESSAGE_ID when permalink fails", async () => {
    mockGetPermalink.mockRejectedValue(new Error("permalink error"));

    await createInitialMessage();

    expect(mockCreateComment).toHaveBeenCalledWith(
      expect.objectContaining({
        body: "SLACK_MESSAGE_ID:1234567890.123456",
      })
    );
  });

  it("returns early when no pull_request found", async () => {
    mockGetPullRequest.mockResolvedValue(null as any);

    const result = await createInitialMessage();

    expect(result).toBeUndefined();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it("returns early when no repository", async () => {
    Object.defineProperty(mockGithub, "context", {
      value: { payload: { repository: undefined } },
      writable: true,
      configurable: true,
    });

    const result = await createInitialMessage();

    expect(result).toBeUndefined();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it("returns early when no requested reviewers", async () => {
    mockGetRequestedReviewersAsIndividuals.mockResolvedValue([]);

    const result = await createInitialMessage();

    expect(result).toBeUndefined();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it("includes PR body when verbose is true", async () => {
    mockCore.getBooleanInput.mockReturnValue(true);

    await createInitialMessage();

    const callArgs = mockPostMessage.mock.calls[0][0] as any;
    expect(callArgs.text).toContain(basePullRequest.body);
  });

  it("does not include PR body when verbose is false", async () => {
    mockCore.getBooleanInput.mockReturnValue(false);

    await createInitialMessage();

    const callArgs = mockPostMessage.mock.calls[0][0] as any;
    expect(callArgs.text).not.toContain(basePullRequest.body);
  });

  it("throws when Slack postMessage fails", async () => {
    mockPostMessage.mockResolvedValue({ ok: false } as any);

    await createInitialMessage();

    expect(mockFail).toHaveBeenCalledWith(
      "Failed to create initial Slack message"
    );
  });
});

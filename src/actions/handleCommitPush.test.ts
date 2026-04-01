import * as core from "@actions/core";
import * as github from "@actions/github";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { clearReactions } from "../utils/clearReactions";
import { createUsersToAtString } from "../utils/createUsersToAtString";
import { fail } from "../utils/fail";
import { getPullRequest } from "../utils/getPullRequest";
import { getSlackMessageId } from "../utils/getSlackMessageId";
import { slackWebClient } from "../utils/slackWebClient";

import { handleCommitPush } from "./handleCommitPush";

vi.mock("@actions/core");
vi.mock("@actions/github");
vi.mock("../utils/clearReactions");
vi.mock("../utils/createUsersToAtString");
vi.mock("../utils/fail");
vi.mock("../utils/getPullRequest");
vi.mock("../utils/getSlackMessageId");
vi.mock("../utils/logger");
vi.mock("../utils/slackWebClient", () => ({
  slackWebClient: { chat: { postMessage: vi.fn() } },
}));

const mockCore = vi.mocked(core);
const mockGithub = vi.mocked(github);
const mockClearReactions = vi.mocked(clearReactions);
const mockCreateUsersToAtString = vi.mocked(createUsersToAtString);
const mockFail = vi.mocked(fail);
const mockGetPullRequest = vi.mocked(getPullRequest);
const mockGetSlackMessageId = vi.mocked(getSlackMessageId);
const mockPostMessage = vi.mocked(slackWebClient.chat.postMessage);

const mockListReviews = vi.fn();

const basePullRequest = {
  number: 42,
  state: "open",
  _links: { html: { href: "https://github.com/org/repo/pull/42" } },
};

const basePayload = {
  compare: "https://github.com/org/repo/compare/abc123...def456",
  repository: { owner: { login: "org" }, name: "repo" },
};

describe("handleCommitPush", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCore.getInput.mockReturnValue("test-channel");
    Object.defineProperty(mockGithub, "context", {
      value: { payload: { ...basePayload } },
      writable: true,
    });
    mockGithub.getOctokit.mockReturnValue({
      rest: { pulls: { listReviews: mockListReviews } },
    } as any);
    mockGetPullRequest.mockResolvedValue(basePullRequest as any);
    mockGetSlackMessageId.mockResolvedValue("1234567890.123456");
    mockClearReactions.mockResolvedValue(undefined);
    mockCreateUsersToAtString.mockResolvedValue("<@U123>");
    mockListReviews.mockResolvedValue({
      data: [
        { user: { login: "reviewer1" } },
        { user: { login: "reviewer2" } },
      ],
    });
    mockPostMessage.mockResolvedValue({
      ok: true,
      ts: "1234567890.999",
    } as any);
  });

  it("clears reactions and posts commit push notification with diff link", async () => {
    await handleCommitPush();

    expect(mockClearReactions).toHaveBeenCalledWith("1234567890.123456");
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "test-channel",
        thread_ts: "1234567890.123456",
      }),
    );
    const callArgs = mockPostMessage.mock.calls[0][0] as any;
    expect(callArgs.text).toContain("new code has been committed");
    expect(callArgs.text).toContain("View the changes");
  });

  it("skips when PR is closed", async () => {
    mockGetPullRequest.mockResolvedValue({
      ...basePullRequest,
      state: "closed",
    } as any);

    await handleCommitPush();

    expect(mockClearReactions).not.toHaveBeenCalled();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it("skips when PR is not found (getPullRequest returns null)", async () => {
    mockGetPullRequest.mockResolvedValue(null as any);

    await handleCommitPush();

    expect(mockClearReactions).not.toHaveBeenCalled();
    expect(mockPostMessage).not.toHaveBeenCalled();
  });

  it("skips when no slack message ID found", async () => {
    mockGetSlackMessageId.mockResolvedValue(undefined as any);

    await handleCommitPush();

    expect(mockClearReactions).not.toHaveBeenCalled();
    expect(mockPostMessage).not.toHaveBeenCalled();
    expect(mockCore.warning).toHaveBeenCalledWith(
      expect.stringContaining("no Slack message ID"),
    );
  });

  it("throws when no repository on payload", async () => {
    Object.defineProperty(mockGithub, "context", {
      value: { payload: { compare: "url", repository: undefined } },
      writable: true,
    });

    await expect(handleCommitPush()).rejects.toThrow(
      "No repository found in github.context.payload in handleCommitPush",
    );
    expect(mockFail).toHaveBeenCalled();
  });

  it("deduplicates previous reviewers", async () => {
    mockListReviews.mockResolvedValue({
      data: [
        { user: { login: "reviewer1" } },
        { user: { login: "reviewer1" } },
        { user: { login: "reviewer2" } },
      ],
    });

    await handleCommitPush();

    expect(mockCreateUsersToAtString).toHaveBeenCalledWith([
      "reviewer1",
      "reviewer2",
    ]);
  });

  it("includes compare link when available", async () => {
    await handleCommitPush();

    const callArgs = mockPostMessage.mock.calls[0][0] as any;
    expect(callArgs.text).toContain(basePayload.compare);
    expect(callArgs.text).toContain("View the changes");
  });

  it("omits compare link when compare is undefined", async () => {
    Object.defineProperty(mockGithub, "context", {
      value: {
        payload: {
          compare: undefined,
          repository: basePayload.repository,
        },
      },
      writable: true,
    });

    await handleCommitPush();

    const callArgs = mockPostMessage.mock.calls[0][0] as any;
    expect(callArgs.text).not.toContain("View the changes");
  });

  it("throws when postMessage fails", async () => {
    mockPostMessage.mockResolvedValue({ ok: false } as any);

    await expect(handleCommitPush()).rejects.toThrow(
      "Failed to post message to thread requesting re-review",
    );
    expect(mockFail).toHaveBeenCalled();
  });
});

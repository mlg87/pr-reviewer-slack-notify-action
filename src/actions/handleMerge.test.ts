import { describe, it, expect, beforeEach, vi } from "vitest";
import * as core from "@actions/core";
import * as github from "@actions/github";
import { clearReactions } from "../utils/clearReactions";
import { fail } from "../utils/fail";
import { getPullRequest } from "../utils/getPullRequest";
import { getSlackMessageId } from "../utils/getSlackMessageId";
import { slackWebClient } from "../utils/slackWebClient";
import { handleMerge } from "./handleMerge";

vi.mock("@actions/core");
vi.mock("@actions/github");
vi.mock("../utils/clearReactions");
vi.mock("../utils/fail");
vi.mock("../utils/getPullRequest");
vi.mock("../utils/getSlackMessageId");
vi.mock("../utils/logger");
vi.mock("../utils/slackWebClient", () => ({
  slackWebClient: {
    chat: { postMessage: vi.fn() },
    reactions: { add: vi.fn() },
  },
}));

const mockCore = vi.mocked(core);
const mockGithub = vi.mocked(github);
const mockFail = vi.mocked(fail);
const mockClearReactions = vi.mocked(clearReactions);
const mockGetPullRequest = vi.mocked(getPullRequest);
const mockGetSlackMessageId = vi.mocked(getSlackMessageId);
const mockPostMessage = vi.mocked(slackWebClient.chat.postMessage);
const mockReactionsAdd = vi.mocked(slackWebClient.reactions.add);

const basePullRequest = {
  number: 42,
  state: "closed",
};

const basePayload = {
  commits: [{ id: "abc123" }],
  repository: { owner: { login: "org" }, name: "repo" },
};

describe("handleMerge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCore.getInput.mockReturnValue("test-channel");
    Object.defineProperty(mockGithub, "context", {
      value: { payload: { ...basePayload } },
      writable: true,
    });
    mockGetPullRequest.mockResolvedValue(basePullRequest as any);
    mockGetSlackMessageId.mockResolvedValue("1234567890.123456");
    mockClearReactions.mockResolvedValue(undefined);
    mockPostMessage.mockResolvedValue({ ok: true } as any);
    mockReactionsAdd.mockResolvedValue({ ok: true } as any);
  });

  it("clears reactions, adds ship-it reaction, and posts merge message", async () => {
    await handleMerge();

    expect(mockClearReactions).toHaveBeenCalledWith("1234567890.123456");
    expect(mockReactionsAdd).toHaveBeenCalledWith({
      channel: "test-channel",
      timestamp: "1234567890.123456",
      name: "ship-it",
    });
    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "test-channel",
        thread_ts: "1234567890.123456",
      })
    );
  });

  it("throws when no pull_request found for commit", async () => {
    mockGetPullRequest.mockResolvedValue(null as any);

    await expect(handleMerge()).rejects.toThrow(
      "No pull_request found for commit: abc123"
    );
    expect(mockFail).toHaveBeenCalled();
  });

  it("throws when PR is not closed", async () => {
    mockGetPullRequest.mockResolvedValue({ ...basePullRequest, state: "open" } as any);

    await expect(handleMerge()).rejects.toThrow(
      "PR is not closed for commit: abc123"
    );
    expect(mockFail).toHaveBeenCalled();
  });

  it("returns early when no slack message ID found", async () => {
    mockGetSlackMessageId.mockResolvedValue(undefined as any);

    await handleMerge();

    expect(mockClearReactions).not.toHaveBeenCalled();
    expect(mockReactionsAdd).not.toHaveBeenCalled();
    expect(mockPostMessage).not.toHaveBeenCalled();
    expect(mockCore.warning).toHaveBeenCalledWith(
      expect.stringContaining("no Slack message ID")
    );
  });

  it("posts the Valhalla message to the correct thread", async () => {
    await handleMerge();

    const callArgs = mockPostMessage.mock.calls[0][0] as any;
    expect(callArgs.text).toBe(
      "This PR has been merged. One-way ticket to Prod purchased. See you in Valhalla."
    );
    expect(callArgs.thread_ts).toBe("1234567890.123456");
    expect(callArgs.channel).toBe("test-channel");
  });
});

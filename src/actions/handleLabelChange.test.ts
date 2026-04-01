import { describe, it, expect, beforeEach, vi } from "vitest";
import * as core from "@actions/core";
import * as github from "@actions/github";
import { createInitialMessage } from "./createInitialMessage";
import { fail } from "../utils/fail";
import { getEngineersFromS3 } from "../utils/getEngineersFromS3";
import { getSlackMessageId } from "../utils/getSlackMessageId";
import { slackWebClient } from "../utils/slackWebClient";
import { handleLabelChange } from "./handleLabelChange";

vi.mock("@actions/core");
vi.mock("@actions/github");
vi.mock("./createInitialMessage");
vi.mock("../utils/fail");
vi.mock("../utils/getEngineersFromS3");
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
const mockCreateInitialMessage = vi.mocked(createInitialMessage);
const mockFail = vi.mocked(fail);
const mockGetEngineersFromS3 = vi.mocked(getEngineersFromS3);
const mockGetSlackMessageId = vi.mocked(getSlackMessageId);
const mockPostMessage = vi.mocked(slackWebClient.chat.postMessage);
const mockReactionsAdd = vi.mocked(slackWebClient.reactions.add);

const basePayload = {
  pull_request: {
    number: 42,
    user: { login: "pr-author" },
    labels: [{ name: "needs-review" }],
  },
  repository: { owner: { login: "org" }, name: "repo" },
  sender: { login: "labeler-user" },
  label: { name: "needs-review" },
};

describe("handleLabelChange", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockCore.getInput.mockImplementation((name: string) => {
      if (name === "channel-id") return "C123456";
      if (name === "label-for-initial-notification") return "needs-review";
      if (name === "label-name-to-watch-for") return "";
      return "";
    });
    mockCore.summary = {
      addRaw: vi.fn().mockReturnThis(),
      write: vi.fn().mockResolvedValue(undefined),
    } as any;

    Object.defineProperty(mockGithub, "context", {
      value: { payload: { ...basePayload } },
      writable: true,
      configurable: true,
    });

    mockGetSlackMessageId.mockResolvedValue(undefined as any);
    mockCreateInitialMessage.mockResolvedValue("SLACK_MESSAGE_ID:123.456");
  });

  it("creates initial message when label-for-initial-notification is applied and no existing thread", async () => {
    mockGetSlackMessageId.mockResolvedValue(undefined as any);

    await handleLabelChange();

    expect(mockGetSlackMessageId).toHaveBeenCalled();
    expect(mockCreateInitialMessage).toHaveBeenCalled();
  });

  it("skips when Slack thread already exists for label-for-initial-notification", async () => {
    mockGetSlackMessageId.mockResolvedValue("1234567890.123456");

    await handleLabelChange();

    expect(mockCreateInitialMessage).not.toHaveBeenCalled();
    expect(mockCore.summary.addRaw).toHaveBeenCalledWith(
      expect.stringContaining("already exists")
    );
  });

  it("posts label notification for label-name-to-watch-for when label is present", async () => {
    mockCore.getInput.mockImplementation((name: string) => {
      if (name === "channel-id") return "C123456";
      if (name === "label-for-initial-notification") return "needs-review";
      if (name === "label-name-to-watch-for") return "approved";
      return "";
    });

    Object.defineProperty(mockGithub, "context", {
      value: {
        payload: {
          ...basePayload,
          label: { name: "approved" },
          pull_request: {
            ...basePayload.pull_request,
            labels: [{ name: "needs-review" }, { name: "approved" }],
          },
        },
      },
      writable: true,
      configurable: true,
    });

    mockGetSlackMessageId.mockResolvedValue("1234567890.123456");
    mockGetEngineersFromS3.mockResolvedValue({
      engineers: [
        { github_username: "labeler-user", slack_id: "U111" },
        { github_username: "pr-author", slack_id: "U222" },
      ],
    } as any);

    await handleLabelChange();

    expect(mockPostMessage).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "C123456",
        thread_ts: "1234567890.123456",
      })
    );
    const callArgs = mockPostMessage.mock.calls[0][0] as any;
    expect(callArgs.text).toContain("<@U222>");
    expect(callArgs.text).toContain("labeler-user");
    expect(callArgs.text).toContain("approved");
  });

  it("adds heart_eyes reaction for watched label", async () => {
    mockCore.getInput.mockImplementation((name: string) => {
      if (name === "channel-id") return "C123456";
      if (name === "label-for-initial-notification") return "needs-review";
      if (name === "label-name-to-watch-for") return "approved";
      return "";
    });

    Object.defineProperty(mockGithub, "context", {
      value: {
        payload: {
          ...basePayload,
          label: { name: "approved" },
          pull_request: {
            ...basePayload.pull_request,
            labels: [{ name: "approved" }],
          },
        },
      },
      writable: true,
      configurable: true,
    });

    mockGetSlackMessageId.mockResolvedValue("1234567890.123456");
    mockGetEngineersFromS3.mockResolvedValue({
      engineers: [
        { github_username: "labeler-user", slack_id: "U111" },
        { github_username: "pr-author", slack_id: "U222" },
      ],
    } as any);

    await handleLabelChange();

    expect(mockReactionsAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "C123456",
        timestamp: "1234567890.123456",
        name: "heart_eyes",
      })
    );
  });

  it("skips when watched label is not on PR labels", async () => {
    mockCore.getInput.mockImplementation((name: string) => {
      if (name === "channel-id") return "C123456";
      if (name === "label-for-initial-notification") return "needs-review";
      if (name === "label-name-to-watch-for") return "approved";
      return "";
    });

    Object.defineProperty(mockGithub, "context", {
      value: {
        payload: {
          ...basePayload,
          label: { name: "some-other-label" },
          pull_request: {
            ...basePayload.pull_request,
            labels: [{ name: "needs-review" }],
          },
        },
      },
      writable: true,
      configurable: true,
    });

    await handleLabelChange();

    expect(mockPostMessage).not.toHaveBeenCalled();
    expect(mockReactionsAdd).not.toHaveBeenCalled();
  });

  it("skips label notification when no slack message ID", async () => {
    mockCore.getInput.mockImplementation((name: string) => {
      if (name === "channel-id") return "C123456";
      if (name === "label-for-initial-notification") return "needs-review";
      if (name === "label-name-to-watch-for") return "approved";
      return "";
    });

    Object.defineProperty(mockGithub, "context", {
      value: {
        payload: {
          ...basePayload,
          label: { name: "approved" },
          pull_request: {
            ...basePayload.pull_request,
            labels: [{ name: "approved" }],
          },
        },
      },
      writable: true,
      configurable: true,
    });

    mockGetSlackMessageId.mockResolvedValue(undefined as any);
    mockGetEngineersFromS3.mockResolvedValue({
      engineers: [
        { github_username: "labeler-user", slack_id: "U111" },
        { github_username: "pr-author", slack_id: "U222" },
      ],
    } as any);

    await handleLabelChange();

    expect(mockPostMessage).not.toHaveBeenCalled();
    expect(mockCore.warning).toHaveBeenCalled();
  });

  it("throws when no pull_request on payload", async () => {
    Object.defineProperty(mockGithub, "context", {
      value: {
        payload: {
          ...basePayload,
          pull_request: undefined,
        },
      },
      writable: true,
      configurable: true,
    });

    await expect(handleLabelChange()).rejects.toThrow(
      "No pull_request found on github.context.payload"
    );
    expect(mockFail).toHaveBeenCalled();
  });

  it("throws when no sender on payload", async () => {
    Object.defineProperty(mockGithub, "context", {
      value: {
        payload: {
          ...basePayload,
          sender: undefined,
        },
      },
      writable: true,
      configurable: true,
    });

    await expect(handleLabelChange()).rejects.toThrow(
      "No sender found on github.context.payload"
    );
    expect(mockFail).toHaveBeenCalled();
  });
});

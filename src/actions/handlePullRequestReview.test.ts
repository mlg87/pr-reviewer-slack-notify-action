import * as core from "@actions/core";
import * as github from "@actions/github";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { fail } from "../utils/fail";
import { getEngineersFromS3 } from "../utils/getEngineersFromS3";
import { getSlackMessageId } from "../utils/getSlackMessageId";
import { slackWebClient } from "../utils/slackWebClient";

import { handlePullRequestReview } from "./handlePullRequestReview";

vi.mock("@actions/core");
vi.mock("@actions/github");
vi.mock("../utils/fail");
vi.mock("../utils/getEngineersFromS3");
vi.mock("../utils/getSlackMessageId");
vi.mock("../utils/logger");
vi.mock("../utils/slackWebClient", () => ({
  slackWebClient: {
    chat: { postMessage: vi.fn() },
    reactions: { get: vi.fn(), add: vi.fn() },
  },
}));

const mockCore = vi.mocked(core);
const mockGithub = vi.mocked(github);
const mockFail = vi.mocked(fail);
const mockGetEngineersFromS3 = vi.mocked(getEngineersFromS3);
const mockGetSlackMessageId = vi.mocked(getSlackMessageId);
const mockPostMessage = vi.mocked(slackWebClient.chat.postMessage);
const mockReactionsGet = vi.mocked(slackWebClient.reactions.get);
const mockReactionsAdd = vi.mocked(slackWebClient.reactions.add);

const mockListCommentsForReview = vi.fn();

const slackUsers = {
  engineers: [
    { github_username: "reviewer1", slack_id: "UREV1" },
    { github_username: "author1", slack_id: "UAUTH1" },
  ],
};

const basePayload = {
  action: "submitted",
  pull_request: {
    number: 42,
    user: { login: "author1" },
  },
  review: {
    id: 100,
    state: "approved",
    body: "",
    user: { login: "reviewer1" },
    html_url: "https://github.com/org/repo/pull/42#pullrequestreview-100",
  },
  repository: { owner: { login: "org" }, name: "repo" },
};

describe("handlePullRequestReview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCore.getInput.mockReturnValue("test-channel");
    Object.defineProperty(mockGithub, "context", {
      value: { payload: JSON.parse(JSON.stringify(basePayload)) },
      writable: true,
    });
    mockGithub.getOctokit.mockReturnValue({
      rest: { pulls: { listCommentsForReview: mockListCommentsForReview } },
    } as any);
    mockGetEngineersFromS3.mockResolvedValue(slackUsers as any);
    mockGetSlackMessageId.mockResolvedValue("1234567890.123456");
    mockPostMessage.mockResolvedValue({ ok: true } as any);
    mockReactionsGet.mockResolvedValue({ message: { reactions: [] } } as any);
    mockReactionsAdd.mockResolvedValue({ ok: true } as any);
  });

  it("posts approval message and adds white_check_mark reaction", async () => {
    mockGithub.context.payload.review.state = "approved";
    mockGithub.context.payload.review.body = "";

    await handlePullRequestReview();

    const callArgs = mockPostMessage.mock.calls[0][0] as any;
    expect(callArgs.text).toContain("approved your PR");
    expect(callArgs.channel).toBe("test-channel");
    expect(callArgs.thread_ts).toBe("1234567890.123456");
    expect(mockReactionsAdd).toHaveBeenCalledWith(
      expect.objectContaining({ name: "white_check_mark" }),
    );
  });

  it("posts changes_requested message with review body and octagonal_sign reaction", async () => {
    mockGithub.context.payload.review.state = "changes_requested";
    mockGithub.context.payload.review.body = "Please fix the tests";

    await handlePullRequestReview();

    const callArgs = mockPostMessage.mock.calls[0][0] as any;
    expect(callArgs.text).toContain("would like you to change some things");
    expect(callArgs.text).toContain("Please fix the tests");
    expect(mockReactionsAdd).toHaveBeenCalledWith(
      expect.objectContaining({ name: "octagonal_sign" }),
    );
  });

  it("posts commented message with fetched inline comments and speech_balloon reaction", async () => {
    mockGithub.context.payload.review.state = "commented";
    mockGithub.context.payload.review.body = "Overall looks good";
    mockListCommentsForReview.mockResolvedValue({
      data: [
        {
          body: "Nit: rename this var",
          html_url: "https://github.com/comment/1",
        },
      ],
    });

    await handlePullRequestReview();

    const callArgs = mockPostMessage.mock.calls[0][0] as any;
    expect(callArgs.text).toContain("Overall looks good");
    expect(callArgs.text).toContain("Nit: rename this var");
    expect(mockReactionsAdd).toHaveBeenCalledWith(
      expect.objectContaining({ name: "speech_balloon" }),
    );
  });

  it('uses singular "a comment" for single comment', async () => {
    mockGithub.context.payload.review.state = "commented";
    mockGithub.context.payload.review.body = "";
    mockListCommentsForReview.mockResolvedValue({
      data: [{ body: "Fix this", html_url: "https://github.com/comment/1" }],
    });

    await handlePullRequestReview();

    const callArgs = mockPostMessage.mock.calls[0][0] as any;
    expect(callArgs.text).toContain("added a comment:");
  });

  it('uses plural "N comments" for multiple comments', async () => {
    mockGithub.context.payload.review.state = "commented";
    mockGithub.context.payload.review.body = "Top-level comment";
    mockListCommentsForReview.mockResolvedValue({
      data: [
        { body: "Inline 1", html_url: "https://github.com/comment/1" },
        { body: "Inline 2", html_url: "https://github.com/comment/2" },
      ],
    });

    await handlePullRequestReview();

    const callArgs = mockPostMessage.mock.calls[0][0] as any;
    expect(callArgs.text).toContain("added 3 comments:");
  });

  it("includes links to each comment", async () => {
    mockGithub.context.payload.review.state = "commented";
    mockGithub.context.payload.review.body = "";
    mockListCommentsForReview.mockResolvedValue({
      data: [
        { body: "Comment A", html_url: "https://github.com/comment/a" },
        { body: "Comment B", html_url: "https://github.com/comment/b" },
      ],
    });

    await handlePullRequestReview();

    const callArgs = mockPostMessage.mock.calls[0][0] as any;
    expect(callArgs.text).toContain("https://github.com/comment/a");
    expect(callArgs.text).toContain("https://github.com/comment/b");
    expect(callArgs.text).toContain(":link:");
  });

  it("skips non-submitted actions", async () => {
    mockGithub.context.payload.action = "dismissed";

    await handlePullRequestReview();

    expect(mockPostMessage).not.toHaveBeenCalled();
    expect(mockReactionsAdd).not.toHaveBeenCalled();
  });

  it("skips when no slack message ID", async () => {
    mockGetSlackMessageId.mockResolvedValue(undefined as any);

    await handlePullRequestReview();

    expect(mockPostMessage).not.toHaveBeenCalled();
    expect(mockCore.warning).toHaveBeenCalledWith(
      expect.stringContaining("no Slack message ID"),
    );
  });

  it("throws when reviewer not found in S3 mapping", async () => {
    mockGithub.context.payload.review.user.login = "unknown-reviewer";

    await expect(handlePullRequestReview()).rejects.toThrow(
      "Could not map unknown-reviewer to the users you provided in action.yml",
    );
    expect(mockFail).toHaveBeenCalled();
  });

  it("throws when author not found in S3 mapping", async () => {
    mockGetEngineersFromS3.mockResolvedValue({
      engineers: [{ github_username: "reviewer1", slack_id: "UREV1" }],
    } as any);
    mockGithub.context.payload.pull_request.user.login = "unknown-author";

    await expect(handlePullRequestReview()).rejects.toThrow(
      "Could not map unknown-author to the users you provided in action.yml",
    );
    expect(mockFail).toHaveBeenCalled();
  });

  it("skips adding reaction if already present", async () => {
    mockGithub.context.payload.review.state = "approved";
    mockReactionsGet.mockResolvedValue({
      message: {
        reactions: [{ name: "white_check_mark" }],
      },
    } as any);

    await handlePullRequestReview();

    expect(mockReactionsAdd).not.toHaveBeenCalled();
  });
});

import * as core from "@actions/core";
import * as github from "@actions/github";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { fail } from "./fail";
import { getPullRequest } from "./getPullRequest";
import { getSlackMessageId } from "./getSlackMessageId";
import { logger } from "./logger";

vi.mock("@actions/core");
vi.mock("@actions/github");
vi.mock("./fail");
vi.mock("./logger");
vi.mock("./getPullRequest");

const mockListComments = vi.fn();
const mockOctokit = { rest: { issues: { listComments: mockListComments } } };

const mockCore = vi.mocked(core);
const mockGithub = vi.mocked(github);
const mockFail = vi.mocked(fail);
const mockLogger = vi.mocked(logger);
const mockGetPullRequest = vi.mocked(getPullRequest);

describe("getSlackMessageId", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCore.getInput.mockReturnValue("fake-token");
    mockGithub.getOctokit.mockReturnValue(mockOctokit as any);

    Object.defineProperty(mockGithub, "context", {
      value: {
        eventName: "pull_request",
        payload: {
          pull_request: { number: 42 },
          repository: { owner: { login: "test-owner" }, name: "test-repo" },
        },
      },
      writable: true,
      configurable: true,
    });
  });

  it("returns slack message ID from PR comment matching SLACK_MESSAGE_ID pattern", async () => {
    mockListComments.mockResolvedValue({
      data: [
        { body: "Some random comment" },
        { body: "SLACK_MESSAGE_ID:1234567890.123456" },
      ],
    });

    const result = await getSlackMessageId();

    expect(result).toBe("SLACK_MESSAGE_ID:1234567890.123456");
    expect(mockListComments).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 42,
    });
  });

  it("returns null when no matching comment found", async () => {
    mockListComments.mockResolvedValue({
      data: [
        { body: "Just a regular comment" },
        { body: "Another comment without the ID" },
      ],
    });

    const result = await getSlackMessageId();

    expect(result).toBeNull();
    expect(mockLogger.info).toHaveBeenCalledWith(
      "No SLACK_MESSAGE_ID found in PR #42 comments",
    );
  });

  it("uses getPullRequest when event is push and no pull_request on payload", async () => {
    Object.defineProperty(mockGithub, "context", {
      value: {
        eventName: "push",
        payload: {
          repository: { owner: { login: "test-owner" }, name: "test-repo" },
        },
      },
      writable: true,
      configurable: true,
    });

    mockGetPullRequest.mockResolvedValue({ number: 99 } as any);
    mockListComments.mockResolvedValue({
      data: [{ body: "SLACK_MESSAGE_ID:9999999999.999999" }],
    });

    const result = await getSlackMessageId();

    expect(mockGetPullRequest).toHaveBeenCalled();
    expect(result).toBe("SLACK_MESSAGE_ID:9999999999.999999");
    expect(mockListComments).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      issue_number: 99,
    });
  });

  it("throws when no pull_request available", async () => {
    Object.defineProperty(mockGithub, "context", {
      value: {
        eventName: "pull_request",
        payload: {
          repository: { owner: { login: "test-owner" }, name: "test-repo" },
        },
      },
      writable: true,
      configurable: true,
    });

    await expect(getSlackMessageId()).rejects.toThrow(
      "No pull_request key on github.context.payload in getSlackMessageId",
    );
    expect(mockFail).toHaveBeenCalled();
  });

  it("throws when no repository on payload", async () => {
    Object.defineProperty(mockGithub, "context", {
      value: {
        eventName: "pull_request",
        payload: {
          pull_request: { number: 42 },
        },
      },
      writable: true,
      configurable: true,
    });

    await expect(getSlackMessageId()).rejects.toThrow(
      "No repository key on github.context.payload in getSlackMessageId",
    );
    expect(mockFail).toHaveBeenCalled();
  });

  it("returns the last matching ID when multiple comments match", async () => {
    mockListComments.mockResolvedValue({
      data: [
        { body: "SLACK_MESSAGE_ID:1111111111.111111" },
        { body: "SLACK_MESSAGE_ID:2222222222.222222" },
        { body: "SLACK_MESSAGE_ID:3333333333.333333" },
      ],
    });

    const result = await getSlackMessageId();

    expect(result).toBe("SLACK_MESSAGE_ID:3333333333.333333");
  });
});

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as core from "@actions/core";
import * as github from "@actions/github";
import { fail } from "./fail";
import { logger } from "./logger";
import { getPullRequest } from "./getPullRequest";

vi.mock("@actions/core");
vi.mock("@actions/github");
vi.mock("./fail");
vi.mock("./logger");

const mockPullsGet = vi.fn();
const mockListPRsForCommit = vi.fn();
const mockOctokit = {
  rest: {
    pulls: { get: mockPullsGet },
    repos: { listPullRequestsAssociatedWithCommit: mockListPRsForCommit },
  },
};

const mockCore = vi.mocked(core);
const mockGithub = vi.mocked(github);
const mockFail = vi.mocked(fail);
const mockLogger = vi.mocked(logger);

describe("getPullRequest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCore.getInput.mockReturnValue("fake-token");
    mockGithub.getOctokit.mockReturnValue(mockOctokit as any);
  });

  it("returns PR data from pulls.get when pull_request is on context", async () => {
    const prData = { number: 42, title: "Test PR", state: "open" };
    Object.defineProperty(mockGithub, "context", {
      value: {
        payload: {
          pull_request: { number: 42, title: "Test PR", state: "open" },
          repository: { owner: { login: "test-owner" }, name: "test-repo" },
        },
      },
      writable: true,
      configurable: true,
    });

    mockPullsGet.mockResolvedValue({ data: prData });

    const result = await getPullRequest();

    expect(result).toEqual(prData);
    expect(mockPullsGet).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      pull_number: 42,
    });
    expect(mockLogger.info).toHaveBeenCalledWith(
      'PR from context: #42 "Test PR" (open)'
    );
  });

  it("finds PR via listPullRequestsAssociatedWithCommit when only commits available", async () => {
    const prData = { number: 10, title: "Commit PR", state: "open" };
    Object.defineProperty(mockGithub, "context", {
      value: {
        payload: {
          commits: [{ id: "abc123" }],
          repository: { owner: { login: "test-owner" }, name: "test-repo" },
        },
      },
      writable: true,
      configurable: true,
    });

    mockListPRsForCommit.mockResolvedValue({ data: [prData] });

    const result = await getPullRequest();

    expect(result).toEqual(prData);
    expect(mockListPRsForCommit).toHaveBeenCalledWith({
      owner: "test-owner",
      repo: "test-repo",
      commit_sha: "abc123",
    });
    expect(mockLogger.info).toHaveBeenCalledWith(
      'PR from commit: #10 "Commit PR" (open)'
    );
  });

  it("throws when no commits and no pull_request", async () => {
    Object.defineProperty(mockGithub, "context", {
      value: {
        payload: {
          repository: { owner: { login: "test-owner" }, name: "test-repo" },
        },
      },
      writable: true,
      configurable: true,
    });

    await expect(getPullRequest()).rejects.toThrow("No commits found");
    expect(mockFail).toHaveBeenCalled();
  });

  it("throws when no repository on payload (commit path)", async () => {
    Object.defineProperty(mockGithub, "context", {
      value: {
        payload: {
          commits: [{ id: "abc123" }],
        },
      },
      writable: true,
      configurable: true,
    });

    await expect(getPullRequest()).rejects.toThrow(
      "No repository found in github.context.payload"
    );
    expect(mockFail).toHaveBeenCalled();
  });

  it("throws when no PR found for commit", async () => {
    Object.defineProperty(mockGithub, "context", {
      value: {
        payload: {
          commits: [{ id: "deadbeef" }],
          repository: { owner: { login: "test-owner" }, name: "test-repo" },
        },
      },
      writable: true,
      configurable: true,
    });

    mockListPRsForCommit.mockResolvedValue({ data: [] });

    await expect(getPullRequest()).rejects.toThrow(
      "No pull_request found for commit: deadbeef"
    );
    expect(mockFail).toHaveBeenCalled();
  });

  it("uses repository.owner.login for the owner parameter", async () => {
    Object.defineProperty(mockGithub, "context", {
      value: {
        payload: {
          pull_request: { number: 7, title: "Login PR", state: "open" },
          repository: {
            owner: { login: "correct-login", name: "should-not-use-this" },
            name: "test-repo",
          },
        },
      },
      writable: true,
      configurable: true,
    });

    mockPullsGet.mockResolvedValue({
      data: { number: 7, title: "Login PR", state: "open" },
    });

    await getPullRequest();

    expect(mockPullsGet).toHaveBeenCalledWith(
      expect.objectContaining({ owner: "correct-login" })
    );
  });
});

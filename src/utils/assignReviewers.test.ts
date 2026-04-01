import * as core from "@actions/core";
import * as github from "@actions/github";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { assignCodeownersAsReviewers } from "./assignReviewers";
import { getTeamMembers } from "./expandTeamMembers";
import { logger } from "./logger";
import { parseCodeowners } from "./parseCodeowners";

vi.mock("@actions/core");
vi.mock("@actions/github");
vi.mock("./logger");
vi.mock("./parseCodeowners");
vi.mock("./expandTeamMembers");

const mockRequestReviewers = vi.fn();
const mockListRequestedReviewers = vi.fn();
const mockListComments = vi.fn();
const mockCreateComment = vi.fn();

const mockOctokit = {
  rest: {
    pulls: {
      requestReviewers: mockRequestReviewers,
      listRequestedReviewers: mockListRequestedReviewers,
    },
    issues: {
      listComments: mockListComments,
      createComment: mockCreateComment,
    },
  },
};

const mockCore = vi.mocked(core);
const mockGithub = vi.mocked(github);
const mockParseCodeowners = vi.mocked(parseCodeowners);
const mockGetTeamMembers = vi.mocked(getTeamMembers);

const pull_request = {
  number: 42,
  user: { login: "author" },
  base: { ref: "main" },
};

const repository = {
  name: "test-repo",
  owner: { login: "test-org" },
};

describe("assignCodeownersAsReviewers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCore.getInput.mockReturnValue("fake-token");
    mockGithub.getOctokit.mockReturnValue(mockOctokit as any);
    mockListComments.mockResolvedValue({ data: [] });
    mockCreateComment.mockResolvedValue({});
  });

  it("successfully assigns users from CODEOWNERS", async () => {
    mockParseCodeowners.mockResolvedValue({
      users: ["alice", "bob"],
      teams: [],
      success: true,
    });

    mockRequestReviewers.mockResolvedValue({
      data: {
        requested_reviewers: [{ login: "alice" }, { login: "bob" }],
        requested_teams: [],
      },
    });

    const result = await assignCodeownersAsReviewers(pull_request, repository);

    expect(result.success).toBe(true);
    expect(result.assigned.users).toEqual(["alice", "bob"]);
    expect(result.errors).toEqual([]);
    expect(mockRequestReviewers).toHaveBeenCalledWith(
      expect.objectContaining({
        owner: "test-org",
        repo: "test-repo",
        pull_number: 42,
        reviewers: ["alice", "bob"],
      }),
    );
  });

  it("expands teams to individual members when expandTeams is true", async () => {
    mockParseCodeowners.mockResolvedValue({
      users: [],
      teams: ["test-org/frontend"],
      success: true,
    });

    mockGetTeamMembers.mockResolvedValue({
      users: ["alice", "bob"],
      errors: [],
    });

    mockRequestReviewers.mockResolvedValue({
      data: {
        requested_reviewers: [{ login: "alice" }, { login: "bob" }],
        requested_teams: [],
      },
    });

    const result = await assignCodeownersAsReviewers(
      pull_request,
      repository,
      true,
    );

    expect(result.success).toBe(true);
    expect(result.assigned.users).toEqual(["alice", "bob"]);
    expect(mockGetTeamMembers).toHaveBeenCalledWith(
      ["test-org/frontend"],
      "test-org",
    );
  });

  it("filters out PR author from reviewers", async () => {
    mockParseCodeowners.mockResolvedValue({
      users: ["alice", "author", "bob"],
      teams: [],
      success: true,
    });

    mockRequestReviewers.mockResolvedValue({
      data: {
        requested_reviewers: [{ login: "alice" }, { login: "bob" }],
        requested_teams: [],
      },
    });

    const result = await assignCodeownersAsReviewers(pull_request, repository);

    expect(result.success).toBe(true);
    expect(mockRequestReviewers).toHaveBeenCalledWith(
      expect.objectContaining({
        reviewers: ["alice", "bob"],
      }),
    );
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("Filtered out PR author"),
    );
  });

  it("returns success: false when parseCodeowners fails", async () => {
    mockParseCodeowners.mockResolvedValue({
      users: [],
      teams: [],
      success: false,
    });

    const result = await assignCodeownersAsReviewers(pull_request, repository);

    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      "No CODEOWNERS file found or parsing failed",
    );
    expect(mockRequestReviewers).not.toHaveBeenCalled();
  });

  it("returns success: false when only reviewer is the PR author", async () => {
    mockParseCodeowners.mockResolvedValue({
      users: ["author"],
      teams: [],
      success: true,
    });

    const result = await assignCodeownersAsReviewers(pull_request, repository);

    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      "No valid reviewers available after filtering out PR author",
    );
    expect(mockRequestReviewers).not.toHaveBeenCalled();
  });

  it("handles 422 error from requestReviewers", async () => {
    mockParseCodeowners.mockResolvedValue({
      users: ["alice"],
      teams: [],
      success: true,
    });

    mockRequestReviewers.mockRejectedValue({
      status: 422,
      message: "Validation Failed",
    });

    mockListRequestedReviewers.mockResolvedValue({
      data: { users: [], teams: [] },
    });

    const result = await assignCodeownersAsReviewers(pull_request, repository);

    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      "Some reviewers could not be assigned (may not have repository access or already be reviewers)",
    );
  });

  it("handles 403 error from requestReviewers", async () => {
    mockParseCodeowners.mockResolvedValue({
      users: ["alice"],
      teams: [],
      success: true,
    });

    mockRequestReviewers.mockRejectedValue({
      status: 403,
      message: "Forbidden",
    });

    mockListRequestedReviewers.mockResolvedValue({
      data: { users: [], teams: [] },
    });

    const result = await assignCodeownersAsReviewers(pull_request, repository);

    expect(result.success).toBe(false);
    expect(result.errors).toContain(
      "Insufficient permissions to assign reviewers",
    );
  });

  it("skips duplicate PR comment if one already exists", async () => {
    mockParseCodeowners.mockResolvedValue({
      users: ["alice"],
      teams: [],
      success: true,
    });

    mockRequestReviewers.mockResolvedValue({
      data: {
        requested_reviewers: [{ login: "alice" }],
        requested_teams: [],
      },
    });

    mockListComments.mockResolvedValue({
      data: [
        {
          body: "🤖 **Auto-assigned reviewers from CODEOWNERS**\n\nSome previous content",
        },
      ],
    });

    const result = await assignCodeownersAsReviewers(pull_request, repository);

    expect(result.success).toBe(true);
    expect(mockCreateComment).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      "Auto-assignment comment already exists, skipping duplicate",
    );
  });

  it("returns errors when team expansion fails", async () => {
    mockParseCodeowners.mockResolvedValue({
      users: ["alice"],
      teams: ["test-org/missing-team"],
      success: true,
    });

    mockGetTeamMembers.mockResolvedValue({
      users: [],
      errors: [
        "Could not get members for team test-org/missing-team: Not Found",
      ],
    });

    mockRequestReviewers.mockResolvedValue({
      data: {
        requested_reviewers: [{ login: "alice" }],
        requested_teams: [],
      },
    });

    const result = await assignCodeownersAsReviewers(
      pull_request,
      repository,
      true,
    );

    // Has assigned users but also has errors, so success is false
    expect(result.success).toBe(false);
    expect(result.assigned.users).toEqual(["alice"]);
    expect(result.errors).toContain(
      "Could not get members for team test-org/missing-team: Not Found",
    );
  });
});

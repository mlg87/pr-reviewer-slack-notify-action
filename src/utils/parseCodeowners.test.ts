import * as core from "@actions/core";
import * as github from "@actions/github";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { logger } from "./logger";
import { parseCodeowners } from "./parseCodeowners";

vi.mock("@actions/core");
vi.mock("@actions/github");
vi.mock("./logger");

const mockGetContent = vi.fn();
const mockOctokit = { rest: { repos: { getContent: mockGetContent } } };

const mockCore = vi.mocked(core);
const mockGithub = vi.mocked(github);

const repository = { name: "test-repo", owner: { login: "test-org" } };
const branch = "main";

const encodeContent = (content: string) =>
  Buffer.from(content).toString("base64");

describe("parseCodeowners", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCore.getInput.mockReturnValue("fake-token");
    mockGithub.getOctokit.mockReturnValue(mockOctokit as any);
  });

  it("parses individual users from CODEOWNERS", async () => {
    mockGetContent.mockResolvedValueOnce({
      data: { content: encodeContent("* @alice @bob\n") },
    });

    const result = await parseCodeowners(repository, branch);

    expect(result.success).toBe(true);
    expect(result.users).toEqual(["alice", "bob"]);
    expect(result.teams).toEqual([]);
  });

  it("parses team owners (org/team format)", async () => {
    mockGetContent.mockResolvedValueOnce({
      data: {
        content: encodeContent(
          "* @alice @myorg/frontend-team @myorg/backend-team\n",
        ),
      },
    });

    const result = await parseCodeowners(repository, branch);

    expect(result.success).toBe(true);
    expect(result.users).toEqual(["alice"]);
    expect(result.teams).toEqual(["myorg/frontend-team", "myorg/backend-team"]);
  });

  it("skips comment lines and empty lines", async () => {
    const content = [
      "# This is a comment",
      "",
      "  # Another comment",
      "* @alice",
      "",
      "src/ @bob",
    ].join("\n");

    mockGetContent.mockResolvedValueOnce({
      data: { content: encodeContent(content) },
    });

    const result = await parseCodeowners(repository, branch);

    expect(result.success).toBe(true);
    expect(result.users).toEqual(["alice", "bob"]);
  });

  it("tries all three possible paths (.github/CODEOWNERS, CODEOWNERS, docs/CODEOWNERS)", async () => {
    // First two paths 404, third succeeds
    mockGetContent
      .mockRejectedValueOnce({ status: 404 })
      .mockRejectedValueOnce({ status: 404 })
      .mockResolvedValueOnce({
        data: { content: encodeContent("* @charlie\n") },
      });

    const result = await parseCodeowners(repository, branch);

    expect(result.success).toBe(true);
    expect(result.users).toEqual(["charlie"]);
    expect(mockGetContent).toHaveBeenCalledTimes(3);
    expect(mockGetContent).toHaveBeenCalledWith(
      expect.objectContaining({ path: ".github/CODEOWNERS" }),
    );
    expect(mockGetContent).toHaveBeenCalledWith(
      expect.objectContaining({ path: "CODEOWNERS" }),
    );
    expect(mockGetContent).toHaveBeenCalledWith(
      expect.objectContaining({ path: "docs/CODEOWNERS" }),
    );
  });

  it("returns success: false when no CODEOWNERS found (all 404)", async () => {
    mockGetContent
      .mockRejectedValueOnce({ status: 404 })
      .mockRejectedValueOnce({ status: 404 })
      .mockRejectedValueOnce({ status: 404 });

    const result = await parseCodeowners(repository, branch);

    expect(result).toEqual({ users: [], teams: [], success: false });
  });

  it("returns success: false when CODEOWNERS has no valid owners", async () => {
    const content = ["# Only comments and bare paths", "src/", "docs/"].join(
      "\n",
    );

    mockGetContent.mockResolvedValueOnce({
      data: { content: encodeContent(content) },
    });

    const result = await parseCodeowners(repository, branch);

    expect(result).toEqual({ users: [], teams: [], success: false });
  });

  it("deduplicates users and teams", async () => {
    const content = [
      "* @alice @bob @myorg/team-a",
      "src/ @alice @bob @myorg/team-a",
      "docs/ @alice @myorg/team-a",
    ].join("\n");

    mockGetContent.mockResolvedValueOnce({
      data: { content: encodeContent(content) },
    });

    const result = await parseCodeowners(repository, branch);

    expect(result.success).toBe(true);
    expect(result.users).toEqual(["alice", "bob"]);
    expect(result.teams).toEqual(["myorg/team-a"]);
  });

  it("handles non-404 errors gracefully", async () => {
    mockGetContent
      .mockRejectedValueOnce({ status: 500, message: "Internal Server Error" })
      .mockRejectedValueOnce({ status: 404 })
      .mockRejectedValueOnce({ status: 404 });

    const result = await parseCodeowners(repository, branch);

    expect(result).toEqual({ users: [], teams: [], success: false });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining(
        "Error fetching CODEOWNERS from .github/CODEOWNERS",
      ),
    );
  });
});

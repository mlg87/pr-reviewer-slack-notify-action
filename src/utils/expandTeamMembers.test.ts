import * as core from "@actions/core";
import * as github from "@actions/github";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { getTeamMembers } from "./expandTeamMembers";
import { logger } from "./logger";

vi.mock("@actions/core");
vi.mock("@actions/github");
vi.mock("./logger");

const mockListMembersInOrg = vi.fn();
const mockOctokit = {
  rest: { teams: { listMembersInOrg: mockListMembersInOrg } },
};

const mockCore = vi.mocked(core);
const mockGithub = vi.mocked(github);

describe("getTeamMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCore.getInput.mockReturnValue("fake-token");
    mockGithub.getOctokit.mockReturnValue(mockOctokit as any);
  });

  it("returns team members for a simple team slug", async () => {
    mockListMembersInOrg.mockResolvedValueOnce({
      data: [{ login: "alice" }, { login: "bob" }],
    });

    const result = await getTeamMembers(["frontend"], "myorg");

    expect(result.users).toEqual(["alice", "bob"]);
    expect(result.errors).toEqual([]);
    expect(mockListMembersInOrg).toHaveBeenCalledWith({
      org: "myorg",
      team_slug: "frontend",
      per_page: 100,
    });
  });

  it("splits org/team-name format correctly", async () => {
    mockListMembersInOrg.mockResolvedValueOnce({
      data: [{ login: "charlie" }],
    });

    const result = await getTeamMembers(["other-org/backend"], "myorg");

    expect(result.users).toEqual(["charlie"]);
    expect(mockListMembersInOrg).toHaveBeenCalledWith({
      org: "other-org",
      team_slug: "backend",
      per_page: 100,
    });
  });

  it("uses provided org when team slug has no slash", async () => {
    mockListMembersInOrg.mockResolvedValueOnce({
      data: [{ login: "dave" }],
    });

    await getTeamMembers(["design"], "fallback-org");

    expect(mockListMembersInOrg).toHaveBeenCalledWith(
      expect.objectContaining({ org: "fallback-org", team_slug: "design" }),
    );
  });

  it("deduplicates members across teams", async () => {
    mockListMembersInOrg
      .mockResolvedValueOnce({
        data: [{ login: "alice" }, { login: "bob" }],
      })
      .mockResolvedValueOnce({
        data: [{ login: "bob" }, { login: "charlie" }],
      });

    const result = await getTeamMembers(
      ["myorg/team-a", "myorg/team-b"],
      "myorg",
    );

    expect(result.users).toEqual(["alice", "bob", "charlie"]);
    expect(result.errors).toEqual([]);
  });

  it("records error but continues when a team fetch fails", async () => {
    mockListMembersInOrg
      .mockRejectedValueOnce({ status: 404, message: "Not Found" })
      .mockResolvedValueOnce({
        data: [{ login: "alice" }],
      });

    const result = await getTeamMembers(
      ["myorg/missing-team", "myorg/good-team"],
      "myorg",
    );

    expect(result.users).toEqual(["alice"]);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toContain(
      "Could not get members for team myorg/missing-team",
    );
    expect(logger.error).toHaveBeenCalled();
  });

  it("returns empty users and errors for empty teams array", async () => {
    const result = await getTeamMembers([], "myorg");

    expect(result.users).toEqual([]);
    expect(result.errors).toEqual([]);
    expect(mockListMembersInOrg).not.toHaveBeenCalled();
  });
});

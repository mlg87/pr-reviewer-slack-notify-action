import * as core from "@actions/core";
import * as github from "@actions/github";
import { getRequestedReviewersAsIndividuals } from "./getRequestedReviewersAsIndividuals";
import { getPullRequest } from "./getPullRequest";

// Mock the dependencies
jest.mock("@actions/core");
jest.mock("@actions/github");
jest.mock("./getPullRequest");
jest.mock("./fail");
jest.mock("./logger");

const mockCore = core as jest.Mocked<typeof core>;
const mockGithub = github as jest.Mocked<typeof github>;
const mockGetPullRequest = getPullRequest as jest.MockedFunction<
  typeof getPullRequest
>;

// Mock octokit
const mockOctokit = {
  rest: {
    teams: {
      listMembersInOrg: jest.fn(),
    },
  },
};

describe("getRequestedReviewersAsIndividuals", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCore.getInput.mockReturnValue("fake-token");
    mockGithub.getOctokit.mockReturnValue(mockOctokit as any);
    Object.defineProperty(mockGithub, "context", {
      value: {
        payload: {
          repository: {
            owner: {
              login: "test-org",
            },
          },
        },
      },
      writable: true,
      configurable: true,
    });
  });

  describe("team reviewer processing", () => {
    it("should process team reviewers correctly with organization.login", async () => {
      const mockPR = {
        requested_reviewers: [{ login: "individual-reviewer" }],
        requested_teams: [
          {
            id: 123,
            slug: "test-team",
            organization: {
              login: "test-org",
            },
          },
        ],
      };

      mockGetPullRequest.mockResolvedValue(mockPR as any);
      mockOctokit.rest.teams.listMembersInOrg.mockResolvedValue({
        data: [{ login: "team-member1" }, { login: "team-member2" }],
      } as any);

      const result = await getRequestedReviewersAsIndividuals();

      expect(result).toEqual([
        "individual-reviewer",
        "team-member1",
        "team-member2",
      ]);
      expect(mockOctokit.rest.teams.listMembersInOrg).toHaveBeenCalledWith({
        org: "test-org",
        team_slug: "test-team",
      });
    });

    it("should extract org from html_url when organization.login is missing", async () => {
      const mockPR = {
        requested_reviewers: [],
        requested_teams: [
          {
            id: 123,
            slug: "test-team",
            html_url: "https://github.com/orgs/extracted-org/teams/test-team",
          },
        ],
      };

      mockGetPullRequest.mockResolvedValue(mockPR as any);
      mockOctokit.rest.teams.listMembersInOrg.mockResolvedValue({
        data: [{ login: "team-member1" }],
      } as any);

      const result = await getRequestedReviewersAsIndividuals();

      expect(result).toEqual(["team-member1"]);
      expect(mockOctokit.rest.teams.listMembersInOrg).toHaveBeenCalledWith({
        org: "extracted-org",
        team_slug: "test-team",
      });
    });

    it("should extract org from url when other methods fail", async () => {
      const mockPR = {
        requested_reviewers: [],
        requested_teams: [
          {
            id: 123,
            slug: "test-team",
            url: "https://api.github.com/orgs/url-extracted-org/teams/456",
          },
        ],
      };

      mockGetPullRequest.mockResolvedValue(mockPR as any);
      mockOctokit.rest.teams.listMembersInOrg.mockResolvedValue({
        data: [{ login: "team-member1" }],
      } as any);

      const result = await getRequestedReviewersAsIndividuals();

      expect(result).toEqual(["team-member1"]);
      expect(mockOctokit.rest.teams.listMembersInOrg).toHaveBeenCalledWith({
        org: "url-extracted-org",
        team_slug: "test-team",
      });
    });

    it("should fall back to repository owner when other org extraction methods fail", async () => {
      const mockPR = {
        requested_reviewers: [],
        requested_teams: [
          {
            id: 123,
            slug: "test-team",
            // No organization info, html_url, or url
          },
        ],
      };

      mockGetPullRequest.mockResolvedValue(mockPR as any);
      mockOctokit.rest.teams.listMembersInOrg.mockResolvedValue({
        data: [{ login: "team-member1" }],
      } as any);

      const result = await getRequestedReviewersAsIndividuals();

      expect(result).toEqual(["team-member1"]);
      expect(mockOctokit.rest.teams.listMembersInOrg).toHaveBeenCalledWith({
        org: "test-org", // Should use repository owner
        team_slug: "test-team",
      });
    });

    it("should skip teams with invalid data", async () => {
      const mockPR = {
        requested_reviewers: [],
        requested_teams: [
          {
            id: 0, // Invalid ID
            slug: "invalid-team",
            organization: { login: "test-org" },
          },
          {
            id: 123,
            slug: "", // Missing slug
            organization: { login: "test-org" },
          },
          {
            id: 456,
            slug: "valid-team",
            organization: { login: "test-org" },
          },
        ],
      };

      mockGetPullRequest.mockResolvedValue(mockPR as any);
      mockOctokit.rest.teams.listMembersInOrg.mockResolvedValue({
        data: [{ login: "team-member1" }],
      } as any);

      const result = await getRequestedReviewersAsIndividuals();

      expect(result).toEqual(["team-member1"]);
      expect(mockOctokit.rest.teams.listMembersInOrg).toHaveBeenCalledTimes(1);
      expect(mockOctokit.rest.teams.listMembersInOrg).toHaveBeenCalledWith({
        org: "test-org",
        team_slug: "valid-team",
      });
    });

    it("should continue processing other teams when one fails", async () => {
      const mockPR = {
        requested_reviewers: [],
        requested_teams: [
          {
            id: 123,
            slug: "failing-team",
            organization: { login: "test-org" },
          },
          {
            id: 456,
            slug: "working-team",
            organization: { login: "test-org" },
          },
        ],
      };

      mockGetPullRequest.mockResolvedValue(mockPR as any);
      mockOctokit.rest.teams.listMembersInOrg
        .mockRejectedValueOnce(new Error("Team not found"))
        .mockResolvedValueOnce({
          data: [{ login: "team-member1" }],
        } as any);

      const result = await getRequestedReviewersAsIndividuals();

      expect(result).toEqual(["team-member1"]);
      expect(mockOctokit.rest.teams.listMembersInOrg).toHaveBeenCalledTimes(2);
    });

    it("should handle teams with no organization info gracefully", async () => {
      const mockPR = {
        requested_reviewers: [],
        requested_teams: [
          {
            id: 123,
            slug: "test-team",
            // No organization, html_url, or url
          },
        ],
      };

      // Remove repository context to test when no fallback is available
      Object.defineProperty(mockGithub, "context", {
        value: {
          payload: {
            repository: undefined,
          },
        },
        writable: true,
        configurable: true,
      });

      mockGetPullRequest.mockResolvedValue(mockPR as any);

      const result = await getRequestedReviewersAsIndividuals();

      expect(result).toEqual([]);
      expect(mockOctokit.rest.teams.listMembersInOrg).not.toHaveBeenCalled();
    });
  });

  describe("individual reviewer processing", () => {
    it("should process individual reviewers correctly", async () => {
      const mockPR = {
        requested_reviewers: [{ login: "reviewer1" }, { login: "reviewer2" }],
        requested_teams: [],
      };

      mockGetPullRequest.mockResolvedValue(mockPR as any);

      const result = await getRequestedReviewersAsIndividuals();

      expect(result).toEqual(["reviewer1", "reviewer2"]);
      expect(mockOctokit.rest.teams.listMembersInOrg).not.toHaveBeenCalled();
    });

    it("should handle null/undefined requested_reviewers", async () => {
      const mockPR = {
        requested_reviewers: null,
        requested_teams: [],
      };

      mockGetPullRequest.mockResolvedValue(mockPR as any);

      const result = await getRequestedReviewersAsIndividuals();

      expect(result).toEqual([]);
    });
  });
});

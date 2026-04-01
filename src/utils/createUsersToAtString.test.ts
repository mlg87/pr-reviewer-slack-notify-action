import { describe, it, expect, beforeEach, vi } from "vitest";
import { createUsersToAtString } from "./createUsersToAtString";
import { fail } from "./fail";
import { getEngineersFromS3 } from "./getEngineersFromS3";

vi.mock("./fail");
vi.mock("./getEngineersFromS3");
vi.mock("./logger");

const mockFail = vi.mocked(fail);
const mockGetEngineersFromS3 = vi.mocked(getEngineersFromS3);

const mockEngineers = [
  { github_username: "alice", slack_id: "U111111" },
  { github_username: "bob", slack_id: "U222222" },
  { github_username: "charlie", slack_id: "U333333" },
];

describe("createUsersToAtString", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEngineersFromS3.mockResolvedValue({
      engineers: mockEngineers,
    } as any);
  });

  it("should map a single GitHub user to a Slack mention", async () => {
    const result = await createUsersToAtString(["alice"]);

    expect(result).toBe("<@U111111>");
  });

  it("should map multiple GitHub users to comma-separated Slack mentions", async () => {
    const result = await createUsersToAtString(["alice", "bob", "charlie"]);

    expect(result).toBe("<@U111111>, <@U222222>, <@U333333>");
  });

  it("should return empty string when no reviewers match", async () => {
    const result = await createUsersToAtString(["unknown-user"]);

    expect(result).toBe("");
  });

  it("should return empty string when reviewers array is empty", async () => {
    const result = await createUsersToAtString([]);

    expect(result).toBe("");
  });

  it("should call fail when getEngineersFromS3 throws", async () => {
    const error = new Error("S3 fetch failed");
    mockGetEngineersFromS3.mockRejectedValue(error);

    const result = await createUsersToAtString(["alice"]);

    expect(mockFail).toHaveBeenCalledWith(error);
    expect(result).toBe("");
  });
});

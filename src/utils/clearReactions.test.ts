import { describe, it, expect, beforeEach, vi } from "vitest";
import * as core from "@actions/core";
import { clearReactions } from "./clearReactions";
import { fail } from "./fail";
import { slackWebClient } from "./slackWebClient";

vi.mock("@actions/core");
vi.mock("./fail");
vi.mock("./logger");
vi.mock("./slackWebClient", () => ({
  slackWebClient: {
    reactions: {
      get: vi.fn(),
      remove: vi.fn(),
    },
  },
}));

const mockCore = vi.mocked(core);
const mockFail = vi.mocked(fail);
const mockReactions = vi.mocked(slackWebClient.reactions);

describe("clearReactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCore.getInput.mockReturnValue("test-channel");
  });

  it("should remove all existing reactions from a message", async () => {
    mockReactions.get.mockResolvedValue({
      ok: true,
      type: "message",
      message: {
        reactions: [
          { name: "eyes", count: 1, users: [] },
          { name: "thumbsup", count: 1, users: [] },
          { name: "rocket", count: 1, users: [] },
        ],
      },
    } as any);
    mockReactions.remove.mockResolvedValue({ ok: true } as any);

    await clearReactions("1234567890.123456");

    expect(mockReactions.remove).toHaveBeenCalledTimes(3);
    expect(mockReactions.remove).toHaveBeenCalledWith({
      channel: "test-channel",
      timestamp: "1234567890.123456",
      name: "eyes",
    });
    expect(mockReactions.remove).toHaveBeenCalledWith({
      channel: "test-channel",
      timestamp: "1234567890.123456",
      name: "thumbsup",
    });
    expect(mockReactions.remove).toHaveBeenCalledWith({
      channel: "test-channel",
      timestamp: "1234567890.123456",
      name: "rocket",
    });
  });

  it("should do nothing when no reactions exist", async () => {
    mockReactions.get.mockResolvedValue({
      ok: true,
      type: "message",
      message: {},
    } as any);

    await clearReactions("1234567890.123456");

    expect(mockReactions.remove).not.toHaveBeenCalled();
  });

  it("should handle 'no_reaction' error gracefully", async () => {
    const noReactionError = {
      data: { error: "no_reaction" },
    };
    mockReactions.get.mockRejectedValue(noReactionError);

    await expect(clearReactions("1234567890.123456")).resolves.toBeUndefined();
    expect(mockFail).not.toHaveBeenCalled();
  });

  it("should throw and call fail for other errors", async () => {
    const otherError = new Error("some slack error");
    mockReactions.get.mockRejectedValue(otherError);

    await expect(clearReactions("1234567890.123456")).rejects.toThrow(
      "some slack error"
    );
    expect(mockFail).toHaveBeenCalledWith(otherError);
  });

  it("should call reactions.remove for each reaction", async () => {
    mockReactions.get.mockResolvedValue({
      ok: true,
      type: "message",
      message: {
        reactions: [
          { name: "white_check_mark", count: 2, users: [] },
          { name: "x", count: 1, users: [] },
        ],
      },
    } as any);
    mockReactions.remove.mockResolvedValue({ ok: true } as any);

    await clearReactions("ts-value");

    expect(mockReactions.remove).toHaveBeenCalledTimes(2);
    expect(mockReactions.remove).toHaveBeenNthCalledWith(1, {
      channel: "test-channel",
      timestamp: "ts-value",
      name: "white_check_mark",
    });
    expect(mockReactions.remove).toHaveBeenNthCalledWith(2, {
      channel: "test-channel",
      timestamp: "ts-value",
      name: "x",
    });
  });
});

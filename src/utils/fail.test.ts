import { describe, it, expect, beforeEach, vi } from "vitest";
import * as core from "@actions/core";
import { fail } from "./fail";
import { logger } from "./logger";

vi.mock("@actions/core");
vi.mock("./logger");

const mockCore = vi.mocked(core);
const mockLogger = vi.mocked(logger);

describe("fail", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call logger.error and core.error with error.message", () => {
    mockCore.getInput.mockReturnValue("false");
    const error = new Error("something went wrong");

    fail(error);

    expect(mockLogger.error).toHaveBeenCalledWith("something went wrong");
    expect(mockCore.error).toHaveBeenCalledWith("something went wrong");
  });

  it("should call core.warning instead of core.setFailed when fail-silently is 'true'", () => {
    mockCore.getInput.mockReturnValue("true");
    const error = new Error("silent failure");

    fail(error);

    expect(mockCore.warning).toHaveBeenCalledWith("silent failure");
    expect(mockCore.setFailed).not.toHaveBeenCalled();
  });

  it("should call core.setFailed when fail-silently is not 'true'", () => {
    mockCore.getInput.mockReturnValue("false");
    const error = new Error("loud failure");

    fail(error);

    expect(mockCore.setFailed).toHaveBeenCalledWith("loud failure");
    expect(mockCore.warning).not.toHaveBeenCalled();
  });

  it("should handle string errors (no .message property)", () => {
    mockCore.getInput.mockReturnValue("false");

    fail("a string error");

    expect(mockLogger.error).toHaveBeenCalledWith("a string error");
    expect(mockCore.error).toHaveBeenCalledWith("a string error");
    expect(mockCore.setFailed).toHaveBeenCalledWith("a string error");
  });

  it("should fall back to 'Oops' for null/undefined errors", () => {
    mockCore.getInput.mockReturnValue("false");

    fail(null);

    expect(mockLogger.error).toHaveBeenCalledWith("Oops");
    expect(mockCore.error).toHaveBeenCalledWith("Oops");
    expect(mockCore.setFailed).toHaveBeenCalledWith("Oops");

    vi.clearAllMocks();
    mockCore.getInput.mockReturnValue("false");

    fail(undefined);

    expect(mockLogger.error).toHaveBeenCalledWith("Oops");
    expect(mockCore.error).toHaveBeenCalledWith("Oops");
    expect(mockCore.setFailed).toHaveBeenCalledWith("Oops");
  });
});

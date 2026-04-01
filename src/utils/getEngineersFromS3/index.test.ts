import { EventEmitter } from "events";

import * as core from "@actions/core";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { fail } from "../fail";
import { logger } from "../logger";

vi.mock("@actions/core");
vi.mock("../fail");
vi.mock("../logger");

const mockSend = vi.fn();

vi.mock("@aws-sdk/client-s3", () => {
  return {
    S3Client: class MockS3Client {
      send = mockSend;
    },
    GetObjectCommand: class MockGetObjectCommand {
      constructor(public input: any) {}
    },
  };
});

import { getEngineersFromS3 } from "./index";

const mockCore = vi.mocked(core);
const mockFail = vi.mocked(fail);
const mockLogger = vi.mocked(logger);

describe("getEngineersFromS3", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCore.getInput.mockImplementation((name: string) => {
      const inputs: Record<string, string> = {
        "aws-s3-bucket": "test-bucket",
        "aws-s3-object-key": "test-key.json",
        "aws-region": "us-east-1",
      };
      return inputs[name] || "";
    });
  });

  it("successfully fetches and parses engineer data from S3", async () => {
    const engineerData = {
      engineers: [
        { github_username: "user1", slack_id: "U123" },
        { github_username: "user2", slack_id: "U456" },
      ],
    };

    const body = new EventEmitter();
    mockSend.mockResolvedValue({ Body: body });

    const promise = getEngineersFromS3();

    await vi.waitFor(() => expect(mockSend).toHaveBeenCalled());

    body.emit("data", JSON.stringify(engineerData));
    body.emit("end");

    const result = await promise;

    expect(result).toEqual(engineerData);
    expect(mockLogger.info).toHaveBeenCalledWith("START getEngineersFromS3");
  });

  it("throws when required AWS inputs are missing", async () => {
    mockCore.getInput.mockReturnValue("");

    await expect(getEngineersFromS3()).rejects.toThrow(
      "Missing required inputs for AWS",
    );
  });

  it("calls fail and rejects when S3 client.send throws", async () => {
    const error = new Error("S3 access denied");
    mockSend.mockRejectedValue(error);

    await expect(getEngineersFromS3()).rejects.toThrow("S3 access denied");
    expect(mockFail).toHaveBeenCalledWith(error);
  });

  it("handles stream error event", async () => {
    const body = new EventEmitter();
    mockSend.mockResolvedValue({ Body: body });

    const promise = getEngineersFromS3();

    await vi.waitFor(() => expect(mockSend).toHaveBeenCalled());

    const streamError = new Error("Stream failed");
    body.emit("error", streamError);

    await expect(promise).rejects.toThrow("Stream failed");
  });
});

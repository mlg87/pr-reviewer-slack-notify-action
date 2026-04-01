import { describe, it, expect, beforeEach, vi } from "vitest";
import * as core from "@actions/core";
import * as github from "@actions/github";

vi.mock("@actions/core");
vi.mock("@actions/github");
vi.mock("./actions/handleLabelChange");
vi.mock("./utils/getSlackMessageId");
vi.mock("./actions/handleMerge");
vi.mock("./actions/handleCommitPush");
vi.mock("./actions/handlePullRequestReview");
vi.mock("./utils/assignReviewers");
vi.mock("./utils/getPullRequest");
vi.mock("./utils/logger");

const mockCore = vi.mocked(core);

const basePullRequest = {
  number: 42,
  title: "Test PR",
  draft: false,
  labels: [] as any[],
  user: { login: "author" },
};

const baseRepository = {
  owner: { login: "org" },
  name: "repo",
};

function setupContext(overrides: Record<string, any>) {
  Object.defineProperty(github, "context", {
    value: {
      eventName: overrides.eventName ?? "pull_request",
      payload: {
        action: overrides.action ?? "opened",
        pull_request: overrides.pull_request ?? { ...basePullRequest },
        repository: overrides.repository ?? { ...baseRepository },
        ...overrides.extraPayload,
      },
      ref: overrides.ref ?? "refs/heads/feature-branch",
    },
    writable: true,
    configurable: true,
  });
}

describe("index run()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();

    mockCore.getInput.mockImplementation((name: string) => {
      if (name === "base-branch") return "main";
      if (name === "ignore-draft-prs") return "";
      if (name === "silence-on-quiet-label") return "";
      if (name === "label-for-initial-notification") return "needs-review";
      return "";
    });
    mockCore.summary = {
      addRaw: vi.fn().mockReturnThis(),
      write: vi.fn().mockResolvedValue(undefined),
    } as any;
  });

  it("routes PR opened to reviewer assignment", async () => {
    setupContext({ eventName: "pull_request", action: "opened" });

    const { assignCodeownersAsReviewers } = await import(
      "./utils/assignReviewers"
    );
    vi.mocked(assignCodeownersAsReviewers).mockResolvedValue({
      success: true,
      assigned: { users: ["reviewer1"], teams: [] },
      errors: [],
    } as any);

    await import("./index");
    // Allow the run() promise to resolve
    await new Promise((r) => setTimeout(r, 0));

    expect(assignCodeownersAsReviewers).toHaveBeenCalled();
  });

  it("routes PR ready_for_review to reviewer assignment", async () => {
    setupContext({ eventName: "pull_request", action: "ready_for_review" });

    const { assignCodeownersAsReviewers } = await import(
      "./utils/assignReviewers"
    );
    vi.mocked(assignCodeownersAsReviewers).mockResolvedValue({
      success: true,
      assigned: { users: ["reviewer1"], teams: [] },
      errors: [],
    } as any);

    await import("./index");
    await new Promise((r) => setTimeout(r, 0));

    expect(assignCodeownersAsReviewers).toHaveBeenCalled();
  });

  it("routes PR labeled to handleLabelChange", async () => {
    setupContext({ eventName: "pull_request", action: "labeled" });

    const { handleLabelChange } = await import("./actions/handleLabelChange");
    vi.mocked(handleLabelChange).mockResolvedValue(undefined);

    await import("./index");
    await new Promise((r) => setTimeout(r, 0));

    expect(handleLabelChange).toHaveBeenCalled();
  });

  it("routes push to feature branch to handleCommitPush", async () => {
    setupContext({
      eventName: "push",
      action: undefined,
      pull_request: undefined,
      ref: "refs/heads/feature-branch",
    });

    const { getSlackMessageId } = await import("./utils/getSlackMessageId");
    const { handleCommitPush } = await import("./actions/handleCommitPush");
    vi.mocked(getSlackMessageId).mockResolvedValue("1234567890.123456");
    vi.mocked(handleCommitPush).mockResolvedValue(undefined);

    await import("./index");
    await new Promise((r) => setTimeout(r, 0));

    expect(handleCommitPush).toHaveBeenCalled();
  });

  it("routes push to base branch to handleMerge", async () => {
    setupContext({
      eventName: "push",
      action: undefined,
      pull_request: undefined,
      ref: "refs/heads/main",
    });

    const { getSlackMessageId } = await import("./utils/getSlackMessageId");
    const { handleMerge } = await import("./actions/handleMerge");
    vi.mocked(getSlackMessageId).mockResolvedValue("1234567890.123456");
    vi.mocked(handleMerge).mockResolvedValue(undefined);

    await import("./index");
    await new Promise((r) => setTimeout(r, 0));

    expect(handleMerge).toHaveBeenCalled();
  });

  it("routes pull_request_review submitted to handlePullRequestReview", async () => {
    setupContext({
      eventName: "pull_request_review",
      action: "submitted",
      ref: "refs/heads/feature-branch",
    });

    const { getSlackMessageId } = await import("./utils/getSlackMessageId");
    const { handlePullRequestReview } = await import(
      "./actions/handlePullRequestReview"
    );
    vi.mocked(getSlackMessageId).mockResolvedValue("1234567890.123456");
    vi.mocked(handlePullRequestReview).mockResolvedValue(undefined);

    await import("./index");
    await new Promise((r) => setTimeout(r, 0));

    expect(handlePullRequestReview).toHaveBeenCalled();
  });

  it("routes pull_request_review dismissed to handleCommitPush", async () => {
    setupContext({
      eventName: "pull_request_review",
      action: "dismissed",
      ref: "refs/heads/feature-branch",
    });

    const { getSlackMessageId } = await import("./utils/getSlackMessageId");
    const { handleCommitPush } = await import("./actions/handleCommitPush");
    vi.mocked(getSlackMessageId).mockResolvedValue("1234567890.123456");
    vi.mocked(handleCommitPush).mockResolvedValue(undefined);

    await import("./index");
    await new Promise((r) => setTimeout(r, 0));

    expect(handleCommitPush).toHaveBeenCalled();
  });

  it("skips draft PRs when ignore-draft-prs is set", async () => {
    mockCore.getInput.mockImplementation((name: string) => {
      if (name === "base-branch") return "main";
      if (name === "ignore-draft-prs") return "true";
      if (name === "silence-on-quiet-label") return "";
      return "";
    });

    setupContext({
      eventName: "pull_request",
      action: "labeled",
      pull_request: { ...basePullRequest, draft: true },
    });

    const { handleLabelChange } = await import("./actions/handleLabelChange");

    await import("./index");
    await new Promise((r) => setTimeout(r, 0));

    expect(handleLabelChange).not.toHaveBeenCalled();
  });

  it("skips when quiet label present and silence-on-quiet-label is set", async () => {
    mockCore.getInput.mockImplementation((name: string) => {
      if (name === "base-branch") return "main";
      if (name === "ignore-draft-prs") return "";
      if (name === "silence-on-quiet-label") return "true";
      return "";
    });

    setupContext({
      eventName: "pull_request",
      action: "labeled",
      pull_request: {
        ...basePullRequest,
        labels: [{ name: "quiet" }],
      },
    });

    const { handleLabelChange } = await import("./actions/handleLabelChange");

    await import("./index");
    await new Promise((r) => setTimeout(r, 0));

    expect(handleLabelChange).not.toHaveBeenCalled();
  });

  it("skips push/review when no slack message ID", async () => {
    setupContext({
      eventName: "push",
      action: undefined,
      pull_request: undefined,
      ref: "refs/heads/feature-branch",
    });

    const { getSlackMessageId } = await import("./utils/getSlackMessageId");
    const { handleCommitPush } = await import("./actions/handleCommitPush");
    vi.mocked(getSlackMessageId).mockResolvedValue(undefined as any);

    await import("./index");
    await new Promise((r) => setTimeout(r, 0));

    expect(handleCommitPush).not.toHaveBeenCalled();
    expect(mockCore.warning).toHaveBeenCalledWith(
      expect.stringContaining("No Slack message found")
    );
  });
});

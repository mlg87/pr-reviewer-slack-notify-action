import * as core from "@actions/core";
import { logger } from "./logger";

export const fail = (error: any) => {
  const failSilently = core.getInput("fail-silently");
  const message = error?.message ?? error ?? "Oops";
  logger.error(message);
  core.error(message);
  if (failSilently === "true") {
    core.warning(message);
  } else {
    core.setFailed(message);
  }
};

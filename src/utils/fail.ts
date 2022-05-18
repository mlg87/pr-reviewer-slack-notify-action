import * as core from "@actions/core";
import { logger } from "./logger";

export const fail = (error: any) => {
  const failSilently = core.getInput("fail-silently");
  logger.error(JSON.stringify(error))
  if (failSilently === "true") {
    core.warning(error.message ?? "Oops");
  } else {
    core.setFailed(error.message ?? "Oops");
  }
};

import core from "@actions/core";

export const fail = (error: any) => {
  const failSilently = core.getInput("fail-silently");
  if (failSilently === "true") {
    core.warning(error.message ?? "Oops");
  } else {
    core.setFailed(error.message ?? "Oops");
  }
};

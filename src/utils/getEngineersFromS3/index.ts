import * as core from "@actions/core";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";

import { fail } from "../fail";
import { logger } from "../logger";

import { EngineerGithubSlackMapping } from "./types";

export const getEngineersFromS3 = async (): Promise<{
  engineers: EngineerGithubSlackMapping[];
}> => {
  logger.info("START getEngineersFromS3");
  const Bucket = core.getInput("aws-s3-bucket");
  const Key = core.getInput("aws-s3-object-key");
  const region = core.getInput("aws-region");

  if (!Bucket || !Key || !region) {
    throw new Error("Missing required inputs for AWS");
  }

  const client = new S3Client({ region });
  const getObjectCommand = new GetObjectCommand({ Bucket, Key });

  try {
    const response = await client.send(getObjectCommand);
    const responseDataChunks: string[] = [];

    if (response && response.Body) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const body: any = response.Body;

      return new Promise((resolve, reject) => {
        body.once("error", (err: Error) => reject(err));
        body.on("data", (chunk: string) => responseDataChunks.push(chunk));
        body.once("end", () =>
          resolve(JSON.parse(responseDataChunks.join(""))),
        );
      });
    }

    throw new Error("No response body from S3");
  } catch (error) {
    fail(error);
    throw error;
  }
};

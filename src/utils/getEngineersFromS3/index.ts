import * as core from "@actions/core";
import { GetObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { fail } from "../fail";
import { EngineerGithubSlackMapping } from "./types";

export const getEngineersFromS3 = (): Promise<{
  engineers: EngineerGithubSlackMapping[];
}> => {
  return new Promise(async (resolve, reject) => {
    console.log("Running getEngineersFromS3");
    // required for this to work
    const Bucket = core.getInput("aws-s3-bucket");
    const Key = core.getInput("aws-s3-object-key");
    const region = core.getInput("aws-region");

    if (!Bucket || !Key || !region) {
      throw "Missing required inputs for AWS";
    }

    const client = new S3Client({ region });
    const getObjectCommand = new GetObjectCommand({
      Bucket,
      Key,
    });

    try {
      const response = await client.send(getObjectCommand);

      // Store all of data chunks returned from the response data stream
      // into an array then use Array#join() to use the returned contents as a String
      let responseDataChunks: string[] = [];

      if (response && response.Body) {
        const body: any = response.Body;

        // Handle an error while streaming the response body
        body.once("error", (err: Error) => reject(err));

        // Attach a 'data' listener to add the chunks of data to our array
        // Each chunk is a Buffer instance
        body.on("data", (chunk: string) => responseDataChunks.push(chunk));

        // Once the stream has no more data, join the chunks into a string and return the string
        body.once("end", () =>
          resolve(JSON.parse(responseDataChunks.join("")))
        );
      }
    } catch (error) {
      fail(error);
      // Handle the error or throw
      return reject(error);
    }
  });
};

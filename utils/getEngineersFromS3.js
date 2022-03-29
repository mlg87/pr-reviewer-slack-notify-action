const core = require("@actions/core");
const { GetObjectCommand, S3Client } = require("@aws-sdk/client-s3")

module.exports = () => {
  return new Promise(async (resolve, reject) => {
    // required for this to work
    const Bucket = core.getInput("aws-s3-bucket");
    const Key = core.getInput("aws-s3-object-key");
    const region = core.getInput("aws-region");
    
    if (!Bucket || !Key || !region) {
      throw 'Missing required inputs for AWS'
    }

    const client = new S3Client({ region });
    const getObjectCommand = new GetObjectCommand({
      Bucket,
      Key
    });

    try {
      const response = await client.send(getObjectCommand)
  
      // Store all of data chunks returned from the response data stream 
      // into an array then use Array#join() to use the returned contents as a String
      let responseDataChunks = [];

      if (response && response.Body) {

        // Handle an error while streaming the response body
        response.Body.once('error', err => reject(err));
    
        // Attach a 'data' listener to add the chunks of data to our array
        // Each chunk is a Buffer instance
        response.Body.on('data', chunk => responseDataChunks.push(chunk));
    
        // Once the stream has no more data, join the chunks into a string and return the string
        response.Body.once('end', () => resolve(JSON.parse(responseDataChunks.join(''))));
      }
    } catch (err) {
      // Handle the error or throw
      return reject(err)
    } 
  })
};

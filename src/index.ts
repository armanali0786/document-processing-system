import { env } from "./config/env";
import { app } from "./app";

app.listen(env.PORT, (error?: Error) => {
  // Express 5 calls this callback with an error if the server fails to start
  if (error) {
    console.error(`Failed to start server on port ${env.PORT}:`, error.message);
    process.exit(1);
  }

  console.log("---- ----------------------------");
  console.log("Document Processing System API");
  console.log("--------------------------------");
  console.log("Environment:   ", env.NODE_ENV);
  console.log("AWS Region:    ", env.AWS_REGION);
  console.log("S3 Bucket:     ", env.S3_BUCKET_NAME);
  console.log("DynamoDB Table:", env.DYNAMODB_TABLE_NAME);
  console.log(`Listening on http://localhost:${env.PORT}`);
});

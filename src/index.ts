import { env } from "./config/env";
import { app } from "./app";

app.listen(env.PORT, () => {
  console.log("--------------------------------");
  console.log("Document Processing System API");
  console.log("--------------------------------");
  console.log("Environment:   ", env.NODE_ENV);
  console.log("AWS Region:    ", env.AWS_REGION);
  console.log("S3 Bucket:     ", env.S3_BUCKET_NAME);
  console.log("DynamoDB Table:", env.DYNAMODB_TABLE_NAME);
  console.log(`Listening on http://localhost:${env.PORT}`);
});

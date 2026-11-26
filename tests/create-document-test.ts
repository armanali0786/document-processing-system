import "dotenv/config";

import { handler } from "../src/handlers/create-document";

async function testCreateDocument() {
  const event = {
    version: "2.0",
    routeKey: "POST /documents",
    rawPath: "/documents",
    rawQueryString: "",
    headers: {
      "content-type": "application/json",
    },
    requestContext: {
      accountId: "test",
      apiId: "test",
      domainName: "localhost",
      domainPrefix: "localhost",
      http: {
        method: "POST",
        path: "/documents",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "local-test",
      },
      requestId: "local-test",
      routeKey: "POST /documents",
      stage: "$default",
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
    },
    isBase64Encoded: false,
    body: JSON.stringify({
      fileName: "resume.pdf",
      contentType: "application/pdf",
    }),
  };

  const result = await handler(event as any, {} as any, () => {});

  console.log("Lambda response:");
  console.log(JSON.stringify(result, null, 2));
}

testCreateDocument();
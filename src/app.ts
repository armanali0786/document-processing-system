import express, { NextFunction, Request, Response } from "express";
import { documentsRouter } from "./routes/documents.routes";

export const app = express();

app.use(express.json()); // parse JSON request bodies

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/documents", documentsRouter);

// Unknown routes
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Any error thrown in a route ends up here (Express 5 catches async errors too)
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

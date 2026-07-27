import "dotenv/config";
import cors from "cors";
import express from "express";
import { registrationsRouter } from "./routes/registrations";
import { hackathonRouter } from "./routes/hackathon";
import { adminRouter } from "./routes/admin";

const app = express();
const port = Number(process.env.PORT) || 4000;

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/registrations", registrationsRouter);
app.use("/api/hackathon-submissions", hackathonRouter);
app.use("/api/admin", adminRouter);

// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error." });
});

app.listen(port, () => {
  console.log(`GATES API server listening on http://localhost:${port}`);
});

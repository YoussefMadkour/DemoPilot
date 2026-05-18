import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { generateRouter } from "./routes/generate.js";
import { scriptsRouter } from "./routes/scripts.js";
import { voicesRouter } from "./routes/voices.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = parseInt(process.env.PORT || "3002");

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Serve generated videos
app.use("/output", express.static(path.join(__dirname, "..", "output")));

// API routes
app.use("/api/generate", generateRouter);
app.use("/api/scripts", scriptsRouter);
app.use("/api/voices", voicesRouter);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "demopilot" });
});

app.listen(PORT, () => {
  console.log(`DemoPilot backend running on http://localhost:${PORT}`);
});

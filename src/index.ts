import { Hono } from "hono";
import arrangements from "./routes/arrangements.js";
import generate from "./routes/generate.js";
import prompts from "./routes/prompts.js";

const app = new Hono();

app.route("/generate", generate);
app.route("/prompts", prompts);
app.route("/arrangements", arrangements);

export default app;

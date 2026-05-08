import { Hono } from "hono";
import generate from "./routes/generate.js";
import prompt from "./routes/prompt.js";

const app = new Hono();

app.route("/generate", generate);
app.route("/prompt", prompt);

export default app;

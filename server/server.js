import express from "express";
import cors from "cors";

const app = express();
const PORT = 5000;

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Content-Length"],
  })
);

app.options("*", cors());

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.get("/download", (req, res) => {
  const sizeParam = req.query.size;
  const size = sizeParam ? parseInt(sizeParam) : 10 * 1024 * 1024;
  const buffer = Buffer.alloc(size, "x");
  res.set({
    "Content-Type": "application/octet-stream",
    "Content-Length": size,
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
  });
  res.send(buffer);
});

app.post(
  "/upload",
  express.raw({ type: "application/octet-stream", limit: "50mb" }),
  (req, res) => {
    const receivedLength = req.body.length;
    res.json({ received: receivedLength });
  }
);

app.listen(PORT, () => {
  console.log(`Speedtest server running on http://localhost:${PORT}`);
});

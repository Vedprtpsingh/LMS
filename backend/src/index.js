const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const courseRoutes = require("./routes/courseRoutes");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/courses", courseRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "course-module" });
});

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Course API listening on http://localhost:${port}`);
});

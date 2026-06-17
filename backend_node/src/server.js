import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import skillRoutes from "./routes/skillRoutes.js";
import employeeSkillRoutes from "./routes/employeeSkillRoutes.js";
import approvalRoutes from "./routes/approvalRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/skills", skillRoutes);
app.use("/api/employee-skills", employeeSkillRoutes);
app.use("/api/approvals", approvalRoutes);

app.get("/", (req, res) => {
  res.send("Skill Matrix API - Running");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

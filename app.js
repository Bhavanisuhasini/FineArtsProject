import express from "express";
import cors from "cors";
import categoryRoutes from "./src/routes/category.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Fine Arts Backend is running",
  });
});

app.use("/api/categories", categoryRoutes);

export default app;
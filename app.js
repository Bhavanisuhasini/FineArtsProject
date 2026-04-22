import express from "express";
import cors from "cors";
import routes from "./src/routes/index.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Main API entry
app.use("/api", routes);

export default app;
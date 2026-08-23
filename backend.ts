import "dotenv/config";
import express from "express";
import tmdbRoutes from "./seencFE/src/routes/tmdb.routes"
import userRoutes from "./seencFE/src/routes/user.routes"
import dataRoutes from "./seencFE/src/routes/data.routes"

const app = express();

app.use(express.json());

app.use("/api/tmdb", tmdbRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/user", userRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
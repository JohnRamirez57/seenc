import "dotenv/config";
import express from "express";
import tmdbRoutes from "./redis-react/src/routes/tmdb.routes";
import userRoutes from "./redis-react/src/routes/user.routes";
import mediaRoutes from "./redis-react/src/routes/media.routes";

const app = express();

app.use(express.json());

app.use("/api/tmdb", tmdbRoutes);
app.use("/api/media", mediaRoutes);
app.use("/api/user", userRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
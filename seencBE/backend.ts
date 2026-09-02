import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import tmdbRoutes from "../seencFE/src/routes/tmdb.routes.ts";
import userRoutes from "../seencFE/src/routes/user.routes.ts";
import dataRoutes from "../seencFE/src/routes/data.routes.ts";

/* 
Implement: 
!user_progress
!questions
!knowledges
!events
!character_appearances
*/

const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(cors({
  origin: process.env.LOCAL_HOST,
  credentials: true
}))

app.use("/api/tmdb", tmdbRoutes);
app.use("/api/data", dataRoutes);
app.use("/api/user", userRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
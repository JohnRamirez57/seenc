import { tmdbController } from "../controllers/tmdb.controller.ts";
import {
  validateQuery,
  searchQuerySchema,
  getCreditsSchema
} from "../../middleware/joiValidation.ts";
import express from 'express';
import tvRouter from "./tv.tmdb.routes.ts";

const tmbmRouter = express.Router({ mergeParams: true });

tmbmRouter.use("/tv", tvRouter)
tmbmRouter.get("/movie", validateQuery(searchQuerySchema), tmdbController.searchQuery)
tmbmRouter.get("/media", validateQuery(searchQuerySchema), tmdbController.searchQuery)
tmbmRouter.get("/credits", validateQuery(getCreditsSchema), tmdbController.getMovieCredits)

export default tmbmRouter;
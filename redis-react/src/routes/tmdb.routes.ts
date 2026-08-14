import { tmdbController } from "../controllers/tmdb.controller.ts";
import {
  validateQuery,
  searchQuerySchema,
  getCreditsSchema
} from "../../middleware/joiValidation.ts";


import express from 'express';
const router = express.Router();

router.get("/tv", validateQuery(searchQuerySchema), tmdbController.searchQuery)
router.get("/movie", validateQuery(searchQuerySchema), tmdbController.searchQuery)
router.get("/media", validateQuery(searchQuerySchema), tmdbController.searchQuery)
router.get("/credits", validateQuery(getCreditsSchema), tmdbController.getMovieCredits)
router.get("/details", validateQuery(getCreditsSchema), tmdbController.getTVDetails)

    export default router;
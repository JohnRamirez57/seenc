import { tmdbController } from "../controllers/tmdb.controller.ts";
import {
  validateQuery,
  searchQuerySchema
} from "../../middleware/joiValidation.ts";


import express from 'express';
const router = express.Router();

router.get("/tv", validateQuery(searchQuerySchema), tmdbController.searchQuery)
router.get("/movie", validateQuery(searchQuerySchema), tmdbController.searchQuery)
router.get("/media", validateQuery(searchQuerySchema), tmdbController.searchQuery)

    export default router;
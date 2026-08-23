import express from 'express';
import { getCreditsSchema, getSeasonEpisodesSchema, searchQuerySchema, validateQuery } from '../../middleware/joiValidation';
import { tmdbController } from '../controllers/tmdb.controller';

const tvRouter = express.Router();

tvRouter.get("/search", validateQuery(searchQuerySchema), tmdbController.searchQuery)
tvRouter.get("/details", validateQuery(getCreditsSchema), tmdbController.getTVDetails)
tvRouter.get("/seasonEpisodesInfo", validateQuery(getSeasonEpisodesSchema), tmdbController.getAllSeasonEpisodesDetails)

export default tvRouter;
import express from 'express';
import { miscController } from '../controllers/misc.controller';
import { authenticateToken } from '../../../seencBE/backendMiddleware/jwtValidation';
import { getSeasonEpisodesSchema, requireTMDBSchema, validateBody } from '../../middleware/joiValidation';

const mediaMiscRouter = express.Router({ mergeParams: true });

mediaMiscRouter.post("/movie", authenticateToken, validateBody(requireTMDBSchema), miscController.createMovieAppearances)

mediaMiscRouter.post("/tv", authenticateToken, validateBody(getSeasonEpisodesSchema), miscController.createTVAppearances)

export default mediaMiscRouter;

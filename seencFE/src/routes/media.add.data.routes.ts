import express from 'express';
import { addMediaSchema, addMediaUnitsSchema, validateBody } from '../../middleware/joiValidation';
import { mediaController } from '../controllers/media.controller';
const mediaRouter = express.Router({ mergeParams: true });

mediaRouter.post("/", validateBody(addMediaSchema), mediaController.addMedia)
mediaRouter.post("/tv-unit", validateBody(addMediaUnitsSchema), mediaController.addTVMediaUnit);
mediaRouter.post("/movie-unit", validateBody(addMediaUnitsSchema), mediaController.addMovieMediaUnit)

export default mediaRouter;
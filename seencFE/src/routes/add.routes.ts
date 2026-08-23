import express from 'express';
import { addMediaSchema, addMediaUnitsSchema, validateBody } from '../../middleware/joiValidation';
import { mediaController } from '../controllers/media.controller';
const addRouter = express.Router({ mergeParams: true });

addRouter.post("/media", validateBody(addMediaSchema), mediaController.addMedia)
addRouter.post("/mediaUnits", validateBody(addMediaUnitsSchema), mediaController.addMediaUnits)

export default addRouter;

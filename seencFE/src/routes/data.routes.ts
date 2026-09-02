import { mediaController } from '../controllers/media.controller.ts';
import { validateBody, addMediaSchema, getSeasonEpisodesSchema } from '../../middleware/joiValidation.ts';
import express from 'express';
import addRouter from './add.data.routes.ts';

const router = express.Router({ mergeParams: true });

router.use("/add", addRouter)

export default router;




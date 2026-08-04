import { mediaController } from '../controllers/media.controller.ts';
import { validateBody, addMediaSchema } from '../../middleware/joiValidation.ts';
import express from 'express';
const router = express.Router();

router.post("/add", validateBody(addMediaSchema), mediaController.addMedia)

export default router;




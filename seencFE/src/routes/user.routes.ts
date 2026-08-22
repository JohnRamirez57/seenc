import { getUserSchema, validateQuery } from '../../middleware/joiValidation.ts';
import { userController } from '../controllers/user.controller.ts';
import express from 'express';
const router = express.Router();

router.delete("/deleteMedia", userController.deleteUserMedia)
router.get("/getMedia", userController.getAllUserMedia)
router.get("/linkUser", validateQuery(getUserSchema), userController.linkAccount)

export default router;
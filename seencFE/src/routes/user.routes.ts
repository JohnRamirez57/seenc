import { logInSchema, signUpSchema, validateBody, validateQuery } from '../../middleware/joiValidation.ts';
import { userController } from '../controllers/user.controller.ts';
import express from 'express';
const router = express.Router();

router.delete("/deleteMedia", userController.deleteUserMedia)
router.get("/getMedia", userController.getAllUserMedia)
router.post("/sign-up", validateBody(signUpSchema), userController.signUp)
router.get("/log-in", validateQuery(logInSchema), userController.logIn)

export default router;
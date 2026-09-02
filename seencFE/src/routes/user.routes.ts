import { logInSchema, signUpSchema, validateBody } from '../../middleware/joiValidation.ts';
import { userController } from '../controllers/user.controller.ts';
import { authenticateToken } from '../../../seencBE/backendMiddleware/jwtValidation.ts'
import express from 'express';
const router = express.Router();

router.delete("/deleteMedia", authenticateToken, userController.deleteUserMedia)
router.get("/getMedia", authenticateToken, userController.getAllUserMedia)
router.post("/sign-up", validateBody(signUpSchema), userController.signUp)
router.post("/log-in", validateBody(logInSchema), userController.logIn)
router.post("/log-out", authenticateToken, userController.logOut)
router.get("/me", authenticateToken, userController.checkIfUserTokenExists)

export default router;
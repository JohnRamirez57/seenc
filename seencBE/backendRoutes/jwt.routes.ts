import express from 'express';
import { jwtController } from '../backendControllers/jwt.controller';
const jwtRouter = express.Router();

jwtRouter.get("/sign", jwtController.sign)
jwtRouter.get("/verify", jwtController.verify)

export default jwtRouter;
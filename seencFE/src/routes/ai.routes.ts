import { authenticateToken } from '../../../seencBE/backendMiddleware/jwtValidation.ts'
import express from 'express';
import knowledgeRoutes from './knowledge.ai.routes.ts';
const aiRouter = express.Router();

aiRouter.use("/knowledge", knowledgeRoutes)

export default aiRouter;
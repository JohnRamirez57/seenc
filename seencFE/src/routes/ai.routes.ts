import { authenticateToken } from '../../../seencBE/backendMiddleware/jwtValidation.ts'
import express from 'express';
import knowledgeRoutes from './knowledge.ai.routes.ts';
import questionRoutes from './question.ai.routes.ts';
import eventsRoutes from './events.ai.routes.ts'
const aiRouter = express.Router();

aiRouter.use("/knowledge", authenticateToken, knowledgeRoutes)
aiRouter.use("/question", authenticateToken, questionRoutes)
aiRouter.use("/events", authenticateToken, eventsRoutes)

export default aiRouter;
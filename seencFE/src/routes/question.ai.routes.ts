import { authenticateToken } from '../../../seencBE/backendMiddleware/jwtValidation.ts'
import express from 'express';
import { inquireController } from '../controllers/inquire.controller.ts';
import { createQuestionSchema, findQuestionsSchema, validateBody, validateQuery } from '../../middleware/joiValidation.ts';
import { askQuestionSchema } from '../../middleware/joiValidation.ts';
import { aiController } from '../controllers/ai.controller.ts';
const questionRoutes = express.Router();

questionRoutes.get("/library", authenticateToken, inquireController.findLibraryQuestions)
questionRoutes.post("/ask", authenticateToken, validateBody(askQuestionSchema), aiController.askQuestion)
questionRoutes.post("/create", authenticateToken, validateBody(createQuestionSchema), inquireController.createQuestion);
questionRoutes.get("/get", authenticateToken, validateQuery(findQuestionsSchema), inquireController.findQuestions)

export default questionRoutes;

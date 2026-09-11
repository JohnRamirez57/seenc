import { authenticateToken } from '../../../seencBE/backendMiddleware/jwtValidation.ts'
import express from 'express';
import { inquireController } from '../controllers/inquire.controller.ts';
import { createQuestionSchema, findQuestionsSchema, validateBody, validateQuery } from '../../middleware/joiValidation.ts';
const questionRoutes = express.Router();

questionRoutes.get("/library", authenticateToken, inquireController.findLibraryQuestions)
questionRoutes.post("/create", authenticateToken, validateBody(createQuestionSchema), inquireController.createQuestion);
questionRoutes.get("/get", authenticateToken, validateQuery(findQuestionsSchema), inquireController.findQuestions)

export default questionRoutes;

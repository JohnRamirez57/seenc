import { authenticateToken } from '../../../seencBE/backendMiddleware/jwtValidation.ts'
import express from 'express';
import { inquireController } from '../controllers/inquire.controller.ts';
import { createKnowledgeSchema, findKnowledgeSchema, validateBody, validateQuery } from '../../middleware/joiValidation.ts';
const knowledgeRoute = express.Router();

knowledgeRoute.post("/create", authenticateToken, validateBody(createKnowledgeSchema), inquireController.createKnowledge)
knowledgeRoute.get("/get", authenticateToken, validateQuery(findKnowledgeSchema), inquireController.findKnowledge)

export default knowledgeRoute;
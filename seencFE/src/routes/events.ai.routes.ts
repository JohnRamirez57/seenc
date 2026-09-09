import { authenticateToken } from '../../../seencBE/backendMiddleware/jwtValidation.ts'
import express from 'express';
import { inquireController } from '../controllers/inquire.controller.ts';
import { createEventSchema, findEventsSchema, validateBody, validateQuery } from '../../middleware/joiValidation.ts';
const eventsRouter = express.Router();

eventsRouter.post("/create", authenticateToken, validateBody(createEventSchema), inquireController.createEvent)
eventsRouter.get("/get", authenticateToken, validateQuery(findEventsSchema), inquireController.findEvents)

export default eventsRouter;
import express from 'express';
import mediaRouter from './media.add.data.routes.ts';
import { authenticateToken } from '../../../seencBE/backendMiddleware/jwtValidation';
import miscRouter from './misc.add.data.routes.ts';
const addRouter = express.Router({ mergeParams: true });

addRouter.use("/media", authenticateToken, mediaRouter)
addRouter.use("/misc", authenticateToken, miscRouter)


export default addRouter;

import express from 'express';
import mediaRouter from './media.add.data.routes.ts';
const addRouter = express.Router({ mergeParams: true });

addRouter.use("/media", mediaRouter)

export default addRouter;

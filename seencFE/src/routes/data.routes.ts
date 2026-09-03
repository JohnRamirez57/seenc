import express from 'express';
import addRouter from './add.data.routes.ts';

const router = express.Router({ mergeParams: true });

router.use("/add", addRouter)

export default router;




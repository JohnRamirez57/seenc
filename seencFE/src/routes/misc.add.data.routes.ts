import express from 'express';
import { authenticateToken } from '../../../seencBE/backendMiddleware/jwtValidation';
import mediaMiscRouter from './movie.misc.add.data.routes';
const miscRouter = express.Router({ mergeParams: true });

miscRouter.use("/character-appearances", authenticateToken, mediaMiscRouter )

export default miscRouter;

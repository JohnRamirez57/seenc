import type { Response } from "express";
import type { AuthenticatedRequest } from "../../../seencBE/backendMiddleware/jwtValidation.ts";
import type { AskQuestionInput } from "../interfaces/ai.interfaces.ts";
import { AIService, AIServiceError } from "../services/ai.service.ts";
import { handleError } from "../utils/error.util.ts";

class AIController {
    private readonly aiService = new AIService();

    public askQuestion = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const userId = req.user?.userID;
            if (!userId) return res.status(401).json({ error: "Authenticated user not found." });

            const input: AskQuestionInput = {
                tmdb_id: Number(req.body.tmdb_id),
                unit_number: Number(req.body.unit_number),
                question: req.body.question,
                ...(req.body.season_number === undefined
                    ? {}
                    : { season_number: Number(req.body.season_number) }),
            };
            const result = await this.aiService.askQuestion(userId, input);
            return res.status(201).json(result);
        } catch (error) {
            const status = error instanceof AIServiceError ? error.status : 500;
            return res.status(status).json({ error: handleError(error) });
        }
    };
}

export const aiController = new AIController();

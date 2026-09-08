import type { Request, Response } from "express";
import { InquisitionService } from "../services/inquisition.service";
import { handleError } from "../utils/error.util";

class InquireController {
    private readonly inquireService;

    constructor() {
        this.inquireService = new InquisitionService();
    }

    public findKnowledge = async (req: Request, res: Response) => {
        try {
            const tmdb_id = req.body.tmdb_id;
            const episode_num = req.body.unit_number;
            const season_num = req.body?.season_number;
            
    
            const knowledge = await this.inquireService.findKnowledgeUnit(tmdb_id, episode_num, season_num)
            res.status(200).json(knowledge)
        } catch (error) {
            console.error(handleError(error))
            res.status(400).json({error: handleError(error)})
        }
    }

    public createKnowledge = async (req: Request, res: Response) => {
        try {
            const tmdb_id = req.body.tmdb_id;
            const episode_num = req.body.unit_number;
            const category = req.body.category;
            const content = req.body?.content ? req.body.content : "No content given!"
            const season_num = req.body?.season_number;
            const knowledge = await this.inquireService.createKnowledgeUnit(tmdb_id, episode_num, category, content, season_num)
            res.status(200).json(knowledge)
        } catch (error) {
            console.error(handleError(error))
            res.status(400).json({error: "Error creating knowledge unit!"})
        }
    }
}

export const inquireController = new InquireController();
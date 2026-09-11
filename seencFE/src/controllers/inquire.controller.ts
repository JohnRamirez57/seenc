import type { Request, Response } from "express";
import { InquisitionService } from "../services/inquisition.service";
import { handleError } from "../utils/error.util";
import type { AuthenticatedRequest } from "../../../seencBE/backendMiddleware/jwtValidation";

class InquireController {
    private readonly inquireService;

    constructor() {
        this.inquireService = new InquisitionService();
    }

    public createEvent = async (req: Request, res: Response) => {
        try {
            const description: string = req.body.description;
            const importance: number = req.body.importance;
            const tmdb_id: number = req.body.tmdb_id;
            const unit_number: number = req.body.unit_number;
            const season_number = req.query.season_number ? Number(req.query.season_number) : undefined;
    
            const eventUnit = await this.inquireService.createEvent(description, importance, tmdb_id, unit_number, season_number)
    
            res.status(200).json(eventUnit)
            
        } catch (error) {
            console.error(error)
            res.status(400).json({error: handleError(error)})
        }
    }

    public findEvents = async (req: Request, res: Response) => {
        try {
            const tmdb_id: number = req.body.tmdb_id;
            const unit_number: number = req.body.unit_number;
            const season_number = req.query.season_number ? Number(req.query.season_number) : undefined;
    
            const eventUnit = await this.inquireService.findEvents(tmdb_id, unit_number, season_number)
    
            res.status(200).json(eventUnit)
            
        } catch (error) {
            console.error(error)
            res.status(400).json({error: handleError(error)})
        }
    }

    public findQuestions = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const user_id = req.user?.userID;
            const tmdb_id = Number(req.query.tmdb_id);
            const ep_num = Number(req.query.unit_number);
            const season_number = req.query.season_number ? Number(req.query.season_number) : undefined;
            const questionUnits = await this.inquireService.findQuestions(user_id!, tmdb_id, ep_num, season_number)
            res.status(200).json(questionUnits)
        } catch (error) {
            console.error(error)
            res.status(400).json({error: handleError(error)})
        }
    }

    public findLibraryQuestions = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const user_id = req.user?.userID;
            if (!user_id) return res.status(401).json({error: "Authenticated user not found"})

            const questions = await this.inquireService.findLibraryQuestions(user_id)
            res.status(200).json(questions)
        } catch (error) {
            console.error(error)
            res.status(400).json({error: handleError(error)})
        }
    }

    public createQuestion = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const user_id = req.user?.userID
            const tmdb_id: number = req.body.tmdb_id;
            const ep_num: number = req.body.unit_number;
            const title: string = req.body.title;
            const question: string = req.body.question;
            const answer = req.body?.answer;
            const season_number = req.query.season_number ? Number(req.query.season_number) : undefined;
            await this.inquireService.createQuestion(user_id!, tmdb_id, ep_num, title, question, answer, season_number)
            res.status(200).json({message: "Successfully created question unit!"})
        } catch (error) {
            console.error(error)
            res.status(400).json({error: handleError(error)})
        }
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

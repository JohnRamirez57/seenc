import type { Request, Response } from "express";
import { MiscService } from "../services/misc.serivce";

class MiscController {
    private readonly misc: MiscService;

    constructor(){
        this.misc = new MiscService();
    }

    public createTVAppearances = async (req: Request, res: Response) => {
        try {
            const tmdb_id = Number(req.body.tmdb_id);
            const season_number = Number(req.body.season_number)
            res.json(await this.misc.createCharacterAppearancesFromTV(tmdb_id, season_number))
        } catch (error) {
            console.error(error)
        }
    }

    public createMovieAppearances = async (req: Request, res: Response) => {
        const tmdb_id = Number(req.body.tmdb_id);

        try {
            await this.misc.createCharacterAppearancesFromMovie(tmdb_id)
        } catch (error) {
            console.error(error)
            return res.status(400).json({error: error})
        }

    }
}

export const miscController = new MiscController();
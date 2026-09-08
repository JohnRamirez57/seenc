import type { Request, Response } from "express";
import { UserMediaService } from "../services/media.service.ts";
import { handleError } from "../utils/error.util.ts";
import { PrismaService } from "../services/prisma.service.ts";
import { UserAccountService } from "../services/account.service.ts";
import dotenv from "dotenv"
import type { AuthenticatedRequest } from "../../../seencBE/backendMiddleware/jwtValidation.ts";
import { error } from "console";
import { watch_status } from "@prisma/client";
import { MiscService } from "../services/misc.serivce.ts";

dotenv.config()

class UserController {
    private readonly userMediaService: UserMediaService;
    private readonly prismaService: PrismaService;
    private readonly userAccountService: UserAccountService;
    private readonly miscService: MiscService;

    constructor() {
        this.userMediaService = new UserMediaService()
        this.prismaService = new PrismaService();
        this.userAccountService = new UserAccountService();
        this.miscService = new MiscService();
    }

    public logIn = async (req: Request, res: Response) => {
        try {
            await this.userAccountService.logIn(req, res)
        } catch (error) {
            res.status(500).json({
                connected: false,
                error: handleError(error)
            })
        }
    }

    public signUp = async (req: Request, res: Response) => {
        try {
            await this.userAccountService.signUp(req, res)
        } catch (error) {
            res.status(500).json({
                connected: false,
                error: handleError(error)
            })
        }
    }

    public deleteUserMedia = async (req: Request, res: Response) => {
        try {
           await this.userMediaService.deleteUserMedia(req.body.userID, req.body.tmdb_id)
            res.status(200).json({removed: true, message: "Successfully deleted media!"})
        } catch (error) {
            res.status(500).json({
                removed: false,
                error: handleError(error)
            })
        }
    }

    public logOut = async (req: Request, res: Response) => {
        return this.userAccountService.signOut(req, res);
    }

    public checkIfUserTokenExists = async (req: AuthenticatedRequest, res: Response) => {
        const user = req.user;
        return res.status(200).json({
            username: user?.username,
            id: user?.userID
        })
    }

    public getUserProgress = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const user_id = req.user?.userID;
            if (!user_id) {
                return res.status(401).json({ error: "Authenticated user not found." });
            }
            const tmdb_id = Number(req.query.tmdb_id)
            const ep_num = Number(req.query.unit_number ?? -1);
            const season_num = Number(req.query.season_number ?? -1);

            console.error(req.query)
            const userProg = await this.miscService.getUserProgress(user_id, tmdb_id, ep_num, season_num)
            res.status(200).json(userProg)
        } catch (error) {
            return res.status(400).json({error: handleError(error)})
        }
    }

    public updateWatchStatus = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const user_id = req.user?.userID;
            const tmdb_id = Number(req.body.tmdb_id)
            const ep_num = req.body?.unit_number ? Number(req.body.unit_number) : -1;
            const new_status = req.body.new_status;
            const season_num = req.body?.season_number ? Number(req.body.season_number) : -1;
            if (!(await this.miscService.updateProgressWatchStatus(user_id!, tmdb_id, ep_num, new_status, season_num))) {
                return res.status(400).json({error: handleError})
            }
            res.status(200)
        } catch (error) {
            console.error(handleError(error))
            res.status(400).json({error: handleError(error)})
        }
    }

    public updateLastViewedProgress = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const user_id = req.user?.userID;
            const tmdb_id = Number(req.body.tmdb_id)
            const ep_num = req.body?.unit_number ? Number(req.body.unit_number) : -1;
            const season_num = req.body?.season_number ? Number(req.body.season_number) : -1;

            if (!(await this.miscService.updateLastViewedProgress(user_id!, tmdb_id, ep_num, season_num))) {
                return res.status(400).json({error: handleError})
            }
            res.status(200)
        } catch (error) {
            console.error(handleError(error))
            res.status(400).json({error: handleError(error)})
        }
    }

    public createUserProgress = async (req: AuthenticatedRequest, res: Response) => {
        try {
            const user_id = req.user?.userID;
            if (!user_id) {
                return res.status(401).json({ error: "Authenticated user not found." });
            }
            const tmdb_id = Number(req.body.tmdb_id);
            const ep_num = Number(req.body.unit_number ?? -1);
            const season_num = Number(req.body.season_number ?? -1);

            if (await this.miscService.getUserProgress(user_id, tmdb_id, ep_num, season_num)) {
                console.error("Progress already exists!")
                return res.status(400).json({error: "Progress already exists!"})
            }
    
            await this.miscService.createUserProgress(user_id, tmdb_id, ep_num, season_num)
        } catch (error) {
            console.error(handleError(error))
            res.status(400).json({error: handleError(error)})
        }
    }

    public getAllUserMedia = async (req: Request, res: Response) => {
        try {
            const medias = await this.userMediaService.getAllUserMedia(Number(req.query.userID))
            res.json(medias);
        } catch (error) {
            res.status(500).json({
                connected: false,
                error: handleError(error),
            });
        }
    }


    public linkAccount = async (req: Request, res: Response) => {
        try {
            const id: number = Number.parseInt(req.query.id as string)
            const returnedUser = await this.prismaService.findUser(id)
            res.json(returnedUser)
        } catch (error) {
            res.status(200).json({
                error: handleError(error)
            })
        }
    }

}

export const userController = new UserController();
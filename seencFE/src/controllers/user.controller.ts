import type { Request, Response } from "express";
import { UserMediaService } from "../services/media.service.ts";
import { handleError } from "../utils/error.util.ts";
import { PrismaService } from "../services/prisma.service.ts";
import { UserAccountService } from "../services/account.service.ts";
import dotenv from "dotenv"
import type { AuthenticatedRequest } from "../../../seencBE/backendMiddleware/jwtValidation.ts";

dotenv.config()

class UserController {
    private readonly userMediaService: UserMediaService;
    private readonly prismaService: PrismaService;
    private readonly userAccountService: UserAccountService;

    constructor() {
        this.userMediaService = new UserMediaService()
        this.prismaService = new PrismaService();
        this.userAccountService = new UserAccountService();
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
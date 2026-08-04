import type { Request, Response } from "express";
import { UserMediaService } from "../services/media.service.ts";
import type { AxiosResponse } from "axios";
import { handleError } from "../utils/error.util.ts";
import type { userTable } from "../interfaces/user.interfaces.ts";
import { PrismaService } from "../services/prisma.service.ts";

class UserController {
    private readonly userMediaService: UserMediaService;
    private readonly prismaService: PrismaService;
    constructor() {
        this.userMediaService = new UserMediaService()
        this.prismaService = new PrismaService();
    }

    public deleteUserMedia = async (req: Request, res: Response) => {
        try {
           await this.userMediaService.deleteUserMedia(req.body.userID, req.body.tmdb_id)
            res.status(200).json({connected: true, message: "Successfully deleted media!"})
        } catch (error) {
            res.status(500).json({
                connected: false,
                error: handleError(error)
            })
        }
    }

    public getAllUserMedia = async (req: Request, res: Response) => {
        try {
            const medias = await this.userMediaService.getAllUserMedia(Number(req.query.userID))

            res.json(
                Object.keys(medias).length === 0
                ? "No medias have been added yet!"
                : medias
            );
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
            const returnedUser: userTable | null = await this.prismaService.findUser(id)
            res.json(returnedUser)
        } catch (error) {
            res.status(200).json({
                error: handleError(error)
            })
        }
    }

}

export const userController = new UserController();
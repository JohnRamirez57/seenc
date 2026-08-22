import type { Request, Response } from "express";
import type { addMediaParams } from "../interfaces/media.interfaces.ts";
import { MediaService, UserMediaService } from "../services/media.service.ts";
import { handleError } from "../utils/error.util.ts";

class MediaController {
    private readonly mediaService: MediaService;
    private readonly userMediaService: UserMediaService;

    constructor() {
        this.mediaService = new MediaService();
        this.userMediaService = new UserMediaService()
    }

    public addMedia = async (req: Request, res: Response) => {
        try {
            const desiredMedia: addMediaParams = req.body;
            const userContainsMedia = await this.mediaService.checkUserContainsMedia(desiredMedia.user_id, desiredMedia.tmdb_id);
            if (userContainsMedia) {
                return res.status(409).json({
                    message: "Media already in user's library"
                })
            }
    
            let media = await this.mediaService.checkMediaExists(desiredMedia.tmdb_id)
            if (!media) {
                const { user_id, ...mediaData } = desiredMedia;
                media = await this.mediaService.createMedia(mediaData)
            }
    
            await this.userMediaService.createUserMediaTable(desiredMedia.user_id, media.id);
    
            res.status(201).json({connected: true, message: "Successfully added media!"})
        } catch (error) {
            res.status(500).json({
                connected: false,
                error: handleError(error),
            });
            }
    }
}

export const mediaController = new MediaController();
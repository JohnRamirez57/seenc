import type { Request, Response } from "express";
import type { addMediaParams } from "../interfaces/media.interfaces.ts";
import { MediaService, MediaUnitService, UserMediaService } from "../services/media.service.ts";
import { handleError } from "../utils/error.util.ts";
import { TMDBService } from "../services/tmdb.service.ts";
import type { AxiosResponse } from "axios";

class MediaController {
    private readonly mediaService: MediaService;
    private readonly userMediaService: UserMediaService;
    private readonly mediaUnitService: MediaUnitService;
    private readonly tmdbService: TMDBService;

    constructor() {
        this.mediaService = new MediaService();
        this.userMediaService = new UserMediaService();
        this.mediaUnitService = new MediaUnitService();
        this.tmdbService = new TMDBService();
    }

    public addMediaUnits = async (req: Request, res: Response) => {
        try {
            const tmdb_id = Number(req.body.tmdb_id)
            const season_number = req.body?.season_number || 1;
            const seasonDetails = (await this.tmdbService.getSeasonDetails(tmdb_id, season_number)).data;
            const episodes: PromiseFulfilledResult<AxiosResponse>[] = await this.tmdbService.getSeasonEpisodesDetails(tmdb_id, season_number, seasonDetails.episodes.length, Number(req.body?.startingEpisode || 1))

            const episodesData = episodes.map((entry) => entry.value.data)
            await this.mediaUnitService.createMultipleMediaUnits(episodesData)
            
            res.status(201).json({message: "Successfully added media units!"})

        } catch (error) {
            res.status(500).json({
                error: handleError(error),
            });
        }
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
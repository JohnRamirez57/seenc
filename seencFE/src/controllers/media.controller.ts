import type { Request, Response } from "express";
import type { addMediaParams, detailsParams, MovieDetailResponse, newMediaParams } from "../interfaces/media.interfaces.ts";
import { media_type } from "@prisma/client"
import { MediaService, MediaUnitService, UserMediaService } from "../services/media.service.ts";
import { handleError } from "../utils/error.util.ts";
import { TMDBService } from "../services/tmdb.service.ts";
import type { AxiosResponse } from "axios";
import { formatPosterPathing } from "../utils/format.util.ts";

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

    public addMovieMediaUnit = async (req: Request, res: Response) => {
        try {
            const tmdb_id = Number(req.body.tmdb_id);
            const movieParams: detailsParams = {
                api_key: process.env.TMDBKEY!,
                language: 'en-US',
                tmdb_id: tmdb_id
            }

            let movieExists = await this.mediaService.checkMediaExists(tmdb_id)
            const movieDetails: MovieDetailResponse = (await this.tmdbService.getMovieDetails(movieParams)).data
            formatPosterPathing(movieDetails)
            if (!movieExists) {
                const createParams: newMediaParams = {
                    title: movieDetails.title,
                    media_type: media_type.MOVIE,
                    description: movieDetails.overview,
                    poster_url: movieDetails.poster_path!,
                    tmdb_id: tmdb_id,
                    release_date: new Date(movieDetails.release_date),
                    created_at: new Date(),
                    updated_at: new Date()
                }
                movieExists = await this.mediaService.createMedia(createParams)
            }

            if (!(await this.mediaUnitService.checkMediaUnitExists(tmdb_id, movieDetails.id))){
                const muParams = {
                    media_id: movieExists.id,
                    unit_number: movieDetails.id,
                    unit_type: media_type.MOVIE,
                    title: movieDetails.title,
                    overview: movieDetails.overview,
                    release_date: new Date(movieDetails.release_date),
                    tmdb_id: tmdb_id
                }
    
                await this.mediaUnitService.createMediaUnit(muParams)
                return res.status(200).json("Created media unit (movie)")
            }

            return res.status(200).json("Media unit already exists!")
        } catch (error) {
            console.error(error)
        }
    }

    public addTVMediaUnit = async (req: Request, res: Response) => {
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
            if (this.isUniqueConstraintError(error)) {
                return res.status(409).json({
                    connected: false,
                    message: "Media already in user's library"
                });
            }

            return res.status(500).json({
                connected: false,
                error: handleError(error),
            });
            }
    }

    private isUniqueConstraintError(error: unknown): boolean {
        return typeof error === "object"
            && error !== null
            && "code" in error
            && error.code === "P2002";
    }
}

export const mediaController = new MediaController();
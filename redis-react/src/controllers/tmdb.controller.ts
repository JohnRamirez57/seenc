import type { Request, Response } from "express";
import { TMDBService } from "../services/tmdb.service.ts";
import type { AxiosResponse } from "axios";
import { formatMultiResults, formatPosterPathing } from "../utils/format.util.ts";
import type { MovieCredit, retrievedMedia, RetrievedMovieCredits as retrievedMovieCredits, TVDetails } from "../interfaces/media.interfaces.ts";
import { searchTMDBType, type searchFn } from "../interfaces/tmdb.interfaces.ts";
import { handleError } from "../utils/error.util.ts";
import { PrismaService } from "../services/prisma.service.ts";

class TMDBController {
    private readonly tmdbService: TMDBService;
    private readonly extraPageNumber = 2;
    private readonly profilePathing = "https://image.tmdb.org/t/p/"
    private readonly profileSize = "original"
    private readonly prismaClient = new PrismaService;

    constructor(){
        this.tmdbService = new TMDBService();
    }

    private readonly searchPageNumber = async (search: searchFn, query: string | undefined, pageNumber: number): Promise<retrievedMedia> => {
        try {
            const extraPageResults: AxiosResponse<retrievedMedia> = await search(query, pageNumber);
            formatMultiResults(extraPageResults.data);
            return extraPageResults.data;
        } catch (error) {
            console.error(error);
            throw error;
        }
    }

    private readonly determineSearchFn = (searchType: string): searchFn => {
        switch (searchType) {
            case searchTMDBType.MOVIE:
                return this.tmdbService.searchMovies.bind(this.tmdbService);
            case searchTMDBType.TV:
                return this.tmdbService.searchTV.bind(this.tmdbService);
            case searchTMDBType.MULTI:
                return this.tmdbService.searchMedia.bind(this.tmdbService);
            default:
                throw new Error("searchType invalid!");
        }
    }

    public searchQuery = async(req: Request, res: Response) => {
        try {
            const query = typeof req.query.query === "string" ? req.query.query : "";
            const searchType: string = typeof req.query.searchType === "string" ? req.query.searchType : "";
            const searchService: searchFn = this.determineSearchFn(searchType);
            const returnedResults: AxiosResponse<retrievedMedia> = await searchService(query);
            formatMultiResults(returnedResults.data)
            if (returnedResults.data.total_pages > 1) {
                const extraPageResults: retrievedMedia = await this.searchPageNumber(searchService, query, this.extraPageNumber);
                returnedResults.data.results = [
                    ...returnedResults.data.results,
                    ...extraPageResults.results
                ]
            }
            res.json(returnedResults.data)
        } catch (error) {
            console.error(error);
            res.status(500).json({
                error: "Failed to search media"
            });
        }
    }

    public getMovieCredits = async (req: Request, res: Response) => {
        try {
            const movieId = req.query.tmdb_id as unknown as number;
            const returnedCredits: AxiosResponse<retrievedMovieCredits> = await this.tmdbService.getMovieCredits(movieId)
            returnedCredits.data.cast.forEach((entry: MovieCredit) => entry.profile_path = `${this.profilePathing}${this.profileSize}${entry.profile_path}`)
            this.prismaClient.checkCastCharacterMedia(movieId, returnedCredits.data.cast)
            res.json(returnedCredits.data.cast)
        } catch (error) {
            console.error(error)
            res.status(200).json({
                error: handleError(error)
            })
        }
    }

    public getTVDetails = async (req: Request, res: Response) => {
        try {
            const tvID: number = Number(req.query.tmdb_id as unknown);
            const returnedTVDetails: AxiosResponse<TVDetails> = await this.tmdbService.getTVDetails(tvID)
            formatPosterPathing(returnedTVDetails.data)
            formatPosterPathing(returnedTVDetails.data.seasons)
            res.json(returnedTVDetails.data)
        } catch (error) {
            console.error(error)
            res.status(200).json({
                error: handleError(error)
            })
        }
    }
}

export const tmdbController = new TMDBController();
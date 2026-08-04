import type { Request, Response } from "express";
import { TMDBService } from "../services/tmdb.service.ts";
import type { AxiosResponse } from "axios";
import { formatMultiResults } from "../utils/format.util.ts";
import type { retrievedMedia } from "../interfaces/media.interfaces.ts";
import { searchTMDBType, type searchFn } from "../interfaces/tmdb.interfaces.ts";

class TMDBController {
    private readonly tmdbService: TMDBService;
    private readonly extraPageNumber = 2;

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
}

export const tmdbController = new TMDBController();
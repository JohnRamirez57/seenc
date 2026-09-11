import { cacheKey, remember } from "./redis.service.ts";
import axios, { type AxiosResponse } from 'axios';
import type { detailsParams, EpisodeDetails, MovieCredit, RetrievedMovieCredits, searchParams } from '../interfaces/media.interfaces.ts';
import { createSearchParamsObject } from '../utils/param.util.ts';
import { TokenBucket } from "../apiBucket/Bucket.ts"
import { extractSuccessfulResponses } from '../utils/format.util.ts';

interface GeminiCorrectionResponse {
    candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
    }>;
}

export class TMDBService {
    private readonly searchMovieURL = "https://api.themoviedb.org/3/search/movie"
    private readonly getMovieDetailsURL = "https://api.themoviedb.org/3/movie/"
    private readonly searchTVURL = "https://api.themoviedb.org/3/search/tv"
    private readonly searchMultiURL = "https://api.themoviedb.org/3/search/multi"
    private readonly getTVDetailsURL = "https://api.themoviedb.org/3/tv/"
    private readonly getSeasonDetailsURL = "https://api.themoviedb.org/3/tv/%d/season/%d"
    private readonly getTVEpisodeDetailsURL = "https://api.themoviedb.org/3/tv/{series_id}/season/{season_number}/episode/{episode_number}"
    private readonly getMovieCreditsURL = `/credits` // getMovieDetails + ${movie_id} + getMovieCreditsURL
    private readonly getTrendingURL = "https://api.themoviedb.org/3/trending/{media_type}/{time_window}"
    private readonly getPopularURL = "https://api.themoviedb.org/3/{media_type}/popular?page={page_number}"
    private readonly profilePathing = "https://image.tmdb.org/t/p/"
    private readonly profileSize = "original"
    private readonly STARTING_API_TOKENS = 40;
    private readonly MAX_API_CALLS_PER_SECOND = 45;
    private readonly PAGE_NUMBER_LIMIT = 5;
    private readonly limiter: TokenBucket = new TokenBucket(this.STARTING_API_TOKENS, this.MAX_API_CALLS_PER_SECOND);

    public async makeTMDBRequest(formattedURL: string, params: any): Promise<AxiosResponse> {
        const { api_key: _apiKey, ...publicParams } = params || {};
        const sortedParams = Object.fromEntries(Object.entries(publicParams).sort(([a], [b]) => a.localeCompare(b)));
        const key = cacheKey('tmdb', [formattedURL, sortedParams]);
        const ttl = /search|trending|popular/.test(formattedURL) ? 900 : 86400;
        const data = await remember(key, ttl, async () => {
            await this.limiter.acquire();
            return (await axios.get(formattedURL, { params, timeout: 15_000 })).data;
        });
        // Callers use Axios' data/status shape; only the JSON payload is cached.
        return { data, status: 200, statusText: 'OK', headers: {}, config: {} } as AxiosResponse;
    }

    public async searchTrending(window_time: string) {
        const trendingTVURLs: string[] = [];
        for (let pageNum = 1; pageNum <= this.PAGE_NUMBER_LIMIT; pageNum++){
            trendingTVURLs.push(this.getPopularURL.replace("{media_type}", "tv").replace("{page_number}", String(pageNum)), this.getPopularURL.replace("{media_type}", "movie").replace("{page_number}", String(pageNum)));
        }

        // console.error("Trending URLs: ", trendingTVURLs)

        trendingTVURLs.push(this.getTrendingURL.replace("{media_type}", "all").replace("{time_window}", window_time))
        
        const res = (await Promise.allSettled(trendingTVURLs.map((url) => this.makeTMDBRequest(url, { api_key: process.env.TMDBKEY }))))
        // console.error(res)
        return res.flatMap((promise, index) => {
                if (promise.status !== "fulfilled") return [];

                const mediaType = trendingTVURLs[index].includes("/tv/") ? "tv" : "movie";
                return [{...promise.value.data, results: promise.value.data.results?.map((entry: any) => ({...entry, media_type: entry.media_type ?? mediaType })) ?? [],
                }];
            });

        // return axios.get(this.getTrendingURL.replace("{media_type}", "all").replace("{time_window}", window_time), { params: { api_key: process.env.TMDBKEY } })
    }

    public async searchMedia(query: any, pageNumber: number = 1) {
        return this.searchWithCorrection(this.searchMultiURL, query, pageNumber)
    }

    public async searchTV(query: any, pageNumber: number = 1) {
        return this.searchWithCorrection(this.searchTVURL, query, pageNumber)
    }

    public async searchMovies(query: any, pageNumber: number = 1) {
        return this.searchWithCorrection(this.searchMovieURL, query, pageNumber)
    }

    private async searchWithCorrection(url: string, query: unknown, pageNumber: number) {
        const originalQuery = String(query ?? "").trim();
        const cleanParams: searchParams = createSearchParamsObject(originalQuery, pageNumber);
        const response = await this.makeTMDBRequest(url, cleanParams);

        if (response.data.results?.length || originalQuery.length < 3) {
            return response;
        }

        const correctedQuery = await this.correctSearchQuery(originalQuery);
        if (correctedQuery.toLowerCase() === originalQuery.toLowerCase()) return response;

        return this.makeTMDBRequest(url, createSearchParamsObject(correctedQuery, pageNumber));
    }

    private async correctSearchQuery(query: string): Promise<string> {
        if (!process.env.GEMINI_API_KEY) return query;
        const key = cacheKey("title-correction", query.toLowerCase());

        try {
            return await remember(key, 24 * 60 * 60, async () => {
                const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";
                const response = await axios.post<GeminiCorrectionResponse>(
                    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
                    {
                        contents: [{
                            role: "user",
                            parts: [{
                                text: `Correct this possibly misspelled movie or TV title: <title>${query}</title>\nReturn only the corrected title. If it is not clearly a title or no correction is needed, return it unchanged.`,
                            }],
                        }],
                        generationConfig: { temperature: 0, maxOutputTokens: 40 },
                    },
                    {
                        params: { key: process.env.GEMINI_API_KEY },
                        headers: { "Content-Type": "application/json" },
                        timeout: 10_000,
                    },
                );

                const correction = response.data.candidates?.[0]?.content?.parts
                    ?.map(part => part.text || "")
                    .join("")
                    .split(/\r?\n/, 1)[0]
                    .replace(/^corrected title:\s*/i, "")
                    .replace(/^["'`]|["'`]$/g, "")
                    .trim();

                return correction && correction.length <= 120 ? correction : query;
            });
        } catch {
            return query;
        }
    }

    public async getMovieDetails(params: detailsParams){
        const {tmdb_id, ...info} = params;
        return this.makeTMDBRequest(`${this.getMovieDetailsURL}${tmdb_id}`, info)
    }

    public async getMovieCredits(movieId: number) {
        const resp: AxiosResponse<RetrievedMovieCredits> = await this.makeTMDBRequest(`${this.getMovieDetailsURL}${movieId}${this.getMovieCreditsURL}`, { api_key: process.env.TMDBKEY })
        resp.data.cast.forEach((entry: MovieCredit) => entry.profile_path = `${this.profilePathing}${this.profileSize}${entry.profile_path}`)
        return resp;
    }

    public async getTVDetails(tmdb_id: number) {
        return this.makeTMDBRequest(`${this.getTVDetailsURL}${tmdb_id}`, { api_key: process.env.TMDBKEY })
    }

    public async getEpisodeCredits(tmdb_id: number, season_number: number, episode_number: number): Promise<AxiosResponse>{
        const url = this.getTVEpisodeDetailsURL.replace("{series_id}", String(tmdb_id)).replace("{season_number}", String(season_number)).replace("{episode_number}", String(episode_number)) + "/credits"

        return this.makeTMDBRequest(`${url}`, { api_key: process.env.TMDBKEY })
    }

    public async getSeasonDetails(tmdb_id: number, season_number: number) {
        const url = this.getSeasonDetailsURL.replace("%d", String(tmdb_id)).replace("%d", String(season_number));
        return this.makeTMDBRequest(`${url}`, { api_key: process.env.TMDBKEY })
    }

    public async getEpisodeDetails(tmdb_id: number, season_number: number, episode_number: number): Promise<AxiosResponse>{
        const url = this.getTVEpisodeDetailsURL.replace("{series_id}", String(tmdb_id)).replace("{season_number}", String(season_number)).replace("{episode_number}", String(episode_number))
        return this.makeTMDBRequest(`${url}`, { api_key: process.env.TMDBKEY })
    }

    public async getTMDBByEpisodeID(episode_id: number, season_num: number, ) {
        const episodeDetails = await this.makeTMDBRequest(`${this.getTVDetailsURL}`, { api_key: process.env.TMDBKEY })
    }

    public async getSeasonEpisodesDetails(tmdb_id: number, season_number: number, max_episodes: number, starting_number: number = 1) {
        const preformattedURL = this.getTVEpisodeDetailsURL.replace("{series_id}", String(tmdb_id)).replace("{season_number}", String(season_number))
        const seasonEpisodeURLS: string[] = [];
        for (let episode_number = starting_number; episode_number <= max_episodes; episode_number++){
            seasonEpisodeURLS.push(preformattedURL.replace("{episode_number}", String(episode_number)))
        }
        let validEpisodes = extractSuccessfulResponses(await Promise.allSettled(seasonEpisodeURLS.map((URL: string) => this.makeTMDBRequest(URL, {api_key: process.env.TMDBKEY}))))
        validEpisodes.forEach(result => {
            result.value.data.tmdb_id = tmdb_id;
        });

        return validEpisodes
    }
}

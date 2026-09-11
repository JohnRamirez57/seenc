import axios, { type AxiosResponse } from 'axios';
import type { detailsParams, EpisodeDetails, MovieCredit, RetrievedMovieCredits, searchParams } from '../interfaces/media.interfaces.ts';
import { createSearchParamsObject } from '../utils/param.util.ts';
import { TokenBucket } from "../apiBucket/Bucket.ts"
import { extractSuccessfulResponses } from '../utils/format.util.ts';

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
        await this.limiter.acquire();
        const resp = await axios.get(formattedURL, {
            params: params
        })

        return resp;
    }

    public async searchTrending(window_time: string) {
        const trendingTVURLs: string[] = [];
        for (let pageNum = 1; pageNum <= this.PAGE_NUMBER_LIMIT; pageNum++){
            trendingTVURLs.push(this.getPopularURL.replace("{media_type}", "tv").replace("{page_number}", String(pageNum)), this.getPopularURL.replace("{media_type}", "movie").replace("{page_number}", String(pageNum)));
        }

        // console.error("Trending URLs: ", trendingTVURLs)

        trendingTVURLs.push(this.getTrendingURL.replace("{media_type}", "all").replace("{time_window}", window_time))
        
        const res = (await Promise.allSettled(trendingTVURLs.map((url) => axios.get(url, { params: { api_key: process.env.TMDBKEY } }))))
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
        const cleanParams: searchParams = createSearchParamsObject(query, pageNumber);
        return axios.get(this.searchMultiURL, { params: cleanParams })
    }

    public async searchTV(query: any, pageNumber: number = 1) {
        const cleanParams: searchParams = createSearchParamsObject(query, pageNumber)
        return axios.get(this.searchTVURL, { params: cleanParams })
    }

    public async searchMovies(query: any, pageNumber: number = 1) {
        const cleanParams: searchParams = createSearchParamsObject(query, pageNumber);
        return axios.get(this.searchMovieURL, { params: cleanParams })
    }

    public async getMovieDetails(params: detailsParams){
        const {tmdb_id, ...info} = params;
        return axios.get(`${this.getMovieDetailsURL}${tmdb_id}`, {params: info })
    }

    public async getMovieCredits(movieId: number) {
        const resp: AxiosResponse<RetrievedMovieCredits> = await axios.get(`${this.getMovieDetailsURL}${movieId}${this.getMovieCreditsURL}`, {
            params: {
                api_key: process.env.TMDBKEY
            }
        })
        resp.data.cast.forEach((entry: MovieCredit) => entry.profile_path = `${this.profilePathing}${this.profileSize}${entry.profile_path}`)
        return resp;
    }

    public async getTVDetails(tmdb_id: number) {
        return axios.get(`${this.getTVDetailsURL}${tmdb_id}`, {
            params: {
                api_key: process.env.TMDBKEY
            }
        })
    }

    public async getEpisodeCredits(tmdb_id: number, season_number: number, episode_number: number): Promise<AxiosResponse>{
        const url = this.getTVEpisodeDetailsURL.replace("{series_id}", String(tmdb_id)).replace("{season_number}", String(season_number)).replace("{episode_number}", String(episode_number)) + "/credits"

        return axios.get(`${url}`, {
            params: {
                api_key: process.env.TMDBKEY
            }
        })
    }

    public async getSeasonDetails(tmdb_id: number, season_number: number) {
        const url = this.getSeasonDetailsURL.replace("%d", String(tmdb_id)).replace("%d", String(season_number));
        return axios.get(`${url}`, {
            params: {
                api_key: process.env.TMDBKEY
            }
        })
    }

    public async getEpisodeDetails(tmdb_id: number, season_number: number, episode_number: number): Promise<AxiosResponse>{
        const url = this.getTVEpisodeDetailsURL.replace("{series_id}", String(tmdb_id)).replace("{season_number}", String(season_number)).replace("{episode_number}", String(episode_number))
        return axios.get(`${url}`, {
            params: {
                api_key: process.env.TMDBKEY
            }
        })
    }

    public async getTMDBByEpisodeID(episode_id: number, season_num: number, ) {
        const episodeDetails = await axios.get(`${this.getTVDetailsURL}`, {
            params: {
                api_key: process.env.TMDBKEY
            }
        })
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
import axios from 'axios';
import type { detailsParams, searchParams } from '../interfaces/media.interfaces.ts';
import { createSearchParamsObject } from '../utils/param.util.ts';

export class TMDBService {
    private readonly searchMovieURL = "https://api.themoviedb.org/3/search/movie"
    private readonly getMovieDetailsURL = "https://api.themoviedb.org/3/movie/"
    private readonly searchTVURL = "https://api.themoviedb.org/3/search/tv"
    private readonly searchMultiURL = "https://api.themoviedb.org/3/search/multi"
    private readonly getMovieCreditsURL = `/credits` // getMovieDetails + ${movie_id} + getMovieCreditsURL

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
        return axios.get(`${this.getMovieDetailsURL}${movieId}${this.getMovieCreditsURL}`, {
            params: {
                api_key: process.env.TMDBKEY
            }
        })
    }
}
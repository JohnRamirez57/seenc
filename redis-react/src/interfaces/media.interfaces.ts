import type { media_type } from "@prisma/client"

export interface retrievedResult{
    adult?: boolean,
    backdrop_path?: string,
    genre_ids?: number[],
    media_type: media_type,
    original_language?: string,
    original_title?: string,
    overview: string,
    popularity: number,
    poster_path: string,
    release_date?: string,
    softcore?: string,
    id: number,
    title: string,
    name?: string,
    video?: boolean,
    vote_average?: number,
    vote_count?: number,
    first_air_date?: string
}

export interface retrievedMedia{
  page: number,
  results: retrievedResult[],
  total_pages: number,
  total_results: number
}

export interface RetrievedMovieCredits {
    id: number;
    cast: MovieCredit[];
    crew: CrewCredit[];
}

export interface MovieCredit {
    adult: boolean;
    gender: number;
    id: number;
    known_for_department: string;
    name: string;
    original_name: string;
    popularity: number;
    profile_path: string | null;
    cast_id: number;
    character: string;
    credit_id: string;
    order: number;
}

export interface CrewCredit {
    adult: boolean;
    gender: number;
    id: number;
    known_for_department: string;
    name: string;
    original_name: string;
    popularity: number;
    profile_path?: string | null;
    credit_id: string;
    department: string;
    job: string;
}

export interface TVDetails {
    adult: boolean,
    backdrop_path: string,
    created_by: CreatedByTVCredit[],
    episode_run_time: number[],
    first_air_date: string,
    genres: Genre[],
    homepage: string,
    id: number,
    in_production: boolean,
    languages: string[],
    last_air_date: string,
    last_episode_to_air: lastEpisodeAiring,
    name: string,
    next_episode_to_air: string,
    networks: Network[],
    number_of_episodes: number,
    number_of_seasons: number,
    origin_country: string[],
    original_language: string,
    original_name: string,
    overview: string,
    popularity: number,
    poster_path: string,
    production_companies: ProductionCompany[],
    production_countries: ProductionCountry[],
    seasons: Season[],
    spoken_languages: SpokenLanguage[],
    status: string,
    tagline: string,
    type: string,
    vote_average: number,
    vote_count: number
}

export interface CreatedByTVCredit {
    id: number,
    credit_id: string,
    name: string,
    gender: number,
    profile_path: string
}

export interface Genre {
    id: number,
    name: string
}

export interface lastEpisodeAiring {
    id: number,
    name: string,
    overview: string,
    vote_average: number,
    vote_count: number,
    air_date: string,
    episode_number: number,
    production_code: string,
    runtime: number,
    season_number: number,
    show_id: number,
    still_path: string
}

export interface Network {
    id: number,
    logo_path: string,
    name: string,
    origin_country: string
}

export interface ProductionCompany {
    id: number,
    logo_path: string,
    name: string,
    origin_country: string
}

export interface ProductionCountry {
    iso_3166_1: string,
    name: string
}

export interface Season {
    air_date: string,
    episode_count: number,
    id: number,
    name: string,
    overview: string,
    poster_path: string,
    season_number: number,
    vote_average: number
}

export interface SpokenLanguage {
    english_name: string,
    iso_639_1: string,
    name: string
}

export interface movieOrTvResult {
  title: string,
  poster_url?: string,
  tmdb_id: number,
  description: string,
  media_type: string,
  release_date?: Date,
  created_at: Date,
  updated_at: Date
  popularity: number
}

export interface searchParams{
    query: string,
    api_key: string,
    language: string,
    page: number,
    include_adult: boolean
}

export interface detailsParams{
    api_key: string,
    language: string,
    tmdb_id: number
}

export interface newMediaParams{
    title: string,
    media_type: media_type,
    description: string,
    poster_url: string,
    isbn?: string,
    tmdb_id: number,
    release_date: Date,
    created_at: Date,
    updated_at: Date
}

export interface addMediaParams extends newMediaParams{
    user_id: number
}

/**
 *  user_id: Joi.number().integer().min(0).required(),
    title: Joi.string().min(1).required(),
    media_type: Joi.string().min(1).required(),
    description: Joi.string().min(0).required(),
    poster_url: Joi.string().min(0).required(),
    isbn: Joi.string().min(0),
    tmdb_id: Joi.number().integer().min(0).required(),
    release_date: Joi.date(),
    created_at: Joi.date(),
    updated_at: Joi.date(),
 */
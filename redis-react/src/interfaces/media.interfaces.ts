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
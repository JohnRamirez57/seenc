import type { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { watch_status } from "@prisma/client";

export function validateBody(schema: Joi.ObjectSchema) {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const { error } = schema.validate(req.body);
        console.error("Body Params: ", req.body)
        // console.log("Error: ", error)
        if (error) {
            console.error(error.details[0].message)
            return res.status(400).json({
                error: error.details[0].message
            });
        }

        next();
    };
}

export function validateQuery(schema: Joi.ObjectSchema) {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const { error } = schema.validate(req.query);
        console.error("Query Params: ", req.query)

        if (error) {
            console.error(error.details[0].message)

            return res.status(400).json({
                error: "error.details[0].message"
            });
        }

        next();
    };
}

export const searchQuerySchema = Joi.object({
    query: Joi.string().min(1).required(),
    searchType: Joi.string().min(1).required()
})

export const searchTrendingSchema = Joi.object({
    time_window: Joi.string().required().min(3).valid("week", "day")
})

export const getDetailsSchema = Joi.object({
    tmdb_id: Joi.number().integer().min(0).required()
})

export const getCreditsSchema = Joi.object({
    tmdb_id: Joi.number().integer().min(0).required()
})

export const getSeasonEpisodesSchema = Joi.object({
    tmdb_id: Joi.number().integer().min(0).required(),
    season_number: Joi.number().integer().min(0).required(),
    starting_number: Joi.number().integer().min(0)
})

export const addMediaUnitsSchema = Joi.object({
    tmdb_id: Joi.number().integer().min(0).required(),
    season_number: Joi.number().integer().min(0),
})

export const getUserSchema = Joi.object({
    id: Joi.string().min(1).required()
})

/* 
            const description: string = req.body.description;
            const importance: number = req.body.importance;
            const tmdb_id: number = req.body.tmdb_id;
            const unit_number: number = req.body.unit_number;
            const season_number = req.query.season_number ? Number(req.query.season_number) : undefined;
*/

export const createEventSchema = Joi.object({
    description: Joi.string().min(1).required(),
    importance: Joi.number().integer().required().min(0),
    tmdb_id: Joi.number().integer().min(0).required(),
    unit_number: Joi.number().integer().required(),
    season_number: Joi.number().integer()
})

export const findEventsSchema = Joi.object({
    tmdb_id: Joi.number().integer().min(0).required(),
    unit_number: Joi.number().integer().required(),
    season_number: Joi.number().integer()
})

export const createQuestionSchema = Joi.object({
    tmdb_id: Joi.number().integer().min(0).required(),
    unit_number: Joi.number().integer().required(),
    title: Joi.string().min(1).required(),
    question: Joi.string().min(1).required(),
    answer: Joi.string().min(1),
    season_number: Joi.number().integer()
})

export const findQuestionsSchema = Joi.object({
    tmdb_id: Joi.number().integer().required().min(0),
    unit_number: Joi.number().integer().required(),
    season_number: Joi.number().integer()
})

export const logInSchema = Joi.object({
    username: Joi.string().min(1).required(),
    password: Joi.string().min(1).required()
})

export const updateLastViewedProgressSchema = Joi.object({
    tmdb_id: Joi.number().integer().min(0).required(),
    unit_number: Joi.number().integer(),
    season_number: Joi.number().integer()
})

export const updateWatchProgressSchema = Joi.object({
    tmdb_id: Joi.number().integer().min(0).required(),
    unit_number: Joi.number().integer(),
    new_status: Joi.string().valid(...Object.values(watch_status)).required(),
    season_number: Joi.number().integer(),
})

export const findKnowledgeSchema = Joi.object({
    tmdb_id: Joi.number().integer().min(0).required(),
    unit_number: Joi.number().integer().required(),
    season_number: Joi.number().integer(),
})

export const createKnowledgeSchema = Joi.object({
    tmdb_id: Joi.number().integer().min(0).required(),
    unit_number: Joi.number().integer().required(),
    category: Joi.string().valid(...Object.values(watch_status)).required(),
    content: Joi.string(),
    season_number: Joi.number().integer(),
})

export const createProgressSchema = Joi.object({
    tmdb_id: Joi.number().integer().min(0).required(),
    unit_number: Joi.number().integer().required(),
    season_number: Joi.number().integer()
})

export const getProgressSchema = Joi.object({
    tmdb_id: Joi.number().integer().min(0).required(),
    unit_number: Joi.number().integer(),
    season_number: Joi.number().integer()
})

export const signUpSchema = Joi.object({
    username: Joi.string().min(1).required(),
    password: Joi.string().min(1).required(),
    email: Joi.string().email().required()
})

export const searchMediaSchema = Joi.object({
    // mediaType: Joi.string().min(2).required(),
    search: Joi.string().min(1).required()
})

export const requireTMDBSchema = Joi.object({
    tmdb_id: Joi.number().integer().min(1).required()
})

export const addMediaSchema = Joi.object({
    user_id: Joi.number().integer().min(0).required(),
    // id: Joi.number().integer().min(0).required(),
    title: Joi.string().min(1).required(),
    media_type: Joi.string().min(1).required(),
    description: Joi.string().min(0).required(),
    poster_url: Joi.string().min(0).required(),
    isbn: Joi.string().min(0),
    tmdb_id: Joi.number().integer().min(0).required(),
    release_date: Joi.date(),
    created_at: Joi.date(),
    updated_at: Joi.date(),
})

/**
 * const payload: {
 user_id: number;
 title: string;
 poster_url?: string | undefined;
 tmdb_id: number;
 description: string;
 media_type: string;
 release_date?: Date | undefined;
 created_at: Date;
 updated_at: Date;
 popularity: number;
}
 * 
 * 
 */
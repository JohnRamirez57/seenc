import type { Request, Response, NextFunction } from "express";
import Joi from "joi";

export function validateBody(schema: Joi.ObjectSchema) {
    return (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        const { error } = schema.validate(req.body);
        // console.log("Error: ", error)
        if (error) {
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

        if (error) {
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

export const getCreditsSchema = Joi.object({
    tmdb_id: Joi.number().integer().min(0).required()
})

export const getUserSchema = Joi.object({
    id: Joi.string().min(1).required()
})

export const searchMediaSchema = Joi.object({
    // mediaType: Joi.string().min(2).required(),
    search: Joi.string().min(1).required()
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
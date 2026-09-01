import jwt, { type SignOptions } from "jsonwebtoken"
import type { Response } from "express";
const SECONDS = 60;
const MINUTES = 60;
const MILLISECONDS = 1000;
const HTTP_ONLY_STATE = true;
const SAME_SITE_MODE = "lax"
const TOKEN_NAME = "token"
const EXPECTED_NODE_ENV = "production"
export function signToken(username: string, user_id: number): string {
    // payload, then secret key, then options
    const token = jwt.sign(
        {username: username, user_id: user_id},
        process.env.JWT_SECRET_KEY!,
        {expiresIn: process.env.EXPIRES_IN_TIME as SignOptions["expiresIn"]}
    )

    return token;
}

export function createPrivateToken(username: string, password: string, email: string): string {
    const token = jwt.sign(
        {username: username, password: password, email: email},
        process.env.JWT_SECRET_KEY!,
        {expiresIn: process.env.EXPIRES_IN_TIME as SignOptions["expiresIn"]}
    )

    return token
}

export function setCookie(res: Response, token: string) {
    res.cookie(TOKEN_NAME, token, {
        maxAge: SECONDS * MINUTES * MILLISECONDS,
        httpOnly: HTTP_ONLY_STATE,
        secure: process.env.NODE_ENV === EXPECTED_NODE_ENV,
        sameSite: SAME_SITE_MODE
    })
}
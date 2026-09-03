import jwt, { type SignOptions } from "jsonwebtoken"
import type { Response, CookieOptions } from "express";
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
        {username: username, userID: user_id},
        process.env.JWT_SECRET_KEY!,
        {expiresIn: process.env.EXPIRES_IN_TIME as SignOptions["expiresIn"]}
    )

    return token;
}

export function signPersonalToken(username: string, id: number, email: string): string {
    const token = jwt.sign(
        {username: username, id: id, email: email},
        process.env.JWT_SECRET_KEY!,
        {expiresIn: process.env.EXPIRES_IN_TIME as SignOptions["expiresIn"]}
    )

    return token
}

const filledCookieDetails: CookieOptions = {
    maxAge: SECONDS * MINUTES * MILLISECONDS,
    httpOnly: HTTP_ONLY_STATE,
    secure: process.env.NODE_ENV === EXPECTED_NODE_ENV,
    path: "/",
    sameSite: SAME_SITE_MODE
}

export function setCookie(res: Response, token: string) {
    res.cookie(TOKEN_NAME, token, filledCookieDetails)
}

export function clearCookie(res: Response) {
    res.clearCookie(TOKEN_NAME, filledCookieDetails)
}
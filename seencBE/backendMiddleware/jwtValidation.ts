import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload, VerifyErrors } from "jsonwebtoken";

interface PersonalTokenPayload extends JwtPayload {
    userID: number;
    username: string;
    email: string;
}

export interface AuthenticatedRequest extends Request {
    user?: PersonalTokenPayload;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction){
    const token = req.cookies.token;
    if (!token) return res.status(401).json({error: "No token provided!"})
    jwt.verify(token, process.env.JWT_SECRET_KEY!, (error: VerifyErrors | null, decoded?: JwtPayload | string) => {
        if (error) return res.status(403).json({error: "Invalid or expired token!"})
        req.user = decoded as PersonalTokenPayload;
        next()
    })
}
// @ts-expect-error bcrypt does not provide TypeScript declarations in this project.
import bcrypt from "bcrypt"
import type { Request, Response } from "express";
import { PrismaService } from "./prisma.service";
import { clearCookie, setCookie, signToken } from "../../../seencBE/backendUtils/jwt.util.ts";
export class UserAccountService {
    private readonly prismaService: PrismaService;

    constructor() {
        this.prismaService = new PrismaService();
    }

    public signUp = async (req: Request, res: Response) => {
        try {
            if (!req.body.username || !req.body.password || !req.body.email) return res.status(400).json({error: "Username, password, and email are required!"}) 
            const username: string = req.body.username;
            const email: string = req.body.email;
            const password: string = String(req.body.password)
            await this.prismaService.checkAvailableSignUp(email, username)
            const user = await this.prismaService.createUser(email, username, password)
            const token = signToken(username, user.id)
            setCookie(res, token)
            return res.status(200).json("Successfully created account!")
        } catch (error) {
            console.error(error)
            return res.status(400).json({error: "Invalid email or password!"})
        }
    }

    public logIn = async (req: Request, res: Response) => {
        try {
            const existingToken = req.cookies?.token;
            if (existingToken) {
                return res.status(409).json({
                    error: "Already logged in. Log out first to switch accounts!"
                });
            }

            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({
                    error: "Username and password are required!"
                });
            }

            const user = await this.prismaService.findUserByName(username);

            if (!user) {
                return res.status(401).json({
                    error: "Invalid credentials!"
                });
            }

            const passwordMatches = await bcrypt.compare(
                String(password),
                user.password_hash
            );

            if (!passwordMatches) {
                return res.status(401).json({
                    error: "Invalid credentials!"
                });
            }

            const token = signToken(
                user.username,
                user.id,
            );

            setCookie(res, token);

            return res.status(200).json({
                loggedIn: true,
                username: user.username,
                id: user.id
            });

        } catch (error) {
            console.error(error);

            return res.status(500).json({
                error: "Unable to log in."
            });
        }
    };

    public signOut = async (req: Request, res: Response) => {
        clearCookie(res)
        return res.status(200).json({isAuthorized: false})
    }
}
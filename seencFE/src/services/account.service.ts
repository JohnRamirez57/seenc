import bcrypt from "bcrypt"
import type { Request, Response } from "express";
import { PrismaService } from "./prisma.service";
import { setCookie, signToken } from "../../../seencBE/backendUtils/jwt.util.ts";
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
        const existingToken = req.cookies.token;
        if (existingToken){
            try {
                // jwt.verify(existingToken, process.env.JWT_SECRET_KEY as string
                // return res.status(409).json({ error: 'Already logged in. Log out first to switch accounts.' });
                // maybe add route? backend only, no jwt in front end
            } catch (error) {
                // no need to add anything here, log in reg procedure
            }
        }
        const username = req.query.username as string;
        const password = req.query.password as string
        const user = await this.prismaService.findUserByName(username as string)
        if (!user) return res.status(401).json({error: "No users found under these credentials!"})
        if (!(await bcrypt.compare(String(password), user.password_hash))) return res.status(401).json({error: "Invalid credentials!"})

        const token = signToken(username, user.id);
        setCookie(res, token)

        return res.json({
            loggedIn: true,
            username: username
        })
    }
}
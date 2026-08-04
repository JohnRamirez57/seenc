import type { newMediaParams } from "../interfaces/media.interfaces";
import { prisma } from "../prismaClient/prisma";

export class PrismaService {
    private readonly prismaClient = prisma;

    public findUser = async (userId: number) => {
        return this.prismaClient.users.findUnique({
            where: {id: userId}
        })
    }

    public findMedia = async (tmdbId: number) => {
        return prisma.media.findUnique({
            where: {
                tmdb_id: tmdbId
            }
        })
    }

    public createMedia = async (mediaParams: newMediaParams) => {
        return prisma.media.create({
            data: mediaParams
        })
    }

    public findUserMedia = async (userId: number, mediaId: number) => {
        return prisma.user_media.findFirst({
            where: {
                user_id: userId,
                media_id: mediaId,
            },
        });
    }

    public createUserMedia = async (userId: number, mediaId: number) => {
        return prisma.user_media.create({
            data: {
                user_id: userId,
                media_id: mediaId,
            },
        });
    }

    public getUserMedia = async (userId: number | string) => {
        return prisma.media.findMany({
            where: {
            user_media: {
                some: {
                    user_id: Number(userId),
                },
            },
            },
            select: {
                title: true,
                tmdb_id: true
            },
        });
    }

    public deleteUserMedia = async (userId: number, tmdbId: number) => {
        return prisma.user_media.deleteMany({
            where: {
                user_id: userId,
                media: {
                    tmdb_id: tmdbId
                }
            }
        })
    }
}


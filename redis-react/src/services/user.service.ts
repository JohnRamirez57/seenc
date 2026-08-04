import {prisma} from "../prismaClient/prisma.ts"

export class UserService{
    public async userContainsMedia(userId: number, mediaId: number){
        return prisma.media.findFirst({
            where: {
            tmdb_id: mediaId,
            user_media: {
                some: {
                user_id: userId,
                },
            },
            },
        });
    }

    public async findUser(user_id: string | number){
        return prisma.users.findUnique({
            where: {id: Number(user_id)}
        })
    }
}
import type { newMediaParams } from "../interfaces/media.interfaces.ts";
import { PrismaService } from "./prisma.service.ts";

class Service {
    readonly prismaService: PrismaService;
    constructor(){
        this.prismaService = new PrismaService()
    }
}

export class MediaService extends Service{
    public async checkMediaExists(tmdb: number){
        return this.prismaService.findMedia(tmdb);
    }

    public async createMedia(mediaParams: newMediaParams){
        return this.prismaService.createMedia(mediaParams)
    }

    public async checkUserContainsMedia(userId: number, mediaId: number){
        return this.prismaService.findUserMedia(userId, mediaId)
    }
}

export class UserMediaService extends Service{
    public async createUserMediaTable(userId: number, mediaId: number){
        return this.prismaService.createUserMedia(userId, mediaId)
    }

    public async getAllUserMedia(userId: number | string){
        return this.prismaService.getUserMedia(userId)
    }

    public async deleteUserMedia(userId: number, mediaId: number){
        return this.prismaService.deleteUserMedia(userId, mediaId)
    }
}
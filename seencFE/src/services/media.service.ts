import { unit_type } from "@prisma/client";
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

export class MediaUnitService extends Service {
    public async checkMediaUnitExists(tmdb_id: number, unit_number: number, checkAsMovie: boolean = false) {
        return this.prismaService.findMediaUnit(tmdb_id, unit_number, checkAsMovie)
    }

    public async createMediaUnit(muParams: any) {
        return this.prismaService.createMediaUnit(muParams)
    }

    public async createMultipleMediaUnits(seasonEpisodesDetails: any[], tmdb?: number, season_num?: number){
        const tmdb_id: number = seasonEpisodesDetails[0]?.tmdb_id || tmdb || -1;
        const season_number: number = seasonEpisodesDetails[0]?.season_number || season_num || -1;
        const media = await this.prismaService.findMedia(tmdb_id);

        if (!media) {
            throw new Error("Media not found!");
        }

        let season = await this.prismaService.findTVSeason(
            media.id,
            seasonEpisodesDetails[0].season_number
        )

        season ??= await this.prismaService.createTVSeasonByTMDB(tmdb_id, season_number)

        const promiseArr: Promise<any>[] = [];

        seasonEpisodesDetails.forEach((entry: any) => {
            const data = {
                media_id: media.id,
                season_id: season?.id,
                unit_number: entry.episode_number,
                unit_type: unit_type.EPISODE,
                title: entry.name,
                overview: entry.overview,
                release_date: new Date(entry.air_date),
                tmdb_id: entry.tmdb_id
            };

            promiseArr.push(this.createMediaUnit(data));
        });

        return Promise.allSettled(promiseArr);
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
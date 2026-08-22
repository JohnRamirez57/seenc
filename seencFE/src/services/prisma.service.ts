import type { MovieCredit, newMediaParams } from "../interfaces/media.interfaces";
import type { characterParams, mediaUnitParams } from "../interfaces/prismaTables.interfaces";
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

    public findCharacterMedia = async (media_id: number, actor_id: number) => {
        return prisma.characters.findMany({
            where: {
                media_id: media_id,
                actor_id: actor_id
            }
        })
    }

    public createCharacterMedia = async (params: characterParams) => {
        return prisma.characters.create({
            data: {
                media_id: params.media_id,
                name: params.name,
                description: params.description,
                image_url: params.image_url,
                actor_id: params.actor_id,
                credit_id: params.credit_id
            }
        });
    };

    public checkCastCharacterMedia = async (
        tmdb_id: number,
        cast: MovieCredit[]
    ) => {
        const media = await this.findMedia(Number(tmdb_id))

        if (!media) {
            throw new Error(
                `Media with TMDB ID ${tmdb_id} was not found in the database.`
            );
        }

        const existingCastCharacterMedia = await prisma.characters.findMany({
            where: {
                media_id: media.id
            }
        });

        const existingMediaActorID = new Set<number>(
            existingCastCharacterMedia.map(
                (character) => character.actor_id
            )
        );

        const newCast: MovieCredit[] = cast.filter(
            (actor) => !existingMediaActorID.has(actor.id)
        );

        if (newCast.length === 0) {
            console.log("No new characters to add.");
            return;
        }

        const characterPromises = newCast.map(
            (actorCredit: MovieCredit) => {
                const createCharacterParams: characterParams = {
                    media_id: media.id,
                    name: actorCredit.character,
                    description: actorCredit.name,
                    image_url: actorCredit.profile_path,
                    actor_id: actorCredit.id,
                    credit_id: actorCredit.credit_id
                };

                return this.createCharacterMedia(
                    createCharacterParams
                );
            }
        );

        await Promise.allSettled(characterPromises);

        console.log(
            `Added ${newCast.length} new character(s) to media ${media.id}.`
        );
    };

    public getCharacterMedias = async (media_id: number) => {
        return prisma.characters.findMany({
            where: {
                media_id: Number(media_id)
            },
            select: {
                name: true
            }
        })
    }

    public createTVSeason = async (media_id: number, season_number: number, overview: string = "", poster_url: string) => {
        return prisma.seasons.create({
            data: {
                media_id: media_id,
                season_number: season_number,
                overview: overview,
                poster_url: poster_url
            }
        })
    }

    public createMediaUnit = async (muParams: mediaUnitParams) => {
        return prisma.media_unit.create({
            data: {
                media_id: muParams.media_id,
                season_id: muParams.season_id,
                unit_number: muParams.unit_number,
                unit_type: muParams.unit_type,
                title: muParams.title,
                overview: muParams.overview,
                release_date: muParams.release_date,
                tmdb_id: muParams.tmdb_id
            }
        })
    }
}


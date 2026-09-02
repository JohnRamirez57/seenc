import type { MovieCredit, newMediaParams } from "../interfaces/media.interfaces";
// import type { characterParams, mediaUnitParams } from "../interfaces/media.interfaces.ts";
import { prisma } from "../prismaClient/prisma";
import { formatPosterPathing } from "../utils/format.util";
import { validateEmail } from "../utils/validate.util";
import { TMDBService } from "./tmdb.service";
import bcrypt from 'bcrypt';
const saltRounds = 10;

export class PrismaService {
    private readonly prismaClient = prisma;
    private readonly tmdbService = new TMDBService();

    public createUser = async (email: string, username: string, password: string) => {
        const passwordHash = await bcrypt.hash(password, saltRounds)
        return this.prismaClient.users.create({
            data: {
                created_at: new Date(),
                email: email,
                username: username,
                password_hash: passwordHash
            }
        })
    }

    public findUser = async (userId: number) => {
        return this.prismaClient.users.findUnique({
            where: {id: userId}
        })
    }

    public async checkAvailableSignUp(email: string, username: string): Promise<boolean | Error> {
        if (!validateEmail(email)) throw new Error("Invalid email.")
        if ((await this.findUserByName(username)) !== null) throw new Error("Username already in use!")
        if ((await this.findUserByEmail(email)) !== null) throw new Error("Email already in use!")
        return true;
    }

    public findUserByName = async (username: string) => {
        return this.prismaClient.users.findUnique({
            where: {username: username}
        })
    }

    public findUserByEmail = async (email: string) => {
        return this.prismaClient.users.findUnique({
            where: {
                email: email
            }
        })
    }

    public findMedia = async (tmdbId: number) => {
        return prisma.media.findUnique({
            where: {
                tmdb_id: tmdbId
            }
        })
    }

    public findMediaUnit = async (tmdb_id: number, unit_number: number) => {
        return prisma.media_unit.findFirst({
            where: {
                tmdb_id: tmdb_id,
                unit_number: unit_number
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

    public createCharacterMedia = async (params: any) => {
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
                const createCharacterParams: any = {
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

    public createTVSeasonByTMDB = async (tmdb_id: number, season_number: number) => {
        const media = await this.findMedia(tmdb_id);
        if (!media) throw new Error("Error finding media!")
        const TVSeriesDetails = await this.tmdbService.getTVDetails(tmdb_id)
        const seasonDetails = await this.tmdbService.getSeasonDetails(tmdb_id, season_number)
        if (!TVSeriesDetails || !seasonDetails) throw new Error("Error retrieving TV details!")
        return await this.createTVSeason(media.id, season_number, TVSeriesDetails.data.overview, formatPosterPathing(seasonDetails?.data?.episodes[0]?.still_path || "")!)
    }

    public findTVSeason = async (media_id: number, season_number: number) => {
        return prisma.seasons.findFirst({
            where: {
                media_id: media_id,
                season_number: season_number
            }
        })
    }

    // public getOrCreateTVMediaUnitBySeason = async (tmdb_id: number, season_number: number) => {
    //     const specificMedia = (await prisma.media.findFirst({
    //         where: {
    //             tmdb_id: tmdb_id
    //         }
    //     }))
    //     if (!specificMedia) throw new Error("No Media Found!")
    //     // console.error("Specific Media: ", specificMedia)
    //     // console.error("Specific Season: ", season_number)
    //     let specificSeason = await this.findTVSeason(specificMedia.id, season_number)
    //     if (!specificSeason) {
    //         let details = (await this.tmdbService.getSeasonDetails(tmdb_id, season_number))
    //         if (details.status != 200) throw new Error("Error getting season details!")
    //         specificSeason = await this.createTVSeason(specificMedia.id, season_number, details.data.overview, details.data.poster_url)
    //     }
    //     // let TVMediaUnit = await prisma.media_unit.findFirst({
    //     //     where: {
    //     //         tmdb_id: tmdb_id,
    //     //         season_id: specificSeason.id
    //     //     }
    //     // })
    //     // TVMediaUnit ??= await this.createMediaUnit({
    //     //         media_id: specificMedia.id,
    //     //         season_id: specificSeason.id,
    //     //         unit_number: season_number,
    //     //         unit_type: unit_type.EPISODE,
    //     //         title: specificMedia.title,
    //     //         overview: specificSeason.overview,
    //     //         release_date: specificMedia.release_date,
    //     //         tmdb_id: specificMedia.tmdb_id
    //     //     })
    //     return TVMediaUnit;
    // }

    public createMediaUnit = async (muParams: any) => {
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


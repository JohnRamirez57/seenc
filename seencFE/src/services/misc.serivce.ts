import { formatPosterPathing } from "../utils/format.util";
import { PrismaService } from "./prisma.service";
import { TMDBService } from "./tmdb.service";
import type { RetrievedMovieCredits } from "../interfaces/media.interfaces";
import { MediaUnitService } from "./media.service";
import { watch_status } from "@prisma/client";
import { handleError } from "../utils/error.util";

export class MiscService {
    private readonly prisma: PrismaService;
    private readonly tmdb: TMDBService;
    private readonly mediaUnit: MediaUnitService;

    constructor(){
        this.prisma = new PrismaService()
        this.tmdb = new TMDBService();
        this.mediaUnit = new MediaUnitService();
    }

    public updateProgressWatchStatus = async (user_id: number, tmdb_id: number, ep_num: number, new_status: watch_status, season_num?: number) => {
        const userProgress = await this.getUserProgress(user_id, tmdb_id, ep_num, season_num);
        if (!userProgress) return false;
        await this.prisma.updateUserProgressWatchStatus(userProgress.id, new_status)
        return true;
    }

    public updateLastViewedProgress = async (user_id: number, tmdb_id: number, ep_num: number, season_num?: number) => {
        const userProgress = await this.getUserProgress(user_id, tmdb_id, ep_num, season_num);
        if (!userProgress) return false;
        await this.prisma.updateUserLastViewedProgress(userProgress.id, new Date())
        return true;
    }

    public getUserProgress = async (user_id: number, tmdb_id: number, ep_num: number, season_num?: number) => {
        const media = await this.prisma.findMedia(tmdb_id);
        // console.error("Media: ", media)
        if (!media) throw new Error("Media doesn\'t exist")
        const isMovie: boolean = ep_num === -1;
        const seasonId = await this.resolveSeasonId(media.id, season_num, isMovie);
        const currUnit = await this.prisma.findMediaUnit(tmdb_id, ep_num, isMovie, seasonId);
        
        const foundUserProg = await this.prisma.findUserProgress(user_id, media.id, currUnit?.id)
        if (!foundUserProg) return null;
        return foundUserProg;       
    }

    public createUserProgress = async (uID: number, tmdbID: number, unit_number: number, season_num?: number) => {
        try {
            const user_id = Number(uID)
            const tmdb_id = Number(tmdbID);
            const media = await this.prisma.findMedia(tmdb_id);
            if (!media) return new Error("Media not found")
            // movies have NULL as unit_number, so -1 indicates NULL
            const isMovie = unit_number === -1;
            const seasonId = await this.resolveSeasonId(media.id, season_num, isMovie);
            const unit = await this.prisma.findMediaUnit(tmdb_id, unit_number, isMovie, seasonId);
            if (!unit) return new Error("Media unit not found")
            const existingProgress = await this.prisma.findUserProgress(user_id, media.id);
            if (existingProgress) {
                return this.prisma.updateUserProgressUnit(existingProgress.id, unit.id);
            }
            const progressData = {
                user_id,
                media_id: media.id,
                last_viewed: new Date(),
                current_unit_id: unit.id,
                status: watch_status.WATCHING,
            }

            const newProg = await this.prisma.createUserProgress(progressData)
            if (!newProg) return new Error("Error making user progress!")

            return (newProg)
        } catch (error) {
            return new Error(handleError(error))
        }
    }

    private resolveSeasonId = async (mediaId: number, seasonNumber: number | undefined, isMovie: boolean) => {
        if (isMovie || seasonNumber === undefined || seasonNumber < 1) return undefined;
        const season = await this.prisma.findTVSeason(mediaId, seasonNumber);
        return season?.id;
    }

    public async createCharacterAppearancesFromTV(
        tmdb: number,
        season: number
    ) {
        const tmdb_id = Number(tmdb);
        const season_number = Number(season);

        const seasonDetails = (
            await this.tmdb.getSeasonDetails(tmdb_id, season_number)
        ).data;

        const max_episodes = seasonDetails.episodes.length;

        const mediaUnitPromises: Array<Promise<{
            epNum: number;
            mediaUnit: Awaited<ReturnType<PrismaService["findMediaUnit"]>>;
        }>> = [];

        for (let epNum = 1; epNum <= max_episodes; epNum++) {
            mediaUnitPromises.push(
                this.prisma
                    .findMediaUnit(tmdb_id, epNum)
                    .then((mediaUnit) => ({
                        epNum,
                        mediaUnit
                    }))
            );
        }

        const mediaUnitResults = await Promise.allSettled(mediaUnitPromises);

        mediaUnitResults
            .filter((result) => result.status === "rejected")
            .forEach((result) => {
                console.error(
                    "Failed to retrieve media unit:",
                    result.reason
                );
            });

        const settledMediaUnits = mediaUnitResults
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value)
            .filter((entry) => entry.mediaUnit !== null);

        if (settledMediaUnits.length === 0) {
            throw new Error(
                `No media units found for TMDB ${tmdb_id}, season ${season_number}`
            );
        }

        const mediaUnitByEpisode = new Map(
            settledMediaUnits.map((entry) => [
                entry.epNum,
                entry.mediaUnit
            ])
        );

        const seasonEpisodeResults =
            await this.tmdb.getSeasonEpisodesDetails(
                tmdb_id,
                season_number,
                max_episodes
            );

        const seasonEpisodesDetails = seasonEpisodeResults
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value.data);

        if (seasonEpisodesDetails.length === 0) {
            throw new Error(
                `No episode details found for season ${season_number}`
            );
        }

        const episodeCreditPromises = seasonEpisodesDetails.map(
            (episode) =>
                this.tmdb
                    .getEpisodeCredits(
                        tmdb_id,
                        season_number,
                        episode.episode_number
                    )
                    .then((credits) => ({
                        epNum: episode.episode_number,
                        credits
                    }))
        );

        const creditResults =
            await Promise.allSettled(episodeCreditPromises);

        creditResults
            .filter((result) => result.status === "rejected")
            .forEach((result) => {
                console.error(
                    "Failed to retrieve episode credits:",
                    result.reason
                );
            });

        const settledCreditData = creditResults
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value);

        settledCreditData.forEach((episodeCredit) => {
            formatPosterPathing(episodeCredit.credits.data);
        });

        const characterPromises = settledCreditData.map(
            (episodeCredit) =>
                this.prisma
                    .checkOrCreateCharacterMedia(
                        tmdb_id,
                        [
                            ...episodeCredit.credits.data.cast,
                            ...episodeCredit.credits.data.guest_stars
                        ]
                    )
                    .then((characters) => ({
                        epNum: episodeCredit.epNum,
                        characters
                    }))
        );

        const characterResults =
            await Promise.allSettled(characterPromises);

        characterResults
            .filter((result) => result.status === "rejected")
            .forEach((result) => {
                console.error(
                    "Failed to create/find episode characters:",
                    result.reason
                );
            });

        const returnedSeasonEpisodesCharacters = characterResults
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value);

        await Promise.all(
            returnedSeasonEpisodesCharacters.map(async (episode) => {

                const mediaUnit =
                    mediaUnitByEpisode.get(episode.epNum);

                if (!mediaUnit) {
                    throw new Error(
                        `Media unit not found for ` +
                        `S${season_number}E${episode.epNum}`
                    );
                }

                const existingAppearances =
                    await this.prisma.getCharacterAppearances(
                        mediaUnit.id
                    );

                const existingCharacterIds = new Set(
                    existingAppearances.map(
                        (appearance) =>
                            appearance.character_id
                    )
                );

                const missingCharacters =
                    episode.characters.filter(
                        (character) =>
                            !existingCharacterIds.has(character.id)
                    );

                if (missingCharacters.length === 0) {
                    return;
                }

                await Promise.all(
                    missingCharacters.map((character) =>
                        this.prisma.createCharacterAppearance(
                            mediaUnit.id,
                            character.id
                        )
                    )
                );
                console.log(`Added ${missingCharacters.length} new characters`)
            })
        );
    }

    public  async createCharacterAppearancesFromMovie(tmdb: number){          
        const tmdb_id = Number(tmdb);

        const creditsDetails: RetrievedMovieCredits = (await this.tmdb.getMovieCredits(tmdb_id)).data
        formatPosterPathing(creditsDetails)

        const movieMU = await this.mediaUnit.checkMediaUnitExists(tmdb_id, -1, true);
        if (!movieMU) return new Error("No media unit found!")
        
        const returnedCharacters = await this.prisma.checkOrCreateCharacterMedia(tmdb_id, creditsDetails.cast)

        const existingCharacterAppearances = await this.prisma.getCharacterAppearances(movieMU.id);
        const existingAppearanceKeys = (new Set(existingCharacterAppearances.map((char) => char.character_id)))

        const missingCharacterAppearances = returnedCharacters.filter((char) => !existingAppearanceKeys.has(char.id)) 

        if (missingCharacterAppearances.length === 0) {
            console.log("No new character appearances to add.");
            return existingCharacterAppearances;
        }

        await Promise.all(
            missingCharacterAppearances.map((character) =>
                this.prisma.createCharacterAppearance(movieMU.id, character.id)
            )
        )
    }
}

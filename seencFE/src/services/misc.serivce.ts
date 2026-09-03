import { formatPosterPathing } from "../utils/format.util";
import { PrismaService } from "./prisma.service";
import { TMDBService } from "./tmdb.service";
import type { EpisodeCredits, RetrievedMovieCredits } from "../interfaces/media.interfaces";
import { MediaUnitService } from "./media.service";

export class MiscService {
    private readonly prisma: PrismaService;
    private readonly tmdb: TMDBService;
    private readonly mediaUnit: MediaUnitService;

    constructor(){
        this.prisma = new PrismaService()
        this.tmdb = new TMDBService();
        this.mediaUnit = new MediaUnitService();
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

        const mediaUnitPromises = [];

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
import { media_type } from "@prisma/client"
import type { MovieCredit, movieOrTvResult, retrievedMedia, RetrievedMovieCredits as retrievedMovieCredits, retrievedResult } from "../interfaces/media.interfaces"
import type { AxiosResponse } from "axios";

const posterImagePath = "https://image.tmdb.org/t/p/w500"
const backupPoster = "https://placehold.net/400x600.png"

function determineMediaType(mediaType: string){
    mediaType = mediaType.toLocaleLowerCase();
    if (mediaType === "tv") return media_type.TV;
    if (mediaType === "movie") return media_type.MOVIE;
    if (mediaType === "book") return media_type.BOOK;
    throw new Error(`Unknown media type: ${mediaType}`);
}

export function formatMultiResults(data: retrievedMedia){
    // console.error(data.results)
    data.results = data.results.filter((entry) => entry.media_type.toLocaleUpperCase() in media_type);
    data.results = data.results.map((entry: retrievedResult) => (
        {...entry, poster_path: entry.poster_path != null ? posterImagePath + entry.poster_path : backupPoster, media_type: determineMediaType(entry.media_type)}
    ))
}

export function formatPosterPathing(data: any, seen: WeakSet<object> = new WeakSet()): any {
    if (!data) return backupPoster

    if (typeof data === "string") {
        if (data.length === 0) return backupPoster
        return data.startsWith("http") ? data : posterImagePath + data
    }

    if (Array.isArray(data)) {
        if (seen.has(data)) return data
        seen.add(data)
        return data.map((entry) => formatPosterPathing(entry, seen))
    }

    if (typeof data === "object") {
        if (seen.has(data)) return data
        seen.add(data)
        Object.keys(data).forEach((key) => {
            if (["poster_path", "still_path", "profile_path"].includes(key)) {
                data[key] = formatPosterPathing(data[key], seen)
            } else if (data[key] && typeof data[key] === "object") {
                data[key] = formatPosterPathing(data[key], seen)
            }
        })
    }

    return data
}

export function extractSuccessfulResponses<T>(
    data: PromiseSettledResult<T>[]
    ): PromiseFulfilledResult<T>[] {
    return data.filter(
        (entry): entry is PromiseFulfilledResult<T> =>
        entry.status === "fulfilled"
    );
}

export function formatMediaResult(resp: retrievedMedia): movieOrTvResult[] {
    return resp.results.map((entry: retrievedResult) => {
            const releaseDate = entry?.release_date ?? entry?.first_air_date ?? new Date().toISOString();

            return {
                title: entry.title ?? entry.name ?? "Untitled",
                poster_url: entry?.poster_path,
                tmdb_id: entry.id,
                description: entry.overview,
                media_type: entry.media_type,
                release_date: releaseDate,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                popularity: entry.popularity
            };
          }).toSorted((a: movieOrTvResult, b: movieOrTvResult) => b.popularity - a.popularity);
}

export function formatMovieResults(data: retrievedMedia){
    formatMultiResults(data)
}
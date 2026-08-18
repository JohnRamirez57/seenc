import { media_type } from "@prisma/client"
import type { MovieCredit, retrievedMedia, RetrievedMovieCredits as retrievedMovieCredits, retrievedResult } from "../interfaces/media.interfaces"

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
    data.results = data.results.map((entry: retrievedResult) => (
        {...entry, poster_path: entry.poster_path != null ? posterImagePath + entry.poster_path : backupPoster, media_type: determineMediaType(entry.media_type)}
    ))
}

export function formatPosterPathing(data: any) {
    if (typeof data === "object"){
        fixPosterPathing(data)
    } else {
        data.map((entry: any) => fixPosterPathing(entry))
    }
}

function fixPosterPathing(data: any) {
    data.poster_path &&= posterImagePath + data.poster_path;
    data.still_path &&= posterImagePath + data.still_path;
}

export function formatMovieResults(data: retrievedMedia){
    formatMultiResults(data)
}
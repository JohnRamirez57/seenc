import "dotenv/config";
import type { searchParams } from "../interfaces/media.interfaces";

const baseLanguage = "en-US";
const baseResultPage = 1;
const defaultIncludeAdult = true;

export function createSearchParamsObject(query: string, pageNumber: number = baseResultPage): searchParams {
    const tmdbKey = process.env.TMDBKEY ?? process.env.VITE_TMDBKEY ?? "";

    return {
        api_key: tmdbKey,
        query,
        language: baseLanguage,
        page: pageNumber,
        include_adult: defaultIncludeAdult
    };
}


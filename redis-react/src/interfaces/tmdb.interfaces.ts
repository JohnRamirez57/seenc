import type { AxiosResponse } from "axios";
import type { retrievedMedia } from "./media.interfaces";

export type searchFn = (
    query: string | undefined,
    pageNumber?: number
) => Promise<AxiosResponse<retrievedMedia>>

export const searchTMDBType = Object.freeze({
    MOVIE: "movie",
    TV: "tv",
    MULTI: "multi"
})
import axios from "axios";
export function handleError(error: unknown): string{
    if (axios.isAxiosError(error)) {
        return error.message
    }

    if (error instanceof Error) {
        return error.message
    }

    return "Unknown error"
}
import axios from "axios";
export function handleError(error: unknown): string{
    if (axios.isAxiosError(error)) {
        console.error(error.message)
        return error.message
    }

    if (error instanceof Error) {
        console.error(error.message)
        return error.message
    }

    console.error("Unknown error found!")
    return "Unknown error"
}
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { config } from "dotenv"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
config({ path: resolve(__dirname, "../../../.env") })

const normalizeDatabaseUrl = (databaseUrl?: string) => {
    if (!databaseUrl) {
        throw new Error("DATABASE_URL is not defined.")
    }

    try {
        const parsedUrl = new URL(databaseUrl)

        if (parsedUrl.username && parsedUrl.password) {
            parsedUrl.password = encodeURIComponent(parsedUrl.password)
        }

        return parsedUrl.toString()
    } catch {
        return databaseUrl
    }
}

const adapter = new PrismaPg({
    connectionString: normalizeDatabaseUrl(process.env.DATABASE_URL)
})

export const prisma = new PrismaClient({
    adapter
})

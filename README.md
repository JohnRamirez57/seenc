# Seenc

Seenc is a media tracker and spoiler-aware story companion for movies and television. It gives users one place to discover titles, maintain a personal library, record watch progress, and ask questions about a story without receiving information from beyond their current point.

The long-term goal is to make following a story feel continuous. A user should be able to stop after an episode, return later, and ask why something happened based only on what they have already watched. Seenc combines media metadata, saved progress, web research, and AI-generated answers to support that experience.

The project is in active development. The main movie and television workflow is functional. Book support and deeper structured story knowledge are represented in the database but are not complete user features yet.

## Current Features

### Media browsing

- A Discover page with a featured title, trending movies and series, filters, and media shelves
- Search across movies and television through The Movie Database API
- Media detail views with artwork, descriptions, release information, cast data, and library controls
- Loading, empty, and error states for the main browsing flows
- A responsive interface with keyboard support and reduced-motion handling

The visual direction combines cinematic browsing with an original menu-driven style influenced by the energy and motion of Persona 3 Reload and Persona 5. The interface uses strong type, angled composition, deliberate transitions, and a restrained blue and neutral palette without copying game artwork or exact menus.

### Accounts and personal libraries

- Account creation, login, logout, and session restoration
- Password hashing with bcrypt
- JWT authentication stored in an HTTP-only cookie
- Protected library, progress, and chat routes
- Add and remove movies or series from a personal library
- Watch states for watching, completed, paused, dropped, and planned titles
- Episode-level progress for television and full-film completion for movies
- Continue Watching sections on the Discover and Library pages

### Spoiler-aware questions

Signed-in users can ask questions from the My Chats section. Before an answer is generated, Seenc checks that the title is in the user's library and that the requested movie or episode is within the user's saved progress.

The question flow currently uses:

1. Tavily to find and extract sources related to the title and story boundary.
2. Gemini to answer from those sources while following the saved spoiler boundary.
3. PostgreSQL to save the question, answer, source list, user, and related media unit.

If broad research does not support an answer, Seenc performs a second search focused on the user's question. Completed movies allow facts from the full film. Television answers are limited to the selected season and episode. Provider safety blocks are handled separately from spoiler boundaries.

The My Chats interface groups saved questions by title. Users can search the archive, filter it by movie, series, or existing history, move through chat slots with the keyboard, and reopen the source links attached to an answer.

### Redis caching

Redis reduces repeated requests to external services and continues to fail safely when the cache is unavailable.

- Tavily research sources are cached for 6 hours.
- TMDB search, trending, and popular results are cached for 15 minutes.
- TMDB details, seasons, episodes, and credits are cached for 24 hours.
- Concurrent requests in one backend process share the same provider request.
- Cache keys are hashed and do not contain API credentials.

User accounts, library membership, watch progress, and generated chat answers are not cached. These records continue to use PostgreSQL so authorization and progress checks use current data.

## Project Structure

```text
seencBE/
  backend.ts                 Express server entry point
  backendMiddleware/         JWT authentication middleware
  backendUtils/              Cookie and token helpers

seencFE/
  client/                    Browser API client and shared response types
  prisma/                    PostgreSQL schema
  public/                    Static assets
  src/components/            Shared interface components
  src/pages/                 Discover, Search, Library, and My Chats pages
  src/routes/                Express route definitions
  src/controllers/           Request handling
  src/services/              Prisma, TMDB, AI, account, media, and Redis logic
  src/toolkit/               Redux store and slices
  docker-compose.yml         Local Redis service
```

The Express entry point is in `seencBE`, while most routes, controllers, and services currently live under `seencFE/src`. This reflects the project's current development structure and may be separated more clearly as the codebase matures.

## Technology

- Frontend: React, TypeScript, Redux Toolkit, Tailwind CSS, and Vite
- Backend: Node.js, Express, TypeScript, Axios, and Joi
- Database: PostgreSQL with Prisma
- Authentication: JWT, HTTP-only cookies, and bcrypt
- Media data: TMDB
- Research and answers: Tavily and Gemini
- Cache: Redis with Docker Compose for local development

## Local Setup

Seenc currently expects Node.js, PostgreSQL, Docker, and API credentials for TMDB, Tavily, and Gemini.

Create a `.env` file at the repository root:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/seenc?schema=public
TMDBKEY=your_tmdb_key
LOCAL_HOST=http://localhost:5173
EXPIRES_IN_TIME=1h
JWT_SECRET_KEY=your_random_secret
NODE_ENV=development

TAVILY_API_KEY=your_tavily_key
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-3.5-flash-lite

REDIS_URL=redis://127.0.0.1:6379
REDIS_ENABLED=true
```

Install dependencies in both application folders:

```powershell
cd seencFE
npm install

cd ../seencBE
npm install
```

Start Redis from the repository root:

```powershell
docker compose -f seencFE/docker-compose.yml up -d
```

Start the backend:

```powershell
cd seencBE
npm start
```

Start the frontend in another terminal:

```powershell
cd seencFE
npm run dev
```

Vite serves the frontend at `http://localhost:5173` and proxies `/api` requests to the Express server at `http://localhost:3000`.

## Current Development Status

The core movie and television experience is connected from the interface through the database and external services. Current work is centered on making progress tracking and spoiler boundaries more reliable, improving research quality, and refining the chat experience.

The database already includes models for characters, appearances, events, knowledge entries, questions, seasons, and media units, along with media types and fields intended for books. Routes also exist for reading and creating event and knowledge records. These pieces provide the foundation for a richer story model, but the full ingestion process and user-facing experience for them are still in development.

Planned work includes:

- More reliable episode and season progress controls
- Better source ranking and verification for specific scene questions
- Structured context from characters, events, relationships, locations, mysteries, and objects
- A complete book metadata and chapter progress workflow
- Further accessibility and mobile interface refinement
- Clearer separation between frontend and backend code

Seenc is not deployed as a finished product yet. It is a working full-stack project whose central library, progress, research, chat, and caching systems are now in place.

# Seenc

Seenc is a full-stack media tracking platform designed to help users keep track of what they watch and eventually ask spoiler-aware questions about the stories they are following.

The project is currently in active development, with most of my focus on completing the backend architecture and data pipeline before building out the final frontend experience.

## Current Progress

### Backend — Mostly Complete

The backend is built with **TypeScript, Node.js, Express, PostgreSQL, and Prisma** and currently supports:

- User account creation, login, logout, and session restoration
- JWT authentication using HTTP-only cookies
- Protected user routes and personalized media libraries
- TMDB-powered movie and TV search
- Movie, season, episode, cast, and character metadata retrieval
- PostgreSQL storage for users, media, seasons, episodes, characters, and user-media relationships
- Automatic creation and reuse of existing media/character records
- Episode-level character appearance processing
- Input validation and modular route/controller/service organization

I am currently finishing the remaining backend relationships and logic for areas such as user progress, character appearances, events, knowledge records, and questions.

### Frontend — In Progress

The frontend uses **React, TypeScript, Redux Toolkit, Tailwind CSS, and Vite**.

Current frontend work is focused on authentication state and connecting the UI to the backend. The larger interface will be developed once the core backend behavior is stable.

## Project Vision

The final goal is for Seenc to support **TV shows, movies, and books** through a personalized media library with detailed progress tracking.

A major planned feature is an AI-powered question system that understands how far a user has progressed through a story.

For example, a user could ask:

> "Why did this character do that?"

Seenc would use the user's current episode or chapter to answer using only information they should already know, while warning them when an answer has not yet been revealed.

Planned features include:

- Episode and chapter-level progress tracking
- Spoiler-aware AI question answering
- Story knowledge organized by characters, events, relationships, locations, mysteries, and objects
- Context retrieval from PostgreSQL
- Redis caching for repeated lookups and AI-assisted search correction
- Support for movies, TV shows, and books
- A polished responsive media library and progress dashboard

## Tech Stack

**Frontend:** React, TypeScript, Redux Toolkit, Tailwind CSS, Vite  
**Backend:** Node.js, Express, TypeScript  
**Database:** PostgreSQL, Prisma  
**APIs:** TMDB, future AI integration  
**Other:** Redis, JWT, bcrypt, Axios, Joi

## Status

**In Development**
(expected to be finished before October)

The backend is nearing completion. Current development is focused on finishing the remaining database-backed features before shifting more heavily toward the frontend and AI retrieval system.

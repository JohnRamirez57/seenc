import type { knowledge_category } from "@prisma/client";
import { PrismaService } from "./prisma.service.ts";



export class InquisitionService { 
    private readonly prisma;

    constructor() {
        this.prisma = new PrismaService();
    }

    public createEvent = async (description: string, importance: number, tmdb_id: number, unit_number: number, season_number?: number) => {
        const season_id = season_number ? await this.retrieveSeasonID(season_number, tmdb_id) : season_number;
        const checkAsMovie = unit_number === -1;
        const unit = await this.prisma.findMediaUnit(tmdb_id, unit_number, checkAsMovie, season_id)
        if (!unit) throw new Error("Error finding unit!")
        const event = await this.prisma.createEventUnit(unit.id, description, importance)
        return event;
    }

    public findEvents = async (tmdb_id: number, unit_number: number, season_number?: number) => {
        const season_id = season_number ? await this.retrieveSeasonID(season_number, tmdb_id) : season_number;
        const checkAsMovie = unit_number === -1;
        const unit = await this.prisma.findMediaUnit(tmdb_id, unit_number, checkAsMovie, season_id)
        if (!unit) throw new Error("Error finding unit!")
        const eventUnits = await this.prisma.findEventUnits(unit.id)
        return eventUnits;
    }

    private retrieveSeasonID = async (season_number: number, tmdb_id: number) => {
        const media = await this.prisma.findMedia(tmdb_id);
        if (!media) return;
        const season = await this.prisma.findTVSeason(media.id, season_number);
        if (!season) return;
        return season.id;
    }

    public createQuestion = async (user_id: number, tmdb_id: number, unit_number: number, title: string, question: string, answer?: string, season_number?: number) => {
       const checkAsMovie = unit_number == -1;
       const season_id = season_number ? await this.retrieveSeasonID(season_number, tmdb_id) : season_number;
        const unit = await this.prisma.findMediaUnit(tmdb_id, unit_number, checkAsMovie, season_id);
        if (!unit) throw new Error("Error finding media unit!")
        await this.prisma.createQuestionUnit(title, user_id, unit.id, question, answer)
    }

    public findQuestions = async (user_id: number, tmdb_id: number, unit_number: number, season_number?: number) => {
        const checkAsMovie = unit_number === -1;
        const season_id = season_number ? await this.retrieveSeasonID(season_number, tmdb_id) : season_number;

        const unit = await this.prisma.findMediaUnit(tmdb_id, unit_number, checkAsMovie, season_id)
        if (!unit) throw new Error("Error finding unit!")
        const questionUnits = await this.prisma.findQuestionUnits(user_id, unit.id);
        return questionUnits;
    }

    public findLibraryQuestions = async (user_id: number) => {
        return this.prisma.findLibraryQuestionUnits(user_id)
    }

    public findKnowledgeUnit = async (tmdb_id: number, unit_number: number, season_number?: number) => {
        const checkAsMovie = unit_number == -1;
        const season_id = season_number ? await this.retrieveSeasonID(season_number, tmdb_id) : season_number;

        const unit = await this.prisma.findMediaUnit(tmdb_id, unit_number, checkAsMovie, season_id);
        if (!unit) throw new Error("Error finding unit!")
        
        const knowledge = await this.prisma.findKnowledgeUnit(unit.id)
        if (!knowledge) throw new Error("Error finding knowledge unit!")
        return knowledge;
    }

    public createKnowledgeUnit = async (tmdb_id: number, unit_number: number, category: knowledge_category, content: string, season_number?: number) => {
        // need unit_id, knowledge_category (prisma type), content (string)
        const checkAsMovie = unit_number === -1;
        const season_id = season_number ? await this.retrieveSeasonID(season_number, tmdb_id) : season_number;
        const unit = await this.prisma.findMediaUnit(tmdb_id, unit_number, checkAsMovie, season_id);
        if (!unit) throw new Error("Error finding unit!");
        const knowledgeUnit = await this.prisma.createKnowledgeUnit(unit.id, category, content);
        if (!knowledgeUnit) throw new Error("Error creating knowledge unit!");
        return knowledgeUnit;
    }
}

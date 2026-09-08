import type { knowledge_category } from "@prisma/client";
import { PrismaService } from "./prisma.service.ts";

export class InquisitionService { 
    private readonly prisma;

    constructor() {
        this.prisma = new PrismaService();
    }

    public findKnowledgeUnit = async (tmdb_id: number, unit_number: number, season_num?: number) => {
        const checkAsMovie = unit_number == -1;
        let season_id;
        if (season_num) {
            const media = await this.prisma.findMedia(tmdb_id);
            if (!media) throw new Error("Error finding media.")
            const season = await this.prisma.findTVSeason(media.id, season_num)
            if (!season) throw new Error("Error finding season!")
            season_id = season.id;
        }

        const unit = await this.prisma.findMediaUnit(tmdb_id, unit_number, checkAsMovie, season_id);
        if (!unit) throw new Error("Error finding unit!")
        
        const knowledge = await this.prisma.findKnowledgeUnit(unit.id)
        if (!knowledge) throw new Error("Error finding knowledge unit!")
        return knowledge;
    }

    public createKnowledgeUnit = async (tmdb_id: number, unit_number: number, category: knowledge_category, content: string, season_number?: number) => {
        // need unit_id, knowledge_category (prisma type), content (string)
        const checkAsMovie = unit_number === -1;
        let season_id;
        if (season_number){
            const media = await this.prisma.findMedia(tmdb_id);
            if (!media) throw new Error("Error finding media!");
            const season = await this.prisma.findTVSeason(media.id, season_number)
            if (!season) throw new Error("Error finding season")
            season_id = season.id;
        }
        const unit = await this.prisma.findMediaUnit(tmdb_id, unit_number, checkAsMovie, season_id);
        if (!unit) throw new Error("Error finding unit!");
        const knowledgeUnit = await this.prisma.createKnowledgeUnit(unit.id, category, content);
        if (!knowledgeUnit) throw new Error("Error creating knowledge unit!");
        return knowledgeUnit;
    }
}
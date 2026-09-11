export interface AskQuestionInput {
    tmdb_id: number;
    unit_number: number;
    season_number?: number;
    question: string;
}

export interface ResearchSource {
    title: string;
    url: string;
    content: string;
}

export interface AskQuestionResult {
    question_id: number;
    answer: string;
    sources: Array<Pick<ResearchSource, "title" | "url">>;
    boundary: {
        media_type: string;
        season_number?: number;
        unit_number: number;
    };
}

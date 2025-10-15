export interface IOrganicResult {
    position: string;
    title: string;
    link: string;
    redirect_link: string;
    displayed_link: string;
    favicon: string;
    date?: string;
    sitelinks?: Record<string, any[]>;
    snippet: string;
    snippet_highlighted_words: string[]
    source: string
}

export interface ISerpPagination {
    current: number,
    next_link: string;
    next: string;
    other_pages: Record<string, string>
}
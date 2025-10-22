import { IOrganicResult } from '../interfaces/serp-api.interfaces';


export function prepareJobPostsForBulkWrite(
    results: IOrganicResult[],
    tagValue: string,
) {
    return results.map((result) => ({
        updateOne: {
            filter: { link: result.link },
            update: {
                $set: {
                    title: result.title,
                    snippet: result.snippet,
                    link: result.link,
                    tag: tagValue,
                },
            },
            upsert: true,
        },
    }));
}
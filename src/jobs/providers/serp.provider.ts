import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as serpapi from 'serpapi'
import { IOrganicResult } from '../interfaces/serp-api.interfaces';
import { AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import * as https from 'https';

@Injectable()
export class SerpProvider {
    constructor(
        private readonly configService: ConfigService,
        private httpService: HttpService
    ) { }

    async fetchJson(url: string): Promise<any> {
        const agent = new https.Agent({
            rejectUnauthorized: false,
        });

        try {
            const response: AxiosResponse<any> = await firstValueFrom(
                this.httpService.get(
                    url.concat(`&api_key=${this.configService.get<string>('appConfig.serpApi')}`),
                    {
                        httpsAgent: agent,
                    }
                ),
            );
            return response.data;
        } catch (error) {
            console.error(`Error fetching JSON from ${url}:`, error);
        }
    }

    async scrapeJob(jobTitle: string, source: string, tbs: string = 'qdr:m1'): Promise<IOrganicResult[]> {
        const allOrganicResults: IOrganicResult[] = [];

        const baseQuery = `${source} "${jobTitle}"`;

        const baseParams = {
            api_key: this.configService.get<string>('appConfig.serpApi'),
            engine: "google",
            q: `site:careers.*.com | inurl:*/careers | inurl:*/work-with-us | inurl:*/join-us | inurl:*/opportunities ${baseQuery}`,
            google_domain: "google.com",
            tbs: tbs
        };

        const firstPageResponse = await serpapi.getJson(baseParams);

        if (firstPageResponse.organic_results) {
            allOrganicResults.push(...firstPageResponse.organic_results);
        }

        const pagination = firstPageResponse.serpapi_pagination;
        if (pagination && pagination.other_pages) {
            const pageUrls = Object.values(pagination.other_pages);

            const promises = pageUrls.map((url: string) => this.fetchJson(url));

            const subsequentPageResponses = await Promise.all(promises);

            for (const pageResponse of subsequentPageResponses) {
                if (pageResponse.organic_results) {
                    allOrganicResults.push(...pageResponse.organic_results);
                }
            }
        }

        return allOrganicResults;
    }
}

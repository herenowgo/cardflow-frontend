/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { AnkiInfo } from './AnkiInfo';
import type { FSRSCard } from './FSRSCard';

export type CardUpdateRequest = {
    id?: string;
    ankiInfo?: AnkiInfo;
    question?: string;
    answer?: string;
    tags?: Array<string>;
    group?: string;
    fsrsCard?: FSRSCard;
};


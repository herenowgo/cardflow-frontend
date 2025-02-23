/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { AnkiInfo } from './AnkiInfo';
import type { FSRSCard } from './FSRSCard';

export type CardDTO = {
    id?: string;
    userId?: number;
    ankiInfo?: AnkiInfo;
    question?: string;
    answer?: string;
    tags?: Array<string>;
    group?: string;
    modifiedTime?: number;
    isDeleted?: boolean;
    deleteTime?: number;
    createTime?: number;
    fsrsCard?: FSRSCard;
};


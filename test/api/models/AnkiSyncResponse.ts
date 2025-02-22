/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { AnkiNoteAddRequest } from './AnkiNoteAddRequest';
import type { AnkiSyncedCard } from './AnkiSyncedCard';

export type AnkiSyncResponse = {
    ankiSyncedCards?: Array<AnkiSyncedCard>;
    cardIds?: Array<number>;
    ankiNoteAddRequests?: Array<AnkiNoteAddRequest>;
};


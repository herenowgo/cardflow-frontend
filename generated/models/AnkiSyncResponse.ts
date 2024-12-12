/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { AnkiNoteAddRequest } from "./AnkiNoteAddRequest";
import type { AnkiSyncedCard } from "./AnkiSyncedCard";

export type AnkiSyncResponse = {
  // 系统中当前deck（group）中所有已经同步过的card的部分信息
  ankiSyncedCards?: Array<AnkiSyncedCard>;
  // 系统中当前deck（group）中所有已经同步过的card的AnkiInfo的cardId
  cardIds?: Array<number>;
  // 系统中新增的卡片，包含了添加到anki的所有必要信息
  ankiNoteAddRequests?: Array<AnkiNoteAddRequest>;
};

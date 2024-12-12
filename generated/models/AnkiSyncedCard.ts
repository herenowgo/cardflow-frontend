/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type AnkiSyncedCard = {
  // 系统中card的id
  id?: string;
  // anki中card的id
  cardId?: number;
  // anki中对应的卡片最后一次同步到系统中的时间
  syncTime?: number;
  // 系统中这个card的最后同步时间
  modifiedTime?: number;
};

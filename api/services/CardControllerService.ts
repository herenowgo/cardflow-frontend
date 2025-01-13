/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnkiCardIdsRequest } from '../models/AnkiCardIdsRequest';
import type { BaseResponseAnkiSyncResponse } from '../models/BaseResponseAnkiSyncResponse';
import type { BaseResponseBoolean } from '../models/BaseResponseBoolean';
import type { BaseResponseCard } from '../models/BaseResponseCard';
import type { BaseResponseListCard } from '../models/BaseResponseListCard';
import type { BaseResponsePageCard } from '../models/BaseResponsePageCard';
import type { CardAddRequest } from '../models/CardAddRequest';
import type { CardIdsRequest } from '../models/CardIdsRequest';
import type { CardUpdateRequest } from '../models/CardUpdateRequest';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class CardControllerService {

    /**
     * @returns BaseResponseListCard OK
     * @throws ApiError
     */
    public static getUserCards(): CancelablePromise<BaseResponseListCard> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/cards',
        });
    }

    /**
     * @param requestBody
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static updateCard(
        requestBody: CardUpdateRequest,
    ): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/cards',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static createCard(
        requestBody: CardAddRequest,
    ): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/cards',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody
     * @returns BaseResponseListCard OK
     * @throws ApiError
     */
    public static getCardsByIds(
        requestBody: CardIdsRequest,
    ): CancelablePromise<BaseResponseListCard> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/cards/batch',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 根据Anki卡片ID获取卡片
     * 传入一组Anki卡片ID，返回对应的卡片列表
     * @param requestBody
     * @returns BaseResponseListCard OK
     * @throws ApiError
     */
    public static getCardsByAnkiCardIds(
        requestBody: AnkiCardIdsRequest,
    ): CancelablePromise<BaseResponseListCard> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/cards/anki/cards',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param cardId
     * @returns BaseResponseCard OK
     * @throws ApiError
     */
    public static getCardById(
        cardId: string,
    ): CancelablePromise<BaseResponseCard> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/cards/{cardId}',
            path: {
                'cardId': cardId,
            },
        });
    }

    /**
     * @param cardId
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static deleteCard(
        cardId: string,
    ): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/cards/{cardId}',
            path: {
                'cardId': cardId,
            },
        });
    }

    /**
     * @param group
     * @returns BaseResponseListCard OK
     * @throws ApiError
     */
    public static getUserGroupCards(
        group: string,
    ): CancelablePromise<BaseResponseListCard> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/cards/group/{group}',
            path: {
                'group': group,
            },
        });
    }

    /**
     * @param group
     * @returns BaseResponseAnkiSyncResponse OK
     * @throws ApiError
     */
    public static syncWithAnki(
        group: string,
    ): CancelablePromise<BaseResponseAnkiSyncResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/cards/group/{group}/syncWithAnki',
            path: {
                'group': group,
            },
        });
    }

    /**
     * @param group
     * @param page
     * @param size
     * @returns BaseResponsePageCard OK
     * @throws ApiError
     */
    public static getUserGroupCardsWithPagination(
        group: string,
        page?: number,
        size: number = 10,
    ): CancelablePromise<BaseResponsePageCard> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/cards/group/{group}/page',
            path: {
                'group': group,
            },
            query: {
                'page': page,
                'size': size,
            },
        });
    }

}

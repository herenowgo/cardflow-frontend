/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponseAnkiSyncResponse } from '../models/BaseResponseAnkiSyncResponse';
import type { BaseResponseBoolean } from '../models/BaseResponseBoolean';
import type { BaseResponseListCard } from '../models/BaseResponseListCard';
import type { CardAddRequest } from '../models/CardAddRequest';
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
     * @returns BaseResponseAnkiSyncResponse OK
     * @throws ApiError
     */
    public static syncWithAnki(): CancelablePromise<BaseResponseAnkiSyncResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/cards/syncWithAnki',
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

}

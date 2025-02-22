/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnkiCardIdsRequest } from '../models/AnkiCardIdsRequest';
import type { BaseResponseAnkiSyncResponse } from '../models/BaseResponseAnkiSyncResponse';
import type { BaseResponseBoolean } from '../models/BaseResponseBoolean';
import type { BaseResponseCardDTO } from '../models/BaseResponseCardDTO';
import type { BaseResponseListCardDTO } from '../models/BaseResponseListCardDTO';
import type { BaseResponseListReviewLogDTO } from '../models/BaseResponseListReviewLogDTO';
import type { BaseResponsePageResultCardDTO } from '../models/BaseResponsePageResultCardDTO';
import type { BaseResponseVoid } from '../models/BaseResponseVoid';
import type { CardAddRequest } from '../models/CardAddRequest';
import type { CardIdsRequest } from '../models/CardIdsRequest';
import type { CardUpdateRequest } from '../models/CardUpdateRequest';
import type { ReviewLogDTO } from '../models/ReviewLogDTO';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class CardControllerService {

    /**
     * 获取用户的所有卡片
     * 获取当前用户的所有卡片
     * @returns BaseResponseListCardDTO OK
     * @throws ApiError
     */
    public static getUserCards(): CancelablePromise<BaseResponseListCardDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cards',
        });
    }

    /**
     * 更新卡片
     * 更新卡片内容
     * @param requestBody
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static updateCard1(
        requestBody: CardUpdateRequest,
    ): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/cards',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 创建卡片
     * 创建一个新的卡片
     * @param requestBody
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static createCard(
        requestBody: CardAddRequest,
    ): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cards',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 批量更新卡片
     * 批量更新多个卡片的内容
     * @param requestBody
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static updateCards(
        requestBody: Array<CardUpdateRequest>,
    ): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/cards/batch',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 批量获取指定ID的卡片
     * 根据卡片ID列表批量获取卡片
     * @param requestBody
     * @returns BaseResponseListCardDTO OK
     * @throws ApiError
     */
    public static getCardsByIds(
        requestBody: CardIdsRequest,
    ): CancelablePromise<BaseResponseListCardDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cards/batch',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 批量保存卡片的复习日志
     * 批量保存卡片的复习日志
     * @param requestBody
     * @returns BaseResponseVoid OK
     * @throws ApiError
     */
    public static saveReviewLogs(
        requestBody: Array<ReviewLogDTO>,
    ): CancelablePromise<BaseResponseVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cards/reviewLogs',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 保存卡片的复习日志
     * 保存卡片的复习日志
     * @param requestBody
     * @returns BaseResponseVoid OK
     * @throws ApiError
     */
    public static saveReviewLog(
        requestBody: ReviewLogDTO,
    ): CancelablePromise<BaseResponseVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cards/reviewLog',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 根据Anki卡片ID获取卡片
     * 传入一组Anki卡片ID，返回对应的卡片列表
     * @param requestBody
     * @returns BaseResponseListCardDTO OK
     * @throws ApiError
     */
    public static getCardsByAnkiCardIds(
        requestBody: AnkiCardIdsRequest,
    ): CancelablePromise<BaseResponseListCardDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/cards/anki/cards',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 获取指定ID的卡片
     * 根据卡片ID获取卡片
     * @param cardId
     * @returns BaseResponseCardDTO OK
     * @throws ApiError
     */
    public static getCardById(
        cardId: string,
    ): CancelablePromise<BaseResponseCardDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cards/{cardId}',
            path: {
                'cardId': cardId,
            },
        });
    }

    /**
     * 删除卡片
     * 根据卡片ID删除卡片
     * @param cardId
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static deleteCard1(
        cardId: string,
    ): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/cards/{cardId}',
            path: {
                'cardId': cardId,
            },
        });
    }

    /**
     * 获取卡片的复习日志
     * 根据卡片ID获取复习日志列表
     * @param cardId
     * @returns BaseResponseListReviewLogDTO OK
     * @throws ApiError
     */
    public static getReviewLogsByCardId(
        cardId: string,
    ): CancelablePromise<BaseResponseListReviewLogDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cards/{cardId}/reviewLogs',
            path: {
                'cardId': cardId,
            },
        });
    }

    /**
     * 获取用户特定分组的卡片
     * 根据分组名称，获取当前用户特定分组的卡片
     * @param group
     * @returns BaseResponseListCardDTO OK
     * @throws ApiError
     */
    public static getUserGroupCards(
        group: string,
    ): CancelablePromise<BaseResponseListCardDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cards/group/{group}',
            path: {
                'group': group,
            },
        });
    }

    /**
     * 与Anki同步
     * 根据分组名称，获取与Anki同步所需的信息
     * @param group
     * @returns BaseResponseAnkiSyncResponse OK
     * @throws ApiError
     */
    public static syncWithAnki(
        group: string,
    ): CancelablePromise<BaseResponseAnkiSyncResponse> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cards/group/{group}/syncWithAnki',
            path: {
                'group': group,
            },
        });
    }

    /**
     * 分页获取用户特定分组的卡片
     * 根据分组名称，分页获取当前用户特定分组的卡片
     * @param group
     * @param page
     * @param size
     * @returns BaseResponsePageResultCardDTO OK
     * @throws ApiError
     */
    public static getUserGroupCardsWithPagination(
        group: string,
        page?: number,
        size: number = 10,
    ): CancelablePromise<BaseResponsePageResultCardDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/cards/group/{group}/page',
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

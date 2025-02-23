/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponseBoolean } from '../models/BaseResponseBoolean';
import type { BaseResponseGraphDTO } from '../models/BaseResponseGraphDTO';
import type { CardNodeDTO } from '../models/CardNodeDTO';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class GraphControllerService {

    /**
     * 更新知识图谱中的卡片
     * @param requestBody
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static updateCard(
        requestBody: CardNodeDTO,
    ): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/graph/card',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 添加卡片到知识图谱
     * @param requestBody
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static addCard(
        requestBody: CardNodeDTO,
    ): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/graph/card',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 获取用户的知识标签图谱
     * @returns BaseResponseGraphDTO OK
     * @throws ApiError
     */
    public static getTagsGraph(): CancelablePromise<BaseResponseGraphDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/graph/tags',
        });
    }

    /**
     * 从知识图谱中删除卡片
     * @param cardId
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static deleteCard(
        cardId: string,
    ): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/graph/card/{cardId}',
            path: {
                'cardId': cardId,
            },
        });
    }

}

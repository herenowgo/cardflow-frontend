/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponseSetString } from '../models/BaseResponseSetString';
import type { BaseResponseString } from '../models/BaseResponseString';
import type { ChatRequest } from '../models/ChatRequest';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AiControllerService {

    /**
     * AI对话
     * 与AI进行对话，返回请求ID用于从流式响应中获取消息
     * @param requestBody
     * @returns BaseResponseString OK
     * @throws ApiError
     */
    public static chat(
        requestBody: ChatRequest,
    ): CancelablePromise<BaseResponseString> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ai/chat',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param requestBody
     * @returns BaseResponseString OK
     * @throws ApiError
     */
    public static getCards(
        requestBody: ChatRequest,
    ): CancelablePromise<BaseResponseString> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ai/cards',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * 获取可用AI模型列表
     * 获取系统当前支持的所有AI模型列表
     * @returns BaseResponseSetString OK
     * @throws ApiError
     */
    public static getAvailableModels(): CancelablePromise<BaseResponseSetString> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/ai/models',
        });
    }

}

/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AIChatRequest } from "../models/AIChatRequest";
import type { BaseResponseString } from "../models/BaseResponseString";
import type { UserCodeAnalysisRequest } from "../models/UserCodeAnalysisRequest";

import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";

export class ChatControllerService {
  /**
   * @param requestBody
   * @returns BaseResponseString OK   其中的data是响应的id，用于获取流式响应
   * @throws ApiError
   */
  public static getTags(
    requestBody: AIChatRequest
  ): CancelablePromise<BaseResponseString> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/ai/tags",
      body: requestBody,
      mediaType: "application/json",
    });
  }

  /**
   * @param requestBody
   * @returns BaseResponseString OK
   * @throws ApiError
   */
  public static analysisUserCode(
    requestBody: UserCodeAnalysisRequest
  ): CancelablePromise<BaseResponseString> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/ai/codeAnalysis",
      body: requestBody,
      mediaType: "application/json",
    });
  }

  /**
   * @param requestBody
   * @returns BaseResponseString OK
   * @throws ApiError
   */
  public static getCards(
    requestBody: AIChatRequest
  ): CancelablePromise<BaseResponseString> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/ai/cards",
      body: requestBody,
      mediaType: "application/json",
    });
  }

  /**
     * AI对话(可以多轮对象，不过需要传递相同的sessionId)
     * 与AI进行对话，返回请求ID用于从流式响应中获取消息
     * @param requestBody
     * @returns BaseResponseString OK
     * @throws ApiError
     */
    public static chat(
        requestBody: AIChatRequest,
    ): CancelablePromise<BaseResponseString> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ai/chat',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}

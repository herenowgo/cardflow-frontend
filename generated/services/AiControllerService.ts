/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponse_QuestionRecommendation_ } from "../models/BaseResponse_QuestionRecommendation_";
import type { BaseResponse_string_ } from "../models/BaseResponse_string_";

import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import { request as __request } from "../core/request";
import { BaseResponseString } from "../models/BaseResponseString";

export class AiControllerService {
  /**
   * @param message
   * @returns BaseResponseString OK
   * @throws ApiError
   */
  public static getStudySuggestion(
    message: string
  ): CancelablePromise<BaseResponseString> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/ai/suggest",
      query: {
        message: message,
      },
    });
  }

  /**
   * analyzeError
   * @param index index
   * @param questionSubmitId questionSubmitId
   * @returns BaseResponse_string_ OK
   * @returns any Created
   * @throws ApiError
   */
  public static analyzeErrorUsingPost(
    index: number,
    questionSubmitId: number
  ): CancelablePromise<BaseResponse_string_ | any> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/ai/analyzeError",
      query: {
        index: index,
        questionSubmitId: questionSubmitId,
      },
      errors: {
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
      },
    });
  }

  /**
   * recommendQuestion
   * @param message message
   * @returns BaseResponse_QuestionRecommendation_ OK
   * @returns any Created
   * @throws ApiError
   */
  public static recommendQuestionUsingPost(
    message?: string
  ): CancelablePromise<BaseResponse_QuestionRecommendation_ | any> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/ai/recommendQuestion",
      query: {
        message: message,
      },
      errors: {
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
      },
    });
  }
}

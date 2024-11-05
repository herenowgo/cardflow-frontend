/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponse_long_ } from "../models/BaseResponse_long_";
import type { BaseResponse_Page_QuestionSubmitVO_ } from "../models/BaseResponse_Page_QuestionSubmitVO_";
import type { BaseResponse_QuestionSubmitStateVO_ } from "../models/BaseResponse_QuestionSubmitStateVO_";
import type { QuestionSubmitAddRequest } from "../models/QuestionSubmitAddRequest";
import type { QuestionSubmitQueryRequest } from "../models/QuestionSubmitQueryRequest";
import type { BaseResponseQuestionSubmit } from "../models/BaseResponseQuestionSubmit";
import type { CancelablePromise } from "../core/CancelablePromise";
import { OpenAPI } from "../core/OpenAPI";
import type { DebugCodeRequest } from "../models/DebugCodeRequest";
import { request as __request } from "../core/request";
import { BaseResponsePageQuestionSubmitPageVO } from "../models/BaseResponsePageQuestionSubmitPageVO";
import { BaseResponseExecuteCodeResponseVO } from "../models/BaseResponseExecuteCodeResponseVO";

export class QuestionSubmitControllerService {
  /**
   * @param requestBody
   * @returns BaseResponseExecuteCodeResponseVO OK
   * @throws ApiError
   */
  public static debugCode(
    requestBody: DebugCodeRequest
  ): CancelablePromise<BaseResponseExecuteCodeResponseVO> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/question_submit/debug",
      body: requestBody,
      mediaType: "application/json",
    });
  }

  /**
   * @param questionSubmitId
   * @returns BaseResponseQuestionSubmit OK
   * @throws ApiError
   */
  public static getQuestionSubmitInfo(
    questionSubmitId: number
  ): CancelablePromise<BaseResponseQuestionSubmit> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/question_submit",
      query: {
        questionSubmitId: questionSubmitId,
      },
    });
  }

  /**
   * @param questionId
   * @param current
   * @param size
   * @returns BaseResponsePageQuestionSubmitPageVO OK
   * @throws ApiError
   */
  public static listQuestionSubmitRecord(
    questionId: string,
    current: number,
    size: number
  ): CancelablePromise<BaseResponsePageQuestionSubmitPageVO> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/question_submit/records",
      query: {
        questionId: questionId,
        current: current,
        size: size,
      },
    });
  }

  /**
   * doQuestionSubmit
   * @param questionSubmitAddRequest questionSubmitAddRequest
   * @returns BaseResponse_long_ OK
   * @returns any Created
   * @throws ApiError
   */
  public static doQuestionSubmitUsingPost(
    questionSubmitAddRequest: QuestionSubmitAddRequest
  ): CancelablePromise<BaseResponse_long_ | any> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/question_submit/",
      body: questionSubmitAddRequest,
      errors: {
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
      },
    });
  }

  /**
   * getJudgeInformation
   * @param questionSubmitId questionSubmitId
   * @returns BaseResponse_QuestionSubmitStateVO_ OK
   * @throws ApiError
   */
  public static getJudgeInformationUsingGet(
    questionSubmitId: number
  ): CancelablePromise<BaseResponse_QuestionSubmitStateVO_> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/question_submit/judgeInformation",
      query: {
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
   * listQuestionSubmitByPage
   * @param questionSubmitQueryRequest questionSubmitQueryRequest
   * @returns BaseResponse_Page_QuestionSubmitVO_ OK
   * @returns any Created
   * @throws ApiError
   */
  public static listQuestionSubmitByPageUsingPost(
    questionSubmitQueryRequest: QuestionSubmitQueryRequest
  ): CancelablePromise<BaseResponse_Page_QuestionSubmitVO_ | any> {
    return __request(OpenAPI, {
      method: "POST",
      url: "/api/question_submit/list/page",
      body: questionSubmitQueryRequest,
      errors: {
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
      },
    });
  }

  /**
   * getQuestionSubmitState
   * @param questionSubmitId questionSubmitId
   * @returns number OK
   * @throws ApiError
   */
  public static getQuestionSubmitStateUsingGet(
    questionSubmitId: number
  ): CancelablePromise<number> {
    return __request(OpenAPI, {
      method: "GET",
      url: "/api/question_submit/state",
      query: {
        questionSubmitId: questionSubmitId,
      },
      errors: {
        401: `Unauthorized`,
        403: `Forbidden`,
        404: `Not Found`,
      },
    });
  }
}

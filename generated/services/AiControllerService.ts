/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponse_string_ } from '../models/BaseResponse_string_';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class AiControllerService {

    /**
     * 根据题目的提交ID和测试用例的序号，分析用户代码中的错误，并且生成修改建议
     * analyzeError
     * @param index index 测试用例的序号（从0开始）
     * @param questionSubmitId questionSubmitId 题目的提交ID
     * @returns BaseResponse_string_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static analyzeErrorUsingPost(
        index: number,
        questionSubmitId: number,
    ): CancelablePromise<BaseResponse_string_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/ai/analyzeError',
            query: {
                'index': index,
                'questionSubmitId': questionSubmitId,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }

}

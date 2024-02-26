/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponse } from '../models/BaseResponse';
import type { BaseResponse_boolean_ } from '../models/BaseResponse_boolean_';
import type { BaseResponse_long_ } from '../models/BaseResponse_long_';
import type { BaseResponse_Page_QuestionSolvingPageVO_ } from '../models/BaseResponse_Page_QuestionSolvingPageVO_';
import type { BaseResponse_QuestionSolving_ } from '../models/BaseResponse_QuestionSolving_';
import type { DeleteRequest } from '../models/DeleteRequest';
import type { QuestionSolvingAddRequest } from '../models/QuestionSolvingAddRequest';
import type { QuestionSolvingQueryRequest } from '../models/QuestionSolvingQueryRequest';
import type { QuestionSolvingUpdateRequest } from '../models/QuestionSolvingUpdateRequest';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class QuestionSolvingControllerService {

    /**
     * addQuestionSolving
     * @param questionSolvingAddRequest questionSolvingAddRequest
     * @returns BaseResponse_long_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static addQuestionSolvingUsingPost(
questionSolvingAddRequest: QuestionSolvingAddRequest,
): CancelablePromise<BaseResponse_long_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/questionSolving/add',
            body: questionSolvingAddRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }

    /**
     * deleteQuestionSolving
     * @param deleteRequest deleteRequest
     * @returns BaseResponse_boolean_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static deleteQuestionSolvingUsingPost(
deleteRequest: DeleteRequest,
): CancelablePromise<BaseResponse_boolean_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/questionSolving/delete',
            body: deleteRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }

    /**
     * getQuestionSolving
     * @param questionSolvingQueryRequest questionSolvingQueryRequest
     * @returns BaseResponse_QuestionSolving_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static getQuestionSolvingUsingPost(
questionSolvingQueryRequest: QuestionSolvingQueryRequest,
): CancelablePromise<BaseResponse_QuestionSolving_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/questionSolving/get',
            body: questionSolvingQueryRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }

    /**
     * supportQuestionSolving
     * @param id id
     * @returns BaseResponse OK
     * @returns any Created
     * @throws ApiError
     */
    public static supportQuestionSolvingUsingPut(
id: number,
): CancelablePromise<BaseResponse | any> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/questionSolving/like/{id}',
            path: {
                'id': id,
            },
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }

    /**
     * listQuestionSolvingPageVOByPage
     * @param questionSolvingQueryRequest questionSolvingQueryRequest
     * @returns BaseResponse_Page_QuestionSolvingPageVO_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static listQuestionSolvingPageVoByPageUsingPost(
questionSolvingQueryRequest: QuestionSolvingQueryRequest,
): CancelablePromise<BaseResponse_Page_QuestionSolvingPageVO_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/questionSolving/list/page/vo',
            body: questionSolvingQueryRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }

    /**
     * updateQuestionSolving
     * @param questionSolvingUpdateRequest questionSolvingUpdateRequest
     * @returns BaseResponse_boolean_ OK
     * @returns any Created
     * @throws ApiError
     */
    public static updateQuestionSolvingUsingPost(
questionSolvingUpdateRequest: QuestionSolvingUpdateRequest,
): CancelablePromise<BaseResponse_boolean_ | any> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/questionSolving/update',
            body: questionSolvingUpdateRequest,
            errors: {
                401: `Unauthorized`,
                403: `Forbidden`,
                404: `Not Found`,
            },
        });
    }

}

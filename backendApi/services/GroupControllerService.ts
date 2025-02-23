/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseResponseBoolean } from '../models/BaseResponseBoolean';
import type { BaseResponseListString } from '../models/BaseResponseListString';

import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class GroupControllerService {

    /**
     * @returns BaseResponseListString OK
     * @throws ApiError
     */
    public static getUserGroups(): CancelablePromise<BaseResponseListString> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/groups',
        });
    }

    /**
     * @param requestBody
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static updateGroups(
        requestBody: Array<string>,
    ): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/groups',
            body: requestBody,
            mediaType: 'application/json',
        });
    }

    /**
     * @param groupName
     * @returns BaseResponseBoolean OK
     * @throws ApiError
     */
    public static addGroup(
        groupName: string,
    ): CancelablePromise<BaseResponseBoolean> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/groups/{groupName}',
            path: {
                'groupName': groupName,
            },
        });
    }

}

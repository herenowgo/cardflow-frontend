/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type AIChatRequest = {
    content?: string;
    model?: AIChatRequest.model;
    prompt?: string;
};

export namespace AIChatRequest {

    export enum model {
        BASIC = 'BASIC',
        A1 = 'A1',
        A2 = 'A2',
        PLUS = 'PLUS',
    }


}


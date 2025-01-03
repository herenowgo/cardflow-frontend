/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * AI对话请求参数
 */
export type AIChatRequest = {
    content?: string;
    model?: AIChatRequest.model;
    prompt?: string;
    // 会话id，用于实现多轮对话（在多轮对话中，要传递相同的sessionId）
    sessionId?: string;
};

export namespace AIChatRequest {

    export enum model {
        BASIC = 'BASIC',
        A1 = 'A1',
        A2 = 'A2',
        PLUS = 'PLUS',
        GEMINI_EXP_1206 = "GEMINI_EXP_1206",
        GEMINI_2_0_FLASH_EXP="GEMINI_2_0_FLASH_EXP",
    }
}
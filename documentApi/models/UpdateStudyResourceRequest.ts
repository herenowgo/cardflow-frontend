/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 更新资源请求
 */
export type UpdateStudyResourceRequest = {
    id: string;
    parentPath?: string;
    name?: string;
    description?: string;
    content?: string;
    note?: string;
    coverUrl?: string;
    resourceUrl?: string;
    /**
     * 结构化标签
     */
    structuredTags?: Array<string>;
    /**
     * 是否公开（仅管理员可设置）
     */
    isPublic?: boolean;
};


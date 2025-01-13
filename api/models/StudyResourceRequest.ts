/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 学习资源请求
 */
export type StudyResourceRequest = {
    /**
     * 资源名称
     */
    name: string;
    /**
     * 资源类型
     */
    resourceType: StudyResourceRequest.resourceType;
    /**
     * 父目录路径（以'/'结尾）
     */
    parentPath?: string;
    /**
     * 封面图片URL
     */
    coverUrl?: string;
    /**
     * 描述信息
     */
    description?: string;
    /**
     * 文本内容（用于文章类型）
     */
    content?: string;
    /**
     * 笔记内容
     */
    note?: string;
    /**
     * 在线资源URL
     */
    resourceUrl?: string;
};

export namespace StudyResourceRequest {

    /**
     * 资源类型
     */
    export enum resourceType {
        PDF = 'PDF',
        ARTICLE = 'ARTICLE',
        NOTE = 'NOTE',
        URL = 'URL',
    }


}


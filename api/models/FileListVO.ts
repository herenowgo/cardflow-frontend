/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * 文件列表项
 */
export type FileListVO = {
    /**
     * 文件/文件夹ID
     */
    id?: string;
    /**
     * 文件/文件夹名称
     */
    name?: string;
    /**
     * 是否是文件夹
     */
    isFolder?: boolean;
    /**
     * 资源类型
     */
    resourceType?: FileListVO.resourceType;
};

export namespace FileListVO {

    /**
     * 资源类型
     */
    export enum resourceType {
        PDF = 'PDF',
        // 文章
        ARTICLE = 'ARTICLE',
        // 笔记
        NOTE = 'NOTE',
        // 在线网页
        URL = 'URL',
    }


}


/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type StudyResourceVO = {
    id?: string;
    name?: string;
    resourceType?: StudyResourceVO.resourceType;
    path?: string;
    parentPath?: string;
    size?: number;
    coverUrl?: string;
    description?: string;
    content?: string;
    note?: string;
    resourceUrl?: string;
};

export namespace StudyResourceVO {

    export enum resourceType {
        PDF = 'PDF',
        ARTICLE = 'ARTICLE',
        NOTE = 'NOTE',
        URL = 'URL',
    }


}


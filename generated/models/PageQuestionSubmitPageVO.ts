/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { OrderItem } from './OrderItem';
import type { QuestionSubmitPageVO } from './QuestionSubmitPageVO';

export type PageQuestionSubmitPageVO = {
    records?: Array<QuestionSubmitPageVO>;
    total?: number;
    size?: number;
    current?: number;
    orders?: Array<OrderItem>;
    optimizeCountSql?: PageQuestionSubmitPageVO;
    searchCount?: PageQuestionSubmitPageVO;
    optimizeJoinOfCountSql?: boolean;
    maxLimit?: number;
    countId?: string;
    /**
     * @deprecated
     */
    pages?: number;
};


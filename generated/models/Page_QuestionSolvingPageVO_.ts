/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { OrderItem } from './OrderItem';
import type { QuestionSolvingPageVO } from './QuestionSolvingPageVO';

export type Page_QuestionSolvingPageVO_ = {
    countId?: string;
    current?: number;
    maxLimit?: number;
    optimizeCountSql?: boolean;
    orders?: Array<OrderItem>;
    pages?: number;
    records?: Array<QuestionSolvingPageVO>;
    searchCount?: boolean;
    size?: number;
    total?: number;
};

/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Card } from './Card';
import type { PageableObject } from './PageableObject';
import type { SortObject } from './SortObject';

export type PageCard = {
    totalElements?: number;
    totalPages?: number;
    pageable?: PageableObject;
    sort?: SortObject;
    size?: number;
    content?: Array<Card>;
    number?: number;
    numberOfElements?: number;
    last?: boolean;
    first?: boolean;
    empty?: boolean;
};


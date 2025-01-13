/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Card } from './Card';
import type { PageableObject } from './PageableObject';
import type { SortObject } from './SortObject';

export type PageCard = {
    totalPages?: number;
    totalElements?: number;
    pageable?: PageableObject;
    sort?: SortObject;
    number?: number;
    numberOfElements?: number;
    last?: boolean;
    first?: boolean;
    size?: number;
    content?: Array<Card>;
    empty?: boolean;
};


/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type ReviewLogDTO = {
    /**
     * 关联的卡片ID
     */
    cardId?: string;
    /**
     * 复习的评级（手动变更，重来，困难，良好，容易）
     */
    rating?: string;
    /**
     * 复习的状态（新卡片、学习中、复习中、重新学习中）
     */
    state?: string;
    /**
     * 上次的调度日期
     */
    due?: string;
    /**
     * 复习前的记忆稳定性
     */
    stability?: number;
    /**
     * 复习前的卡片难度
     */
    difficulty?: number;
    /**
     * 自上次复习以来的天数
     */
    elapsed_days?: number;
    /**
     * 上次复习的间隔天数
     */
    last_elapsed_days?: number;
    /**
     * 下次复习的间隔天数
     */
    scheduled_days?: number;
    /**
     * 复习的日期
     */
    review?: string;
};


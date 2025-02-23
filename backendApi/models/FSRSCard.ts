/* generated using openapi-typescript-codegen -- do no edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

/**
 * FSRS卡片实体
 */
export type FSRSCard = {
    /**
     * 卡片下次复习的日期
     */
    due?: string;
    /**
     * 记忆稳定性
     */
    stability?: number;
    /**
     * 卡片难度
     */
    difficulty?: number;
    /**
     * 自上次复习以来的天数
     */
    elapsed_days?: number;
    /**
     * 下次复习的间隔天数
     */
    scheduled_days?: number;
    /**
     * 卡片被复习的总次数
     */
    reps?: number;
    /**
     * 卡片被遗忘或错误记忆的次数
     */
    lapses?: number;
    /**
     * 卡片的当前状态（新卡片、学习中、复习中、重新学习中）
     */
    state?: string;
    /**
     * 最近一次复习的日期
     */
    last_review?: string;
};


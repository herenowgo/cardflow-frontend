import {
  createEmptyCard,
  formatDate,
  fsrs,
  generatorParameters,
  Rating,
  Grades,
  FSRS,
  FSRSParameters,
  Grade,
} from "ts-fsrs";

import {
  CardControllerService,
  CardUpdateRequest,
  CardDTO,
} from "@backendApi/index";

export class FsrsService {
  private fsrsInstance: FSRS;

  constructor(params?: Partial<FSRSParameters>) {
    if (params) {
      const customParams = generatorParameters(params);
      this.fsrsInstance = fsrs(customParams);
    } else {
      const defaultParams = generatorParameters({
        enable_fuzz: true,
        enable_short_term: false,
      });
      this.fsrsInstance = fsrs(defaultParams);
    }
  }

  /**
   * 会自动创建FSRS参数
   * @param cards
   * @returns
   */
  static async batchCreateCards(cards: Array<CardUpdateRequest>) {
    try {
      // 为每张卡片创建 FSRS 参数
      const cardsWithFsrs = cards.map(({ id, ...cardWithoutId }) => {
        const fsrsCard = createEmptyCard(new Date());
        return {
          ...cardWithoutId,
          fsrsCard: {
            ...fsrsCard,
            due: formatDate(fsrsCard.due),
            state: String(fsrsCard.state),
            last_review: fsrsCard.last_review
              ? formatDate(fsrsCard.last_review)
              : undefined,
          },
        };
      });

      // 调用 CardControllerService 的 updateCards 方法批量更新
      const result = await CardControllerService.updateCards(cardsWithFsrs);
      return result;
    } catch (error) {
      console.error("批量创建卡片失败:", error);
      throw error;
    }
  }

  async reviewCard(card: CardDTO, rating: Grade) {
    try {
      // Convert CardDTO's fsrsCard to ts-fsrs Card format
      const fsrsCard = {
        due: new Date(card.fsrsCard?.due ?? 0),
        last_review: card.fsrsCard?.last_review
          ? new Date(card.fsrsCard.last_review)
          : undefined,
        state: Number(card.fsrsCard?.state),
        stability: card.fsrsCard?.stability ?? 0,
        difficulty: card.fsrsCard?.difficulty ?? 0,
        elapsed_days: card.fsrsCard?.elapsed_days ?? 0,
        scheduled_days: card.fsrsCard?.scheduled_days ?? 0,
        reps: card.fsrsCard?.reps ?? 0,
        lapses: card.fsrsCard?.lapses ?? 0,
      };

      // Get next state using ts-fsrs
      const result = this.fsrsInstance.next(fsrsCard, new Date(), rating);

      // Save review log
      await CardControllerService.saveReviewLogs([
        {
          ...result.log,
          cardId: card.id,
          review: formatDate(result.log.review),
          due: formatDate(result.log.due),
          rating: String(result.log.rating),
          state: String(result.log.state),
        },
      ]);

      // Update card's FSRS state
      const updateRequest: CardUpdateRequest = {
        id: card.id,
        fsrsCard: {
          ...result.card,
          due: formatDate(result.card.due),
          state: String(result.card.state),
          last_review: result.card.last_review
            ? formatDate(result.card.last_review)
            : undefined,
        },
      };

      // Save updated card
      await CardControllerService.updateCard1(updateRequest);

      return result;
    } catch (error) {
      console.error("Review card failed:", error);
      throw error;
    }
  }
}

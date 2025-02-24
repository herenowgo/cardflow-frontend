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
  Card,
} from "ts-fsrs";

import {
  CardControllerService,
  CardUpdateRequest,
  CardDTO,
} from "@backendApi/index";
import { AnkiService } from "./AnkiService";

export class FsrsService {
  private fsrsInstance: FSRS;

  constructor(params?: Partial<FSRSParameters>) {
    // TODO 从后端获取用户的FSRS参数
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
  static async batchCreateCards(
    cards: Array<CardUpdateRequest>
  ): Promise<boolean> {
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
      return result.data ?? false;
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

  /**
   * 根据Anki中新卡片的cardId，读取到卡片的所有复习记录，然后根据复习记录使用fsrs的reschedule计算出卡片的FSRS状态，并返回这个卡片
   */
  public async rescheduleCard(cardId: number): Promise<Card> {
    try {
      // 获取卡片的所有复习记录
      const reviewLogs = await AnkiService.getReviewsOfCards([cardId]);
      const card = createEmptyCard(cardId);

      // 转换复习记录为FSRSHistory格式
      const fsrsHistory = Object.values(reviewLogs)
        .flat()
        .filter((log) => log.type != 4)
        .map((log) => ({
          rating: Number(log.ease) as Grade,
          review: new Date(log.id),
        }));

      // 使用reschedule计算新的卡片状态
      const result = this.fsrsInstance.reschedule(card, fsrsHistory);

      // 返回最新的卡片状态
      return result.reschedule_item?.card || card;
    } catch (error) {
      console.error("Reschedule card failed:", error);
      throw error;
    }
  }
}

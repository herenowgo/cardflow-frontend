import { Message } from "@arco-design/web-vue";
import {
  AnkiNoteAddRequest,
  AnkiSyncedCard,
  AnkiSyncResponse,
  CardControllerService,
  CardDTO,
} from "../../backendApi";
import { AnkiService, CardInfo, NoteFields, NoteInfo } from "./AnkiService";
import { FsrsService } from "./FsrsService";

export class AnkiSyncService {
  static fsrsService = new FsrsService();

  // 处理冲突和更新
  private static async processCardsSync(
    syncedCards: AnkiSyncedCard[],
    ankiCardsInfo: CardInfo[],
    ankiNotesInfo: NoteInfo[],
    deckName: string
  ): Promise<{ conflicts: ConflictCard[] }> {
    const conflicts: Conflicts[] = [];
    const onlySystemModifiedCardIds: string[] = [];
    const onlyAnkiModifiedCards: SyncRequest[] = [];

    for (const syncedCard of syncedCards) {
      const ankiCard = ankiCardsInfo.find(
        (card) => card.cardId === syncedCard.cardId
      );
      const ankiNote = ankiNotesInfo.find(
        (note) => note.noteId === ankiCard?.note
      );

      if (!ankiCard || !ankiNote || !syncedCard.syncTime) continue;

      // 检查修改时间，判断是否有冲突
      if (
        ankiNote.mod > syncedCard?.syncTime &&
        (syncedCard.modifiedTime ?? 0) > syncedCard.syncTime
      ) {
        conflicts.push({
          systemCardId: syncedCard.id ?? "",
          ankiCard,
          ankiNote,
        });
      } else if (
        syncedCard.modifiedTime &&
        syncedCard.syncTime &&
        syncedCard.modifiedTime > syncedCard.syncTime
      ) {
        if (syncedCard.id !== undefined) {
          onlySystemModifiedCardIds.push(syncedCard.id);
        }
      } else if (ankiNote.mod > syncedCard.syncTime) {
        onlyAnkiModifiedCards.push({
          ankiCardId: ankiCard.cardId,
          systemCardId: syncedCard.id,
        });
      }
    }
    // Anki->System: 把onlyAnkiModifiedCards更新到系统
    if (onlyAnkiModifiedCards.length > 0) {
      await this.ankiCardsSyncToSystem(onlyAnkiModifiedCards);
    }

    // 将onlySystemModifiedCards和conflicts中的systemCardId合并到一个数组中
    const cardIds = onlySystemModifiedCardIds.concat(
      conflicts.map((conflict) => conflict.systemCardId)
    );

    if (cardIds.length == 0) return { conflicts: [] };

    // 使用cardIds获取卡片信息
    const response = await CardControllerService.getCardsByIds({
      cardIds: cardIds,
    });
    if (response.code !== 200 || !response.data) {
      throw new Error("Failed to get cards by ids");
    }
    const systemCardDTOs = response.data;
    // System->Anki: 利用onlySystemModifiedCards把这些系统卡片更新到Anki（使用systemCardsUpdateToAnki函数）
    if (onlySystemModifiedCardIds.length > 0) {
      const updateParams = systemCardDTOs
        .filter(
          (card) => card.id && onlySystemModifiedCardIds.includes(card.id)
        )
        .map((card) => ({
          id: card.ankiInfo?.noteId || 0,
          fields: {
            Front: card.question || "",
            Back: card.answer || "",
          },
          tags: card.tags || [],
        }));

      if (updateParams.length > 0) {
        await this.systemCardsUpdateToAnki(updateParams);
      }
    }

    if (conflicts.length == 0) return { conflicts: [] };
    //封装冲突结果
    const conflictResult = conflicts
      .map((conflict) => {
        const systemCardDTO = systemCardDTOs.find(
          (card) => card.id === conflict.systemCardId
        );
        if (!systemCardDTO) return null;
        return {
          systemCard: systemCardDTO,
          ankiCard: {
            question: conflict.ankiCard.fields.Front?.value,
            answer: conflict.ankiCard.fields.Back?.value,
            tags: conflict.ankiNote.tags,
            mod: conflict.ankiNote.mod,
          },
          cardId: conflict.ankiCard.cardId,
          noteId: conflict.ankiNote.noteId,
        };
      })
      .filter((item): item is ConflictCard => item !== null);

    return { conflicts: conflictResult };
  }

  // 同步指定牌组的系统卡片和Anki卡片
  public static async syncWithAnkiOnSpecifiedDeck(
    deckName: string,
    onConflict?: (conflicts: ConflictCard[], currentIndex: number) => void
  ): Promise<boolean> {
    try {
      // 1. 获取同步状态
      const res = await CardControllerService.syncWithAnki(deckName);
      if (res.code !== 200 || !res.data) {
        throw new Error("Failed to get sync status");
      }

      // 系统中已同步的卡片同步到anki（设置到期日）
      // 根据到期时间分组卡片并更新到Anki
      if (res.data.ankiSyncedCards) {
        const cardsByDueDate = new Map<number, number[]>();

        for (const card of res.data.ankiSyncedCards) {
          if (card.due !== undefined && card.cardId) {
            // 计算出距离现在还有几天到期
            const dueDate = new Date(card.due);
            const today = new Date();
            // 只比较日期部分
            dueDate.setHours(0, 0, 0, 0);
            today.setHours(0, 0, 0, 0);
            let daysUntilDue = Math.floor(
              (dueDate.getTime() - today.getTime()) / (1000 * 3600 * 24)
            );
            if (daysUntilDue < 0) daysUntilDue = 0;
            // 如果Map中没有这个到期时间，创建一个新数组
            if (!cardsByDueDate.has(daysUntilDue)) {
              cardsByDueDate.set(daysUntilDue, []);
            }
            // 将卡片ID添加到对应的到期时间组
            cardsByDueDate.get(daysUntilDue)?.push(card.cardId);
          }
        }

        // 为每组卡片设置到期时间
        for (const [dueInDays, cardIds] of cardsByDueDate) {
          // await AnkiService.setDueDate({ cards: cardIds, days: dueInDays });
          await AnkiService.setDueDate({
            cards: [...cardIds],
            days: dueInDays.toString(),
          });
        }
      }

      // 2. 处理新卡片同步
      await this.syncNewCards(res.data, deckName);

      // 3. 处理已同步卡片的更新
      const ankiSyncedCards = res.data.ankiSyncedCards ?? [];
      if (ankiSyncedCards.length > 0) {
        await this.handleSyncedCards(res.data, deckName, onConflict);
      }

      Message.success("同步成功");
      return true;
    } catch (error) {
      console.error("Sync failed:", error);
      Message.error("同步失败");
      return false;
    }
  }

  private static async syncNewCards(data: AnkiSyncResponse, deckName: string) {
    // 处理系统中的新卡片
    if (
      data.ankiNoteAddRequests != null &&
      (data.ankiNoteAddRequests?.length ?? 0) > 0
    ) {
      const addToAnkiCardIds = await this.systemCardsAddToAnkiOnSpecifiedDeck(
        data.ankiNoteAddRequests,
        deckName
      );
      data.cardIds?.push(...addToAnkiCardIds);
    }

    data.ankiNoteAddRequests?.forEach((request) => {
      if (request.id) {
        data.cardIds?.push(Number(request.id));
      }
    });
    // 处理Anki中的新卡片
    const deckCardIds = await AnkiService.getDeckCardIds(deckName);
    const ankiNewCards = deckCardIds?.filter(
      (cardId) => !data.cardIds?.includes(cardId)
    );
    if (ankiNewCards.length <= 0) return;

    const syncRequests = ankiNewCards.map((cardId) => ({ ankiCardId: cardId }));
    await this.ankiCardsSyncToSystem(syncRequests);
  }

  private static async handleSyncedCards(
    data: AnkiSyncResponse,
    deckName: string,
    onConflict?: (conflicts: ConflictCard[], currentIndex: number) => void
  ) {
    if (!data.cardIds || data.cardIds.length === 0 || !data.ankiSyncedCards) {
      return;
    }
    const cardsInfo = await AnkiService.getCardsInfo(data.cardIds);
    const notesInfo = await AnkiService.getNotesInfo(
      cardsInfo.map((card) => card.note).filter(Boolean)
    );

    const { conflicts } = await this.processCardsSync(
      data.ankiSyncedCards,
      cardsInfo,
      notesInfo,
      deckName
    );

    if (conflicts.length > 0 && onConflict) {
      onConflict(conflicts, 0);
    }
  }

  /**
   * 将Anki中的卡片同步到系统
   * @param syncRequests
   */
  private static async ankiCardsSyncToSystem(
    syncRequests: SyncRequest[]
  ): Promise<boolean> {
    try {
      const ankiCardIds = syncRequests.map((req) => req.ankiCardId);
      const ankiCardsInfo = await AnkiService.getCardsInfo(ankiCardIds);
      const noteIds = ankiCardsInfo.map((card) => card.note);
      const noteInfos = await AnkiService.getNotesInfo(noteIds);

      const updateRequests = await Promise.all(
        ankiCardsInfo.map(async (card, index) => {
          const noteInfo = noteInfos.find((note) => note.noteId === card.note);
          if (!noteInfo) {
            throw new Error(`No note info found for note ${card.note}`);
          }

          const fsrsCard = await this.fsrsService.rescheduleCard(card.cardId);
          const formatDate = (date: Date) => {
            return date.toISOString().slice(0, 19).replace("T", " ");
          };

          const fsrsCardWithStringDue = {
            ...fsrsCard,
            due: formatDate(fsrsCard.due),
            state: fsrsCard.state.toString(),
            last_review: fsrsCard.last_review
              ? formatDate(fsrsCard.last_review)
              : undefined,
          };

          const baseRequest = {
            ankiInfo: {
              cardId: card.cardId,
              noteId: card.note,
              modelName: card.modelName,
              syncTime: noteInfo.mod,
            },
            question: card.fields.Front?.value,
            answer: card.fields.Back?.value,
            tags: noteInfo.tags,
            group: card.deckName,
            fsrsCard: fsrsCardWithStringDue,
          };

          const systemCardId = syncRequests[index].systemCardId;
          return systemCardId
            ? { ...baseRequest, id: systemCardId }
            : baseRequest;
        })
      );

      await CardControllerService.updateCards(updateRequests);
      return true;
    } catch (error) {
      console.error("Failed to sync Anki cards to system:", error);
      return false;
    }
  }

  // 将指定牌组的系统卡片批量添加到Anki
  private static async systemCardsAddToAnkiOnSpecifiedDeck(
    ankiNoteSyncRequests: AnkiNoteAddRequest[],
    deckName: string
  ): Promise<number[]> {
    // 确保目标牌组存在
    const deckExists = await AnkiService.createDeckIfNotExists(deckName);
    if (!deckExists) {
      throw new Error(`Failed to create or verify deck: ${deckName}`);
    }

    const notes = ankiNoteSyncRequests.map((request: AnkiNoteAddRequest) => ({
      question: request.question || "",
      answer: request.answer || "",
      tags: request.tags || [],
    }));

    const noteIds = await AnkiService.addNotes(deckName, notes);
    if (!noteIds || noteIds.length !== notes.length) {
      throw new Error("Failed to add some notes to Anki");
    }

    // 获取Anki中刚刚添加的笔记信息和卡片信息
    const noteInfos = await AnkiService.getNotesInfo(noteIds);
    const cardInfos = await AnkiService.getCardsInfo(noteIds);
    if (!cardInfos || cardInfos.length === 0) {
      throw new Error("Failed to get card info for new notes");
    }

    // 封装出Array<CardUpdateRequest>对象，然后调用CardControllerService.updateCards方法批量更新系统卡片
    const updates = ankiNoteSyncRequests.map(
      (request: AnkiNoteAddRequest, index: number) => {
        const noteInfo = noteInfos[index];
        if (!noteInfo) {
          throw new Error(
            `No note info found for note ${cardInfos[index].cardId}`
          );
        }

        // data.cardIds.push(cardInfos[index].cardId);
        return {
          id: request.id,
          ankiInfo: {
            cardId: noteInfo.cards[0],
            noteId: noteInfo.noteId,
            modelName: "Basic",
            syncTime: noteInfo.mod,
          },
        };
      }
    );

    await CardControllerService.updateCards(updates);
    return updates.map((update) => update.ankiInfo.cardId);
  }

  // 将系统卡片批量更新到Anki，注意要使用AnkiService的updateNote方法。
  // 更新到Anki的操作完成后，需要实现的逻辑和systemCardsAddToAnkiOnSpecifiedDeck函数类似。
  // 也就是需要获取Anki中刚刚更新的卡片信息和笔记信息，然后调用CardControllerService.updateCards方法批量更新系统卡片。
  private static async systemCardsUpdateToAnki(
    params: Array<{
      id: number;
      fields: NoteFields;
      tags: string[];
    }>
  ) {
    // 更新Anki中的笔记
    await Promise.all(params.map((param) => AnkiService.updateNote(param)));

    // 获取更新后的笔记信息和卡片信息
    const noteIds = params.map((param) => param.id);
    const noteInfos = await AnkiService.getNotesInfo(noteIds);
    const cardInfos = await AnkiService.getCardsInfo(noteIds);

    if (!cardInfos || cardInfos.length === 0) {
      throw new Error("Failed to get card info for updated notes");
    }

    // 封装更新请求
    const updates = noteIds.map((noteId, index) => {
      const noteInfo = noteInfos[index];
      if (!noteInfo) {
        throw new Error(`No note info found for note ${noteId}`);
      }

      return {
        ankiInfo: {
          cardId: noteInfo.cards[0],
          noteId: noteInfo.noteId,
          modelName: "Basic",
          syncTime: noteInfo.mod,
        },
      };
    });

    // 更新系统卡片
    await CardControllerService.updateCards(updates);
    return updates.map((update) => update.ankiInfo.cardId);
  }

  // 将系统中当天的要复习的卡片与Anki的复习记录比对，如果Anki中已经复习过了，就自动把系统中的卡片也复习了
  public static async syncReviewCards(cardDTOs: CardDTO[]): Promise<string[]> {
    if (cardDTOs.length == 0) {
      Message.error("没有卡片需要同步");
    }
    const reviewedCardIds = [];
    try {
      // 提取出所有的Anki的cardId
      const ankiCardIds = cardDTOs
        .map((card) => card.ankiInfo?.cardId)
        .filter((cardId) => cardId !== undefined) as number[];

      const cardReviewsMap = await AnkiService.getReviewsOfCards(ankiCardIds);
      if (!cardReviewsMap || Object.keys(cardReviewsMap).length == 0) {
        Message.error(
          "Anki未连接,请检查Anki是否打开，以及AnkiConnect插件是否安装与正确配置"
        );
        return [];
      }
      // 遍历cardDTOs,每次遍历从cardReviewsMap中找到对应cardDTO的AnkiInfo的cardId的复习记录们
      for (const cardDTO of cardDTOs) {
        const ankiCardId = cardDTO.ankiInfo?.cardId;
        if (ankiCardId === undefined) continue;

        const reviews = cardReviewsMap[ankiCardId].filter(
          (review) => review.type != 4
        );
        if (!reviews || reviews.length == 0) continue;
        const lastReview = reviews[reviews.length - 1];
        const lastReviewDayTimestamp = new Date(
          cardDTO.fsrsCard?.due ?? "1740374581093"
        ).setHours(0, 0, 0, 0);

        if (lastReview.id > lastReviewDayTimestamp) {
          this.fsrsService.reviewCard(cardDTO, lastReview.ease);
          reviewedCardIds.push(cardDTO.id);
        }
      }
    } catch (error) {
      console.error("Failed to sync review cards:", error);
    }
    return reviewedCardIds.filter((id): id is string => id !== undefined);
  }
}

export interface ConflictCard {
  systemCard: CardDTO & { modifiedTime: number };
  ankiCard: {
    question: string;
    answer: string;
    tags: string[];
    mod: number;
  };
  cardId: number;
  noteId: number;
}

interface Conflicts {
  systemCardId: string;
  ankiCard: CardInfo;
  ankiNote: NoteInfo;
}

interface SyncRequest {
  ankiCardId: number;
  systemCardId?: string; // 如果提供则更新已有卡片，否则创建新卡片
}
// function syncWithAnkiOnSpecifiedDeck(
//   deckName: string,
//   string: any,
//   arg2: any
// ): any {
//   throw new Error("Function not implemented.");
// }

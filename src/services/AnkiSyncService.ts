import { Message } from "@arco-design/web-vue";
import {
  AnkiNoteAddRequest,
  AnkiSyncedCard,
  AnkiSyncResponse,
  CardControllerService,
  CardDTO,
} from "../../backendApi";
import { AnkiService, CardInfo, NoteFields, NoteInfo } from "./AnkiService";

export class AnkiSyncService {
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

      const updateRequests = ankiCardsInfo.map((card, index) => {
        const noteInfo = noteInfos.find((note) => note.noteId === card.note);
        if (!noteInfo) {
          throw new Error(`No note info found for note ${card.note}`);
        }

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
        };

        const systemCardId = syncRequests[index].systemCardId;
        return systemCardId
          ? { ...baseRequest, id: systemCardId }
          : baseRequest;
      });

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

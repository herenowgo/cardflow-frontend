import { CardUpdateRequest } from "@api/index";
import { AnkiSyncedCard } from "@api/models/AnkiSyncedCard";
import { CardControllerService } from "@api/services/CardControllerService";
import { Message } from "@arco-design/web-vue";
import { AnkiService } from "./AnkiService";

export class AnkiSyncService {
  // 处理冲突和更新
  private static async processCardsSync(
    syncedCards: AnkiSyncedCard[],
    ankiCardsInfo: any[],
    ankiNotesInfo: any[]
  ) {
    const conflicts: any[] = [];
    const updates: any[] = [];

    for (const syncedCard of syncedCards) {
      const ankiCard = ankiCardsInfo.find(
        (card) => card.cardId === syncedCard.cardId
      );
      const ankiNote = ankiNotesInfo.find(
        (note) => note.noteId === ankiCard?.note
      );

      if (!ankiCard || !ankiNote || !syncedCard.syncTime) continue;

      // 检查修改时间，判断是否有冲突
      if (ankiNote.mod > syncedCard?.syncTime) {
        conflicts.push({
          cardId: syncedCard.id,
          ankiCard,
          ankiNote,
          modTime: ankiNote.mod,
        });
      } else if (
        syncedCard.modifiedTime &&
        syncedCard.syncTime &&
        syncedCard.modifiedTime > syncedCard.syncTime
      ) {
        updates.push({
          id: syncedCard.id,
          ankiInfo: {
            cardId: ankiCard.cardId,
            noteId: ankiNote.noteId,
            modelName: ankiCard.modelName,
            syncTime: ankiNote.mod,
          },
        });
      }
    }

    return { conflicts, updates };
  }

  // 同步卡片到Anki
  public static async syncWithAnki(
    deckName: string,
    onConflict?: (conflicts: any[], currentIndex: number) => void
  ) {
    try {
      // 1. 获取同步状态
      const res = await CardControllerService.syncWithAnki(deckName);
      if (res.code !== 200 || !res.data) {
        throw new Error("Failed to get sync status");
      }

      // 2. 处理新卡片同步
      await this.handleNewCards(res.data, deckName);

      // 3. 处理已同步卡片的更新
      const ankiSyncedCards = res.data.ankiSyncedCards ?? [];
      if (ankiSyncedCards.length > 0) {
        await this.handleSyncedCards(res.data, onConflict);
      }

      Message.success("同步成功");
      return true;
    } catch (error) {
      console.error("Sync failed:", error);
      Message.error("同步失败");
      return false;
    }
  }

  private static async handleNewCards(data: any, deckName: string) {
    // 处理系统中的新卡片
    if (data.ankiNoteAddRequests?.length > 0) {
      await this.handleSystemNewCards(data, deckName);
    }

    // 处理Anki中的新卡片
    const deckCardIds = await AnkiService.getDeckCardIds(deckName);
    const ankiNewCards = deckCardIds.filter(
      (cardId) => !data.cardIds.includes(cardId)
    );
    if (ankiNewCards.length > 0) {
      await this.handleAnkiNewCards(ankiNewCards, deckName);
    }
  }

  private static async handleSystemNewCards(data: any, deckName: string) {
    // 确保目标牌组存在
    const deckExists = await AnkiService.createDeckIfNotExists(deckName);
    if (!deckExists) {
      throw new Error(`Failed to create or verify deck: ${deckName}`);
    }

    // 将新卡片添加到 Anki
    const notes = data.ankiNoteAddRequests.map((request: any) => ({
      question: request.question || "",
      answer: request.answer || "",
      tags: request.tags || [],
    }));

    const noteIds = await AnkiService.addNotes(deckName, notes);
    if (!noteIds || noteIds.length !== notes.length) {
      throw new Error("Failed to add some notes to Anki");
    }

    const noteInfos = await AnkiService.getNotesInfo(noteIds);
    const cardInfos = await AnkiService.getCardsInfo(noteIds);
    if (!cardInfos || cardInfos.length === 0) {
      throw new Error("Failed to get card info for new notes");
    }

    // 批量更新系统卡片
    await this.updateSystemCards(data, noteInfos, cardInfos);
  }

  private static async handleAnkiNewCards(
    ankiNewCards: number[],
    deckName: string
  ) {
    const ankiNewCardsInfo = await AnkiService.getCardsInfo(ankiNewCards);
    await Promise.all(
      ankiNewCardsInfo.map(async (card) => {
        const noteInfos = await AnkiService.getNotesInfo([card.cardId]);
        const noteInfo = noteInfos[0];

        if (!noteInfo) {
          throw new Error(`No note info found for note ${card.note}`);
        }

        return CardControllerService.createCard({
          ankiInfo: {
            cardId: card.cardId,
            noteId: card.note,
            modelName: card.modelName,
            syncTime: noteInfo.mod,
          },
          question: card.fields.Front?.value,
          answer: card.fields.Back?.value,
          tags: noteInfo.tags,
          group: deckName,
        });
      })
    );
  }

  private static async handleSyncedCards(
    data: any,
    onConflict?: (conflicts: any[], currentIndex: number) => void
  ) {
    const cardsInfo = await AnkiService.getCardsInfo(data.cardIds);
    const notesInfo = await AnkiService.getNotesInfo(
      cardsInfo.map((card) => card.note).filter(Boolean)
    );

    const { conflicts, updates } = await this.processCardsSync(
      data.ankiSyncedCards,
      cardsInfo,
      notesInfo
    );

    if (updates.length > 0) {
      await Promise.all(
        updates.map((update) => CardControllerService.updateCard(update))
      );
    }

    if (conflicts.length > 0 && onConflict) {
      onConflict(conflicts, 0);
    }
  }

  private static async updateSystemCards(
    data: any,
    noteInfos: any[],
    cardInfos: any[]
  ) {
    const updates = data.ankiNoteAddRequests.map(
      (request: any, index: number) => {
        const noteInfo = noteInfos[index];
        if (!noteInfo) {
          throw new Error(
            `No note info found for note ${cardInfos[index].cardId}`
          );
        }
        data.cardIds.push(cardInfos[index].cardId);
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

    await Promise.all(
      updates.map((update: CardUpdateRequest) =>
        CardControllerService.updateCard(update)
      )
    );
  }
}

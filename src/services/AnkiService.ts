// 基础响应接口
interface AnkiResponse<T = any> {
  result: T;
  error: string | null;
}

// 笔记字段接口
export interface NoteFields {
  Front: string;
  Back: string;
  [key: string]: string;
}

// 笔记创建参数接口
interface AddNoteParams {
  deckName: string;
  modelName: string;
  fields: NoteFields;
  options?: {
    allowDuplicate?: boolean;
    duplicateScope?: string;
    duplicateScopeOptions?: {
      deckName?: string;
      checkChildren?: boolean;
      checkAllModels?: boolean;
    };
  };
  tags?: string[];
  audio?: Array<{
    url: string;
    filename: string;
    skipHash?: string;
    fields: string[];
  }>;
  video?: Array<{
    url: string;
    filename: string;
    skipHash?: string;
    fields: string[];
  }>;
  picture?: Array<{
    url: string;
    filename: string;
    skipHash?: string;
    fields: string[];
  }>;
}

// 卡片信息接口
export interface CardInfo {
  answer: string;
  question: string;
  deckName: string;
  modelName: string;
  fieldOrder: number;
  fields: { [key: string]: { value: string; order: number } };
  css: string;
  cardId: number;
  interval: number;
  note: number;
  ord: number;
  type: number;
  queue: number;
  due: number;
  reps: number;
  lapses: number;
  left: number;
  mod: number;
}

// 笔记信息接口
export interface NoteInfo {
  noteId: number;
  profile: string;
  modelName: string;
  tags: string[];
  fields: { [key: string]: { value: string; order: number } };
  mod: number;
  cards: number[];
}

// 复习记录接口
export interface ReviewLog {
  id: number;
  cid: number;
  usn: number;
  ease: number;
  ivl: number;
  lastIvl: number;
  factor: number;
  time: number;
  type: number;
}

// 答案难度枚举
export enum AnswerEase {
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

export class AnkiService {
  private static readonly ANKI_CONNECT_URL = "http://localhost:8765";

  private static async invoke<T>(
    action: string,
    params: any = {}
  ): Promise<AnkiResponse<T>> {
    const response = await fetch(this.ANKI_CONNECT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        version: 6,
        params,
      }),
    });
    return response.json();
  }

  // 检查deck是否存在，不存在则创建
  public static async createDeckIfNotExists(
    deckName: string
  ): Promise<boolean> {
    try {
      // 获取所有deck
      const decksResponse = await this.invoke<string[]>("deckNames");
      if (decksResponse.error) return false;

      const decks = decksResponse.result;
      if (!decks.includes(deckName)) {
        // 创建新deck
        const createResponse = await this.invoke<void>("createDeck", {
          deck: deckName,
        });
        return !createResponse.error;
      }
      return true;
    } catch (error) {
      console.error("Failed to create deck:", error);
      return false;
    }
  }

  // 添加笔记
  public static async addNotes(
    deckName: string,
    notes: Array<{
      question: string;
      answer: string;
      tags: string[];
    }>
  ): Promise<number[]> {
    try {
      const ankiNotes: AddNoteParams[] = notes.map((note) => ({
        deckName,
        modelName: "Basic", // 使用Anki的基础卡片类型
        fields: {
          Front: note.question,
          Back: note.answer,
        },
        options: {
          allowDuplicate: false,
        },
        tags: note.tags,
      }));

      const response = await this.invoke<number[]>("addNotes", {
        notes: ankiNotes,
      });

      if (response.error) return [];
      return response.result;
    } catch (error) {
      console.error("Failed to add notes:", error);
      return [];
    }
  }

  // 获取卡片信息
  public static async getCardsInfo(cardIds: number[]): Promise<CardInfo[]> {
    try {
      const response = await this.invoke<CardInfo[]>("cardsInfo", {
        cards: cardIds,
      });
      if (response.error) return [];
      return response.result;
    } catch (error) {
      console.error("Failed to get cards info:", error);
      return [];
    }
  }

  // 添加获取笔记信息的方法
  public static async getNotesInfo(noteIds: number[]): Promise<NoteInfo[]> {
    try {
      const response = await this.invoke<NoteInfo[]>("notesInfo", {
        notes: noteIds,
      });
      if (response.error) return [];
      return response.result;
    } catch (error) {
      console.error("Failed to get notes info:", error);
      return [];
    }
  }

  // 删除笔记
  public static async deleteNotes(noteIds: number[]): Promise<boolean> {
    const response = await this.invoke<void>("deleteNotes", {
      notes: noteIds,
    });
    if (response.error) return false;
    return true;
  }

  public static async getNotesModTime(
    noteIds: number[]
  ): Promise<number | null> {
    try {
      const response = await this.invoke<{ mod: number }[]>("notesModTime", {
        notes: noteIds,
      });
      if (response.error) return null; // 如果有错误，返回 null

      // 提取 mod 并确保是数值
      const mod = response.result[0]?.mod;
      return typeof mod === "number" ? mod : null; // 确保返回的是数值类型
    } catch (error) {
      console.error("Failed to get notes Mod time:", error);
      return null; // 如果发生异常，也返回 null
    }
  }

  // 获取指定牌组中的所有卡片ID
  public static async getDeckCardIds(deckName: string): Promise<number[]> {
    try {
      const response = await this.invoke<number[]>("findCards", {
        query: `deck:"${deckName}"`,
      });
      if (response.error) return [];
      return response.result;
    } catch (error) {
      console.error("Failed to get deck card IDs:", error);
      return [];
    }
  }

  // 获取卡片详细信息
  public static async getCardDetails(cardIds: number[]): Promise<CardInfo[]> {
    try {
      const response = await this.invoke<CardInfo[]>("cardsInfo", {
        cards: cardIds,
      });
      if (response.error) return [];
      return response.result;
    } catch (error) {
      console.error("Failed to get card details:", error);
      return [];
    }
  }

  // 添加更新笔记的方法
  public static async updateNote(params: {
    id: number;
    fields: NoteFields;
    tags: string[];
  }): Promise<boolean> {
    try {
      // 使用 updateNote 接口而不是分开调用
      const response = await this.invoke<void>("updateNote", {
        note: {
          id: params.id,
          fields: params.fields,
          tags: params.tags,
        },
      });

      if (response.error) {
        console.error("Failed to update note:", response.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to update note:", error);
      return false;
    }
  }

  // 检查卡片是否到期
  public static async areDue(cards: number[]): Promise<boolean[]> {
    try {
      const response = await this.invoke<boolean[]>("areDue", {
        cards,
      });
      if (response.error) return [];
      return response.result;
    } catch (error) {
      console.error("Failed to check if cards are due:", error);
      return [];
    }
  }

  // 获取多个牌组内所有到期卡片和未学习卡片的ID
  public static async getDueCardsInDecks(
    deckNames: string[]
  ): Promise<number[]> {
    try {
      // 构建查询字符串,使用 OR 连接多个牌组条件
      const deckQuery = deckNames.map((name) => `deck:"${name}"`).join(" OR ");
      const response = await this.invoke<number[]>("findCards", {
        query: `(${deckQuery}) (is:due OR is:new)`,
      });

      if (response.error) {
        console.error("获取到期卡片和未学习卡片失败:", response.error);
        return [];
      }

      return response.result;
    } catch (error) {
      console.error("获取到期卡片和未学习卡片失败:", error);
      return [];
    }
  }

  // 回答卡片
  public static async answerCard(params: {
    card: number; // 卡片ID
    ease: AnswerEase; // 1-4 对应 again, hard, good, easy
  }): Promise<boolean> {
    try {
      const response = await this.invoke<boolean[]>("answerCards", {
        answers: [
          {
            cardId: params.card,
            ease: params.ease,
          },
        ],
      });

      if (response.error) {
        console.error("回答卡片失败:", response.error);
        return false;
      }

      // 返回第一个卡片的结果
      return Array.isArray(response.result) && response.result[0] === true;
    } catch (error) {
      console.error("回答卡片失败:", error);
      return false;
    }
  }

  // 批量回答卡片
  public static async answerCards(params: {
    cards: number[]; // 卡片ID数组
    ease: AnswerEase; // 1-4 对应 again, hard, good, easy
  }): Promise<boolean> {
    try {
      const response = await this.invoke<void>("answerCards", {
        cards: params.cards,
        ease: params.ease,
      });

      if (response.error) {
        console.error("Failed to answer cards:", response.error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to answer cards:", error);
      return false;
    }
  }

  // 获取卡片复习记录
  public static async getReviewsOfCards(
    cardIds: number[]
  ): Promise<{ [key: number]: ReviewLog[] }> {
    try {
      const response = await this.invoke<{ [key: number]: ReviewLog[] }>(
        "getReviewsOfCards",
        {
          cards: cardIds,
        }
      );
      if (response.error) return {};
      return response.result;
    } catch (error) {
      console.error("Failed to get card reviews:", error);
      return {};
    }
  }

  // 获取所有牌组名称
  public static async getDeckNames(): Promise<string[]> {
    try {
      const response = await this.invoke<string[]>("deckNames");
      if (response.error) {
        console.error("获取牌组名称失败:", response.error);
        return [];
      }
      return response.result;
    } catch (error) {
      console.error("获取牌组名称失败:", error);
      return [];
    }
  }
}

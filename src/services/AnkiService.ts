interface AnkiResponse {
  result: any;
  error: string | null;
}

export class AnkiService {
  private static readonly ANKI_CONNECT_URL = "http://localhost:8765";

  private static async invoke(
    action: string,
    params: any = {}
  ): Promise<AnkiResponse> {
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
      const decksResponse = await this.invoke("deckNames");
      if (decksResponse.error) return false;

      const decks = decksResponse.result as string[];
      if (!decks.includes(deckName)) {
        // 创建新deck
        const createResponse = await this.invoke("createDeck", {
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
  ): Promise<Array<number>> {
    try {
      const ankiNotes = notes.map((note) => ({
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

      const response = await this.invoke("addNotes", {
        notes: ankiNotes,
      });

      if (response.error) return [];
      return response.result as number[];
    } catch (error) {
      console.error("Failed to add notes:", error);
      return [];
    }
  }

  // 获取卡片信息
  public static async getCardsInfo(noteIds: number[]): Promise<any[]> {
    try {
      const response = await this.invoke("cardsInfo", {
        cards: noteIds,
      });
      if (response.error) return [];
      return response.result;
    } catch (error) {
      console.error("Failed to get cards info:", error);
      return [];
    }
  }

  // 添加获取笔记信息的方法
  public static async getNotesInfo(noteIds: number[]): Promise<any[]> {
    try {
      const response = await this.invoke("notesInfo", {
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
  public static async deleteNotes(noteIds: number[]): Promise<any[]> {
    const response = await this.invoke("deleteNotes", {
      notes: noteIds,
    });
    if (response.error) return [];
    return response.result;
  }

  public static async getNotesModTime(
    noteIds: number[]
  ): Promise<number | null> {
    try {
      const response = await this.invoke("notesModTime", {
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
      const response = await this.invoke("findCards", {
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
  public static async getCardDetails(cardIds: number[]): Promise<any[]> {
    try {
      const response = await this.invoke("cardsInfo", {
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
    fields: {
      Front: string;
      Back: string;
    };
    tags: string[];
  }): Promise<boolean> {
    try {
      // 使用 updateNote 接口而不是分开调用
      const response = await this.invoke("updateNote", {
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
}

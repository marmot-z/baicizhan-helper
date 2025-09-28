import axios, { AxiosInstance, AxiosResponse } from 'axios';

// AnkiConnect 默认端口
const ANKI_CONNECT_URL = 'http://localhost:8765';

// AnkiConnect API 请求接口
interface AnkiConnectRequest {
  action: string;
  version: number;
  params?: any;
}

// AnkiConnect API 响应接口
interface AnkiConnectResponse<T = any> {
  result: T;
  error: string | null;
}

// 笔记信息接口
interface NoteInfo {
  noteId: number;
  modelName: string;
  tags: string[];
  fields: Record<string, { value: string; order: number }>;
}

// 添加笔记参数接口
interface AddNoteParams {
  deckName: string;
  modelName: string;
  fields: Record<string, string>;
  tags?: string[];
  audio?: {
    url: string;
    filename: string;
    skipHash?: string;
    fields: string[];
  }[],
  picture?: {
    url: string;
    filename: string;
    skipHash?: string;
    fields: string[];
  }[]
  options?: {
    allowDuplicate?: boolean;
    duplicateScope?: string;
    duplicateScopeOptions?: {
      deckName?: string;
      checkChildren?: boolean;
      checkAllModels?: boolean;
    };
  };
}

// 创建模板参数接口
interface CreateModelParams {
  modelName: string;
  inOrderFields: string[];
  css?: string;
  cardTemplates: {
    Name: string;
    Front: string;
    Back: string;
  }[];
}

class AnkiConnectClient {
  private client: AxiosInstance;

  constructor(baseURL: string = ANKI_CONNECT_URL) {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 发送请求到 AnkiConnect
   */
  private async request<T>(
    action: string,
    params?: any,
    version: number = 6
  ): Promise<T> {
    try {
      const requestData: AnkiConnectRequest = {
        action,
        version,
        params,
      };

      const response: AxiosResponse<AnkiConnectResponse<T>> = await this.client.post(
        '',
        requestData
      );

      const { result, error } = response.data;

      if (error) {
        throw new Error(`AnkiConnect Error: ${error}`);
      }

      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNREFUSED') {
          throw new Error('无法连接到 Anki，请确保 Anki 正在运行并安装了 AnkiConnect 插件');
        }
        throw new Error(`网络错误: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 获取 AnkiConnect 版本
   */
  async version(): Promise<number> {
    return this.request<number>('version');
  }

  /**
   * 获取所有模板名称
   */
  async modelNames(): Promise<string[]> {
    return this.request<string[]>('modelNames');
  }

  /**
   * 获取所有牌组名称
   */
  async deckNames(): Promise<string[]> {
    return this.request<string[]>('deckNames');
  }

  /**
   * 根据查询条件查找笔记 ID
   * @param query 查询字符串，例如: "deck:English", "tag:vocabulary", "front:hello"
   */
  async findNotes(query: string): Promise<number[]> {
    return this.request<number[]>('findNotes', { query });
  }

  /**
   * 获取笔记详细信息
   * @param noteIds 笔记 ID 数组
   */
  async notesInfo(noteIds: number[]): Promise<NoteInfo[]> {
    return this.request<NoteInfo[]>('notesInfo', { notes: noteIds });
  }

  /**
   * 添加笔记
   * @param note 笔记参数
   */
  async addNote(note: AddNoteParams): Promise<number> {
    return this.request<number>('addNote', { note });
  }

  /**
   * 检查是否可以添加笔记（检查重复）
   * @param notes 笔记数组
   */
  async canAddNotes(notes: AddNoteParams[]): Promise<boolean[]> {
    return this.request<boolean[]>('canAddNotes', { notes });
  }

  /**
   * 更新笔记字段
   * @param noteId 笔记 ID
   * @param fields 要更新的字段
   */
  async updateNoteFields(noteId: number, fields: Record<string, string>): Promise<null> {
    return this.request<null>('updateNoteFields', {
      note: {
        id: noteId,
        fields,
      },
    });
  }

  /**
   * 删除笔记
   * @param noteIds 要删除的笔记 ID 数组
   */
  async deleteNotes(noteIds: number[]): Promise<null> {
    return this.request<null>('deleteNotes', { notes: noteIds });
  }

  /**
   * 获取牌组统计信息
   * @param decks 牌组名称数组
   */
  async getDeckStats(decks: string[]): Promise<Record<string, any>> {
    return this.request<Record<string, any>>('getDeckStats', { decks });
  }

  /**
   * 同步 Anki
   */
  async sync(): Promise<null> {
    return this.request<null>('sync');
  }

  /**
   * 创建模板
   * @param modelName 模板名称
   * @param inOrderFields 字段列表
   * @param css 样式（可选）
   * @param cardTemplates 卡片模板列表
   */
  async createModel(modelName: string, inOrderFields: string[] = ['Front', 'Back'], css?: string, cardTemplates?: { Name: string; Front: string; Back: string }[]): Promise<null> {
    const defaultCardTemplates = cardTemplates || [
      {
        Name: 'Card 1',
        Front: '{{Front}}',
        Back: '{{FrontSide}}<hr id="answer">{{Back}}'
      }
    ];

    const params: CreateModelParams = {
      modelName,
      inOrderFields,
      css,
      cardTemplates: defaultCardTemplates
    };

    return this.request<null>('createModel', params);
  }

  /**
   * 检查 AnkiConnect 是否可用
   */
  async isAvailable(): Promise<boolean> {
    try {
      await this.version();
      return true;
    } catch {
      return false;
    }
  }
}

// 创建默认实例
const ankiConnectClient = new AnkiConnectClient();

export default ankiConnectClient;
export { AnkiConnectClient, type AddNoteParams, type NoteInfo, type CreateModelParams };
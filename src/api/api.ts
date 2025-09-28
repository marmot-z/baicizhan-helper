import { ApiService } from './apiClient';
import { SearchWordResultV2, TopicResourceV2, UserBookItem, UserBooksResponse, UserBookWordDetail, UserInfo, SendSmsResponse, LoginRequest } from './types';

export const API = {
  /**
   * 调用百词斩助手API查询单词信息
   * @param word 要查询的单词
   * @returns Promise<SearchWordResultV2> 单词查询结果
   */
  async searchWord(word: string): Promise<SearchWordResultV2[]> {
    const response = await ApiService.get<SearchWordResultV2[]>(`/search/word/${encodeURIComponent(word)}`);
    return response.data;
  },

  /**
   * 获取单词详细信息
   * @param topicId 单词主题ID
   * @param withDict 是否包含词典信息，默认true
   * @param withMedia 是否包含媒体信息，默认false
   * @param withSimilarWords 是否包含相似单词，默认false
   * @returns Promise<WordDictV2> 单词详细信息
   */
  async getWordDetail(
    topicId: number,
    withDict: boolean = true,
    withMedia: boolean = false,
    withSimilarWords: boolean = false
  ): Promise<TopicResourceV2> {
    const response = await ApiService.get<TopicResourceV2>(
      `/word/${topicId}?withDict=${withDict}&withMedia=${withMedia}&withSimilarWords=${withSimilarWords}`
    );
    return response.data;
  },

  // 收藏单词
  async collectWord(bookId: number, topicId: number): Promise<boolean> {
    const response = await ApiService.put<boolean>(`/book/${bookId}/word/${topicId}`);
    return response.data;
  },

  // 取消收藏单词
  async cancelCollectWord(bookId: number, topicId: number): Promise<boolean> {
    const response = await ApiService.delete<boolean>(`/book/${bookId}/word/${topicId}`);
    return response.data;
  },

  // 获取用户所有单词本信息
  async getBooks(): Promise<UserBookItem[]> {
    const response = await ApiService.get<UserBooksResponse>('/books');
    return response.data.user_books;
  },

  // 获取单词本中的单词列表
  async getBookWords(bookId: number): Promise<UserBookWordDetail[]> {
    const response = await ApiService.get<UserBookWordDetail[]>(`/book/${bookId}/words`);
    return response.data;
  },

  // 获取用户信息
  async getUserInfo(): Promise<UserInfo> {
    const response = await ApiService.get<UserInfo>('/userInfoWithVip');
    return response.data;
  },

  // 发送短信验证码
  async sendSmsVerifyCode(phoneNum: string): Promise<SendSmsResponse> {
    const response = await ApiService.post<SendSmsResponse>(`/login/sendSmsVerifyCode/${phoneNum}`);
    return response.data;
  },

  // 用户登录
  async login(data: LoginRequest): Promise<string> {
    const { phoneNum, smsVerifyCode } = data;
    const response = await ApiService.post<string>(`/login/${phoneNum}/${smsVerifyCode}`);
    return response.data;
  },
}
export interface SearchWordResultV2 {
  word: string,
  topic_id: number,
  mean_cn: string,
  accent: string,
}

export interface WordInfo {
  topic_id: number;
  word: string;
  accent: string;
  mean_cn: string;
  sentence: string;
  sentence_trans: string;
  img_uri: string;
  audio_uri: string;
}

export interface TopicResourceV2 {
  zpk_info: ZpkInfo;
  dict: WordDictV2;
  dict_wiki: DictWiki;
  media: WordMedia;
  similar_words: SimilarWord[];
  collected: boolean;
}

export interface ZpkInfo {
  topic_key: TopicKey;
  zpk_uri: string;
  zpk_md5: string;
  zpk_size: number;
  zpk_version: number;
}

export interface TopicKey {
  topic_id: number;
  word_level_id: number;
  tag_id: number;
}

export interface DictWiki {
  dict: WordDictV2;
  origin_word: string;
  variant_type: string;
}

export interface WordMedia {
  topic_id: number;
  m4a_audio_path: string;
  amr_audio_path: string;
  tv_path: string;
  tv_snapshot_path: string;
  word: string;
  word_mean_cn: string;
  word_type: string;
  word_sentence: string;
  fm_updated_at: number;
  tv_updated_at: number;
  poster_updated_at: number;
  poster_zpk: string;
}

export interface SimilarWord {
  topic_id: number;
  word_level_id: number;
  word: string;
}

export interface WordDictV2 {
  word_basic_info: WordBasicInfo;
  chn_means: MeanInfo[];
  en_means: MeanInfo[];
  sentences: SentenceInfo[];
  short_phrases: ShortPhraseInfo[];
  antonyms: SynAntInfo[];
  synonyms: SynAntInfo[];
  variant_info: VariantInfo;
  exams: string[];
}

export interface WordBasicInfo {
  topic_id: number;
  word: string;
  accent_usa: string;
  accent_uk: string;
  accent_usa_audio_uri: string;
  accent_uk_audio_uri: string;
  deformation_img_uri: string;
  etyma: string;
}

export interface MeanInfo {
  id: number;
  topic_id: number;
  mean_type: string;
  mean: string;
  accent_usa: string;
  accent_uk: string;
  accent_usa_audio_uri: string;
  accent_uk_audio_uri: string;
}

export interface SentenceInfo {
  id: number;
  topic_id: number;
  chn_mean_id: number;
  sentence: string;
  sentence_trans: string;
  highlight_phrase: string;
  img_uri: string;
  audio_uri: string;
}

export interface ShortPhraseInfo {
  id: number;
  topic_id: number;
  chn_mean_id: number;
  short_phrase: string;
  short_phrase_trans: string;
  short_phrase_topic_id: number;
}

export interface SynAntInfo {
  syn_ant_id: number;
  topic_id: number;
  chn_mean_id: number;
  syn_ant_topic_id: number;
  syn_ant: string;
}

export interface VariantInfo {
  topic_id: number;
  pl: string;
  pl_topic_id: number;
  third: string;
  third_topic_id: number;
  past: string;
  past_topic_id: number;
  done: string;
  done_topic_id: number;
  ing: string;
  ing_topic_id: number;
  er: string;
  er_topic_id: number;
  est: string;
  est_topic_id: number;
  prep: string;
  prep_topic_id: number;
  adv: string;
  adv_topic_id: number;
  verb: string;
  verb_topic_id: number;
  noun: string;
  noun_topic_id: number;
  adj: string;
  adj_topic_id: number;
  conn: string;
  conn_topic_id: number;
}



export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

// 用户单词本项目
export interface UserBookItem {
  user_book_id: number;
  book_name: string;
  word_num: number;
  cover: string;
  updated_at: number;
}

// 用户单词本响应
export interface UserBooksResponse {
  user_books: UserBookItem[];
}

// 单词本中的单词详情
export interface UserBookWordDetail {
  topic_id: number;
  book_id: number;
  created_at: number;
  word: string;
  mean: string;
  audio_us: string;
  audio_uk: string;
}

export interface UserInfo {
  user:UserVipInfo;
  userInfo:UserBindInfo[];
}

export interface UserVipInfo {
  vip: boolean;
  vipName: string;
  startTime: number;
  endTime: number;
}

export interface UserBindInfo {
  nickname: string;
  openid: string;
  provider: string;
  setNickname: boolean;
  setOpenid: boolean;
  setProvider: boolean;
  setUnionid: boolean;
  unionid: string;
}

// 发送验证码请求
export interface SendSmsRequest {
  phoneNum: string;
}

// 发送验证码响应
export interface SendSmsResponse {
  verifyCode: string;
}

export interface LoginRequest {
  phoneNum: string;
  smsVerifyCode: string;
}
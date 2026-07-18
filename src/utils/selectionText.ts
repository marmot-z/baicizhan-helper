export const MAX_SELECTED_TEXT_LENGTH = 300;
export const MIN_CHINESE_TRANSLATION_CHARACTER_COUNT = 7;

export type TranslationLanguage = 'en' | 'zh';

export type SelectedTextClassification =
  | {
      kind: 'english-word';
      text: string;
    }
  | {
      kind: 'english-sentence' | 'chinese-sentence';
      text: string;
      from: TranslationLanguage;
      to: TranslationLanguage;
    }
  | {
      kind: 'unsupported';
      text: string;
    };

const ENGLISH_WORD_PATTERN = /^[A-Za-z]+$/;
const ENGLISH_TEXT_PATTERN = /^[A-Za-z\s.,!?;:'’"“”()\-–—]+$/u;
const ENGLISH_TOKEN_PATTERN = /[A-Za-z]+(?:[-'’][A-Za-z]+)*/g;
const CHINESE_TEXT_PATTERN = /^[\p{Script=Han}\s，。！？；：、“”‘’（）《》〈〉【】—…,.!?;:'"()\-]+$/u;
const CHINESE_CHARACTER_PATTERN = /\p{Script=Han}/gu;

export function normalizeSelectedText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

export function classifySelectedText(text: string): SelectedTextClassification {
  const normalizedText = normalizeSelectedText(text);

  if (!normalizedText || normalizedText.length > MAX_SELECTED_TEXT_LENGTH) {
    return {
      kind: 'unsupported',
      text: normalizedText,
    };
  }

  if (ENGLISH_WORD_PATTERN.test(normalizedText)) {
    return {
      kind: 'english-word',
      text: normalizedText,
    };
  }

  if (ENGLISH_TEXT_PATTERN.test(normalizedText)) {
    const tokens = normalizedText.match(ENGLISH_TOKEN_PATTERN) || [];
    if (tokens.length >= 2) {
      return {
        kind: 'english-sentence',
        text: normalizedText,
        from: 'en',
        to: 'zh',
      };
    }
  }

  if (CHINESE_TEXT_PATTERN.test(normalizedText)) {
    const characters = normalizedText.match(CHINESE_CHARACTER_PATTERN) || [];
    if (characters.length >= MIN_CHINESE_TRANSLATION_CHARACTER_COUNT) {
      return {
        kind: 'chinese-sentence',
        text: normalizedText,
        from: 'zh',
        to: 'en',
      };
    }
  }

  return {
    kind: 'unsupported',
    text: normalizedText,
  };
}

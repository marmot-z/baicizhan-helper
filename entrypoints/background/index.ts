import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/sandbox';
import { API } from '../../src/api';
import { TopicResourceV2 } from '../../src/api/types';
import { useWordBookStorage } from '../../src/stores/wordBookStorage';
import ankiConnectClient from '../../src/api/ankiConnectClient';
import exportTask from '../../src/api/exportTask';
import { ForbiddenError } from '../../src/api/errors';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { classifySelectedText } from '../../src/utils/selectionText';
import { historyStorage, type HistoryRecordInput } from '../../src/stores/historyStorage';

const LOOKUP_SELECTION_COMMAND = 'lookup-selection';
const LOOKUP_SELECTION_CONTEXT_MENU = 'lookup-selection-context-menu';

export default defineBackground(() => {
  async function openPopup(): Promise<boolean> {
    await browser.action.openPopup();
    return true;
  }

  async function openPopupSafely(): Promise<void> {
    try {
      await openPopup();
    } catch (error) {
      console.warn('无法自动打开插件弹窗:', error);
    }
  }

  async function triggerSelectionLookup(tabId?: number, text?: string): Promise<void> {
    let targetTabId = tabId;
    if (!targetTabId) {
      const [activeTab] = await browser.tabs.query({ active: true, lastFocusedWindow: true });
      targetTabId = activeTab?.id;
    }

    if (!targetTabId) {
      await openPopupSafely();
      return;
    }

    try {
      const response = await browser.tabs.sendMessage<
        { action: 'lookupSelection'; text?: string },
        { handled?: boolean }
      >(targetTabId, {
        action: 'lookupSelection',
        text,
      });

      if (!response?.handled) {
        await openPopupSafely();
      }
    } catch (error) {
      console.warn('当前页面无法执行划词查询，改为打开插件弹窗:', error);
      await openPopupSafely();
    }
  }

  browser.runtime.onInstalled.addListener(() => {
    void browser.contextMenus.removeAll().then(() => {
      browser.contextMenus.create({
        id: LOOKUP_SELECTION_CONTEXT_MENU,
        title: '百词斩助手查询',
        contexts: ['selection'],
      });
    }).catch((error) => console.warn('注册划词查询右键菜单失败:', error));
  });

  browser.commands.onCommand.addListener((command, tab) => {
    if (command === LOOKUP_SELECTION_COMMAND) {
      void triggerSelectionLookup(tab?.id);
    }
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === LOOKUP_SELECTION_CONTEXT_MENU) {
      void triggerSelectionLookup(tab?.id, info.selectionText);
    }
  });

  async function dispatch(request: any): Promise<any> {
    switch (request.action) {
      case 'searchWord':
        return searchWord(request);
      case 'getWordDetail':
        return getWordDetail(request.topicId);
      case 'translateSentence':
        return translateSentence(request.text);
      case 'openPopup':
        return openPopup();
      case 'collect':
        return collectWord(request);        
      case 'cancelCollect':
        return cancelCollectWord(request);
      case 'getAnkiDecks':
        return ankiConnectClient.deckNames();
      case 'exportCheck':
        return exportTask.preprocess(request.deckName, request.words);
      case 'doExport':
        return exportTask.doExport();
      case 'getExportProgress':
        return exportTask.getProgress();
      case 'stopExport':
        return exportTask.stop();
      case 'recordHistory':
        return historyStorage.record(request.entry as HistoryRecordInput);
      case 'getHistory':
        return historyStorage.getAll();
      case 'deleteHistory':
        return historyStorage.delete(request.id);
      case 'clearHistory':
        return historyStorage.clear();
    }

    throw new Error(`Unsupported action: ${request.action}`);
  }

  async function searchWord(request: any): Promise<TopicResourceV2 | null> {
    const words = await API.searchWord(request.word);
    if (words?.length) {
      return await getWordDetail(words[0].topic_id);
    }
    return null;
  }

  async function getWordDetail(topicId: number): Promise<TopicResourceV2> {
    const wordDetail = await API.getWordDetail(topicId);
    wordDetail.collected = await isCollect(wordDetail.dict.word_basic_info.topic_id);
    return wordDetail;
  }

  async function translateSentence(text: string) {
    const classification = classifySelectedText(text);
    if (classification.kind !== 'english-sentence' && classification.kind !== 'chinese-sentence') {
      throw new Error('不支持翻译所选内容');
    }

    await useAuthStore.persist.rehydrate();
    const userInfo = await API.getUserInfo();
    if (!userInfo.user.vip) {
      throw new ForbiddenError('句子翻译仅会员可用');
    }

    const translation = await API.translateSentence({
      sourceText: classification.text,
      source: classification.from,
      target: classification.to,
    });

    return {
      translatedText: translation.targetText,
    };
  }

  async function isCollect(topicId: number): Promise<boolean> {
    const wordIds = await useWordBookStorage.getState().getAllWordIds();
    return wordIds.includes(topicId);
  }

  async function collectWord(request: any): Promise<boolean> {
    const success = await API.collectWord(request.bookId, request.topicId);
    if (success) {
      useWordBookStorage.getState().appendTopicId(request.bookId, request.topicId);
    }
    return success;
  }

  async function cancelCollectWord(request: any): Promise<boolean> {
    const success = await API.cancelCollectWord(request.bookId, request.topicId);
    if (success) {
      useWordBookStorage.getState().deleteTopicId(request.bookId, request.topicId);
    }
    return success;
  }

  browser.runtime.onMessage.addListener(
    (request: any, _sender: any, sendResponse: (response: any) => void) => {
      dispatch(request)
        .then(res => sendResponse({
          success: true,
          data: res
        }))
        .catch(error => sendResponse({ 
          success: false, 
          error: error.message, 
          errorType: error.name 
        }));

      return true;
    }
  );
});

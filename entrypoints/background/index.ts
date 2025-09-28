import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/sandbox';
import { API } from '../../src/api';
import { TopicResourceV2 } from '../../src/api/types';
import { useWordBookStorage } from '../../src/stores/wordBookStorage';
import ankiConnectClient from '../../src/api/ankiConnectClient';
import exportTask from '../../src/api/exportTask';

export default defineBackground(() => {
  async function dispatch(request: any): Promise<any> {
    switch (request.action) {
      case 'searchWord':
        return searchWord(request);
      case 'getWordDetail':
        return getWordDetail(request.topicId);
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
    }
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

  async function isCollect(topicId: number): Promise<boolean> {
    const wordIds = await useWordBookStorage.getState().getAllWordIds();
    return wordIds.includes(topicId);
  }

  async function openPopup(): Promise<boolean> {
    await browser.action.openPopup();
    return true;
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
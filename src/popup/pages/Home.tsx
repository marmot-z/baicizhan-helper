import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { HotkeysProvider } from 'react-hotkeys-hook';
import { API } from '../../api/api';
import { ForbiddenError, UnauthorizedError } from '../../api/errors';
import type { SearchWordResultV2, TopicResourceV2 } from '../../api/types';
import PopoverContent from '../../components/PopoverContent';
import SentenceTranslationPopover from '../../components/SentenceTranslationPopover';
import { useAuthStore } from '../../stores/useAuthStore';
import {
  HISTORY_STORAGE_KEY,
  buildWordHistoryPreview,
  type HistoryEntry,
  type HistoryRecordInput,
} from '../../stores/historyStorage';
import { settingsStore } from '../../stores/settingsStore';
import { HistoryPanel, RecentHistoryBar } from '../components/HistoryViews';

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchWordResultV2[]>([]);
  const [wordDetail, setWordDetail] = useState<TopicResourceV2 | null>(null);
  const [translatedText, setTranslatedText] = useState('');
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { refreshUserInfo } = useAuthStore();
  const theme = settingsStore((state) => state.theme);

  const loadHistory = useCallback(async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'getHistory' });
      if (response?.success && Array.isArray(response.data)) {
        setHistoryEntries(response.data);
      } else if (!response?.success) {
        console.warn('加载历史记录失败:', response?.error);
      }
    } catch (error) {
      console.warn('加载历史记录失败:', error);
    }
  }, []);

  const recordHistory = useCallback((entry: HistoryRecordInput) => {
    void chrome.runtime.sendMessage({ action: 'recordHistory', entry })
      .then((response) => {
        if (response?.success && Array.isArray(response.data)) {
          setHistoryEntries(response.data);
        } else if (!response?.success) {
          console.warn('保存搜索历史失败:', response?.error);
        }
      })
      .catch((error) => console.warn('保存搜索历史失败:', error));
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
    void refreshUserInfo().catch(() => undefined);
    void loadHistory();

    const handleStorageChange = (
      changes: Record<string, chrome.storage.StorageChange>,
      namespace: string,
    ) => {
      if (namespace === 'local' && changes[HISTORY_STORAGE_KEY]) {
        void loadHistory();
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);
    return () => chrome.storage.onChanged.removeListener(handleStorageChange);
  }, [loadHistory, refreshUserInfo]);

  const resetResults = () => {
    setSearchResults([]);
    setWordDetail(null);
    setTranslatedText('');
    setErrorMessage('');
  };

  const handleSearch = async (queryOverride?: string) => {
    const query = (queryOverride ?? searchQuery).trim();
    if (!query) return;

    setSearchQuery(query);
    setShowHistory(false);
    setLoading(true);
    resetResults();

    try {
      const results = await API.searchWord(query);
      setSearchResults(results);

      if (results.length > 0) {
        recordHistory({
          text: query,
          resultKind: 'word',
          source: 'search',
          preview: results[0].mean_cn,
          topicId: results[0].topic_id,
        });
      }
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        navigate('/user-info');
        return;
      }
      console.error('搜索失败:', error);
      setErrorMessage('搜索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleWordClick = async (topicId: number) => {
    setLoading(true);
    setErrorMessage('');
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getWordDetail',
        topicId,
      });

      if (response.success) {
        setSearchResults([]);
        setTranslatedText('');
        setWordDetail(response.data);
      } else {
        setWordDetail(null);
        setErrorMessage(response.error || '获取单词详情失败');
      }
    } catch (error) {
      setWordDetail(null);
      setErrorMessage('获取单词详情失败，请稍后重试');
      console.error('获取单词详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const replaySelectionHistory = async (entry: HistoryEntry) => {
    setSearchQuery(entry.text);
    setShowHistory(false);
    setLoading(true);
    resetResults();

    try {
      const response = await chrome.runtime.sendMessage({
        action: entry.resultKind === 'word' ? 'searchWord' : 'translateSentence',
        ...(entry.resultKind === 'word' ? { word: entry.text } : { text: entry.text }),
      });

      if (!response?.success || !response.data) {
        if (response?.errorType === UnauthorizedError.type) {
          navigate('/user-info');
          return;
        }
        if (response?.errorType === ForbiddenError.type) {
          throw new ForbiddenError(response.error || '权限不足');
        }
        throw new Error(response?.error || '重新查询失败');
      }

      if (entry.resultKind === 'word') {
        const detail = response.data as TopicResourceV2;
        setWordDetail(detail);
        recordHistory({
          text: entry.text,
          resultKind: 'word',
          source: 'selection',
          preview: buildWordHistoryPreview(detail.dict.chn_means),
          topicId: detail.dict.word_basic_info.topic_id,
          page: entry.page,
        });
      } else {
        const translation = response.data.translatedText as string;
        setTranslatedText(translation);
        recordHistory({
          text: entry.text,
          resultKind: 'translation',
          source: 'selection',
          preview: translation,
          page: entry.page,
        });
      }
    } catch (error) {
      setErrorMessage(error instanceof ForbiddenError
        ? '句子翻译仅会员可用'
        : error instanceof Error ? error.message : '重新查询失败');
    } finally {
      setLoading(false);
    }
  };

  const handleHistorySelect = (entry: HistoryEntry) => {
    if (entry.latestSource === 'search') {
      void handleSearch(entry.text);
    } else {
      void replaySelectionHistory(entry);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'deleteHistory', id });
      if (response?.success && Array.isArray(response.data)) {
        setHistoryEntries(response.data);
      }
    } catch (error) {
      console.warn('删除历史记录失败:', error);
    }
  };

  const handleClearHistory = async () => {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'clearHistory' });
      if (response?.success) {
        setHistoryEntries([]);
        setShowHistory(false);
      }
    } catch (error) {
      console.warn('清空历史记录失败:', error);
    }
  };

  return (
    <>
      <div className="search-container">
        <div className="search-box">
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="输入要查询的单词..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && void handleSearch()}
            tabIndex={0}
          />
          <button
            type="button"
            className="search-button"
            onClick={() => void handleSearch()}
            disabled={loading}
            tabIndex={-1}
            aria-label="搜索"
          >
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </div>
      </div>

      <RecentHistoryBar
        entries={historyEntries}
        onOpenAll={() => setShowHistory(true)}
        onSelect={handleHistorySelect}
      />

      {showHistory ? (
        <HistoryPanel
          entries={historyEntries}
          onBack={() => setShowHistory(false)}
          onSelect={handleHistorySelect}
          onDelete={(id) => void handleDeleteHistory(id)}
          onClear={() => void handleClearHistory()}
        />
      ) : (
        <div className="home-result-area">
          {loading && <div className="home-status-message">查询中...</div>}
          {!loading && errorMessage && <div className="home-status-message error">{errorMessage}</div>}
          {!loading && !errorMessage && wordDetail && (
            <div className="word-detail">
              <HotkeysProvider initiallyActiveScopes={['popover']}>
                <PopoverContent wordResult={wordDetail} />
              </HotkeysProvider>
            </div>
          )}
          {!loading && !errorMessage && translatedText && (
            <div className="home-translation-result">
              <SentenceTranslationPopover translatedText={translatedText} theme={theme} />
            </div>
          )}
          {!loading && !errorMessage && !wordDetail && !translatedText && (
            <div className="search-results">
              {searchResults.map((result) => (
                <button
                  type="button"
                  key={result.topic_id}
                  className="word-item"
                  onClick={() => void handleWordClick(result.topic_id)}
                >
                  <span className="search-result-word">{result.word}</span>
                  <span className="word-meaning">{result.mean_cn}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
